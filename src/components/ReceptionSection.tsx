import { motion } from "framer-motion";
import { Clock, Utensils } from "lucide-react";
import { weddingData } from "../data/weddingData";

export default function ReceptionSection() {
  return (
    <section className="reception-section" id="reception">
      <div className="section-container">
        {/* Tiệc Cưới Chung Vui */}
        <motion.div
          className="reception-card-featured"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="reception-header-tag">
            <Utensils size={16} />
            <span>TIỆC MỪNG CHUNG VUI</span>
          </div>

          <h2 className="reception-main-title">{weddingData.events.tiecMung.title}</h2>
          <p className="reception-main-subtitle">{weddingData.events.tiecMung.subtitle}</p>

          <div className="reception-time-location">
            <div className="reception-badge-time">
              <span>{weddingData.events.tiecMung.time}</span>
              <small>{weddingData.events.tiecMung.date}</small>
            </div>
            <p className="reception-venue-address">
              <strong>{weddingData.events.tiecMung.locationName}</strong>
              <span>{weddingData.events.tiecMung.address}</span>
            </p>
          </div>
        </motion.div>

        {/* Lịch trình chi tiết trong ngày (Timeline) */}
        <div className="reception-timeline-wrap">
          <motion.div
            className="section-header-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-subtitle">PROGRAM SCHEDULE</div>
            <h3 className="section-title">Lịch Trình Tiệc Cưới</h3>
            <div className="title-divider-leaf">
              <span className="leaf-line" />
              <Clock size={16} color="#c5a059" />
              <span className="leaf-line" />
            </div>
          </motion.div>

          <div className="schedule-grid">
            {weddingData.timeline.map((item, idx) => (
              <motion.div
                key={idx}
                className="schedule-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <div className="schedule-time-box">
                  <span className="time-val">{item.time}</span>
                </div>
                <div className="schedule-info-box">
                  <h4 className="schedule-item-title">{item.title}</h4>
                  <p className="schedule-item-desc">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
