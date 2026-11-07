import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import type { Guest } from "../types/guestManagement";
import { updateGuestRSVP, getGuests, addGuest } from "../services/guestStorage";
import { sendRSVPToGoogleSheets } from "../services/googleSheetsService";
import FloatingCalendarWishes from "./FloatingCalendarWishes";

interface GuestBookSectionProps {
  initialGuestName?: string;
  currentGuest?: Guest;
  guestSide?: "groom" | "bride";
}

type RSVPStatusType = "attending" | "declined" | "maybe" | "";

export default function GuestBookSection({
  initialGuestName = "",
  currentGuest,
  guestSide,
}: GuestBookSectionProps) {
  // Kiểm tra xem khách này đã thực sự từng gửi xác nhận chưa (không dùng key chung)
  const checkGuestSubmitted = (guest?: Guest): boolean => {
    if (typeof window === "undefined") return false;
    // Dọn dẹp key wedding_rsvp chung cũ nếu có
    try {
      localStorage.removeItem("wedding_rsvp");
    } catch {
      // ignore
    }

    if (guest) {
      const rsvps = [
        guest.rsvp?.tiecThanMat?.attending,
        guest.rsvp?.thanhHon?.attending,
        guest.rsvp?.tiecThanMatNhaGai?.attending,
        guest.rsvp?.vuQuy?.attending,
      ];
      const hasDbResponse = rsvps.some((st) => st === "attending" || st === "declined");
      const hasLocalKey =
        !!localStorage.getItem(`wedding_rsvp_submitted_${guest.id}`) ||
        !!localStorage.getItem(`wedding_rsvp_submitted_${guest.code}`);
      return hasDbResponse || hasLocalKey;
    }
    return !!localStorage.getItem("wedding_rsvp_submitted_anon");
  };

  // Lấy trạng thái ban đầu: Nếu khách chưa trả lời thì để rỗng "" (KHÔNG mặc định chọn sẵn)
  const getInitialStatus = (guest?: Guest): RSVPStatusType => {
    if (!guest || !guest.rsvp) return "";
    const rsvps = [
      guest.rsvp.tiecThanMat?.attending,
      guest.rsvp.thanhHon?.attending,
      guest.rsvp.tiecThanMatNhaGai?.attending,
      guest.rsvp.vuQuy?.attending,
    ].filter(Boolean);

    if (rsvps.includes("attending")) return "attending";
    if (rsvps.length > 0 && rsvps.every((st) => st === "declined")) return "declined";
    return ""; // Chưa chọn
  };

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState(currentGuest?.fullName || initialGuestName);
  const [rsvpPhone, setRsvpPhone] = useState(currentGuest?.phone || "");
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatusType>(() => getInitialStatus(currentGuest));
  const [rsvpCount, setRsvpCount] = useState<number>(currentGuest?.expectedCount || 1);
  const [rsvpSide, setRsvpSide] = useState<"groom" | "bride">(currentGuest?.side || guestSide || "groom");
  const [rsvpNote, setRsvpNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [rsvpSubmitted, setRsvpSubmitted] = useState<boolean>(() => checkGuestSubmitted(currentGuest));

  useEffect(() => {
    if (currentGuest) {
      setRsvpName(currentGuest.fullName || "");
      if (currentGuest.phone) setRsvpPhone(currentGuest.phone);
      setRsvpSide(currentGuest.side || guestSide || "groom");
      if (currentGuest.expectedCount) setRsvpCount(currentGuest.expectedCount);
      setRsvpStatus(getInitialStatus(currentGuest));
      setRsvpSubmitted(checkGuestSubmitted(currentGuest));
    } else if (guestSide) {
      setRsvpSide(guestSide);
    }
  }, [currentGuest, guestSide]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      setErrorMsg("Vui lòng nhập họ và tên của bạn!");
      return;
    }

    // Kiểm tra người dùng đã chọn tham dự hay chưa
    if (!rsvpStatus) {
      setErrorMsg("Vui lòng chọn bạn có thể tham dự hay không (Chắc chắn tham gia / Chưa chắc chắn / Rất tiếc không thể đến)!");
      return;
    }

    setErrorMsg("");

    // Lưu cờ riêng cho khách này
    if (currentGuest) {
      localStorage.setItem(`wedding_rsvp_submitted_${currentGuest.id}`, "true");
      localStorage.setItem(`wedding_rsvp_submitted_${currentGuest.code}`, "true");
    } else {
      localStorage.setItem("wedding_rsvp_submitted_anon", "true");
    }
    setRsvpSubmitted(true);

    // Cập nhật vào hệ thống quản lý khách mời
    let matchedGuest: Guest | undefined;
    try {
      const allGuests = getGuests();
      matchedGuest = currentGuest || allGuests.find((g) => g.fullName.toLowerCase() === rsvpName.trim().toLowerCase());

      const isAttending = rsvpStatus === "attending";
      const statusValue = rsvpStatus === "declined" ? "declined" : isAttending ? "attending" : "pending";
      const determinedSide: "groom" | "bride" = rsvpSide === "bride" ? "bride" : "groom";

      if (matchedGuest) {
        const isGroom = matchedGuest.side === "groom";
        const evIds = matchedGuest.eventIds || [];

        if (isGroom) {
          if (evIds.includes("tiec_than_mat") || evIds.length === 0) {
            updateGuestRSVP(matchedGuest.id, "tiec_than_mat", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
          }
          if (evIds.includes("thanh_hon") || evIds.length === 0) {
            updateGuestRSVP(matchedGuest.id, "thanh_hon", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
          }
        } else {
          if (evIds.includes("tiec_than_mat_nha_gai") || evIds.length === 0) {
            updateGuestRSVP(matchedGuest.id, "tiec_than_mat_nha_gai", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
          }
          if (evIds.includes("vu_quy") || evIds.length === 0) {
            updateGuestRSVP(matchedGuest.id, "vu_quy", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
          }
        }
      } else {
        // Thêm khách mới vào danh sách quản lý theo đúng bên
        matchedGuest = addGuest({
          fullName: rsvpName.trim(),
          phone: rsvpPhone.trim(),
          code: rsvpName.trim().toLowerCase().replace(/\s+/g, "-"),
          group: determinedSide === "groom" ? "Bạn Chú Rể" : "Bạn Cô Dâu",
          side: determinedSide,
          eventIds: determinedSide === "groom" ? ["tiec_than_mat", "thanh_hon"] : ["tiec_than_mat_nha_gai", "vu_quy"],
          invitedTo: determinedSide === "groom" ? "thiep_chu_re" : "thiep_co_dau",
          expectedCount: rsvpCount,
          notes: rsvpNote,
          rsvp: {
            tiecThanMat: determinedSide === "groom" ? { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 } : undefined,
            thanhHon: determinedSide === "groom" ? { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 } : undefined,
            tiecThanMatNhaGai: determinedSide === "bride" ? { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 } : undefined,
            vuQuy: determinedSide === "bride" ? { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 } : undefined,
            generalNote: rsvpNote,
          },
        });
      }
    } catch (err) {
      console.error("Lỗi khi lưu RSVP vào hệ thống:", err);
    }

    // Đẩy RSVP lên Google Sheets để Admin thấy ngay trên mọi thiết bị
    const finalSide: "groom" | "bride" = matchedGuest?.side || (rsvpSide === "bride" ? "bride" : "groom");
    sendRSVPToGoogleSheets({
      guestId: matchedGuest?.id || `anon_${Date.now()}`,
      guestCode: matchedGuest?.code || rsvpName.trim().toLowerCase().replace(/\s+/g, "-"),
      fullName: rsvpName.trim(),
      phone: rsvpPhone.trim(),
      side: finalSide,
      status: (rsvpStatus as "attending" | "declined" | "maybe"),
      attendeeCount: rsvpCount,
      note: rsvpNote,
    }).catch(() => {
      // Thất bại thầm lặng — RSVP đã lưu local, không cần báo lỗi cho khách
    });
  };

  return (
    <section className="guestbook-section" id="guestbook">
      <div className="section-container">
        {/* RSVP FORM */}
        <motion.div
          className="rsvp-box-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="section-subtitle">XÁC NHẬN THAM DỰ</div>
          <h2 className="section-title">Gửi Xác Nhận Tham Dự (RSVP)</h2>
          <div className="title-divider-leaf">
            <span className="leaf-line" />
            <UserCheck size={18} color="#c5a059" />
            <span className="leaf-line" />
          </div>
          <p className="section-description">
            Để gia đình chuẩn bị chu đáo nhất cho bữa tiệc mừng, quý khách vui lòng xác nhận tham dự trước ngày cưới nhé!
          </p>

          {rsvpSubmitted ? (
            <div className="rsvp-success-card">
              <CheckCircle2 size={48} className="icon-success" />
              <h3>Cảm Ơn Bạn Rất Nhiều!</h3>
              <p>
                Gia đình đã nhận được thông tin xác nhận của bạn. Rất mong được đón tiếp bạn trong ngày vui của chúng mình!
              </p>
              <button
                type="button"
                className="btn-edit-rsvp"
                onClick={() => setRsvpSubmitted(false)}
              >
                Chỉnh sửa phản hồi
              </button>
            </div>
          ) : (
            <form className="rsvp-form" onSubmit={handleRsvpSubmit}>
              <div className="form-group-row">
                <div className="form-field">
                  <label>Họ và Tên của bạn *</label>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => { setRsvpName(e.target.value); setErrorMsg(""); }}
                  />
                </div>

                <div className="form-field">
                  <label>Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* LỰA CHỌN THAM DỰ: KHÔNG MẶC ĐỊNH CHỌN SẴN, ĐỂ KHÁCH TỰ BẤM CHỌN */}
              <div className="form-field">
                <label>Bạn sẽ tham dự chứ? *</label>
                <div className="radio-group-chips">
                  <label className={`chip-item ${rsvpStatus === "attending" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "attending"}
                      onChange={() => { setRsvpStatus("attending"); setErrorMsg(""); }}
                    />
                    <span>💖 Chắc chắn tham gia</span>
                  </label>

                  <label className={`chip-item ${rsvpStatus === "maybe" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "maybe"}
                      onChange={() => { setRsvpStatus("maybe"); setErrorMsg(""); }}
                    />
                    <span>🤔 Chưa chắc chắn</span>
                  </label>

                  <label className={`chip-item ${rsvpStatus === "declined" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "declined"}
                      onChange={() => { setRsvpStatus("declined"); setErrorMsg(""); }}
                    />
                    <span>💌 Rất tiếc không thể đến</span>
                  </label>
                </div>
              </div>

              {/* CHỈ HIỆN SỐ NGƯỜI KHI KHÁCH ĐÃ CHỌN THAM GIA */}
              {rsvpStatus === "attending" && (
                <div className="form-group-row">
                  <div className="form-field">
                    <label>Số người tham dự</label>
                    <select
                      value={rsvpCount}
                      onChange={(e) => setRsvpCount(Number(e.target.value))}
                    >
                      <option value={1}>1 người (Một mình tôi)</option>
                      <option value={2}>2 người (Cùng người thương / bạn)</option>
                      <option value={3}>3 người (Gia đình nhỏ)</option>
                      <option value={4}>4+ người (Cả gia đình)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Khách mời của</label>
                    <select
                      value={rsvpSide}
                      onChange={(e) => setRsvpSide(e.target.value as "groom" | "bride")}
                    >
                      <option value="groom">Nhà Trai (Phía Chú Rể)</option>
                      <option value="bride">Nhà Gái (Phía Cô Dâu)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-field">
                <label>Ghi chú hoặc lời nhắn riêng (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mình sẽ đến vào tiệc trưa... / Chúc hai bạn trăm năm hạnh phúc!"
                  value={rsvpNote}
                  onChange={(e) => setRsvpNote(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div style={{ color: "#C02640", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", background: "#FFF0F3", padding: "8px 12px", borderRadius: "8px", border: "1px solid #F5CCD4" }}>
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" className="btn-submit-rsvp">
                <CheckCircle2 size={18} />
                <span>XÁC NHẬN THAM DỰ NGAY</span>
              </button>
            </form>
          )}
        </motion.div>

        {/* MODULE LỊCH CƯỚI & LỜI CHÚC NỔI (FLOATING LIVE WISHES) */}
        <div className="wishes-section-container">
          <motion.div
            className="section-header-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-subtitle">LỜI CHÚC PHÚC</div>
            <h2 className="section-title">Sổ Lưu Bút Mừng Cưới</h2>
            <div className="title-divider-leaf">
              <span className="leaf-line" />
              <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
              <span className="leaf-line" />
            </div>
            <p className="section-description">
              Cảm ơn những lời chúc ý nghĩa, tình cảm và sự hiện diện của mọi người trong ngày trọng đại của chúng mình!
            </p>
          </motion.div>

          {/* Module Lời Chúc Tương Tác Trực Tuyến */}
          <FloatingCalendarWishes
            currentGuest={currentGuest}
            initialGuestName={initialGuestName}
          />
        </div>
      </div>
    </section>
  );
}
