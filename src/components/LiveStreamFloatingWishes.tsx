import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Send,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Guest, WishItem } from "../types/guestManagement.ts";
import { sendWishToGoogleSheets, useWishesSync } from "../services/googleSheetsService.ts";
import WishModal from "./WishModal.tsx";

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

  // Đồng bộ danh sách lời chúc real-time với Google Sheets
  const { wishes, setWishes } = useWishesSync();

  // Hàng đợi các bong bóng chat đang hiển thị trong luồng livestream (3-4 bong bóng)
  const [streamQueue, setStreamQueue] = useState<WishItem[]>([]);
  const nextWishIndexRef = useRef<number>(0);
  const prevTopWishId = useRef<string | number | null>(null);

  // Bộ đếm lượt bắn tim
  const [likeCount, setLikeCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("wedding_calendar_likes");
    return saved ? parseInt(saved, 10) : 0;
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
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (currentGuest?.fullName) {
      setSenderName(currentGuest.fullName);
    } else if (initialGuestName) {
      setSenderName(initialGuestName);
    }
  }, [currentGuest, initialGuestName]);

  // Khởi tạo luồng chat ban đầu
  useEffect(() => {
    if (wishes.length === 0) {
      setStreamQueue([]);
      return;
    }
    const countToDisplay = Math.min(3, wishes.length);
    const initialItems = wishes.slice(0, countToDisplay);
    setStreamQueue(initialItems);
    nextWishIndexRef.current = countToDisplay % wishes.length;
  }, [wishes.length]);

  // Đưa ngay lời chúc mới nhất từ Google Sheets vào luồng livestream
  useEffect(() => {
    if (wishes.length === 0) return;
    const topWish = wishes[0];
    if (topWish && prevTopWishId.current !== null && prevTopWishId.current !== topWish.id) {
      setStreamQueue((prev) => [...prev.slice(-3), topWish]);
    }
    prevTopWishId.current = topWish ? topWish.id : null;
  }, [wishes]);

  // Luân phiên đẩy lời chúc mới vào luồng livestream nếu có từ 2 lời chúc trở lên
  useEffect(() => {
    if (wishes.length <= 1) return;

    const timer = setInterval(() => {
      const nextWish = wishes[nextWishIndexRef.current % wishes.length];
      nextWishIndexRef.current = (nextWishIndexRef.current + 1) % wishes.length;

      setStreamQueue((prev) => {
        const updated = [...prev, nextWish];
        if (updated.length > 3) {
          return updated.slice(updated.length - 3);
        }
        return updated;
      });
    }, 4200);

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

  // Xử lý gửi lời chúc mới trực tiếp lên Google Sheets
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !wishContent.trim()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await sendWishToGoogleSheets({
        name: senderName.trim(),
        relationship: currentGuest?.group || "Bạn bè",
        message: wishContent.trim(),
        guestCode: currentGuest?.code,
        guestId: currentGuest?.id,
      });

      if (!result.success || !result.wish) {
        setSubmitError(result.message || "Gửi lời chúc thất bại. Dữ liệu chưa thể lưu vào Google Sheets!");
        return;
      }

      const created = result.wish;

      // Cập nhật danh sách và đưa thẳng vào luồng livestream
      setWishes((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);
      setStreamQueue((prev) => [...prev.slice(-3), created]);

      handleHeartBurst();
      setWishContent("");
      setIsModalOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || "Đã xảy ra lỗi khi gửi lời chúc tới Google Sheets!");
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
                        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={{
                        opacity: 0,
                        y: -18,
                        scale: 0.92,
                        transition: { duration: 0.35 },
                      }}
                      className="livestream-bubble-item translucent-stream-bubble"
                    >
                      <div className="livestream-user-avatar">
                        <span>{initialChar}</span>
                      </div>
                      <div className="livestream-bubble-content">
                        <div className="bubble-top-meta">
                          <strong className="bubble-guest-name">
                            {item.name}
                          </strong>
                          {/* {item.relationship && (
                            <span className="bubble-guest-role">
                              • {item.relationship}
                            </span>
                          )} */}
                        </div>
                        <p className="bubble-guest-msg">{item.message}</p>
                      </div>
                      <div className="bubble-stream-heart">
                        <Heart size={11} fill="#FF6B8B" color="#FF6B8B" />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHÙM TIM BAY TOÀN MÀN HÌNH */}
      <div className="global-livestream-hearts-container" aria-hidden="true">
        <AnimatePresence>
          {floatingHearts.map((h) => (
            <motion.div
              key={h.id}
              className="livestream-floating-heart"
              style={{
                position: "absolute",
                right: `calc(24px + ${h.x}px)`,
                bottom: `calc(80px + ${h.yOffset}px)`,
                color: h.color,
                fontSize: `${20 * h.scale}px`,
              }}
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{
                opacity: [1, 0.9, 0],
                y: -320,
                x: h.x * 1.6,
                scale: [0.6, 1.25, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              {h.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. THANH ĐIỀU KHIỂN FLOATING TƯƠNG TÁC (GÓC DƯỚI BÊN PHẢI) */}
      <div className="global-livestream-floating-actions global-livestream-action-dock">
        <button
          type="button"
          className="btn-floating-burst-heart dock-btn-heart-burst"
          onClick={handleHeartBurst}
          title="Thả tim chúc mừng cô dâu & chú rể"
          aria-label="Thả tim chúc mừng"
        >
          <Heart size={20} className="icon-burst icon-dock-heart" fill="#E24B5C" color="#E24B5C" />
          <span className="dock-count-badge">
            {likeCount > 999
              ? `${(likeCount / 1000).toFixed(1)}k`
              : likeCount}
          </span>
        </button>

        <button
          type="button"
          className="btn-floating-send-wish dock-btn-open-wish"
          onClick={() => {
            setIsModalOpen(true);
            setSubmitError("");
          }}
          title="Gửi lời chúc mừng"
          aria-label="Gửi lời chúc mừng"
        >
          <MessageCircle size={19} className="icon-send-heart" />
          <span className="btn-label-text dock-label-text">Gửi lời chúc</span>
        </button>

        <button
          type="button"
          className="btn-toggle-stream-visibility dock-btn-toggle-visibility"
          onClick={() => setIsVisible(!isVisible)}
          title={isVisible ? "Ẩn luồng lời chúc livestream" : "Hiện luồng lời chúc livestream"}
          aria-label={isVisible ? "Ẩn luồng lời chúc" : "Hiện luồng lời chúc"}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* 4. MODAL GỬI LỜI CHÚC LIVESTREAM */}
      <WishModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <motion.div
          className="wish-modal-dialog"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25 }}
        >
          <div className="wish-modal-header">
            <div className="modal-header-title-wrap">
              <Sparkles size={18} className="icon-header-heart" color="#C5A059" />
              <h4>Gửi Lời Chúc Phúc</h4>
            </div>
            <button
              type="button"
              className="btn-modal-close"
              aria-label="Đóng hộp thoại lời chúc"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          <p className="modal-description-sub">
            Lời chúc của bạn sẽ xuất hiện trên màn hình và lưu trực tiếp vào sổ lời chúc của hai gia đình!
          </p>

          <form onSubmit={handleSubmitWish} className="wish-modal-form">
            <div className="modal-form-group">
              <label>Tên của bạn *</label>
              <input
                type="text"
                required
                maxLength={100}
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
                maxLength={1000}
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

            {/* Thông báo lỗi nếu gửi thất bại */}
            {submitError && (
              <div
                style={{
                  color: "#C02640",
                  background: "#FFF0F3",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginTop: "10px",
                  border: "1px solid #FFD0DA",
                  textAlign: "center",
                  lineHeight: "1.4",
                }}
              >
                {submitError}
              </div>
            )}

            <div className="modal-form-footer">
              <button
                type="submit"
                disabled={isSubmitting || !senderName.trim() || !wishContent.trim()}
                className="btn-submit-calendar-wish"
              >
                <Send size={16} />
                <span>{isSubmitting ? "Đang lưu vào Google Sheets..." : "GỬI LỜI CHÚC NGAY"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </WishModal>
    </>
  );
}
