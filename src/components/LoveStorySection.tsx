import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { weddingData } from "../data/weddingData";

export default function LoveStorySection() {
  return (
    <section className="love-story-section" id="story">
      <div className="section-container">
        <motion.div
          className="section-header-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="section-subtitle">OUR JOURNEY</div>
          <h2 className="section-title">Câu Chuyện Tình Yêu</h2>
          <div className="title-divider-leaf">
            <span className="leaf-line" />
            <Heart size={18} fill="#FF6B8B" color="#FF6B8B" />
            <span className="leaf-line" />
          </div>
          <p className="section-description">
            Mỗi khoảnh khắc đi qua đều là một mảnh ghép nhiệm màu tạo nên hạnh phúc trọn vẹn của hôm nay.
          </p>
        </motion.div>

        <div className="timeline-container">
          <div className="timeline-center-line" />

          {weddingData.loveStory.map((item, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                className={`timeline-item ${isEven ? "left" : "right"}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
              >
                <div className="timeline-node">
                  <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
                </div>

                <div className="timeline-card">
                  {item.image && (
                    <div className="timeline-img-wrap">
                      <img src={item.image} alt={item.title} className="timeline-img" />
                    </div>
                  )}

                  <div className="timeline-content">
                    <span className="timeline-year-tag">{item.year}</span>
                    <h3 className="timeline-title">{item.title}</h3>
                    <p className="timeline-desc">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
