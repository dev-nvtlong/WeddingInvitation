import { motion } from "framer-motion";
import { Heart, Phone, Quote } from "lucide-react";
import { weddingData } from "../data/weddingData";

export default function InvitationSection() {
  // Lấy và chuẩn hóa số điện thoại trực tiếp từ cấu hình dữ liệu
  const groomPhone = weddingData.groom.phone ? weddingData.groom.phone.replace(/[^\d+]/g, "") : "";
  const bridePhone = weddingData.bride.phone ? weddingData.bride.phone.replace(/[^\d+]/g, "") : "";
  return (
    <section className="invitation-section" id="invitation">
      <div className="section-container">
        {/* Lời ngỏ trang trọng */}
        <motion.div
          className="invitation-intro"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="section-subtitle">THƯ NGỎ</div>
          <h2 className="section-title">Lời Ngỏ Tri Ân</h2>
          <div className="title-divider-leaf">
            <span className="leaf-line" />
            <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
            <span className="leaf-line" />
          </div>

          <div className="invitation-letter-box">
            <Quote className="quote-icon" size={32} />
            <p className="letter-text">
              “Hạnh phúc lớn nhất của đời người là tìm thấy một nửa thương yêu,
              cùng nhau đi qua những thăng trầm và sẻ chia từng khoảnh khắc bình dị.
              Ngày hôm nay, tình yêu ấy đã đơm hoa kết trái thành một tổ ấm vẹn tròn.”
            </p>
            <p className="letter-subtext">
              Sự hiện diện và lời chúc phúc của quý người thân, bạn bè chính là món quà ý nghĩa nhất
              dành cho hai gia đình cũng như cô dâu & chú rể trong ngày trọng đại này!
            </p>
          </div>
        </motion.div>

        {/* Thông tin Cô dâu & Chú rể */}
        <div className="couple-cards-container">
          {/* Card Chú Rể */}
          <motion.div
            className="couple-card groom-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="couple-card-image-wrap">
              <img
                src={weddingData.groom.image}
                alt={weddingData.groom.fullName}
                className="couple-img"
              />
              <div className="couple-role-badge">CHÚ RỂ</div>
            </div>

            <div className="couple-card-info">
              <h3 className="couple-fullname">{weddingData.groom.fullName}</h3>
              <p className="couple-order">{weddingData.groom.birthOrder}</p>

              <div className="couple-family">
                <p>
                  <strong>Thân phụ:</strong> {weddingData.groom.fatherName}
                </p>
                <p>
                  <strong>Thân mẫu:</strong> {weddingData.groom.motherName}
                </p>
              </div>

              <blockquote className="couple-quote">
                "{weddingData.groom.description}"
              </blockquote>

              {groomPhone && (
                <a
                  href={`tel:${groomPhone}`}
                  title={`Gọi chú rể: ${weddingData.groom.phone}`}
                  aria-label={`Gọi chú rể: ${weddingData.groom.phone}`}
                  className="btn-call-couple"
                >
                  <Phone size={14} />
                  <span>Gọi chú rể</span>
                </a>
              )}
            </div>
          </motion.div>

          {/* Biểu tượng trái tim liên kết */}
          <div className="couple-center-connector">
            <div className="connector-circle">
              <Heart size={28} fill="#FF6B8B" color="#FF6B8B" />
              <span>囍</span>
            </div>
          </div>

          {/* Card Cô Dâu */}
          <motion.div
            className="couple-card bride-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="couple-card-image-wrap">
              <img
                src={weddingData.bride.image}
                alt={weddingData.bride.fullName}
                className="couple-img"
              />
              <div className="couple-role-badge">CÔ DÂU</div>
            </div>

            <div className="couple-card-info">
              <h3 className="couple-fullname">{weddingData.bride.fullName}</h3>
              <p className="couple-order">{weddingData.bride.birthOrder}</p>

              <div className="couple-family">
                <p>
                  <strong>Thân phụ:</strong> {weddingData.bride.fatherName}
                </p>
                <p>
                  <strong>Thân mẫu:</strong> {weddingData.bride.motherName}
                </p>
              </div>

              <blockquote className="couple-quote">
                "{weddingData.bride.description}"
              </blockquote>

              {bridePhone && (
                <a
                  href={`tel:${bridePhone}`}
                  title={`Gọi cô dâu: ${weddingData.bride.phone}`}
                  aria-label={`Gọi cô dâu: ${weddingData.bride.phone}`}
                  className="btn-call-couple"
                >
                  <Phone size={14} />
                  <span>Gọi cô dâu</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
