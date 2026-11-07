import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, MapPin } from "lucide-react";
import { weddingData } from "../data/weddingData";
import type { Guest } from "../types/guestManagement";
import type { EventDetail } from "../data/weddingData";

interface CeremonySectionProps {
  currentGuest?: Guest;
  isGuestView?: boolean;
  guestSide?: "groom" | "bride";
}

export default function CeremonySection({
  currentGuest,
  isGuestView = false,
  guestSide,
}: CeremonySectionProps) {
  // 1. TẤT CẢ SỰ KIỆN CHUẨN CỦA HAI BÊN TỪ WEDDING DATA
  // Bảo đảm 100% sự kiện nhà trai có side = "groom", nhà gái có side = "bride"
  const groomAllEvents: EventDetail[] = useMemo(() => {
    const list = [
      weddingData.events.tiecThanMatNhaTrai || weddingData.events.tiecThanMat,
      weddingData.events.thanhHon,
    ];
    return list.filter((ev): ev is EventDetail => Boolean(ev && ev.side === "groom"));
  }, []);

  const brideAllEvents: EventDetail[] = useMemo(() => {
    const list = [
      weddingData.events.tiecThanMatNhaGai,
      weddingData.events.vuQuy,
    ];
    return list.filter((ev): ev is EventDetail => Boolean(ev && ev.side === "bride"));
  }, []);

  // 2. XÁC ĐỊNH BÊN VÀ DANH SÁCH SỰ KIỆN THEO CHẾ ĐỘ XEM
  // - Khách Nhà trai: CHỈ hiển thị sự kiện side = "groom", KHÔNG hiển thị bất kỳ sự kiện nào của Nhà gái.
  // - Khách Nhà gái: CHỈ hiển thị sự kiện side = "bride", KHÔNG hiển thị bất kỳ sự kiện nào của Nhà trai.
  // - Chủ sở hữu: Xem và quản lý toàn bộ sự kiện của cả hai bên.
  const isGuest = isGuestView || Boolean(currentGuest && !window.location.search.includes("mode=owner"));
  const effectiveGuestSide: "groom" | "bride" = guestSide || currentGuest?.side || "groom";

  // Quyền chuyển đổi giữa 2 tab: CHỈ dành cho Chủ sở hữu. Khách mời bị khóa cố định theo đúng bên được mời.
  const canSwitchSides = !isGuest;

  // Lọc sự kiện cho khách mời
  const { guestGroomEvents, guestBrideEvents } = useMemo(() => {
    if (!isGuest) {
      return {
        guestGroomEvents: groomAllEvents,
        guestBrideEvents: brideAllEvents,
      };
    }

    const eventIds = currentGuest?.eventIds || [];

    let groomFiltered = groomAllEvents;
    if (eventIds.length > 0) {
      const matched = groomAllEvents.filter((ev) => eventIds.includes(ev.id));
      if (matched.length > 0) groomFiltered = matched;
    }

    let brideFiltered = brideAllEvents;
    if (eventIds.length > 0) {
      const matched = brideAllEvents.filter((ev) => eventIds.includes(ev.id));
      if (matched.length > 0) brideFiltered = matched;
    }

    return {
      guestGroomEvents: groomFiltered,
      guestBrideEvents: brideFiltered,
    };
  }, [isGuest, currentGuest, groomAllEvents, brideAllEvents]);

  // Tab đang hoạt động
  const [activeSide, setActiveSide] = useState<"groom" | "bride">(() => {
    if (isGuest) return effectiveGuestSide;
    return "groom";
  });

  // Đồng bộ khi prop thay đổi
  useEffect(() => {
    if (isGuest) {
      setActiveSide(effectiveGuestSide);
    }
  }, [isGuest, effectiveGuestSide]);

  // Danh sách sự kiện sẽ render theo activeSide
  const currentEvents = useMemo(() => {
    if (isGuest) {
      // Khách mời: Lọc triệt để theo effectiveGuestSide
      return effectiveGuestSide === "groom" ? guestGroomEvents : guestBrideEvents;
    }
    // Chủ sở hữu: Hiển thị danh sách sự kiện theo tab được chọn
    return activeSide === "groom" ? groomAllEvents : brideAllEvents;
  }, [isGuest, effectiveGuestSide, guestGroomEvents, guestBrideEvents, activeSide, groomAllEvents, brideAllEvents]);

  // Nếu không có sự kiện nào hợp lệ, không hiển thị section
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

          {/* THANH CHUYỂN ĐỔI 2 THIỆP: CHỈ HIỂN THỊ CHO CHỦ SỞ HỮU, ẨN HOÀN TOÀN VỚI KHÁCH MỜI */}
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

          {/* DÒNG THÔNG BÁO THIỆP CÁ NHÂN HÓA DÀNH CHO KHÁCH MỜI */}
          {isGuest && (
            <div className="guest-personalized-badge">
              <span>
                Thiệp mời trân trọng gửi tới:{" "}
                <strong>{currentGuest?.fullName || "Quý khách"}</strong>
              </span>
              <span className="badge-side-note">
                {effectiveGuestSide === "groom"
                  ? `(${currentEvents.map((e) => e.title).join(" & ")} tại Nhà Trai)`
                  : `(${currentEvents.map((e) => e.title).join(" & ")} tại Nhà Gái)`}
              </span>
            </div>
          )}
        </motion.div>

        {/* LƯỚI CARD THIỆP MỜI: NẾU CHỈ CÓ 1 SỰ KIỆN SẼ TỰ ĐỘNG CĂN GIỮA ĐẸP MẮT */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${isGuest ? effectiveGuestSide : activeSide}-${currentEvents.length}`}
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
                key={`${eventItem.side}-${eventItem.id || idx}-${eventItem.title}`}
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
