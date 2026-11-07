import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Send,
  X,
  MessageCircleHeart,
  Check,
} from "lucide-react";
import type { Guest, WishItem } from "../types/guestManagement";
import { getWishes, addWish } from "../services/guestStorage";
import { weddingData } from "../data/weddingData";
import WishModal from "./WishModal";

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
  // Danh sách lời chúc thực tế từ cơ sở dữ liệu
  const [wishes, setWishes] = useState<WishItem[]>(() => {
    const list = getWishes();
    return list.filter((w) => w.isApproved !== false);
  });

  // 4 vị trí hiển thị bong bóng lời chúc hiện tại trên lịch
  const [activeSlots, setActiveSlots] = useState<{
    slotId: number;
    wish: WishItem;
    key: string;
  }[]>([]);

  const nextWishIndexRef = useRef<number>(0);
  const currentSlotIndexRef = useRef<number>(0);

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
  const [successToast, setSuccessToast] = useState(false);

  // Cập nhật tên nếu có thông tin khách mời
  useEffect(() => {
    if (currentGuest?.fullName) {
      setSenderName(currentGuest.fullName);
    } else if (initialGuestName) {
      setSenderName(initialGuestName);
    }
  }, [currentGuest, initialGuestName]);

  // Khởi tạo 4 lời chúc đầu tiên vào 4 vị trí trên lịch
  useEffect(() => {
    if (wishes.length === 0) return;

    const initialSlots = LANES_CONFIG.map((_, idx) => {
      const wish = wishes[idx % wishes.length];
      return {
        slotId: idx,
        wish,
        key: `slot-${idx}-${wish.id}-${Date.now()}`,
      };
    });

    setActiveSlots(initialSlots);
    nextWishIndexRef.current = initialSlots.length % wishes.length;
  }, [wishes.length]);

  // Luân phiên thay đổi từng lời chúc lần lượt, nhẹ nhàng không giật lag
  useEffect(() => {
    if (wishes.length === 0) return;

    const timer = setInterval(() => {
      setActiveSlots((prev) => {
        if (prev.length === 0) return prev;

        const slotToUpdate = currentSlotIndexRef.current;
        currentSlotIndexRef.current = (slotToUpdate + 1) % LANES_CONFIG.length;

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
    }, 3400); // Mỗi 3.4 giây đổi 1 vị trí -> Các bong bóng khác vẫn đứng yên và đọc rõ ràng

    return () => clearInterval(timer);
  }, [wishes]);

  // Xử lý bắn tim (có throttle chống spam làm lag trình duyệt)
  const handleHeartBurst = () => {
    const now = Date.now();
    if (now - lastHeartBurstTime.current < 140) return; // giới hạn 140ms
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

    // Xoá bớt hạt tim cũ sau khi bay xong
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 1800);
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

      // Thêm vào danh sách lời chúc hiển thị
      const updatedWishes = [created, ...wishes];
      setWishes(updatedWishes);

      // Đưa ngay lời chúc mới vào vị trí đầu tiên trên lịch để khách nhìn thấy ngay lập tức
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
    } catch (err) {
      console.error("Lỗi khi gửi lời chúc:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cấu hình dữ liệu ngày cho lịch
  // Tháng 11/2026: 30 ngày, ngày 1 là Chủ Nhật (CN)
  const novDays: (number | null)[] = [
    null, null, null, null, null, null, 1,
    2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22,
    23, 24, 25, 26, 27, 28, 29,
    30, null, null, null, null, null, null,
  ];

  const currentDays = novDays;
  const eventLabel = "NGÀY CHUNG ĐÔI (13 & 14.11.2026)";

  return (
    <div className="floating-calendar-module">
      {/* Thông báo gửi lời chúc thành công */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            className="calendar-success-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <Check size={18} className="toast-icon" />
            <span>Cảm ơn bạn! Lời chúc đã xuất hiện trực tiếp trên lịch cưới.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KHUNG LỊCH CƯỚI NỀN TRẮNG CHỨA LỜI CHÚC NỔI */}
      <div className="calendar-card-container">
        {/* 1. Header Lịch cưới */}
        <div className="calendar-card-header">
          <div className="calendar-month-selector">
            <div className="calendar-title-box" style={{ textAlign: "center", width: "100%" }}>
              <h3 className="calendar-month-heading">
                THÁNG 11 / 2026
              </h3>
              <p className="calendar-event-sublabel">{eventLabel}</p>
            </div>
          </div>

          <div className="calendar-couple-subtext">
            <span>{weddingData.groom.shortName}</span>
            <span className="heart-sep">❤</span>
            <span>{weddingData.bride.shortName}</span>
          </div>
        </div>

        {/* 2. KHU VỰC LƯỚI LỊCH (LỜI CHÚC NỔI TRỰC TIẾP TRÊN CÁC NGÀY) */}
        <div className="calendar-grid-wrapper">
          {/* Lưới các thứ trong tuần */}
          <div className="calendar-weekdays-row">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="sunday">CN</span>
          </div>

          {/* Lưới các ngày trong tháng */}
          <div className="calendar-days-grid">
            {currentDays.map((dayNum, i) => {
              if (dayNum === null) {
                return <div key={`empty-${i}`} className="calendar-day-cell empty" />;
              }

              const isHighlight = dayNum === 13 || dayNum === 14;
              const isSunday = i % 7 === 6;

              return (
                <div
                  key={`day-${dayNum}-${i}`}
                  className={`calendar-day-cell ${isHighlight ? "highlight-day" : ""} ${
                    isSunday ? "sunday-cell" : ""
                  }`}
                >
                  {isHighlight ? (
                    <div className="highlight-badge-wrap">
                      <span className="day-number highlight-number">{dayNum}</span>
                      <Heart size={14} className="highlight-heart-icon" />
                    </div>
                  ) : (
                    <span className="day-number">{dayNum}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* LỚP BONG BÓNG LỜI CHÚC NỔI TRỰC TIẾP (FLOATING LIVE WISHES OVERLAY) */}
          <div className="floating-wishes-overlay-layer">
            <AnimatePresence mode="popLayout">
              {activeSlots.map((slot) => {
                const lane = LANES_CONFIG[slot.slotId] || LANES_CONFIG[0];
                const senderInitial = (slot.wish.name || "K").trim().charAt(0).toUpperCase();

                const stylePosition: React.CSSProperties = {
                  top: lane.top,
                  maxWidth: lane.maxWidth,
                  ...(lane.align === "left"
                    ? { left: lane.offset }
                    : { right: lane.offset }),
                };

                return (
                  <motion.div
                    key={slot.key}
                    style={stylePosition}
                    className="floating-wish-bubble-item"
                    initial={{
                      opacity: 0,
                      x: lane.align === "left" ? -24 : 24,
                      scale: 0.92,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      transition: { duration: 0.6, ease: "easeOut" },
                    }}
                    exit={{
                      opacity: 0,
                      x: lane.align === "left" ? 18 : -18,
                      scale: 0.94,
                      transition: { duration: 0.5, ease: "easeIn" },
                    }}
                  >
                    {/* Bong bóng hồng pastel #F4B8BE bo tròn hai đầu */}
                    <div className="pastel-wish-bubble">
                      <span className="bubble-avatar">{senderInitial}</span>
                      <span className="bubble-content-text">
                        <strong className="bubble-sender-name">
                          {slot.wish.name}:
                        </strong>{" "}
                        <span className="bubble-msg-body">
                          {slot.wish.message}
                        </span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* HIỆU ỨNG TRÁI TIM BAY LÊN KHI NHẤN BẮN TIM */}
          <div className="floating-hearts-burst-container">
            <AnimatePresence>
              {floatingHearts.map((h) => (
                <motion.div
                  key={h.id}
                  className="heart-particle"
                  style={{
                    right: `calc(40px + ${h.x}px)`,
                    bottom: "20px",
                    color: h.color,
                    fontSize: `${18 * h.scale}px`,
                  }}
                  initial={{ opacity: 1, y: 0, scale: 0.6 }}
                  animate={{
                    opacity: [1, 0.9, 0],
                    y: -220 - Math.random() * 80,
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

        {/* 3. THANH TƯƠNG TÁC PHÍA DƯỚI LỊCH */}
        <div className="calendar-interactive-bottom-bar">
          {/* Nút "Gửi lời chúc..." mở modal */}
          <button
            type="button"
            className="btn-trigger-wish-input"
            onClick={() => setIsModalOpen(true)}
          >
            <MessageCircleHeart size={18} className="icon-wish-trigger" />
            <span className="text-wish-trigger">Gửi lời chúc...</span>
          </button>

          {/* Nút Bắn tim kèm bộ đếm tương tác */}
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

      {/* CỬA SỔ NHẬP LỜI CHÚC (MODAL GỌI Ý NHANH) */}
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
      </WishModal>
    </div>
  );
}
