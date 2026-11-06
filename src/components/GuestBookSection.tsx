import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, UserCheck } from "lucide-react";
import type { Guest } from "../types/guestManagement";
import { updateGuestRSVP, getGuests, addGuest } from "../services/guestStorage";
import FloatingCalendarWishes from "./FloatingCalendarWishes";

interface GuestBookSectionProps {
  initialGuestName?: string;
  currentGuest?: Guest;
}

export default function GuestBookSection({ initialGuestName = "", currentGuest }: GuestBookSectionProps) {
  // RSVP Form State
  const [rsvpName, setRsvpName] = useState(currentGuest?.fullName || initialGuestName);
  const [rsvpPhone, setRsvpPhone] = useState(currentGuest?.phone || "");
  const [rsvpStatus, setRsvpStatus] = useState<"attending" | "declined" | "maybe">("attending");
  const [rsvpCount, setRsvpCount] = useState<number>(currentGuest?.expectedCount || 1);
  const [rsvpSide, setRsvpSide] = useState<"groom" | "bride" | "both">("groom");
  const [rsvpNote, setRsvpNote] = useState("");
  const [rsvpSubmitted, setRsvpSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("wedding_rsvp");
  });

  useEffect(() => {
    if (currentGuest?.fullName) {
      setRsvpName(currentGuest.fullName);
      if (currentGuest.phone) setRsvpPhone(currentGuest.phone);
    }
  }, [currentGuest]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;

    const rsvpData = {
      name: rsvpName,
      phone: rsvpPhone,
      status: rsvpStatus,
      count: rsvpCount,
      side: rsvpSide,
      note: rsvpNote,
      submittedAt: new Date().toISOString(),
    };

    localStorage.setItem("wedding_rsvp", JSON.stringify(rsvpData));
    setRsvpSubmitted(true);

    // Cập nhật vào hệ thống quản lý khách mời
    try {
      const allGuests = getGuests();
      let matched = currentGuest || allGuests.find((g) => g.fullName.toLowerCase() === rsvpName.trim().toLowerCase());

      const isAttending = rsvpStatus === "attending";
      const statusValue = rsvpStatus === "declined" ? "declined" : isAttending ? "attending" : "pending";

      if (matched) {
        if (
          matched.invitedTo === "both" ||
          matched.invitedTo === "tiec_than_mat" ||
          matched.invitedTo === "thiep_chu_re" ||
          matched.invitedTo === "thiep_co_dau"
        ) {
          updateGuestRSVP(matched.id, "tiec_than_mat", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
        }
        if (
          matched.invitedTo === "both" ||
          matched.invitedTo === "vu_quy" ||
          matched.invitedTo === "thiep_co_dau"
        ) {
          updateGuestRSVP(matched.id, "vu_quy", statusValue, isAttending ? rsvpCount : 0, rsvpNote);
        }
      } else {
        // Tự động thêm khách mới vào danh sách quản lý
        addGuest({
          fullName: rsvpName.trim(),
          phone: rsvpPhone.trim(),
          code: rsvpName.trim().toLowerCase().replace(/\s+/g, "-"),
          group: rsvpSide === "groom" ? "Bạn Chú Rể" : rsvpSide === "bride" ? "Bạn Cô Dâu" : "Bạn Bè",
          invitedTo: rsvpSide === "groom" ? "thiep_chu_re" : "thiep_co_dau",
          expectedCount: rsvpCount,
          notes: rsvpNote,
          rsvp: {
            tiecThanMat: { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 },
            vuQuy: { attending: statusValue, attendeeCount: isAttending ? rsvpCount : 0 },
            generalNote: rsvpNote,
          },
        });
      }
    } catch (err) {
      console.error("Lỗi khi lưu RSVP vào hệ thống:", err);
    }
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
                    placeholder="Ví dụ: Tuấn Dịu"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    placeholder="0988 xxx xxx"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Bạn sẽ tham dự chứ? *</label>
                <div className="radio-group-chips">
                  <label className={`chip-item ${rsvpStatus === "attending" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "attending"}
                      onChange={() => setRsvpStatus("attending")}
                    />
                    <span>Chắc chắn tham gia</span>
                  </label>

                  <label className={`chip-item ${rsvpStatus === "maybe" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "maybe"}
                      onChange={() => setRsvpStatus("maybe")}
                    />
                    <span>Chưa chắc chắn</span>
                  </label>

                  <label className={`chip-item ${rsvpStatus === "declined" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="status"
                      checked={rsvpStatus === "declined"}
                      onChange={() => setRsvpStatus("declined")}
                    />
                    <span>Rất tiếc không thể đến</span>
                  </label>
                </div>
              </div>

              {rsvpStatus === "attending" && (
                <div className="form-group-row">
                  <div className="form-field">
                    <label>Số người tham dự</label>
                    <select
                      value={rsvpCount}
                      onChange={(e) => setRsvpCount(Number(e.target.value))}
                    >
                      <option value={1}>1 người (Một mình tôi)</option>
                      <option value={2}>2 người (Cùng người thương/bạn)</option>
                      <option value={3}>3 người (Gia đình nhỏ)</option>
                      <option value={4}>4+ người (Cả gia đình)</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Khách mời của</label>
                    <select
                      value={rsvpSide}
                      onChange={(e) => setRsvpSide(e.target.value as "groom" | "bride" | "both")}
                    >
                      <option value="groom">Nhà Trai (Bạn Chú Rể)</option>
                      <option value="bride">Nhà Gái (Bạn Cô Dâu)</option>
                      <option value="both">Bạn chung cả hai</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-field">
                <label>Ghi chú hoặc lời nhắn riêng (nếu có)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mình sẽ đến vào tiệc trưa chủ nhật..."
                  value={rsvpNote}
                  onChange={(e) => setRsvpNote(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-submit-rsvp">
                <CheckCircle2 size={18} />
                <span>XÁC NHẬN THAM DỰ NGAY</span>
              </button>
            </form>
          )}
        </motion.div>

        {/* MODULE LỊCH CƯỚI & LỜI CHÚC NỔI (FLOATING LIVE WISHES - ZENLOVE 83 PRE STYLE) */}
        <div className="wishes-section-container">
          <motion.div
            className="section-header-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-subtitle">SAVE THE DATE</div>
            <h2 className="section-title">Lịch Cưới</h2>
            <div className="title-divider-leaf">
              <span className="leaf-line" />
              <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
              <span className="leaf-line" />
            </div>
            <p className="section-description">
              Ngày 22 tháng 11 năm 2026 — cùng bắn tim và gửi lời chúc yêu thương đến hai bạn trẻ nhé!
            </p>
          </motion.div>

          <FloatingCalendarWishes
            currentGuest={currentGuest}
            initialGuestName={initialGuestName}
          />

          {/* PHÂN CÁCH LỜI CHÚC */}
          <motion.div
            className="wishes-label-row"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="wishes-label-inner">
              <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
              <span>Lời chúc phúc sẽ bay lên trực tiếp trên thiệp cưới</span>
              <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
