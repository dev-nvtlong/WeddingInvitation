import { useState, useEffect } from "react";
import OpeningCard from "./components/OpeningCard";
import HeroSection from "./components/HeroSection";
import InvitationSection from "./components/InvitationSection";
import LoveStorySection from "./components/LoveStorySection";
import CeremonySection from "./components/CeremonySection";
import GallerySection from "./components/GallerySection";
import GuestBookSection from "./components/GuestBookSection";
import GiftSection from "./components/GiftSection";
import Footer from "./components/Footer";
import MusicPlayer from "./components/MusicPlayer";
import PetalAnimation from "./components/PetalAnimation";
import Navigation from "./components/Navigation";
import ShareModal from "./components/ShareModal";
import LiveStreamFloatingWishes from "./components/LiveStreamFloatingWishes";

// Admin Module & Services
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import { isAdminAuthenticated, getGuestByCode } from "./services/guestStorage";
import type { Guest } from "./types/guestManagement";
import "./admin/admin.css";

export default function App() {
  // Trạng thái điều hướng trang Quản trị (Admin)
  const [isAdminView, setIsAdminView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#admin" || window.location.pathname.startsWith("/admin");
  });
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => isAdminAuthenticated());

  useEffect(() => {
    const handleHashChange = () => {
      const isAdm = window.location.hash === "#admin" || window.location.pathname.startsWith("/admin");
      setIsAdminView(isAdm);
      if (isAdm) {
        setIsAdminLoggedIn(isAdminAuthenticated());
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Nhận diện khách mời cá nhân hóa qua URL
  const [currentGuest] = useState<Guest | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("g") || params.get("code");
    if (code) {
      return getGuestByCode(code);
    }
    const nameParam = params.get("guest") || params.get("to") || params.get("khach");
    if (nameParam) {
      return getGuestByCode(nameParam);
    }
    return undefined;
  });

  const [guestName] = useState<string>(() => {
    if (currentGuest) return currentGuest.fullName;
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const guest = params.get("guest") || params.get("to") || params.get("khach");
    return guest ? guest.trim() : "";
  });

  // Phân biệt chế độ xem của chủ sở hữu / ban tổ chức vs chế độ khách mời:
  // - Chủ sở hữu: Đã đăng nhập quản trị (Admin), hoặc mở link thiệp gốc không có định danh khách mời (?g=...), hoặc có tham số mode=owner / owner=true
  // - Khách mời: Mở thiệp qua link cá nhân hóa (?g=, ?code=, ?guest=...) và không đăng nhập phiên quản trị
  const isOwnerMode = Boolean(
    isAdminLoggedIn ||
    (typeof window !== "undefined" && (
      window.location.search.includes("mode=owner") ||
      window.location.search.includes("owner=true") ||
      (!currentGuest && !guestName)
    ))
  );

  const [isOpened, setIsOpened] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [audioTrigger, setAudioTrigger] = useState(false);

  const handleOpenInvitation = () => {
    setIsOpened(true);
    setAudioTrigger(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // NẾU ĐANG Ở TRANG ADMIN DASHBOARD (#admin)
  if (isAdminView) {
    if (isAdminLoggedIn) {
      return (
        <AdminDashboard
          onExit={() => {
            window.location.hash = "";
            setIsAdminView(false);
          }}
        />
      );
    }
    return (
      <AdminLogin
        onSuccess={() => setIsAdminLoggedIn(true)}
        onBackToHome={() => {
          window.location.hash = "";
          setIsAdminView(false);
        }}
      />
    );
  }

  // TRANG THIỆP CƯỚI CHÍNH (GIỮ NGUYÊN 100% GIAO DIỆN & HIỆU ỨNG)
  return (
    <div className="wedding-app-root">
      {/* Cánh cửa thiệp mở đầu */}
      <OpeningCard
        isOpened={isOpened}
        onOpen={handleOpenInvitation}
        guestName={guestName}
      />

      {/* Hiệu ứng cánh hoa bay lãng mạn */}
      <PetalAnimation />

      {/* Trình phát nhạc nền */}
      <MusicPlayer autoStart={audioTrigger} />

      {/* Nội dung chính của thiệp cưới */}
      <main className={`wedding-main-container ${isOpened ? "opened" : "blurred"}`}>
        <HeroSection
          guestName={guestName}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />

        <InvitationSection />

        <LoveStorySection />

        <CeremonySection currentGuest={currentGuest} />

        <GallerySection />

        <GuestBookSection initialGuestName={guestName} currentGuest={currentGuest} />

        <GiftSection />

        <Footer />
      </main>

      {/* Luồng lời chúc Livestream nổi trên toàn bộ mặt thiệp (nền nhạt không che nội dung) */}
      {isOpened && (
        <LiveStreamFloatingWishes
          currentGuest={currentGuest}
          initialGuestName={guestName}
        />
      )}

      {/* Thanh điều hướng nhanh nổi bên dưới: Chỉ hiển thị nút Chia sẻ cho chủ sở hữu, ẩn hoàn toàn với khách mời */}
      {isOpened && (
        <Navigation
          onOpenShareModal={() => setIsShareModalOpen(true)}
          showShareButton={isOwnerMode}
        />
      )}

      {/* Modal tạo link chia sẻ cá nhân hóa */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
