import { useState, useEffect } from "react";
import { X, User, Phone, Users, Calendar, Hash, FileText, CheckSquare, MapPin } from "lucide-react";
import type { Guest, InvitedEventType, WeddingSide } from "../types/guestManagement";
import { generateGuestSlug, getGuests } from "../services/guestStorage";
import { AVAILABLE_EVENTS } from "../data/weddingData";

interface GuestModalProps {
  guest?: Guest | null;
  defaultSide?: WeddingSide;
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: any) => void;
}

const COMMON_GROUPS_GROOM = [
  "Bạn Chú Rể",
  "Họ Nhà Trai (Hải Phòng)",
  "Đồng Nghiệp Chú Rể",
  "Khác",
];

const COMMON_GROUPS_BRIDE = [
  "Bạn Cô Dâu",
  "Họ Nhà Gái (Ninh Bình)",
  "Đồng Nghiệp Cô Dâu",
  "Khác",
];

export default function GuestModal({ guest, defaultSide = "groom", isOpen, onClose, onSave }: GuestModalProps) {
  const isEditing = !!guest;

  const [fullName, setFullName] = useState(guest?.fullName || "");
  const [code, setCode] = useState(guest?.code || "");
  const [phone, setPhone] = useState(guest?.phone || "");

  // Phân loại bên: Bắt buộc là "groom" hoặc "bride"
  const initialSide: WeddingSide = guest?.side ? (guest.side === "bride" ? "bride" : "groom") : defaultSide;
  const [side, setSide] = useState<WeddingSide>(initialSide);

  const [group, setGroup] = useState(() => {
    if (guest?.group) return guest.group;
    return initialSide === "bride" ? "Họ Nhà Gái (Ninh Bình)" : "Họ Nhà Trai (Hải Phòng)";
  });

  // Danh sách sự kiện được mời (chỉ gồm sự kiện của bên đã chọn)
  const [eventIds, setEventIds] = useState<string[]>(() => {
    if (guest?.eventIds && guest.eventIds.length > 0) {
      if (initialSide === "bride") {
        const filtered = guest.eventIds.filter((e) => e === "tiec_than_mat_nha_gai" || e === "vu_quy");
        return filtered.length > 0 ? filtered : ["tiec_than_mat_nha_gai", "vu_quy"];
      } else {
        const filtered = guest.eventIds.filter((e) => e === "tiec_than_mat" || e === "thanh_hon");
        return filtered.length > 0 ? filtered : ["tiec_than_mat", "thanh_hon"];
      }
    }
    return initialSide === "bride" ? ["tiec_than_mat_nha_gai", "vu_quy"] : ["tiec_than_mat", "thanh_hon"];
  });

  const [expectedCount, setExpectedCount] = useState<number>(guest?.expectedCount || 1);
  const [notes, setNotes] = useState(guest?.notes || "");
  const [error, setError] = useState("");

  // Cập nhật lại form nếu mở modal mới hoặc thay đổi guest / defaultSide
  useEffect(() => {
    if (isOpen) {
      if (guest) {
        setFullName(guest.fullName || "");
        setCode(guest.code || "");
        setPhone(guest.phone || "");
        const curSide = guest.side === "bride" ? "bride" : "groom";
        setSide(curSide);
        setGroup(guest.group || (curSide === "bride" ? "Họ Nhà Gái (Ninh Bình)" : "Họ Nhà Trai (Hải Phòng)"));
        setExpectedCount(guest.expectedCount || 1);
        setNotes(guest.notes || "");
        if (guest.eventIds && guest.eventIds.length > 0) {
          setEventIds(guest.eventIds);
        } else {
          setEventIds(curSide === "bride" ? ["tiec_than_mat_nha_gai", "vu_quy"] : ["tiec_than_mat", "thanh_hon"]);
        }
      } else {
        setFullName("");
        setCode("");
        setPhone("");
        setSide(defaultSide);
        setGroup(defaultSide === "bride" ? "Họ Nhà Gái (Ninh Bình)" : "Họ Nhà Trai (Hải Phòng)");
        setEventIds(defaultSide === "bride" ? ["tiec_than_mat_nha_gai", "vu_quy"] : ["tiec_than_mat", "thanh_hon"]);
        setExpectedCount(1);
        setNotes("");
      }
      setError("");
    }
  }, [isOpen, guest, defaultSide]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!isEditing && (!code || code === generateGuestSlug(fullName))) {
      setCode(generateGuestSlug(val));
    }
  };

  // Đổi Bên mời (side) -> Tự động chuyển sự kiện tương ứng của bên đó
  const handleSideChange = (newSide: WeddingSide) => {
    setSide(newSide);
    if (newSide === "groom") {
      setEventIds(["tiec_than_mat", "thanh_hon"]);
      if (group.toLowerCase().includes("nhà gái") || group.toLowerCase().includes("cô dâu")) {
        setGroup("Bạn Thế (Nhà Trai)");
      }
    } else {
      setEventIds(["tiec_than_mat_nha_gai", "vu_quy"]);
      if (group.toLowerCase().includes("nhà trai") || group.toLowerCase().includes("chú rể")) {
        setGroup("Họ Nhà Gái (Ninh Bình)");
      }
    }
  };

  // Toggle sự kiện
  const handleToggleEvent = (id: string) => {
    setEventIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const selectAllPartyEvents = () => {
    if (side === "groom") {
      setEventIds(["tiec_than_mat", "thanh_hon"]);
    } else {
      setEventIds(["tiec_than_mat_nha_gai", "vu_quy"]);
    }
  };

  const clearAllEvents = () => {
    setEventIds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    if (eventIds.length === 0) {
      setError("Vui lòng chọn ít nhất một sự kiện để mời khách tham dự.");
      return;
    }

    const guestCode = code.trim() || generateGuestSlug(fullName.trim());
    if (getGuests().some((item) => item.id !== guest?.id && item.code.toLowerCase() === guestCode.toLowerCase())) {
      setError("Mã link này đã được sử dụng. Vui lòng chọn mã khác.");
      return;
    }

    // Tương thích ngược: Suy ra invitedTo
    let calculatedInvitedTo: InvitedEventType = "thiep_chu_re";
    if (side === "bride") {
      if (eventIds.length === 1 && eventIds.includes("vu_quy")) {
        calculatedInvitedTo = "vu_quy";
      } else if (eventIds.length === 1 && eventIds.includes("tiec_than_mat_nha_gai")) {
        calculatedInvitedTo = "tiec_than_mat_nha_gai";
      } else {
        calculatedInvitedTo = "thiep_co_dau";
      }
    } else {
      if (eventIds.length === 1 && eventIds.includes("tiec_than_mat")) {
        calculatedInvitedTo = "tiec_than_mat";
      } else {
        calculatedInvitedTo = "thiep_chu_re";
      }
    }

    const now = new Date().toISOString();

    const data = {
      ...(guest || {}),
      fullName: fullName.trim(),
      code: guestCode,
      phone: phone.trim(),
      group: group.trim() || (side === "groom" ? "Họ Nhà Trai" : "Họ Nhà Gái"),
      side,
      eventIds,
      invitedTo: calculatedInvitedTo,
      expectedCount: Number(expectedCount) || 1,
      notes: notes.trim(),
      updatedAt: now,
    };

    onSave(data);
    onClose();
  };

  // Chỉ lấy sự kiện theo side đã chọn
  const availablePartyEvents = AVAILABLE_EVENTS.filter((e) => e.side === side);
  const commonGroupList = side === "groom" ? COMMON_GROUPS_GROOM : COMMON_GROUPS_BRIDE;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Chỉnh sửa khách mời" : "Thêm khách mời"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <h3>
            {isEditing
              ? `Chỉnh Sửa Khách Mời (${side === "groom" ? "Nhà Trai" : "Nhà Gái"})`
              : `Thêm Khách Mời (${side === "groom" ? "Nhà Trai" : "Nhà Gái"})`}
          </h3>
          <button className="btn-close-admin-modal" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Phân loại Bên Mời (Bắt buộc groom hoặc bride) */}
          <div className="form-field-group">
            <label>
              <Calendar size={14} style={{ display: "inline", marginRight: "6px" }} />
              Phân loại danh sách khách mời *
            </label>
            <select
              aria-label="Khách mời thuộc bên"
              value={side}
              onChange={(e) => handleSideChange(e.target.value as WeddingSide)}
              style={{
                fontWeight: 600,
                color: side === "groom" ? "#65001D" : "#B8506C",
                background: side === "groom" ? "#FFF5F7" : "#FDF4F6",
                borderColor: side === "groom" ? "#E6BDC6" : "#EAC8D2",
              }}
            >
              <option value="groom">🤵 Khách Mời Nhà Trai (Chú Rể)</option>
              <option value="bride">👰 Khách Mời Nhà Gái (Cô Dâu)</option>
            </select>
          </div>

          {/* Họ và tên */}
          <div className="form-field-group">
            <label>
              <User size={14} style={{ display: "inline", marginRight: "6px" }} />
              Họ và tên khách mời *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Mã URL rút gọn (Slug code) */}
          <div className="form-field-group">
            <label>
              <Hash size={14} style={{ display: "inline", marginRight: "6px" }} />
              Mã link thiệp cá nhân (?g=...)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          {/* Số điện thoại */}
          <div className="form-field-group">
            <label>
              <Phone size={14} style={{ display: "inline", marginRight: "6px" }} />
              Số điện thoại (tùy chọn)
            </label>
            <input
              type="tel"
              placeholder="0912 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Phân nhóm khách */}
          <div className="form-field-group">
            <label>
              <Users size={14} style={{ display: "inline", marginRight: "6px" }} />
              Nhóm khách mời ({side === "groom" ? "Nhà Trai" : "Nhà Gái"})
            </label>
            <select
              aria-label="Nhóm khách mời"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {Array.from(
                new Set([
                  ...commonGroupList,
                  ...getGuests()
                    .filter((item) => item.side === side)
                    .map((item) => item.group)
                    .filter(Boolean),
                  ...(group ? [group] : []),
                ])
              ).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* DANH SÁCH SỰ KIỆN MỜI CỦA BÊN NÀY */}
          <div className="form-field-group">
            <label>
              <CheckSquare size={14} style={{ display: "inline", marginRight: "6px" }} />
              Sự kiện mời tham dự ({side === "groom" ? "Sự kiện Nhà Trai" : "Sự kiện Nhà Gái"}) *
            </label>

            <div className="events-select-container">
              {/* Nút chọn nhanh */}
              <div className="events-quick-actions">
                <button type="button" className="btn-event-quick" onClick={selectAllPartyEvents}>
                  Chọn tất cả
                </button>
                <button type="button" className="btn-event-quick" onClick={clearAllEvents}>
                  Bỏ chọn
                </button>
              </div>

              <div className="events-subgroup">
                {availablePartyEvents.map((evt) => {
                  const isChecked = eventIds.includes(evt.id);
                  return (
                    <div
                      key={evt.id}
                      className={`event-checkbox-card ${isChecked ? "selected" : ""}`}
                      onClick={() => handleToggleEvent(evt.id)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        onChangeCapture={() => handleToggleEvent(evt.id)}
                      />
                      <div className="event-checkbox-info">
                        <div className="event-checkbox-title">{evt.name}</div>
                        <div className="event-checkbox-meta">{evt.timeDate}</div>
                        <div className="event-checkbox-location">
                          <MapPin size={11} />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Số lượng người dự kiến */}
          <div className="form-field-group">
            <label>Số lượng khách dự kiến / đi cùng (Người)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={expectedCount}
              onChange={(e) => setExpectedCount(parseInt(e.target.value, 10) || 1)}
            />
          </div>

          {/* Ghi chú */}
          <div className="form-field-group">
            <label>
              <FileText size={14} style={{ display: "inline", marginRight: "6px" }} />
              Ghi chú thêm (Bàn tiệc, xe đưa đón...)
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú nội bộ dành cho ban tổ chức..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p role="alert" className="login-error-msg">{error}</p>}
          <div className="form-actions-row">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-primary-action">
              {isEditing ? "Lưu Thay Đổi" : "Thêm Khách Mời"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
