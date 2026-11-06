import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Gift,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  Smile,
  Check,
} from "lucide-react";
import type { Guest, WishItem } from "../types/guestManagement";
import { getWishes, addWish } from "../services/guestStorage";
import { weddingData } from "../data/weddingData";

interface LivestreamWishOverlayProps {
  currentGuest?: Guest;
  initialGuestName?: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  color: string;
  emoji: string;
  scale: number;
}

interface GiftAnimationItem {
  id: number;
  senderName: string;
  giftName: string;
  icon: string;
}

// 7 gợi ý lời chúc chuẩn theo yêu cầu
const QUICK_SUGGESTIONS = [
  "❤️ Trăm năm hạnh phúc!",
  "💕 Mãi mãi bên nhau!",
  "💐 Chúc mừng hạnh phúc!",
  "🥰 Sớm có tin vui nhé!",
  "🏡 Gia đình luôn viên mãn!",
  "✨ Bách niên giai lão!",
  "❤️ Chúc hai bạn luôn yêu thương và thấu hiểu nhau!",
];

// Danh mục quà tặng tương tác vui vẻ
const GIFTS = [
  { id: "bouquet", name: "Bó Hoa Cưới", icon: "💐", label: "Hoa tươi" },
  { id: "heart", name: "Đại Trái Tim", icon: "💖", label: "Yêu thương" },
  { id: "firework", name: "Pháo Hoa Rực Rỡ", icon: "🎆", label: "Pháo hoa" },
  { id: "cheers", name: "Cụng Ly Chúc Mừng", icon: "🥂", label: "Cụng ly" },
  { id: "ring", name: "Nhẫn Kim Cương", icon: "💍", label: "Nhẫn cưới" },
];

export default function LivestreamWishOverlay({
  currentGuest,
  initialGuestName = "",
}: LivestreamWishOverlayProps) {
  // Toàn bộ danh sách lời chúc từ hệ thống
  const [allWishes, setAllWishes] = useState<WishItem[]>(() => {
    const list = getWishes().filter((w) => w.isApproved !== false);
    if (list.length > 0) return list;
    return weddingData.defaultWishes.map((w) => ({ ...w, isApproved: true }));
  });

  // Hàng đợi lời chúc đang hiển thị trên màn hình livestream (khoảng 4-6 tin nhắn)
  const [visibleWishes, setVisibleWishes] = useState<WishItem[]>([]);
  const wishIndexRef = useRef(0);

  // Thả tim & tương tác
  const [likeCount, setLikeCount] = useState<number>(() => {
    if (typeof window === "undefined") return 2450;
    const stored = localStorage.getItem("wedding_livestream_likes");
    return stored ? parseInt(stored, 10) : 2450;
  });
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftAnimationItem | null>(null);

  // Trạng thái modal và popup
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);
  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(true);

  // Form input lời chúc
  const [senderName, setSenderName] = useState(currentGuest?.fullName || initialGuestName || "");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToastSuccess, setShowToastSuccess] = useState(false);

  // Audio Context cho âm thanh pop / chime nhẹ
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playPopSound = () => {
    if (isSoundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const playGiftSound = () => {
    if (isSoundMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    } catch {
      // Audio fallback
    }
  };

  // Khởi tạo luồng chat livestream ban đầu (4 lời chúc đầu tiên)
  useEffect(() => {
    if (allWishes.length > 0) {
      const initialBatch = allWishes.slice(0, Math.min(4, allWishes.length));
      setVisibleWishes(initialBatch);
      wishIndexRef.current = initialBatch.length;
    }
  }, [allWishes]);

  // Vòng lặp tự động đẩy lời chúc mới lên livestream mỗi 2.8 - 3.5 giây
  useEffect(() => {
    if (allWishes.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = wishIndexRef.current % allWishes.length;
      const nextWish = allWishes[nextIndex];
      wishIndexRef.current += 1;

      setVisibleWishes((prev) => {
        // Duy trì tối đa 5 lời chúc đồng thời, lời chúc cũ tự mờ dần và trượt lên
        const updated = [...prev, nextWish];
        if (updated.length > 5) {
          return updated.slice(updated.length - 5);
        }
        return updated;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [allWishes]);

  // Cập nhật tên người gửi khi có thông tin khách
  useEffect(() => {
    if (currentGuest?.fullName) {
      setSenderName(currentGuest.fullName);
    } else if (initialGuestName) {
      setSenderName(initialGuestName);
    }
  }, [currentGuest, initialGuestName]);

  // Xử lý Bắn Tim / Thả Tim
  const handleHeartBurst = () => {
    playPopSound();
    const newCount = likeCount + 1;
    setLikeCount(newCount);
    if (typeof window !== "undefined") {
      localStorage.setItem("wedding_livestream_likes", newCount.toString());
    }

    const emojis = ["❤️", "💖", "💕", "🌸", "✨", "🥰", "💗"];
    const colors = ["#E06D7A", "#FF6B8B", "#FF8E9E", "#F4B8BE", "#E24B5C"];

    // Tạo chùm 3-5 hạt tim bay ngẫu nhiên
    const count = Math.floor(Math.random() * 3) + 2;
    const newHearts: FloatingHeart[] = [];

    for (let i = 0; i < count; i++) {
      newHearts.push({
        id: Date.now() + Math.random(),
        x: Math.floor(Math.random() * 80) - 40, // trôi lệch trái phải
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: 0.8 + Math.random() * 0.5,
      });
    }

    setFloatingHearts((prev) => [...prev, ...newHearts]);

    // Tự dọn dẹp hạt tim sau 2 giây
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
    }, 2000);
  };

  // Xử lý Tặng Quà
  const handleSelectGift = (gift: (typeof GIFTS)[0]) => {
    setIsGiftPickerOpen(false);
    playGiftSound();

    const sender = senderName.trim() || (currentGuest ? currentGuest.fullName : "Một người bạn");
    const giftAnim: GiftAnimationItem = {
      id: Date.now(),
      senderName: sender,
      giftName: gift.name,
      icon: gift.icon,
    };

    setActiveGiftAnimation(giftAnim);

    // Thêm bong bóng chúc mừng tặng quà vào dòng livestream
    const giftWishItem: WishItem = {
      id: `gift_${Date.now()}`,
      name: sender,
      relationship: "Tặng quà",
      message: `đã gửi tặng ${gift.name} ${gift.icon}`,
      createdAt: "Vừa xong",
      isApproved: true,
    };

    setVisibleWishes((prev) => [...prev.slice(-4), giftWishItem]);

    setTimeout(() => {
      setActiveGiftAnimation(null);
    }, 3500);
  };

  // Xử lý Gửi Lời Chúc
  const handleSendWishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !messageText.trim()) return;

    setIsSubmitting(true);

    try {
      const newWish = addWish({
        name: senderName.trim(),
        relationship: currentGuest ? currentGuest.group : "Bạn bè",
        message: messageText.trim(),
        guestCode: currentGuest?.code,
      });

      // Cập nhật danh sách tổng và đưa thẳng vào khung livestream
      setAllWishes((prev) => [newWish, ...prev]);
      setVisibleWishes((prev) => [...prev.slice(-4), newWish]);

      setMessageText("");
      setIsSubmitting(false);
      setShowToastSuccess(true);
      handleHeartBurst();

      setTimeout(() => {
        setShowToastSuccess(false);
        setIsWishModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Lỗi khi gửi lời chúc:", err);
      setIsSubmitting(false);
    }
  };

  // Chọn nhanh gợi ý lời chúc
  const handleSelectSuggestion = (text: string) => {
    setMessageText(text);
  };

  return (
    <div className="livestream-component-root">
      {/* KHUNG LIVESTREAM CHAT OVERLAY CHÍNH */}
      <div className="livestream-chat-frame">
        {/* 1. THANH TIÊU ĐỀ LIVESTREAM (HEADER) */}
        <div className="livestream-header-bar">
          <div className="livestream-header-left">
            <div className="live-pulsing-badge">
              <span className="live-dot" />
              <span>LIVE</span>
            </div>
            <div className="live-meta-info">
              <span className="live-title">Trực Tiếp Lời Chúc Phúc</span>
              <span className="live-viewers">
                <span className="eye-icon">👁️</span> 286 người đang theo dõi
              </span>
            </div>
          </div>

          <div className="livestream-header-right">
            {/* Nút Bật/Tắt Âm Thanh */}
            <button
              className={`btn-sound-toggle ${!isSoundMuted ? "active" : ""}`}
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              title={isSoundMuted ? "Bật âm thanh tương tác" : "Tắt âm thanh"}
              aria-label="Bật tắt âm thanh"
            >
              {isSoundMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Bộ Đếm Lượt Thả Tim */}
            <div className="live-likes-pill">
              <Heart size={14} fill="#E06D7A" color="#E06D7A" />
              <span>{likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}</span>
            </div>
          </div>
        </div>

        {/* 2. KHU VỰC HIỂN THỊ CÁC BONG BÓNG LỜI CHÚC (STREAM CHAT AREA) */}
        <div className="livestream-screen-area">
          {/* Nền phong cảnh nhẹ nhàng với hiệu ứng ánh sáng lãng mạn */}
          <div className="livestream-screen-ambient" />

          {/* HIỆU ỨNG QUÀ TẶNG BAY LÊN (GIFT ANIMATION) */}
          <AnimatePresence>
            {activeGiftAnimation && (
              <motion.div
                className="livestream-gift-overlay-popup"
                initial={{ scale: 0.2, y: 80, opacity: 0 }}
                animate={{ scale: [0.2, 1.2, 1], y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: -60, opacity: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="gift-large-icon">{activeGiftAnimation.icon}</div>
                <div className="gift-popup-text">
                  <strong>{activeGiftAnimation.senderName}</strong>
                  <span>đã gửi tặng <strong>{activeGiftAnimation.giftName}</strong></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HIỆU ỨNG HẠT TIM BAY LÊN (FLOATING HEARTS PARTICLES) */}
          <div className="floating-hearts-layer" aria-hidden="true">
            {floatingHearts.map((h) => (
              <motion.span
                key={h.id}
                className="particle-heart"
                initial={{ opacity: 1, y: 0, x: h.x, scale: h.scale }}
                animate={{
                  opacity: 0,
                  y: -260,
                  x: h.x + (Math.random() * 40 - 20),
                  rotate: Math.random() * 30 - 15,
                }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                style={{ color: h.color }}
              >
                {h.emoji}
              </motion.span>
            ))}
          </div>

          {/* DANH SÁCH BONG BÓNG CHAT (#F4B8BE - BO TRÒN HAI ĐẦU) */}
          <div className="chat-bubbles-stream-container">
            <AnimatePresence mode="popLayout">
              {visibleWishes.map((w, index) => {
                const initialLetter = w.name ? w.name.trim().charAt(0).toUpperCase() : "❤️";
                return (
                  <motion.div
                    key={`${w.id}_${index}`}
                    className="livestream-chat-bubble"
                    initial={{ opacity: 0, y: 24, x: -16, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.35 } }}
                    transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                    layout
                  >
                    {/* Avatar người gửi: hình tròn nhỏ ở đầu bong bóng */}
                    <div className="chat-bubble-avatar">
                      <span>{initialLetter}</span>
                    </div>

                    {/* Nội dung lời chúc: Tên in đậm, theo sau là nội dung */}
                    <div className="chat-bubble-content">
                      <strong className="chat-sender-name">{w.name}</strong>
                      <span className="chat-separator">: </span>
                      <span className="chat-message-text">{w.message}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. THANH CÔNG CỤ CỐ ĐỊNH Ở ĐÁY KHUNG (BOTTOM ACTION BAR) */}
        <div className="livestream-bottom-bar">
          {/* Nút 1: GỬI LỜI CHÚC (Mở Modal) */}
          <button
            className="btn-trigger-wish-box"
            onClick={() => setIsWishModalOpen(true)}
            aria-label="Gửi lời chúc mừng"
          >
            <Heart size={16} className="btn-wish-icon" fill="#E06D7A" color="#E06D7A" />
            <span className="btn-wish-placeholder">
              {currentGuest ? `${currentGuest.fullName}, gửi lời chúc...` : "Gửi lời chúc mừng đến cặp đôi..."}
            </span>
            <Send size={15} className="btn-send-cue" />
          </button>

          {/* Nút 2: TẶNG QUÀ */}
          <div className="relative-gift-wrap">
            <button
              className={`btn-stream-action gift ${isGiftPickerOpen ? "active" : ""}`}
              onClick={() => setIsGiftPickerOpen(!isGiftPickerOpen)}
              title="Tặng quà chúc mừng"
              aria-label="Tặng quà mừng"
            >
              <Gift size={20} />
            </button>

            {/* BẢNG CHỌN QUÀ TẶNG (GIFT PICKER POPOVER) */}
            <AnimatePresence>
              {isGiftPickerOpen && (
                <motion.div
                  className="gift-picker-popover"
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="gift-picker-header">
                    <span>Chọn quà tặng tương tác:</span>
                    <button onClick={() => setIsGiftPickerOpen(false)} aria-label="Đóng">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="gift-items-grid">
                    {GIFTS.map((g) => (
                      <button
                        key={g.id}
                        className="gift-select-item"
                        onClick={() => handleSelectGift(g)}
                      >
                        <span className="gift-emoji-icon">{g.icon}</span>
                        <span className="gift-name-label">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Nút 3: BẮN TIM / THẢ TIM */}
          <button
            className="btn-stream-action heart-burst"
            onClick={handleHeartBurst}
            title="Thả tim chúc mừng"
            aria-label="Thả tim"
          >
            <Heart size={22} fill="#E06D7A" color="#E06D7A" />
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODAL GỬI LỜI CHÚC (HỘP THOẠI CÓ GỢI Ý CHUẨN)
          ==================================================================== */}
      <AnimatePresence>
        {isWishModalOpen && (
          <motion.div
            className="wish-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsWishModalOpen(false)}
          >
            <motion.div
              className="wish-modal-sheet"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="wish-modal-header">
                <div className="modal-title-wrap">
                  <Sparkles size={18} className="icon-sparkle" />
                  <h3>Gửi Lời Chúc Phúc Đến Cặp Đôi</h3>
                </div>
                <button
                  className="btn-close-wish-modal"
                  onClick={() => setIsWishModalOpen(false)}
                  aria-label="Đóng"
                >
                  <X size={20} />
                </button>
              </div>

              {showToastSuccess ? (
                <div className="wish-sent-success-box">
                  <Check size={36} className="icon-check" />
                  <h4>Lời Chúc Đã Lên Sóng Trực Tiếp!</h4>
                  <p>Cảm ơn bạn đã gửi những lời yêu thương đến Trường Long & Thanh Tới.</p>
                </div>
              ) : (
                <form onSubmit={handleSendWishSubmit}>
                  {/* Tên người gửi */}
                  <div className="wish-input-field">
                    <label>Tên của bạn *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Anh Huy, Chị Chanh, Bạn Chính..."
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Lời chúc */}
                  <div className="wish-input-field">
                    <label>Lời chúc của bạn *</label>
                    <textarea
                      rows={3}
                      placeholder="Nhập lời chúc ngọt ngào của bạn tại đây hoặc chọn gợi ý bên dưới..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                    />
                  </div>

                  {/* 7 GỢI Ý LỜI CHÚC NHANH (QUICK SUGGESTIONS) */}
                  <div className="suggestions-container">
                    <span className="suggestions-label">
                      <Smile size={13} /> Gợi ý lời chúc ý nghĩa (chạm để chọn):
                    </span>
                    <div className="suggestions-pills-list">
                      {QUICK_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="suggestion-pill-btn"
                          onClick={() => handleSelectSuggestion(sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nút gửi */}
                  <div className="wish-modal-actions">
                    <button
                      type="submit"
                      className="btn-submit-livestream-wish"
                      disabled={isSubmitting || !senderName.trim() || !messageText.trim()}
                    >
                      <Send size={16} />
                      <span>{isSubmitting ? "Đang Gửi..." : "Gửi Lên Livestream Ngay"}</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
