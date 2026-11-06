import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

function WishModalContent({ onClose, children }: Omit<WishModalProps, "isOpen">) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    const backdrop = backdropRef.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusableElements = () => Array.from(backdrop.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter((element) => element.getClientRects().length > 0);

    // Focus without moving the page to the form's original position.
    (backdrop.querySelector<HTMLElement>('input, textarea') || backdrop).focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = focusableElements();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          backdrop.focus({ preventScroll: true });
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === backdrop || !backdrop.contains(document.activeElement))) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === backdrop || !backdrop.contains(document.activeElement))) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    // Keep the dialog inside the visible area when a mobile keyboard opens.
    const viewport = window.visualViewport;
    const updateViewport = () => {
      if (!viewport) return;
      Object.assign(backdrop.style, {
        top: `${viewport.offsetTop}px`,
        left: `${viewport.offsetLeft}px`,
        height: `${viewport.height}px`,
        width: `${viewport.width}px`,
      });
    };
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown, true);
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.div
      ref={backdropRef}
      className="wish-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Gửi lời chúc mừng"
      tabIndex={-1}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      {children}
    </motion.div>
  );
}

export default function WishModal({ isOpen, onClose, children }: WishModalProps) {
  // Portals avoid fixed-position containing blocks created by ancestor filters/transforms.
  return createPortal(
    <AnimatePresence>
      {isOpen && <WishModalContent onClose={onClose}>{children}</WishModalContent>}
    </AnimatePresence>,
    document.body,
  );
}
