import { motion, AnimatePresence } from "framer-motion";
import { MailOpen, Heart, Sparkles } from "lucide-react";
import { weddingData } from "../data/weddingData";

interface OpeningCardProps {
  isOpened: boolean;
  onOpen: () => void;
  guestName?: string;
}

export default function OpeningCard({ isOpened, onOpen, guestName }: OpeningCardProps) {
  return (
    <AnimatePresence>
      {!isOpened && (
        <div className="opening-wrapper">
          {/* Cánh cửa bên trái */}
          <motion.div
            className="door door-left"
            initial={{ x: 0 }}
            exit={{ x: "-105%", transition: { duration: 1.4, ease: [0.77, 0, 0.175, 1] } }}
          >
            <div className="door-panel">
              <div className="door-ornament-corner top-left" />
              <div className="door-ornament-corner bottom-left" />
              <div className="door-content-side">
                <span className="door-label">THE WEDDING OF</span>
                <h2 className="door-person-name">{weddingData.groom.shortName}</h2>
                <div className="door-divider"></div>
                <p className="door-role">CHÚ RỂ</p>
              </div>
            </div>
          </motion.div>

          {/* Cánh cửa bên phải */}
          <motion.div
            className="door door-right"
            initial={{ x: 0 }}
            exit={{ x: "105%", transition: { duration: 1.4, ease: [0.77, 0, 0.175, 1] } }}
          >
            <div className="door-panel">
              <div className="door-ornament-corner top-right" />
              <div className="door-ornament-corner bottom-right" />
              <div className="door-content-side">
                <span className="door-label">THE WEDDING OF</span>
                <h2 className="door-person-name">{weddingData.bride.shortName}</h2>
                <div className="door-divider"></div>
                <p className="door-role">CÔ DÂU</p>
              </div>
            </div>
          </motion.div>

          {/* Huy hiệu trung tâm & Nút bấm mở thiệp */}
          <motion.div
            className="opening-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.6 } }}
          >
            {/* Chữ Song Hỷ Hoàng Gia */}
            <div className="double-happiness-badge">
              <span className="badge-symbol">囍</span>
              <div className="badge-glow" />
            </div>

            <div className="invitation-intro-card">
              <div className="intro-header">
                <Sparkles className="icon-sparkle" size={16} />
                <span>THIỆP CƯỚI TRÂN TRỌNG</span>
                <Sparkles className="icon-sparkle" size={16} />
              </div>

              <h1 className="intro-title">
                {weddingData.groom.shortName}
                <Heart className="intro-heart" size={20} fill="#FF6B8B" color="#c5a059" />
                {weddingData.bride.shortName}
              </h1>

              {guestName && (
                <div className="guest-badge-pill">
                  <span>Trân trọng kính mời:</span>
                  <strong>{guestName}</strong>
                </div>
              )}

              <p className="intro-date">
                {weddingData.weddingDate.fullString}
              </p>

              <button
                className="btn-open-invitation"
                onClick={onOpen}
                aria-label="Mở thiệp cưới"
              >
                <MailOpen size={18} className="btn-icon" />
                <span>CHẠM ĐỂ MỞ THIỆP</span>
                <div className="btn-ripple" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
