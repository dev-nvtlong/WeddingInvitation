import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Send,
  X,
  MessageCircleHeart,
  Check,
} from "lucide-react";
import type { Guest, WishItem } from "../types/guestManagement.ts";
import { sendWishToGoogleSheets, useWishesSync } from "../services/googleSheetsService.ts";
import WishModal from "./WishModal.tsx";

interface FloatingCalendarWishesProps {
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

// 7 câu gợi ý lời chúc nhanh theo đúng yêu cầu
const QUICK_SUGGESTIONS = [
  "Chúc hai bạn trăm năm hạnh phúc!",
  "Chúc mừng hạnh phúc!",
  "Mãi mãi yêu thương nhau nhé!",
  "Chúc hai bạn sớm có tin vui!",
  "Bách niên giai lão!",
  "Chúc tổ ấm luôn ngập tràn tiếng cười!",
  "Trọn đời hạnh phúc bên nhau!",
];

// Cấu hình các luồng hiển thị (horizontal lanes) để bong bóng lệch vị trí tự nhiên
const LANES_CONFIG = [
  { top: "22%", align: "left", offset: "6%", maxWidth: "82%" },
  { top: "39%", align: "right", offset: "6%", maxWidth: "80%" },
  { top: "56%", align: "left", offset: "10%", maxWidth: "84%" },
  { top: "73%", align: "right", offset: "8%", maxWidth: "82%" },
];

export default function FloatingCalendarWishes({
  currentGuest,
  initialGuestName = "",
}: FloatingCalendarWishesProps) {
  // Đồng bộ danh sách lời chúc real-time với Google Sheets
  const { wishes, setWishes } = useWishesSync();

  // 4 vị trí hiển thị bong bóng lời chúc hiện tại trên lịch
  const [activeSlots, setActiveSlots] = useState<{
    slotId: number;
    wish: WishItem;
    key: string;
  }[]>([]);

  const nextWishIndexRef = useRef<number>(0);
  const currentSlotIndexRef = useRef<number>(0);
  const prevTopWishId = useRef<string | number | null>(null);

  // Bộ đếm lượt bắn tim
  const [likeCount, setLikeCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem("wedding_calendar_likes");
    return saved ? parseInt(saved, 10) : 0;
  });

  // Hạt tim bay lên khi nhấn Bắn tim
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const lastHeartBurstTime = useRef<number>(0);

  // Trạng thái modal nhập lời chúc
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [senderName, setSenderName] = useState(
    currentGuest?.fullName || initialGuestName || ""
  );
  const [wishContent, setWishContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successToast, setSuccessToast] = useState(false);

  // Cập nhật tên nếu có thông tin khách mời
  useEffect(() => {
    if (currentGuest?.fullName) {
      setSenderName(currentGuest.fullName);
    } else if (initialGuestName) {
      setSenderName(initialGuestName);
    }
  }, [currentGuest, initialGuestName]);

  // Khởi tạo các lời chúc đầu tiên vào các vị trí trên lịch
  useEffect(() => {
    if (wishes.length === 0) {
      setActiveSlots([]);
      return;
    }

    // Hiển thị tối đa 4 slot tương ứng với số lời chúc thực tế (không lặp lại dữ liệu nếu ít hơn 4)
    const countToDisplay = Math.min(LANES_CONFIG.length, wishes.length);
    const initialSlots = LANES_CONFIG.slice(0, countToDisplay).map((_, idx) => {
      const wish = wishes[idx];
      return {
        slotId: idx,
        wish,
        key: `slot-${idx}-${wish.id}`,
      };
    });

    setActiveSlots(initialSlots);
    nextWishIndexRef.current = countToDisplay % wishes.length;
  }, [wishes.length]);

  // Đưa ngay lời chúc mới nhất từ Google Sheets vào slot đầu tiên
  useEffect(() => {
    if (wishes.length === 0) return;
    const topWish = wishes[0];
    if (topWish && prevTopWishId.current !== null && prevTopWishId.current !== topWish.id) {
      setActiveSlots((prev) => {
        if (prev.length === 0) {
          return [{
            slotId: 0,
            wish: topWish,
            key: `slot-new-${topWish.id}-${Date.now()}`,
          }];
        }
        const next = [...prev];
        next[0] = {
          slotId: 0,
          wish: topWish,
          key: `slot-new-${topWish.id}-${Date.now()}`,
        };
        return next;
      });
    }
    prevTopWishId.current = topWish ? topWish.id : null;
  }, [wishes]);

  // Luân phiên thay đổi từng lời chúc lần lượt nếu có nhiều lời chúc hơn số slot
  useEffect(() => {
    if (wishes.length <= LANES_CONFIG.length) return;

    const timer = setInterval(() => {
      setActiveSlots((prev) => {
        if (prev.length === 0) return prev;

        const slotToUpdate = currentSlotIndexRef.current % prev.length;
        currentSlotIndexRef.current = (slotToUpdate + 1) % prev.length;

        const nextWish = wishes[nextWishIndexRef.current % wishes.length];
        nextWishIndexRef.current =
          (nextWishIndexRef.current + 1) % wishes.length;

        const updated = [...prev];
        updated[slotToUpdate] = {
          slotId: slotToUpdate,
          wish: nextWish,
          key: `slot-${slotToUpdate}-${nextWish.id}-${Date.now()}`,
        };

        return updated;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [wishes]);

  // Hiệu ứng Bắn tim chúc mừng
  const handleHeartBurst = () => {
    const now = Date.now();
    if (now - lastHeartBurstTime.current < 140) return;
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
        x: Math.floor(Math.random() * 70) - 35,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        scale: 0.8 + Math.random() * 0.5,
      });
    }

    setFloatingHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 1800);
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

      // Cập nhật danh sách lời chúc hiển thị
      setWishes((prev) => [created, ...prev.filter((w) => w.id !== created.id)]);

      // Đưa ngay lời chúc mới vào vị trí đầu tiên trên lịch để khách nhìn thấy ngay
      setActiveSlots((prev) => {
        const next = [...prev];
        next[0] = {
          slotId: 0,
          wish: created,
          key: `wish-new-${created.id}-${Date.now()}`,
        };
        return next;
      });

      // Tạo chùm pháo tim chúc mừng
      handleHeartBurst();

      setWishContent("");
      setIsModalOpen(false);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 4500);
    } catch (err: any) {
      setSubmitError(err.message || "Đã xảy ra lỗi khi gửi lời chúc tới Google Sheets!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cấu hình dữ liệu ngày cho lịch tháng 11/2026
  const novDays: (number | null)[] = [
    null, null, null, null, null, null, 1,
    2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, 29,
    30, null, null, null, null, null, null,
  ];

  return (
    <div className="floating-calendar-module floating-calendar-wishes-wrapper">
      {/* Toast thông báo gửi thành công */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            className="wish-success-toast"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Check size={18} className="toast-check-icon" />
            <div className="toast-content">
              <strong>Gửi lời chúc thành công!</strong>
              <p>Lời chúc của bạn đã được lưu vào Google Sheets & hiển thị trực tiếp.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NÚT GỬI LỜI CHÚC MỪNG Ở TRÊN LỊCH */}
      <div className="top-wish-action-bar">
        <button
          type="button"
          className="btn-send-wish-top"
          onClick={() => {
            setIsModalOpen(true);
            setSubmitError("");
          }}
          aria-label="Gửi lời chúc mừng tới cô dâu & chú rể"
        >
          <MessageCircleHeart size={19} />
          <span>GỬI LỜI CHÚC MỪNG</span>
        </button>
      </div>

      <div className="calendar-card-container calendar-with-wishes-card">
        {/* 1. KHUNG LỊCH ĐÁM CƯỚI TRANG TRỌNG */}
        <div className="calendar-card-header">
          <div className="calendar-month-selector">
            <div className="calendar-title-box">
              <h3 className="calendar-month-heading">THÁNG 11 / 2026</h3>
              <span className="calendar-event-sublabel">LỄ THÀNH HÔN & VU QUY</span>
            </div>
          </div>

          <div className="calendar-couple-subtext">
            <span>Trường Long</span>
            <span className="heart-sep">❤</span>
            <span>Thanh Tới</span>
          </div>
        </div>

        <div className="calendar-grid-wrapper">
          <div className="calendar-weekdays-row">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="sunday">CN</span>
          </div>

          <div className="calendar-days-grid">
            {novDays.map((dayNum, i) => {
              if (dayNum === null) {
                return <div key={`empty-${i}`} className="calendar-day-cell empty" />;
              }

              const isMainWeddingDay = dayNum === 14;
              const isFamilyDinnerDay = dayNum === 13;
              const isSunday = (i % 7) === 6;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`calendar-day-cell ${
                    isMainWeddingDay ? "highlight-day" : ""
                  } ${isFamilyDinnerDay ? "highlight-dinner-day" : ""} ${
                    isSunday ? "sunday-cell" : ""
                  }`}
                >
                  {isMainWeddingDay ? (
                    <div className="highlight-badge-wrap">
                      <span className="highlight-number">{dayNum}</span>
                      <Heart size={14} className="highlight-heart-icon" />
                    </div>
                  ) : isFamilyDinnerDay ? (
                    <div className="dinner-badge-wrap">
                      <span className="day-number">{dayNum}</span>
                      <span className="dinner-dot-indicator" title="Bữa Cơm Thân Mật" />
                    </div>
                  ) : (
                    <span className="day-number">{dayNum}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. LỚP BONG BÓNG LỜI CHÚC NỔI TRỰC TIẾP TRÊN MẶT LỊCH (NỀN HỒNG KEM NHẠT TRONG SUỐT) */}
        <div className="floating-wishes-overlay-layer">
          <div className="wishes-bubbles-container">
            <AnimatePresence mode="popLayout">
              {activeSlots.map((slot) => {
                const lane = LANES_CONFIG[slot.slotId] || LANES_CONFIG[0];
                const wish = slot.wish;

                const nameParts = (wish.name || "Khách").trim().split(" ");
                const shortName = nameParts.slice(-2).join(" ");
                const avatarLetter = (wish.name || "K")
                  .trim()
                  .charAt(0)
                  .toUpperCase();

                const isAlignLeft = lane.align === "left";

                return (
                  <motion.div
                    key={slot.key}
                    className="floating-wish-bubble pastel-wish-bubble"
                    style={{
                      top: lane.top,
                      left: isAlignLeft ? lane.offset : "auto",
                      right: !isAlignLeft ? lane.offset : "auto",
                      maxWidth: lane.maxWidth,
                    }}
                    initial={{
                      opacity: 0,
                      scale: 0.85,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.88,
                      y: -12,
                    }}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <div className="bubble-avatar-badge">
                      <span>{avatarLetter}</span>
                    </div>

                    <div className="bubble-content-text">
                      <div className="bubble-author-row">
                        <span className="bubble-sender-name">{shortName}</span>
                        {wish.relationship && (
                          <span className="bubble-sender-rel">
                            • {wish.relationship}
                          </span>
                        )}
                      </div>
                      <p className="bubble-message-body">{wish.message}</p>
                    </div>

                    <div className="bubble-heart-sparkle">
                      <Heart size={11} fill="#FF6B8B" color="#FF6B8B" />
                    </div>
                  </motion.div>
                );
              })}

              {activeSlots.length === 0 && (
                <motion.div
                  key="empty-invite"
                  className="floating-wish-bubble pastel-wish-bubble empty-invite-bubble"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    top: "48%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    maxWidth: "88%",
                  }}
                >
                  <div className="bubble-avatar-badge">
                    <Heart size={11} fill="#FFFFFF" color="#FFFFFF" />
                  </div>
                  <div className="bubble-content-text">
                    <p className="bubble-message-body" style={{ fontStyle: "italic" }}>
                      Hãy là người đầu tiên gửi lời chúc tới cô dâu & chú rể! ✨
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* HẠT TIM BAY LÊN KHI NHẤN NÚT BẮN TIM */}
            <AnimatePresence>
              {floatingHearts.map((h) => (
                <motion.div
                  key={h.id}
                  className="flying-floating-heart"
                  style={{
                    position: "absolute",
                    right: `calc(50% + ${h.x}px)`,
                    bottom: "20px",
                    color: h.color,
                    fontSize: `${18 * h.scale}px`,
                  }}
                  initial={{ opacity: 1, y: 0, scale: 0.6 }}
                  animate={{
                    opacity: [1, 0.9, 0],
                    y: -260,
                    x: h.x * 1.5,
                    scale: [0.6, 1.2, 1],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                >
                  {h.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 3. GHI CHÚ CHÚ THÍCH CÁC NGÀY ĐẶC BIỆT DƯỚI LỊCH */}
      <div className="calendar-note-footer">
        <span className="note-dot main" />
        <span>14.11: Lễ Thành Hôn & Vu Quy</span>
        <span className="note-divider">•</span>
        <span className="note-dot sub" />
        <span>13.11: Bữa Cơm Thân Mật</span>
      </div>

      {/* 4. THANH TƯƠNG TÁC PHÍA DƯỚI LỊCH */}
      <div className="calendar-interactive-bottom-bar">
          <button
            type="button"
            className="btn-trigger-wish-input"
            onClick={() => {
              setIsModalOpen(true);
              setSubmitError("");
            }}
          >
            <MessageCircleHeart size={18} className="icon-wish-trigger" />
            <span className="text-wish-trigger">Gửi lời chúc...</span>
          </button>

          <button
            type="button"
            className="btn-heart-burst"
            onClick={handleHeartBurst}
            title="Thả tim chúc mừng"
          >
            <Heart size={20} className="icon-heart-burst" fill="#E24B5C" color="#E24B5C" />
            <span className="count-number">
              {likeCount.toLocaleString("vi-VN")}
            </span>
          </button>
        </div>
      </div>

      {/* CỬA SỔ NHẬP LỜI CHÚC (MODAL GỢI Ý NHANH) */}
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
              <Heart size={20} className="icon-header-heart" fill="#FF6B8B" color="#FF6B8B" />
              <h4>Gửi Lời Chúc Mừng</h4>
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
            Lời chúc của bạn sẽ xuất hiện trực tiếp và nổi bật trên lịch cưới của chúng mình!
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
                placeholder="Nhập lời chúc chân thành gửi tới cô dâu & chú rể..."
                value={wishContent}
                onChange={(e) => setWishContent(e.target.value)}
              />
            </div>

            {/* GỢI Ý LỜI CHÚC NHANH (7 CÂU CHUẨN THEO YÊU CẦU) */}
            <div className="quick-suggestions-block">
              <span className="suggestions-label">Gợi ý lời chúc nhanh:</span>
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
                <span>{isSubmitting ? "Đang gửi lên Google Sheets..." : "GỬI LỜI CHÚC NGAY"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </WishModal>
    </div>
  );
}
