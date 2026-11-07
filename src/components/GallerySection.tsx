import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Heart,
  Play,
  Pause,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { weddingData } from "../data/weddingData";

type CategoryFilter = "all" | "gate" | "romantic" | "studio";

export default function GallerySection() {
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Autoplay
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Window width for responsive 3D spacing
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // Lightbox controls
  const [lightboxPlaying, setLightboxPlaying] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Lightbox thumbnail ref
  const lbThumbStripRef = useRef<HTMLDivElement>(null);

  // Drag ref for Coverflow
  const isDraggingCoverflow = useRef(false);

  // Filter photos
  const filteredPhotos = useMemo(() => {
    return weddingData.gallery
      .filter((p) => (activeFilter === "all" ? true : p.category === activeFilter))
      .slice(0, 10);
  }, [activeFilter]);

  // Responsive resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Handle filter change
  const handleFilterChange = (cat: CategoryFilter) => {
    setActiveFilter(cat);
    setCurrentIndex(0);
    if (lightboxIndex !== null) {
      setLightboxIndex(0);
    }
  };

  // Autoplay coverflow
  useEffect(() => {
    if (!isPlaying || isHovered || lightboxIndex !== null || filteredPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredPhotos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, isHovered, lightboxIndex, filteredPhotos.length]);

  // Autoplay in Lightbox
  useEffect(() => {
    if (lightboxIndex === null || !lightboxPlaying || filteredPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setLightboxIndex((prev) =>
        prev === null ? null : (prev + 1) % filteredPhotos.length
      );
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    }, 5000);
    return () => clearInterval(timer);
  }, [lightboxIndex, lightboxPlaying, filteredPhotos.length]);

  // Lock body scroll when Lightbox open
  useEffect(() => {
    if (lightboxIndex !== null) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [lightboxIndex]);

  // Center active thumbnail in lightbox strip
  useEffect(() => {
    if (lightboxIndex === null || !lbThumbStripRef.current) return;
    const activeEl = lbThumbStripRef.current.children[lightboxIndex] as HTMLElement | undefined;
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [lightboxIndex]);

  // Navigation handlers
  const goTo = useCallback(
    (idx: number) => {
      const count = filteredPhotos.length;
      if (count === 0) return;
      setCurrentIndex((idx + count) % count);
    },
    [filteredPhotos.length]
  );

  const handlePrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const handleNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  // Lightbox Navigation
  const handleLbPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + filteredPhotos.length) % filteredPhotos.length
    );
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  }, [filteredPhotos.length]);

  const handleLbNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % filteredPhotos.length
    );
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  }, [filteredPhotos.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    setLightboxPlaying(false);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  }, []);

  // Zoom handlers
  const zoomIn = () => setLightboxZoom((z) => Math.min(3, +(z + 0.5).toFixed(1)));
  const zoomOut = () =>
    setLightboxZoom((z) => {
      const next = Math.max(1, +(z - 0.5).toFixed(1));
      if (next === 1) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  const resetZoom = () => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleLbDoubleClick = () => {
    if (lightboxZoom > 1) {
      resetZoom();
    } else {
      setLightboxZoom(2);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") handleLbPrev();
      if (e.key === "ArrowRight") handleLbNext();
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setLightboxPlaying((p) => !p);
      }
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, closeLightbox, handleLbPrev, handleLbNext]);

  // Touch & Drag on Coverflow stage
  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 40;
    if (info.offset.x < -threshold || info.velocity.x < -300) {
      handleNext();
    } else if (info.offset.x > threshold || info.velocity.x > 300) {
      handlePrev();
    }
    setTimeout(() => {
      isDraggingCoverflow.current = false;
    }, 50);
  };

  // Card click handler
  const handleCardClick = (idx: number) => {
    if (isDraggingCoverflow.current) return;
    if (idx === currentIndex) {
      setLightboxIndex(idx);
    } else {
      goTo(idx);
    }
  };

  // Mouse pan handlers when zoomed in Lightbox
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return;
    e.preventDefault();
    setIsDraggingZoom(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: lightboxPan.x,
      startPanY: lightboxPan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingZoom || lightboxZoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setLightboxPan({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => setIsDraggingZoom(false);

  // Helper category label
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "gate":
        return "Ảnh Cổng";
      case "romantic":
        return "Ảnh Bàn";
      default:
        return "Ảnh Khung";
    }
  };

  const currentPhoto = filteredPhotos[currentIndex] || filteredPhotos[0];
  const activeLbPhoto =
    lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  // Compute 3D Coverflow properties for card idx
  const getCardTransform = (idx: number) => {
    const offset = idx - currentIndex;
    const absOffset = Math.abs(offset);

    // Limit visible cards to optimize and avoid visual clutter
    const maxVisible = isMobile ? 2 : 3;
    if (absOffset > maxVisible) {
      return null;
    }

    // Spacing between cards in 3D
    const spacing = isMobile ? 130 : isTablet ? 170 : 210;
    const x = offset * spacing;

    // Depth (Z translation)
    const z = absOffset === 0 ? (isMobile ? 80 : 120) : -absOffset * (isMobile ? 70 : 90);

    // Y Rotation
    const rotateY = offset === 0 ? 0 : offset > 0 ? (isMobile ? -36 : -45) : (isMobile ? 36 : 45);

    // Scale
    const scale = absOffset === 0 ? 1 : Math.max(0.68, 1 - absOffset * 0.14);

    // Opacity
    const opacity = absOffset === 0 ? 1 : Math.max(0.35, 1 - absOffset * 0.24);

    // Z-Index
    const zIndex = 50 - absOffset;

    return { x, z, rotateY, scale, opacity, zIndex };
  };

  return (
    <>
      <section className="gallery-section" id="gallery">
        {/* Header with Cream Pink Theme */}
        <div className="gallery-section-header">
          <motion.div
            className="section-header-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-subtitle">ALBUM HÌNH CƯỚI • 3D COVERFLOW</div>
            <h2 className="section-title">Khoảnh Khắc Hạnh Phúc</h2>
            <div className="title-divider-leaf">
              <span className="leaf-line" />
              <Camera size={18} color="#D4708A" />
              <span className="leaf-line" />
            </div>
            <p className="section-description">
              Từng bức hình là một kỷ niệm ngọt ngào lưu giữ thanh xuân và tình yêu vĩnh cửu của chúng mình.
            </p>
          </motion.div>

          {/* Filter tabs styled in Soft Cream Pink */}
          <div className="gallery-filter-tabs">
            {(["all", "gate", "romantic", "studio"] as const).map((cat) => {
              const count =
                cat === "all"
                  ? Math.min(10, weddingData.gallery.length)
                  : Math.min(10, weddingData.gallery.filter((p) => p.category === cat).length);
              return (
                <button
                  key={cat}
                  className={`filter-btn ${activeFilter === cat ? "active" : ""}`}
                  onClick={() => handleFilterChange(cat)}
                >
                  {cat === "all"
                    ? `Tất cả (${count})`
                    : cat === "gate"
                    ? `Ảnh Cổng (${count})`
                    : cat === "romantic"
                    ? `Ảnh Bàn (${count})`
                    : `Ảnh Khung (${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Coverflow Container */}
        <div
          className="coverflow-stage-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Ambient Cream Pink Floor Glow */}
          <div className="coverflow-ambient-glow" />

          {/* Top Controls: Autoplay toggle & Lightbox button */}
          <div className="coverflow-top-controls">
            <button
              className={`coverflow-ctrl-btn ${isPlaying ? "active" : ""}`}
              onClick={() => setIsPlaying((v) => !v)}
              title={isPlaying ? "Tạm dừng tự động xoay" : "Tiếp tục tự động xoay"}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? "Tự động" : "Tạm dừng"}</span>
            </button>
            <button
              className="coverflow-ctrl-btn expand-btn"
              onClick={() => setLightboxIndex(currentIndex)}
              title="Phóng to ảnh (Mở Lightbox)"
            >
              <Maximize2 size={14} />
              <span>Phóng to</span>
            </button>
          </div>

          {/* 3D Coverflow Stage with perspective */}
          <div className="coverflow-perspective-viewport">
            {/* Draggable interactive motion container */}
            <motion.div
              className="coverflow-cards-track"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => {
                isDraggingCoverflow.current = true;
              }}
              onDragEnd={handleDragEnd}
            >
              {filteredPhotos.map((photo, idx) => {
                const transform = getCardTransform(idx);
                if (!transform) return null;

                const isCenter = idx === currentIndex;

                return (
                  <motion.div
                    key={photo.id}
                    className={`coverflow-card ${isCenter ? "is-center" : ""}`}
                    onClick={() => handleCardClick(idx)}
                    animate={{
                      x: transform.x,
                      z: transform.z,
                      rotateY: transform.rotateY,
                      scale: transform.scale,
                      opacity: transform.opacity,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 1, 0.5, 1],
                    }}
                    style={{
                      zIndex: transform.zIndex,
                    }}
                  >
                    <div className="coverflow-card-inner">
                      <img
                        src={photo.src}
                        alt={photo.title}
                        className="coverflow-card-img"
                        draggable={false}
                        loading="lazy"
                      />

                      {/* Center card overlay badge */}
                      {isCenter && (
                        <div className="coverflow-center-badge">
                          <Heart size={14} fill="#FCE4EC" color="#FCE4EC" />
                          <span>Nhấp để phóng to</span>
                        </div>
                      )}

                      {/* Side card label */}
                      {!isCenter && (
                        <div className="coverflow-side-label">
                          <span>{photo.title}</span>
                        </div>
                      )}
                    </div>

                    {/* Elegant 3D Mirror Reflection under the card */}
                    <div className="coverflow-card-reflection">
                      <img
                        src={photo.src}
                        alt=""
                        className="coverflow-reflect-img"
                        draggable={false}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Prev & Next Floating Navigation Arrows */}
            <button
              className="coverflow-nav-arrow prev"
              onClick={handlePrev}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={26} />
            </button>
            <button
              className="coverflow-nav-arrow next"
              onClick={handleNext}
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={26} />
            </button>
          </div>

          {/* Current Photo Romantic Caption */}
          <div className="coverflow-caption-block">
            <div className="coverflow-meta-pill">
              <span className="meta-tag">
                {getCategoryLabel(currentPhoto?.category || "romantic")}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-counter">
                {String(currentIndex + 1).padStart(2, "0")} / {String(filteredPhotos.length).padStart(2, "0")}
              </span>
            </div>
            <h3 className="coverflow-photo-title">{currentPhoto?.title}</h3>
            <p className="coverflow-hint-text">
              <Sparkles size={13} color="#D4708A" />
              <span>Vuốt sang hai bên hoặc nhấp vào ảnh để xoay 3D • Nhấp ảnh giữa để mở Lightbox</span>
            </p>
          </div>

          {/* Pagination Dots */}
          <div className="coverflow-dots-bar">
            {filteredPhotos.map((_, idx) => (
              <button
                key={idx}
                className={`coverflow-dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goTo(idx)}
                aria-label={`Ảnh ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Luxury Fullscreen Lightbox via Portal */}
      {createPortal(
        <AnimatePresence>
          {lightboxIndex !== null && activeLbPhoto && (
            <motion.div
              className="lightbox-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeLightbox}
            >
              {/* Lightbox Window Container */}
              <div
                className="lightbox-modal-window"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Bar */}
                <div className="lightbox-header-bar">
                  <div className="lightbox-info-group">
                    <span className="lb-category-pill">
                      {getCategoryLabel(activeLbPhoto.category)}
                    </span>
                    <span className="lb-photo-title">{activeLbPhoto.title}</span>
                    <span className="lb-counter-pill">
                      {lightboxIndex + 1} / {filteredPhotos.length}
                    </span>
                  </div>

                  {/* Toolbar */}
                  <div className="lightbox-toolbar">
                    {/* Slideshow Play / Pause */}
                    <button
                      className={`lb-tool-btn ${lightboxPlaying ? "active" : ""}`}
                      onClick={() => setLightboxPlaying((v) => !v)}
                      title={lightboxPlaying ? "Dừng trình chiếu (Phím Space)" : "Tự động phát trình chiếu (Phím Space)"}
                    >
                      {lightboxPlaying ? <Pause size={16} /> : <Play size={16} />}
                      <span className="tool-text">{lightboxPlaying ? "Dừng" : "Phát"}</span>
                    </button>

                    {/* Zoom In */}
                    <button
                      className="lb-tool-btn"
                      onClick={zoomIn}
                      disabled={lightboxZoom >= 3}
                      title="Phóng to (+)"
                    >
                      <ZoomIn size={16} />
                    </button>

                    {/* Zoom Out */}
                    <button
                      className="lb-tool-btn"
                      onClick={zoomOut}
                      disabled={lightboxZoom <= 1}
                      title="Thu nhỏ (-)"
                    >
                      <ZoomOut size={16} />
                    </button>

                    {/* Reset Zoom */}
                    {lightboxZoom > 1 && (
                      <button
                        className="lb-tool-btn"
                        onClick={resetZoom}
                        title="Đặt lại kích thước ban đầu (Phím 0)"
                      >
                        <RotateCcw size={16} />
                        <span className="tool-text">{lightboxZoom}x</span>
                      </button>
                    )}

                    {/* Close */}
                    <button
                      className="lb-tool-btn close-btn"
                      onClick={closeLightbox}
                      title="Đóng (Phím Esc)"
                      aria-label="Đóng"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Viewport for main image */}
                <div
                  className="lightbox-viewport"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onDoubleClick={handleLbDoubleClick}
                  style={{
                    cursor:
                      lightboxZoom > 1
                        ? isDraggingZoom
                          ? "grabbing"
                          : "grab"
                        : "zoom-in",
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={activeLbPhoto.id}
                      className="lightbox-img-holder"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.03 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{
                        transform:
                          lightboxZoom > 1
                            ? `scale(${lightboxZoom}) translate3d(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px, 0)`
                            : undefined,
                        transformOrigin: "center center",
                      }}
                    >
                      <img
                        src={activeLbPhoto.src}
                        alt={activeLbPhoto.title}
                        className="lightbox-main-img"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Prev / Next Nav Buttons */}
                  <button
                    className="lb-nav-arrow prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLbPrev();
                    }}
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    className="lb-nav-arrow next"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLbNext();
                    }}
                    aria-label="Ảnh tiếp theo"
                  >
                    <ChevronRight size={32} />
                  </button>
                </div>

                {/* Bottom Thumbnail Ribbon */}
                <div className="lightbox-bottom-bar">
                  <div className="lightbox-thumbnail-ribbon" ref={lbThumbStripRef}>
                    {filteredPhotos.map((photo, idx) => {
                      const isActive = idx === lightboxIndex;
                      return (
                        <button
                          key={photo.id}
                          className={`lb-thumb-btn ${isActive ? "active" : ""}`}
                          onClick={() => {
                            setLightboxIndex(idx);
                            setLightboxZoom(1);
                            setLightboxPan({ x: 0, y: 0 });
                          }}
                          title={photo.title}
                        >
                          <img
                            src={photo.src}
                            alt={photo.title}
                            className="lb-thumb-img"
                            draggable={false}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <div className="lightbox-footer-hint">
                    Dùng phím mũi tên ← → để chuyển ảnh • Phím Space để phát/dừng • Nhấp đúp để phóng to • Esc để đóng
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
