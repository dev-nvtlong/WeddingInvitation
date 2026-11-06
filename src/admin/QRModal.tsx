import { useState } from "react";
import { X, Copy, Check, ExternalLink, MessageSquareShare } from "lucide-react";
import type { Guest } from "../types/guestManagement";
import { getGuestInvitationUrl } from "../utils/guestList";

interface QRModalProps {
  guest: Guest | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRModal({ guest, isOpen, onClose }: QRModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedZaloMsg, setCopiedZaloMsg] = useState(false);

  if (!isOpen || !guest) return null;

  const inviteUrl = getGuestInvitationUrl(guest.code);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=15&data=${encodeURIComponent(
    inviteUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyZaloMessage = () => {
    const eventName =
      guest.invitedTo === "both"
        ? "Tiệc thân mật & Lễ vu quy"
        : guest.invitedTo === "tiec_than_mat"
        ? "Tiệc thân mật"
        : "Lễ vu quy";

    const message = `Trân trọng kính mời ${guest.fullName} tới tham dự ${eventName} chung vui cùng gia đình Trường Long & Thanh Tới!\n\nKính mời bạn chạm vào đường link thiệp cưới riêng để xem chi tiết thời gian, địa điểm và gửi lời chúc phúc:\n👉 ${inviteUrl}`;

    navigator.clipboard.writeText(message);
    setCopiedZaloMsg(true);
    setTimeout(() => setCopiedZaloMsg(false), 2500);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
        <div className="modal-header-row">
          <h3>Mã QR & Link Mời Cá Nhân</h3>
          <button className="btn-close-admin-modal" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="qr-modal-body">
          <div className="qr-image-frame">
            <img src={qrImageUrl} alt={`QR Code ${guest.fullName}`} />
          </div>

          <div className="qr-guest-name">{guest.fullName}</div>
          <div className="qr-guest-code">
            Mã mời: <strong>{guest.code}</strong> • Nhóm: {guest.group}
          </div>

          <div className="qr-link-copy-box">
            <span>{inviteUrl}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <button
              className="btn-primary-action"
              onClick={handleCopyLink}
              style={{ justifyContent: "center" }}
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedLink ? "Đã Sao Chép Link!" : "Sao Chép Đường Dẫn Thiệp"}</span>
            </button>

            <button
              className="btn-secondary-action"
              onClick={handleCopyZaloMessage}
              style={{ justifyContent: "center" }}
            >
              {copiedZaloMsg ? <Check size={16} /> : <MessageSquareShare size={16} />}
              <span>{copiedZaloMsg ? "Đã Sao Chép Tin Nhắn Mời!" : "Sao Chép Mẫu Nhắn Zalo / SMS"}</span>
            </button>

            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary-action"
              style={{ justifyContent: "center", textDecoration: "none" }}
            >
              <ExternalLink size={16} />
              <span>Xem Thử Thiệp Của Khách Này</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
