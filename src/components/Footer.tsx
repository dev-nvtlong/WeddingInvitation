import { Heart, ArrowUp } from "lucide-react";
import { weddingData } from "../data/weddingData";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="wedding-footer">
      <div className="footer-container">
        <div className="footer-emblem">
          <span className="footer-hỷ">囍</span>
        </div>

        <h2 className="footer-couple-names">
          {weddingData.groom.shortName} & {weddingData.bride.shortName}
        </h2>

        <p className="footer-thank-you">
          “Cảm ơn bạn đã luôn là một phần ý nghĩa trong hành trình thanh xuân của chúng mình.
          Hẹn gặp bạn trong ngày hạnh phúc nhất!”
        </p>

        <div className="footer-date-tag">
          <span>{weddingData.weddingDate.fullString}</span>
        </div>

        <button
          className="btn-scroll-top"
          onClick={scrollToTop}
          title="Về đầu trang"
          aria-label="Về đầu trang"
        >
          <ArrowUp size={18} />
          <span>Về đầu trang</span>
        </button>

        <div className="footer-bottom-bar">
          <p>
            Made with <Heart size={14} fill="#e06d7a" color="#e06d7a" className="heart-inline" /> for
            our special wedding day
          </p>
          <div style={{ marginTop: "8px" }}>
            <a
              href="#admin"
              style={{
                fontSize: "11px",
                color: "#A08E92",
                textDecoration: "none",
                opacity: 0.6,
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
            >
              🔒 Quản trị hệ thống
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
