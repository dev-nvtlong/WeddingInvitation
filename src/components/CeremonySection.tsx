import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, MapPin } from "lucide-react";
import { weddingData } from "../data/weddingData";
import type { Guest } from "../types/guestManagement";
import type { EventDetail } from "../data/weddingData";

interface CeremonySectionProps {
  currentGuest?: Guest;
}

export default function CeremonySection({ currentGuest }: CeremonySectionProps) {
  // 1. TẤT CẢ SỰ KIỆN CỦA HAI BÊN TỪ DỮ LIỆU CHUẨN
  const groomAllEvents: EventDetail[] = [
    weddingData.events.tiecThanMatNhaTrai || weddingData.events.tiecThanMat,
    weddingData.events.thanhHon,
  ];

  const brideAllEvents: EventDetail[] = [
    weddingData.events.tiecThanMatNhaGai || weddingData.events.tiecThanMat,
    weddingData.events.vuQuy,
  ];

  // 2. LỌC SỰ KIỆN THEO KHÁCH MỜI
  // Nếu có khách mời cá nhân: lọc theo guest.eventIds và event.side
  const { invitedGroomEvents, invitedBrideEvents, hasAnyInvitedEvents } = useMemo(() => {
    if (!currentGuest) {
      return {
        invitedGroomEvents: groomAllEvents,
        invitedBrideEvents: brideAllEvents,
        hasAnyInvitedEvents: true,
      };
    }

    const eventIds = currentGuest.eventIds || [];

    const groomFiltered = groomAllEvents.filter(
      (ev) => eventIds.includes(ev.id) && ev.side === "groom"
    );

    const brideFiltered = brideAllEvents.filter(
      (ev) => eventIds.includes(ev.id) && ev.side === "bride"
    );

    return {
      invitedGroomEvents: groomFiltered,
      invitedBrideEvents: brideFiltered,
      hasAnyInvitedEvents: groomFiltered.length > 0 || brideFiltered.length > 0,
    };
  }, [currentGuest]);

  // Yêu cầu: "Nếu khách không được mời sự kiện nào thì không hiển thị phần lịch trình sự kiện."
  if (currentGuest && !hasAnyInvitedEvents) {
    return null;
  }

  // 3. XÁC ĐỊNH BÊN MẶC ĐỊNH (activeSide) VÀ ĐIỀU KIỆN HIỂN THỊ TAB SWITCHER
  // Có cho phép đổi tab hay không?
  // - Nếu không có currentGuest: cho phép đổi giữa 2 bên tự do.
  // - Nếu currentGuest có sự kiện ở cả 2 bên (invitedGroomEvents > 0 && invitedBrideEvents > 0): cho phép đổi tab.
  // - Nếu currentGuest chỉ có sự kiện nhà trai: cố định groom, KHÔNG cho đổi/không hiển thị tab nhà gái.
  // - Nếu currentGuest chỉ có sự kiện nhà gái: cố định bride, KHÔNG cho đổi/không hiển thị tab nhà trai.
  const canSwitchSides = !currentGuest || (invitedGroomEvents.length > 0 && invitedBrideEvents.length > 0);

  const defaultSide: "groom" | "bride" = useMemo(() => {
    if (!currentGuest) return "groom";
    if (invitedGroomEvents.length > 0 && invitedBrideEvents.length === 0) return "groom";
    if (invitedBrideEvents.length > 0 && invitedGroomEvents.length === 0) return "bride";
    return currentGuest.side === "bride" ? "bride" : "groom";
  }, [currentGuest, invitedGroomEvents.length, invitedBrideEvents.length]);

  const [activeSide, setActiveSide] = useState<"groom" | "bride">(defaultSide);

  // Cập nhật khi defaultSide thay đổi hoặc đọc query params URL (?side=groom | bride)
  useEffect(() => {
    if (!canSwitchSides) {
      setActiveSide(defaultSide);
      return;
    }

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
    } else {
      setActiveSide(defaultSide);
    }
  }, [defaultSide, canSwitchSides]);

  // Danh sách sự kiện sẽ render theo activeSide
  const currentEvents = activeSide === "groom" ? invitedGroomEvents : invitedBrideEvents;

  // Nếu bên đang chọn không có sự kiện nào thì không render card rỗng
  if (currentEvents.length === 0) {
    return null;
  }

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

          {/* THANH CHUYỂN ĐỔI 2 THIỆP: CHỈ HIỂN THỊ KHI KHÁCH ĐƯỢC MỜI CẢ 2 BÊN HOẶC TRUY CẬP LINK CHUNG */}
          {canSwitchSides && (
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
          )}

          {/* DÒNG THÔNG BÁO THIỆP CÁ NHÂN HÓA NẾU KHÁCH CÓ ĐƯỜNG LINK RIÊNG */}
          {currentGuest && (
            <div className="guest-personalized-badge">
              <span>Thiệp mời trân trọng gửi tới: <strong>{currentGuest.fullName}</strong></span>
              <span className="badge-side-note">
                {activeSide === "groom"
                  ? `(${invitedGroomEvents.map((e) => e.title).join(" & ")} tại Nhà Trai)`
                  : `(${invitedBrideEvents.map((e) => e.title).join(" & ")} tại Nhà Gái)`}
              </span>
            </div>
          )}
        </motion.div>

        {/* THIỆP MỜI HIỂN THỊ DẠNG HỒNG KEM NHẠT */}
        {/* NẾU CHỈ CÓ 1 SỰ KIỆN: CĂN GIỮA VÀ BỐ CỤC GỌN GÀNG, KHÔNG ĐỂ LẠI CARD TRỐNG HOẶC KHOẢNG TRẮNG */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSide}-${currentEvents.length}`}
            className={`ceremony-cards-grid ${currentEvents.length === 1 ? "single-card" : ""}`}
            style={
              currentEvents.length === 1
                ? {
                    gridTemplateColumns: "minmax(0, 520px)",
                    justifyContent: "center",
                  }
                : undefined
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {currentEvents.map((eventItem, idx) => (
              <motion.div
                key={`${activeSide}-${eventItem.id || idx}-${eventItem.title}`}
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
