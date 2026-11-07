import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Heart, Clock, MailOpen, ChevronDown } from "lucide-react";
import { weddingData } from "../data/weddingData";

interface HeroSectionProps {
  guestName?: string;
  onOpenShareModal?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export default function HeroSection({ guestName }: HeroSectionProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const targetDate = new Date(
      weddingData.weddingDate.year,
      weddingData.weddingDate.month - 1,
      weddingData.weddingDate.day,
      weddingData.weddingDate.hour,
      weddingData.weddingDate.minute
    ).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const addToGoogleCalendar = () => {
    const { title, details, location, start, end } = weddingData.events.thanhHon.calendarEvent;
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
      location
    )}&dates=${start}/${end}`;
    window.open(url, "_blank");
  };

  const handleOpenInvitation = () => {
    const target =
      document.getElementById("countdown-section") ||
      document.getElementById("invitation");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ====================================================================
          HERO SECTION — BLUSH CREAM SPLIT LAYOUT (DESKTOP) & VERTICAL (MOBILE)
          ==================================================================== */}
      <section className="hero-split-section" id="home">
        {/* Ambient subtle glow & decorative flourishes */}
        <div className="hero-split-ambient-glow" aria-hidden="true" />
        <div className="hero-split-corner-accent top-left" aria-hidden="true">
          <span className="accent-floral">❦</span>
        </div>
        <div className="hero-split-corner-accent bottom-right" aria-hidden="true">
          <span className="accent-floral">❦</span>
        </div>

        <div className="hero-split-container">
          {/* ----------------------------------------------------------------
              KHU VỰC BÊN TRÁI: WEDDING INTRODUCTION (~45% TRÊN DESKTOP)
              ---------------------------------------------------------------- */}
          <motion.div
            className="hero-intro-column"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 1. WE ARE GETTING MARRIED */}
            <div className="hero-intro-pretitle">
              <span className="pretitle-line" />
              <span>WE ARE GETTING MARRIED</span>
              <span className="pretitle-line" />
            </div>

            {/* 2. Tiêu đề The Wedding Of */}
            <span className="hero-intro-heading">The Wedding Of</span>

            {/* 3. Tên chú rể & cô dâu */}
            <div className="hero-intro-names">
              <h1 className="name-groom">{weddingData.groom.shortName}</h1>
              <div className="name-ampersand-divider">
                <span className="line" />
                <span className="ampersand">&</span>
                <span className="line" />
              </div>
              <h1 className="name-bride">{weddingData.bride.shortName}</h1>
            </div>

            {/* 4. Ngày tổ chức đám cưới */}
            <div className="hero-intro-date-box">
              <div className="date-main">
                <span className="day-name">THỨ BẢY</span>
                <span className="dot">•</span>
                <span className="full-date">14 . 11 . 2026</span>
                <span className="dot">•</span>
                <span className="time-badge">10:30</span>
              </div>
              <p className="date-lunar">
                (Tức ngày 06 tháng 10 năm Bính Ngọ)
              </p>
            </div>

            {/* 5. Lời mời ngắn nhẹ nhàng */}
            <p className="hero-intro-invitation-text">
              Trân trọng kính mời quý người thân, bạn bè đến chung vui và sẻ chia
              khoảnh khắc thiêng liêng nhất trong ngày hạnh phúc của chúng mình.
            </p>

            {/* 6. Thẻ khách mời nếu có tham số tên */}
            {guestName && (
              <div className="hero-intro-guest-tag">
                <span className="guest-label">Kính gửi:</span>
                <strong className="guest-name">{guestName}</strong>
              </div>
            )}

            {/* 7. Nút MỞ THIỆP / OPEN INVITATION */}
            <div className="hero-intro-action">
              <button
                className="btn-open-invitation-hero"
                onClick={handleOpenInvitation}
                aria-label="Mở thiệp cưới"
              >
                <MailOpen size={16} />
                <span>Mở thiệp cưới</span>
                <ChevronDown size={16} className="btn-bounce-icon" />
              </button>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------
              KHU VỰC BÊN PHẢI: WEDDING INVITATION CARD (~55% TRÊN DESKTOP)
              ---------------------------------------------------------------- */}
          <motion.div
            className="hero-card-column"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="wedding-card-frame"
              onClick={handleOpenInvitation}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleOpenInvitation();
              }}
              title="Nhấp để mở thiệp cưới"
            >
              {/* Đường viền mảnh Nude Pink (#E8C9CC) */}
              <div className="card-inner-hairline" />

              {/* Phần đầu thiệp */}
              <div className="card-inner-header">
                <span className="card-invitation-label">WEDDING INVITATION</span>
                <h2 className="card-inner-couple-names">
                  {weddingData.groom.shortName}{" "}
                  <span className="inner-amp">&</span>{" "}
                  {weddingData.bride.shortName}
                </h2>
                <div className="card-inner-date-line">
                  <span className="inner-line" />
                  <span className="inner-date">14 . 11 . 2026</span>
                  <span className="inner-line" />
                </div>
              </div>

              {/* Phần ảnh cưới khung vòm với hiệu ứng Ken Burns chậm */}
              <div className="card-photo-arch-container">
                <div className="card-photo-arch">
                  <img
                    src={weddingData.groom.image}
                    alt="Trường Long & Thanh Tới"
                    className="card-kenburns-photo"
                    draggable={false}
                  />
                  <div className="card-photo-soft-overlay" />
                </div>
              </div>

              {/* Phần chân thiệp */}
              <div className="card-inner-footer">
                <span className="card-love-quote">~ Save Our Date ~</span>
                <span className="card-location">HẢI PHÒNG, VIỆT NAM</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====================================================================
          PHẦN THỜI GIAN ĐẾN NGÀY CƯỚI (NẰM BÊN DƯỚI HERO SECTION)
          ==================================================================== */}
      <section className="wedding-countdown-section" id="countdown-section">
        <div className="countdown-section-container">
          <motion.div
            className="countdown-card-wrapper"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="countdown-section-header">
              <div className="countdown-subtitle">
                <Clock size={14} />
                <span>THỜI GIAN ĐẾN NGÀY CƯỚI</span>
              </div>
              <h2 className="countdown-main-title">Đếm Ngược Ngày Chung Đôi</h2>
              <div className="countdown-divider">
                <span className="line" />
                <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
                <span className="line" />
              </div>
            </div>

            <div className="countdown-date-info">
              <div className="date-full-text">
                <Calendar size={17} className="icon-cal" />
                <span>{weddingData.weddingDate.fullString}</span>
              </div>
              <div className="date-lunar-text">
                (Tức {weddingData.weddingDate.lunarString})
              </div>
            </div>

            <div className="countdown-grid">
              <div className="countdown-item">
                <span className="countdown-number">{String(timeLeft.days).padStart(2, "0")}</span>
                <span className="countdown-label">Ngày</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="countdown-label">Giờ</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="countdown-label">Phút</span>
              </div>
              <div className="countdown-separator">:</div>
              <div className="countdown-item">
                <span className="countdown-number">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="countdown-label">Giây</span>
              </div>
            </div>

            <div className="countdown-action">
              <button
                onClick={addToGoogleCalendar}
                className="btn-add-calendar"
                title="Thêm sự kiện vào Google Calendar"
              >
                <Calendar size={16} />
                <span>Lưu ngày cưới vào Lịch</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
