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
import { isAdminAuthenticated } from "./services/guestStorage";
import { useInvitationMode } from "./utils/invitationMode";
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

  // Nguồn trạng thái duy nhất xác định chế độ xem thiệp (dùng chung cho cả desktop và mobile)
  const {
    isGuestView,
    isOwnerView,
    guestSide,
    guestName,
    currentGuest,
  } = useInvitationMode();

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
          guestSide={guestSide}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />

        <InvitationSection />

        <LoveStorySection />

        <CeremonySection
          currentGuest={currentGuest}
          isGuestView={isGuestView}
          guestSide={guestSide}
        />

        <GallerySection />

        <GuestBookSection
          initialGuestName={guestName}
          currentGuest={currentGuest}
          guestSide={guestSide}
        />

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
          showShareButton={isOwnerView}
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
