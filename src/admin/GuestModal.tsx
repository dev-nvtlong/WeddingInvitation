import { useState } from "react";
import { X, User, Phone, Users, Calendar, Hash, FileText } from "lucide-react";
import type { Guest, InvitedEventType } from "../types/guestManagement";
import { generateGuestSlug } from "../services/guestStorage";

interface GuestModalProps {
  guest?: Guest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (guestData: any) => void;
}

const COMMON_GROUPS = [
  "Bạn Thế (Nhà Trai)",
  "Gia Phong",
  "Bạn Chú Rể",
  "Bạn Cô Dâu",
  "Họ Nhà Trai (Hải Phòng)",
  "Họ Nhà Gái (Ninh Bình)",
  "Đồng Nghiệp Chú Rể",
  "Đồng Nghiệp Cô Dâu",
  "Khách VIP",
  "Khác",
];

export default function GuestModal({ guest, isOpen, onClose, onSave }: GuestModalProps) {
  const isEditing = !!guest;

  const [fullName, setFullName] = useState(guest?.fullName || "");
  const [code, setCode] = useState(guest?.code || "");
  const [phone, setPhone] = useState(guest?.phone || "");
  const [group, setGroup] = useState(guest?.group || "Bạn Thế (Nhà Trai)");
  const [invitedTo, setInvitedTo] = useState<InvitedEventType>(guest?.invitedTo || "thiep_chu_re");
  const [expectedCount, setExpectedCount] = useState<number>(guest?.expectedCount || 1);
  const [notes, setNotes] = useState(guest?.notes || "");

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setFullName(val);
    if (!isEditing && (!code || code === generateGuestSlug(fullName))) {
      setCode(generateGuestSlug(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const data = {
      ...(guest || {}),
      fullName: fullName.trim(),
      code: code.trim() || generateGuestSlug(fullName.trim()),
      phone: phone.trim(),
      group: group.trim() || "Bạn Bè",
      invitedTo,
      expectedCount: Number(expectedCount) || 1,
      notes: notes.trim(),
    };

    onSave(data);
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h3>{isEditing ? "Chỉnh Sửa Thông Tin Khách Mời" : "Thêm Khách Mời Mới"}</h3>
          <button className="btn-close-admin-modal" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Họ và tên */}
          <div className="form-field-group">
            <label>
              <User size={14} style={{ display: "inline", marginRight: "6px" }} />
              Họ và tên khách mời *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Tuấn Dịu, Anh Thám..."
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
              Mã link cá nhân hóa (Dùng trong URL thiệp: ?g=...)
            </label>
            <input
              type="text"
              placeholder="Ví dụ: tuan-diu"
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
              Nhóm khách mời
            </label>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {COMMON_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Loại thiệp mời (Admin chọn: Thiệp Chú Rể hoặc Thiệp Cô Dâu) */}
          <div className="form-field-group">
            <label>
              <Calendar size={14} style={{ display: "inline", marginRight: "6px" }} />
              Loại thiệp mời của khách
            </label>
            <select
              value={invitedTo}
              onChange={(e) => setInvitedTo(e.target.value as InvitedEventType)}
            >
              <option value="thiep_chu_re">
                🤵 Thiệp Chú Rể (Bữa cơm thân mật + Lễ thành hôn tại Nhà Trai)
              </option>
              <option value="thiep_co_dau">
                👰 Thiệp Cô Dâu (Bữa cơm thân mật + Lễ vu quy tại Nhà Gái)
              </option>
              <option value="both">
                ✨ Cả 2 bên (Hiển thị đầy đủ cả Nhà Trai & Nhà Gái)
              </option>
            </select>
          </div>

          {/* Số lượng người dự kiến */}
          <div className="form-field-group">
            <label>Số lượng khách dự kiến (Người)</label>
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
