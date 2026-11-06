import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2, Sparkles, Send } from "lucide-react";
import { weddingData } from "../data/weddingData";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [customName, setCustomName] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const getShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    if (!customName.trim()) return baseUrl;
    return `${baseUrl}?guest=${encodeURIComponent(customName.trim())}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Thiệp cưới ${weddingData.groom.shortName} & ${weddingData.bride.shortName}`,
        text: `Trân trọng kính mời ${customName.trim() || "bạn"} đến dự lễ cưới của ${weddingData.groom.shortName} & ${weddingData.bride.shortName}!`,
        url: getShareUrl(),
      });
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="share-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="share-modal-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={onClose}>
              <X size={20} />
            </button>

            <div className="share-modal-header">
              <div className="modal-icon-badge">
                <Share2 size={22} />
              </div>
              <h3>Tạo Link Thiệp Mời Cá Nhân Hóa</h3>
              <p>
                Nhập tên khách mời để tạo đường link thiệp cưới trang trọng dành riêng cho người đó:
              </p>
            </div>

            <div className="share-input-group">
              <label>Tên khách mời:</label>
              <input
                type="text"
                placeholder="Ví dụ: Tuấn Dịu, Bạn Hiền Châm..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                autoFocus
              />
            </div>

            {customName.trim() && (
              <div className="share-preview-box">
                <Sparkles size={14} className="preview-sparkle" />
                <span>
                  Khách mở thiệp sẽ thấy: <strong>"Kính gửi: {customName.trim()}"</strong>
                </span>
              </div>
            )}

            <div className="share-url-container">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="share-url-input"
              />
              <button
                className={`btn-copy-share-url ${isCopied ? "copied" : ""}`}
                onClick={handleCopyLink}
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>

            <div className="share-modal-actions">
              <button className="btn-native-share" onClick={handleNativeShare}>
                <Send size={16} />
                <span>Chia sẻ qua Zalo / Messenger / Tin nhắn</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
