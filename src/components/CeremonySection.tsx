import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, MapPin } from "lucide-react";
import { weddingData } from "../data/weddingData";
import type { Guest } from "../types/guestManagement";

interface CeremonySectionProps {
  currentGuest?: Guest;
}

export default function CeremonySection({ currentGuest }: CeremonySectionProps) {
  // Xác định thiệp mặc định dựa theo cấu hình Admin cho khách mời
  const isGroomGuest =
    currentGuest?.invitedTo === "thiep_chu_re" ||
    currentGuest?.invitedTo === "tiec_than_mat" ||
    currentGuest?.group?.toLowerCase().includes("nhà trai") ||
    currentGuest?.group?.toLowerCase().includes("chú rể") ||
    currentGuest?.group?.toLowerCase().includes("thế");

  const isBrideGuest =
    currentGuest?.invitedTo === "thiep_co_dau" ||
    currentGuest?.invitedTo === "vu_quy" ||
    currentGuest?.group?.toLowerCase().includes("nhà gái") ||
    currentGuest?.group?.toLowerCase().includes("cô dâu");

  const defaultSide: "groom" | "bride" =
    isBrideGuest && !isGroomGuest ? "bride" : "groom";

  const [activeSide, setActiveSide] = useState<"groom" | "bride">(defaultSide);

  // Nhận diện qua URL query param nếu có (?side=groom hoặc ?side=bride)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const side = params.get("side");
      if (side === "bride" || side === "gai") {
        setActiveSide("bride");
      } else if (side === "groom" || side === "trai") {
        setActiveSide("groom");
      } else {
        setActiveSide(defaultSide);
      }
    }
  }, [defaultSide]);

  // 1. THIỆP CHÚ RỂ (NHÀ TRAI): Bữa cơm thân mật + Lễ thành hôn tại nhà trai
  const groomEvents = [
    weddingData.events.tiecThanMat,
    weddingData.events.thanhHon,
  ];

  // 2. THIỆP CÔ DÂU (NHÀ GÁI): Bữa cơm thân mật + Lễ vu quy tại nhà gái
  const brideEvents = [
    weddingData.events.tiecThanMat,
    weddingData.events.vuQuy,
  ];

  const currentEvents = activeSide === "groom" ? groomEvents : brideEvents;

  return (
    <section className="ceremony-section" id="ceremony">
      <div className="section-container">
        <motion.div
          className="section-header-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="section-subtitle">WEDDING CEREMONIES</div>
          <h2 className="section-title">Sự Kiện Trọng Đại</h2>
          <div className="title-divider-leaf">
            <span className="leaf-line" />
            <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
            <span className="leaf-line" />
          </div>
          <p className="section-description">
            Kính mời quý quan khách cùng tham dự các nghi thức trang trọng và chung vui cùng hai gia đình.
          </p>

          {/* THANH CHUYỂN ĐỔI 2 THIỆP (THIỆP CHÚ RỂ & THIỆP CÔ DÂU) */}
          <div className="ceremony-tab-switcher">
            <button
              type="button"
              className={`btn-side-pill ${activeSide === "groom" ? "active" : ""}`}
              onClick={() => setActiveSide("groom")}
            >
              <User size={15} />
              <span>THIỆP CHÚ RỂ (NHÀ TRAI)</span>
            </button>
            <button
              type="button"
              className={`btn-side-pill ${activeSide === "bride" ? "active" : ""}`}
              onClick={() => setActiveSide("bride")}
            >
              <Heart size={15} fill="#FF6B8B" color="#FF6B8B" />
              <span>THIỆP CÔ DÂU (NHÀ GÁI)</span>
            </button>
          </div>

          {/* Dòng thông báo thiệp cá nhân hóa nếu khách có đường link riêng */}
          {currentGuest && (
            <div className="guest-personalized-badge">
              <span>Thiệp mời trân trọng gửi tới: <strong>{currentGuest.fullName}</strong></span>
              <span className="badge-side-note">
                {activeSide === "groom"
                  ? "(Bữa cơm thân mật & Lễ Thành Hôn tại Nhà Trai)"
                  : "(Bữa cơm thân mật & Lễ Vu Quy tại Nhà Gái)"}
              </span>
            </div>
          )}
        </motion.div>

        {/* 2 THIỆP MỜI HIỂN THỊ DẠNG HỒNG KEM NHẠT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSide}
            className="ceremony-cards-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {currentEvents.map((eventItem, idx) => (
              <motion.div
                key={`${activeSide}-${idx}-${eventItem.title}`}
                className="burgundy-invitation-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {/* Tiêu đề sự kiện */}
                <h3 className="card-event-title">{eventItem.title}</h3>

                {/* Dòng mô tả thời gian */}
                <p className="card-event-description">{eventItem.descriptionTime}</p>

                {/* Đường kẻ ngang mảnh phía trên ngày */}
                <div className="card-divider-line" />

                {/* Ngày tổ chức nổi bật */}
                <div className="card-event-date">{eventItem.dateFormatted}</div>

                {/* Đường kẻ ngang mảnh phía dưới ngày */}
                <div className="card-divider-line" />

                {/* Chú thích âm lịch */}
                <p className="card-event-lunar">{eventItem.lunarDateFormatted}</p>

                {/* Tên địa điểm */}
                <h4 className="card-location-title">{eventItem.locationTitle}</h4>

                {/* Địa chỉ */}
                <p className="card-address">{eventItem.addressFormatted}</p>

                {/* Nút chỉ đường viên thuốc */}
                <a
                  href={eventItem.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-pill-button"
                >
                  <MapPin size={13} style={{ marginRight: "6px" }} />
                  <span>XEM CHỈ ĐƯỜNG</span>
                </a>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
