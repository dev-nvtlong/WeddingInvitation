import { Heart, Calendar, Camera, MessageSquare, Gift, Share2 } from "lucide-react";

interface NavigationProps {
  onOpenShareModal: () => void;
  showShareButton?: boolean;
}

export default function Navigation({ onOpenShareModal, showShareButton = true }: NavigationProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="floating-nav-bar" aria-label="Điều hướng chính">
      <button onClick={() => scrollTo("invitation")} title="Lời ngỏ">
        <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
        <span>Lời ngỏ</span>
      </button>

      <button onClick={() => scrollTo("ceremony")} title="Lễ cưới">
        <Calendar size={18} />
        <span>Sự kiện</span>
      </button>

      <button onClick={() => scrollTo("gallery")} title="Album ảnh">
        <Camera size={18} />
        <span>Album</span>
      </button>

      <button onClick={() => scrollTo("guestbook")} title="Sổ lưu bút">
        <MessageSquare size={18} />
        <span>Chúc phúc</span>
      </button>

      <button onClick={() => scrollTo("gift")} title="Mừng cưới">
        <Gift size={18} />
        <span>Mừng cưới</span>
      </button>

      {showShareButton && (
        <button onClick={onOpenShareModal} className="nav-share-highlight" title="Chia sẻ">
          <Share2 size={18} />
          <span>Chia sẻ</span>
        </button>
      )}
    </nav>
  );
}
