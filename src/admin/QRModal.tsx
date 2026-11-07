import { useState } from "react";
import { X, Copy, Check, ExternalLink, MessageSquareShare, Maximize2 } from "lucide-react";
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
  const [qrExpanded, setQrExpanded] = useState(false);

  if (!isOpen || !guest) return null;

  const inviteUrl = getGuestInvitationUrl(guest.code);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(
    inviteUrl
  )}`;
  const qrImageLargeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=20&data=${encodeURIComponent(
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
        ? "Tiệc Cưới Chung Vui & Lễ Thành Hôn"
        : guest.invitedTo === "thiep_chu_re"
        ? "Tiệc Thân Mật & Lễ Thành Hôn (Nhà Trai)"
        : guest.invitedTo === "thiep_co_dau"
        ? "Tiệc Thân Mật & Lễ Vu Quy (Nhà Gái)"
        : guest.invitedTo === "tiec_than_mat"
        ? "Tiệc Thân Mật (Nhà Trai)"
        : guest.invitedTo === "tiec_than_mat_nha_gai"
        ? "Tiệc Thân Mật (Nhà Gái)"
        : "Lễ Vu Quy (Nhà Gái)";

    const message = `Trân trọng kính mời ${guest.fullName} tới tham dự ${eventName} chung vui cùng gia đình Trường Long & Thanh Tới!\n\nKính mời bạn chạm vào đường link thiệp cưới riêng để xem chi tiết thời gian, địa điểm và gửi lời chúc phúc:\n👉 ${inviteUrl}`;

    navigator.clipboard.writeText(message);
    setCopiedZaloMsg(true);
    setTimeout(() => setCopiedZaloMsg(false), 2500);
  };

  return (
    <>
      {/* Modal chính */}
      <div className="admin-modal-backdrop" onClick={onClose}>
        <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
          <div className="modal-header-row">
            <h3>Mã QR & Link Mời Cá Nhân</h3>
            <button className="btn-close-admin-modal" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>

          <div className="qr-modal-body">
            {/* QR Image + nút phóng to */}
            <div className="qr-image-frame" style={{ position: "relative" }}>
              <img src={qrImageUrl} alt={`QR Code ${guest.fullName}`} />
              <button
                onClick={() => setQrExpanded(true)}
                title="Phóng to mã QR"
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  background: "rgba(255,255,255,0.92)",
                  border: "1px solid #E6BDC6",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  color: "#65001D",
                  fontWeight: 600,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
                }}
              >
                <Maximize2 size={14} />
                <span>Phóng to</span>
              </button>
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

      {/* Overlay phóng to QR */}
      {qrExpanded && (
        <div
          onClick={() => setQrExpanded(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            cursor: "zoom-out",
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              cursor: "default",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#1E1719" }}>{guest.fullName}</div>
                <div style={{ fontSize: "12px", color: "#8C7B7E" }}>Mã mời: {guest.code}</div>
              </div>
              <button
                onClick={() => setQrExpanded(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#554448", padding: "4px" }}
                aria-label="Đóng phóng to"
              >
                <X size={22} />
              </button>
            </div>

            <img
              src={qrImageLargeUrl}
              alt={`QR Code lớn ${guest.fullName}`}
              style={{ width: "100%", maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px" }}
            />

            <div style={{ marginTop: "16px", fontSize: "12px", color: "#8C7B7E", wordBreak: "break-all" }}>
              {inviteUrl}
            </div>

            <button
              onClick={() => setQrExpanded(false)}
              className="btn-secondary-action"
              style={{ marginTop: "16px", justifyContent: "center", width: "100%" }}
            >
              <X size={15} />
              <span>Đóng</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
