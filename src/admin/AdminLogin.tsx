import { useState } from "react";
import { Lock, ArrowLeft, KeyRound, Heart } from "lucide-react";
import { loginAdmin } from "../services/guestStorage";

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToHome: () => void;
}

export default function AdminLogin({ onSuccess, onBackToHome }: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(pin)) {
      onSuccess();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="login-badge-icon">
          <Lock size={32} />
        </div>

        <h2>Quản Trị Thiệp Cưới</h2>
        <p>Đăng nhập bằng mã PIN quản trị để xem và quản lý danh sách khách mời, phản hồi RSVP & đồng bộ dữ liệu.</p>

        <form onSubmit={handleSubmit} className="login-form-group">
          <div className="login-input-wrap">
            <KeyRound size={20} />
            <input
              type="password"
              placeholder="Nhập mã PIN bảo mật"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="login-error-msg">
              Mã PIN không chính xác. Vui lòng kiểm tra lại!
            </div>
          )}

          <button type="submit" className="btn-admin-login-submit">
            <Lock size={16} />
            <span>Mở Bảng Điều Khiển</span>
          </button>

          <button type="button" onClick={onBackToHome} className="btn-back-to-invitation">
            <ArrowLeft size={16} />
            <span>Quay lại trang thiệp cưới</span>
          </button>
        </form>

        <div style={{ marginTop: "24px", fontSize: "11.5px", color: "#9E8E91", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <span>Trường Long</span>
          <Heart size={12} fill="#65001D" color="#65001D" />
          <span>Thanh Tới • 2026</span>
        </div>
      </div>
    </div>
  );
}
