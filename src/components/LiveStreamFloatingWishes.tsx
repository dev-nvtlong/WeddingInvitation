import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircleHeart,
  Send,
  X,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import type { Guest, WishItem } from "../types/guestManagement";
import { getWishes, addWish } from "../services/guestStorage";

interface LiveStreamFloatingWishesProps {
  currentGuest?: Guest;
  initialGuestName?: string;
}

interface FloatingHeart {
  id: number;
  x: number;
  yOffset: number;
  color: string;
  emoji: string;
  scale: number;
}

// 7 câu gợi ý lời chúc nhanh chuẩn xác
const QUICK_SUGGESTIONS = [
  "Chúc hai bạn trăm năm hạnh phúc!",
  "Chúc mừng hạnh phúc!",
  "Mãi mãi yêu thương nhau nhé!",
  "Chúc hai bạn sớm có tin vui!",
  "Bách niên giai lão!",
  "Chúc tổ ấm luôn ngập tràn tiếng cười!",
  "Trọn đời hạnh phúc bên nhau!",
];

export default function LiveStreamFloatingWishes({
  currentGuest,
  initialGuestName = "",
}: LiveStreamFloatingWishesProps) {
  // Trạng thái bật/tắt hiển thị luồng livestream trên toàn bộ mặt thiệp
  const [isVisible, setIsVisible] = useState(true);

  // Danh sách lời chúc thực tế từ cơ sở dữ liệu
  const [wishes, setWishes] = useState<WishItem[]>(() => {
    const list = getWishes();
    return list.filter((w) => w.isApproved !== false);
  });

  // Hàng đợi các bong bóng chat đang hiển thị trong luồng livestream (3-4 bong bóng)
  const [streamQueue, setStreamQueue] = useState<WishItem[]>([]);
  const nextWishIndexRef = useRef<number>(0);

  // Bộ đếm lượt bắn tim
  const [likeCount, setLikeCount] = useState<number>(() => {
    if (typeof window === "undefined") return 1288;
    const saved = localStorage.getItem("wedding_calendar_likes");
    return saved ? parseInt(saved, 10) : 1288;
  });

  // Chùm hạt tim bay lên khắp màn hình
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const lastHeartBurstTime = useRef<number>(0);

  // Trạng thái modal gửi lời chúc
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [senderName, setSenderName] = useState(
    currentGuest?.fullName || initialGuestName || ""
  );
  const [wishContent, setWishContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentGuest?.fullName) {
      setSenderName(currentGuest.fullName);
    } else if (initialGuestName) {
      setSenderName(initialGuestName);
    }
  }, [currentGuest, initialGuestName]);

  // Khởi tạo luồng chat ban đầu
  useEffect(() => {
    if (wishes.length === 0) return;
    const initialItems = wishes.slice(0, 3);
    setStreamQueue(initialItems);
    nextWishIndexRef.current = initialItems.length % wishes.length;
  }, [wishes.length]);

  // Luân phiên đẩy lời chúc mới vào luồng livestream như phòng live trực tiếp
  useEffect(() => {
    if (wishes.length === 0) return;

    const timer = setInterval(() => {
      const nextWish = wishes[nextWishIndexRef.current % wishes.length];
      nextWishIndexRef.current = (nextWishIndexRef.current + 1) % wishes.length;

      setStreamQueue((prev) => {
        // Giữ tối đa 4 lời chúc trong luồng, lời chúc mới xuất hiện ở dưới
        const updated = [...prev, nextWish];
        if (updated.length > 4) {
          return updated.slice(updated.length - 4);
        }
        return updated;
      });
    }, 3600); // 3.6s trôi lên 1 lời chúc mới

    return () => clearInterval(timer);
  }, [wishes]);

  // Xử lý bắn tim toàn màn hình
  const handleHeartBurst = () => {
    const now = Date.now();
    if (now - lastHeartBurstTime.current < 130) return;
    lastHeartBurstTime.current = now;

    const newCount = likeCount + 1;
    setLikeCount(newCount);
    if (typeof window !== "undefined") {
      localStorage.setItem("wedding_calendar_likes", newCount.toString());
    }

    const emojis = ["❤️", "💖", "💕", "🌸", "✨", "🥰", "💗"];
    const colors = ["#E06D7A", "#FF6B8B", "#FF8E9E", "#F4B8BE", "#E24B5C"];
    const count = Math.floor(Math.random() * 3) + 2;
    const newHearts: FloatingHeart[] = [];

    for (let i = 0; i < count; i++) {
      newHearts.push({
        id: Date.now() + Math.random(),
        x: Math.floor(Math.random() * 80) - 40,
        yOffset: Math.floor(Math.random() * 40),
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: 0.85 + Math.random() * 0.45,
      });
    }

    setFloatingHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 2000);
  };

  // Xử lý gửi lời chúc mới
  const handleSubmitWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !wishContent.trim()) return;

    setIsSubmitting(true);
    try {
      const created = addWish({
        name: senderName.trim(),
        relationship: currentGuest?.group || "Bạn bè",
        message: wishContent.trim(),
        guestCode: currentGuest?.code,
        guestId: currentGuest?.id,
      });

      // Cập nhật danh sách và đưa thẳng vào luồng livestream
      const updatedWishes = [created, ...wishes];
      setWishes(updatedWishes);
      setStreamQueue((prev) => [...prev.slice(-3), created]);

      handleHeartBurst();
      setWishContent("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Lỗi gửi lời chúc:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. LUỒNG BONG BÓNG LỜI CHÚC LIVESTREAM NỔI TRÊN TOÀN BỘ MẶT THIỆP */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="global-livestream-stream-overlay"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
          >
            <div className="livestream-badge-pill">
              <span className="live-dot-pulse" />
              <span className="live-text-tag">LIVE WISHES</span>
            </div>

            <div className="livestream-bubbles-column">
              <AnimatePresence mode="popLayout">
                {streamQueue.map((item, index) => {
                  const initialChar = (item.name || "K")
                    .trim()
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <motion.div
                      key={`stream-${item.id}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 24, scale: 0.92 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: { duration: 0.45, ease: "easeOut" },
                      }}
                      exit={{
                        opacity: 0,
                        y: -18,
                        scale: 0.94,
                        transition: { duration: 0.35, ease: "easeIn" },
                      }}
                      className="global-livestream-bubble-item"
                    >
                      {/* Nền hồng kem nhạt bán trong suốt không che mất nội dung thiệp */}
                      <div className="translucent-stream-bubble">
                        <span className="bubble-stream-avatar">
                          {initialChar}
                        </span>
                        <div className="bubble-stream-text-wrap">
                          <strong className="bubble-stream-author">
                            {item.name}:
                          </strong>{" "}
                          <span className="bubble-stream-body">
                            {item.message}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. THANH CÔNG CỤ TƯƠNG TÁC NỔI CỦA LIVESTREAM */}
      <div className="global-livestream-floating-actions">
        {/* Nút Ẩn / Hiện luồng chat */}
        <button
          type="button"
          className="btn-toggle-stream-visibility"
          onClick={() => setIsVisible(!isVisible)}
          title={isVisible ? "Ẩn luồng lời chúc" : "Hiện luồng lời chúc"}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>

        {/* Nút Mở modal gửi lời chúc */}
        <button
          type="button"
          className="btn-floating-send-wish"
          onClick={() => setIsModalOpen(true)}
          title="Gửi lời chúc mừng"
        >
          <MessageCircleHeart size={17} className="icon-send-heart" />
          <span className="btn-label-text">Gửi lời chúc</span>
        </button>

        {/* Nút Bắn tim kèm bộ đếm */}
        <button
          type="button"
          className="btn-floating-burst-heart"
          onClick={handleHeartBurst}
          title="Bắn tim chúc mừng"
        >
          <Heart size={18} fill="#FF6B8B" color="#FF6B8B" className="icon-burst" />
          <span className="counter-num">
            {likeCount.toLocaleString("vi-VN")}
          </span>
        </button>
      </div>

      {/* 3. LỚP HẠT TIM BAY LÊN KHẮP TOÀN BỘ MẶT THIỆP */}
      <div className="global-floating-hearts-layer">
        <AnimatePresence>
          {floatingHearts.map((h) => (
            <motion.div
              key={h.id}
              className="screen-heart-particle"
              style={{
                right: `calc(28px + ${h.x}px)`,
                bottom: `calc(96px + ${h.yOffset}px)`,
                color: h.color,
                fontSize: `${20 * h.scale}px`,
              }}
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{
                opacity: [1, 0.95, 0],
                y: -360 - Math.random() * 140,
                x: h.x * 2.2,
                scale: [0.6, 1.25, 0.95],
                rotate: [0, (Math.random() - 0.5) * 45],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              {h.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 4. MODAL NHẬP LỜI CHÚC NHANH */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="wish-modal-backdrop">
            <motion.div
              className="wish-modal-dialog"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="wish-modal-header">
                <div className="modal-header-title-wrap">
                  <Heart size={20} className="icon-header-heart" fill="#FF6B8B" color="#FF6B8B" />
                  <h4>Gửi Lời Chúc Mừng</h4>
                </div>
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <p className="modal-description-sub">
                Lời chúc của bạn sẽ xuất hiện trực tiếp trên luồng livestream nổi khắp mặt thiệp cưới!
              </p>

              <form onSubmit={handleSubmitWish} className="wish-modal-form">
                <div className="modal-form-group">
                  <label>Tên của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Anh Huy, Bạn Linh..."
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>

                <div className="modal-form-group">
                  <label>Nội dung lời chúc *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Nhập lời chúc ngọt ngào gửi đến cô dâu & chú rể..."
                    value={wishContent}
                    onChange={(e) => setWishContent(e.target.value)}
                  />
                </div>

                {/* 7 GỢI Ý LỜI CHÚC NHANH */}
                <div className="quick-suggestions-block">
                  <span className="suggestions-label">
                    <Sparkles size={13} style={{ display: "inline", marginRight: "4px" }} />
                    Gợi ý lời chúc 1-chạm:
                  </span>
                  <div className="suggestions-chips-grid">
                    {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="suggestion-chip-btn"
                        onClick={() => setWishContent(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-form-footer">
                  <button
                    type="submit"
                    disabled={isSubmitting || !senderName.trim() || !wishContent.trim()}
                    className="btn-submit-calendar-wish"
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? "Đang gửi..." : "GỬI LỜI CHÚC NGAY"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
