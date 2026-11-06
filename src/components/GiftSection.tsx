import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, QrCode, Heart, Sparkles, ChevronDown, ChevronUp, X, Gift } from "lucide-react";
import { weddingData } from "../data/weddingData";

export default function GiftSection() {
  const [openedGroom, setOpenedGroom] = useState(false);
  const [openedBride, setOpenedBride] = useState(false);
  const [copiedGroom, setCopiedGroom] = useState(false);
  const [copiedBride, setCopiedBride] = useState(false);
  const [previewQr, setPreviewQr] = useState<{ title: string; qrUrl: string; bankName: string; accNumber: string; accName: string } | null>(null);

  const handleCopy = (text: string, type: "groom" | "bride") => {
    navigator.clipboard.writeText(text);
    if (type === "groom") {
      setCopiedGroom(true);
      setTimeout(() => setCopiedGroom(false), 2500);
    } else {
      setCopiedBride(true);
      setTimeout(() => setCopiedBride(false), 2500);
    }
  };

  return (
    <section className="gift-section" id="gift">
      <div className="section-container">
        <motion.div
          className="section-header-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="section-subtitle">SENDING BLESSINGS</div>
          <h2 className="section-title">Hộp Lì Xì Mừng Cưới</h2>
          <div className="title-divider-leaf">
            <span className="leaf-line" />
            <Gift size={20} color="#c5a059" />
            <span className="leaf-line" />
          </div>
          <p className="section-description">
            Dành cho bạn bè và người thân ở phương xa gửi lời chúc phúc và quà mừng tới cô dâu & chú rể.
            <br />
            <strong>Chạm vào phong bao lì xì bên dưới</strong> để mở thông tin gửi quà mừng bạn nhé!
          </p>
        </motion.div>

        {/* Lưới 2 phong bao lì xì Chú Rể & Cô Dâu */}
        <div className="red-envelopes-grid">
          {/* ================= PHONG BAO LÌ XÌ CHÚ RỂ ================= */}
          <motion.div
            className={`red-envelope-card ${openedGroom ? "is-opened" : "is-closed"}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Vỏ bao lì xì đỏ phía trên */}
            <div
              className="envelope-cover"
              onClick={() => setOpenedGroom(!openedGroom)}
              role="button"
              tabIndex={0}
              title={openedGroom ? "Bấm để gập phong bao" : "Bấm để mở phong bao lì xì"}
            >
              {/* Nắp bao lì xì */}
              <div className="envelope-flap-top">
                <div className="envelope-seal-button">
                  <span className="seal-text">囍</span>
                  <Sparkles size={14} className="seal-sparkle" />
                </div>
              </div>

              {/* Thân bao lì xì */}
              <div className="envelope-body-front">
                <div className="envelope-gold-frame">
                  <div className="envelope-badge">LÌ XÌ MỪNG CƯỚI</div>
                  <h3 className="envelope-recipient-name">Chú Rể {weddingData.groom.shortName}</h3>
                  <p className="envelope-recipient-sub">{weddingData.groom.fullName}</p>
                  <p className="envelope-recipient-address">{weddingData.groom.bank.bankName}</p>

                  <div className="envelope-interactive-pill">
                    {openedGroom ? (
                      <>
                        <ChevronUp size={16} />
                        <span>Đang mở • Chạm để gập lại</span>
                      </>
                    ) : (
                      <>
                        <Heart size={16} className="pulsing-heart" />
                        <span>Chạm để mở lì xì</span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ruột thư lì xì (Thông tin chuyển khoản - Chỉ hiện ra khi bấm mở) */}
            <AnimatePresence>
              {openedGroom && (
                <motion.div
                  className="envelope-letter-insert"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="letter-inner-content">
                    <div className="letter-header-tag">
                      <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
                      <span>THÔNG TIN MỪNG CƯỚI CHÚ RỂ</span>
                    </div>

                    {/* QR Code */}
                    <div
                      className="letter-qr-wrap"
                      onClick={() =>
                        setPreviewQr({
                          title: `Mừng cưới Chú Rể (${weddingData.groom.shortName})`,
                          qrUrl: weddingData.groom.bank.qrUrl,
                          bankName: weddingData.groom.bank.bankName,
                          accNumber: weddingData.groom.bank.accountNumber,
                          accName: weddingData.groom.bank.accountName,
                        })
                      }
                      title="Chạm để phóng to mã QR"
                    >
                      <img
                        src={weddingData.groom.bank.qrUrl}
                        alt="Mã QR Chú Rể"
                        className="letter-qr-img"
                      />
                      <div className="letter-qr-overlay-hint">
                        <QrCode size={14} />
                        <span>Chạm để phóng to QR</span>
                      </div>
                    </div>

                    {/* Chi tiết tài khoản */}
                    <div className="letter-bank-details">
                      <div className="detail-field">
                        <span className="field-label">Ngân hàng:</span>
                        <strong className="field-value">{weddingData.groom.bank.bankName}</strong>
                      </div>

                      <div className="detail-field">
                        <span className="field-label">Số tài khoản:</span>
                        <div className="field-acc-copy-row">
                          <strong className="field-acc-number">{weddingData.groom.bank.accountNumber}</strong>
                          <button
                            className={`btn-letter-copy ${copiedGroom ? "copied" : ""}`}
                            onClick={() => handleCopy(weddingData.groom.bank.accountNumber, "groom")}
                            title="Sao chép số tài khoản"
                          >
                            {copiedGroom ? (
                              <>
                                <Check size={14} />
                                <span>Đã chép!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="detail-field">
                        <span className="field-label">Chủ tài khoản:</span>
                        <strong className="field-value highlight">{weddingData.groom.bank.accountName}</strong>
                      </div>

                      {weddingData.groom.bank.branch && (
                        <div className="detail-field">
                          <span className="field-label">Chi nhánh:</span>
                          <span className="field-value-sub">{weddingData.groom.bank.branch}</span>
                        </div>
                      )}
                    </div>

                    <div className="letter-note">
                      <span>Nội dung gửi: <em>Mung cuoi Long Toi - [Ten ban]</em></span>
                    </div>

                    <button
                      className="btn-fold-envelope"
                      onClick={() => setOpenedGroom(false)}
                    >
                      <span>Gập phong bao lại</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ================= PHONG BAO LÌ XÌ CÔ DÂU ================= */}
          <motion.div
            className={`red-envelope-card ${openedBride ? "is-opened" : "is-closed"}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            {/* Vỏ bao lì xì đỏ phía trên */}
            <div
              className="envelope-cover"
              onClick={() => setOpenedBride(!openedBride)}
              role="button"
              tabIndex={0}
              title={openedBride ? "Bấm để gập phong bao" : "Bấm để mở phong bao lì xì"}
            >
              {/* Nắp bao lì xì */}
              <div className="envelope-flap-top">
                <div className="envelope-seal-button">
                  <span className="seal-text">囍</span>
                  <Sparkles size={14} className="seal-sparkle" />
                </div>
              </div>

              {/* Thân bao lì xì */}
              <div className="envelope-body-front">
                <div className="envelope-gold-frame">
                  <div className="envelope-badge">LÌ XÌ MỪNG CƯỚI</div>
                  <h3 className="envelope-recipient-name">Cô Dâu {weddingData.bride.shortName}</h3>
                  <p className="envelope-recipient-sub">{weddingData.bride.fullName}</p>
                  <p className="envelope-recipient-address">{weddingData.bride.bank.bankName}</p>

                  <div className="envelope-interactive-pill">
                    {openedBride ? (
                      <>
                        <ChevronUp size={16} />
                        <span>Đang mở • Chạm để gập lại</span>
                      </>
                    ) : (
                      <>
                        <Heart size={16} className="pulsing-heart" />
                        <span>Chạm để mở lì xì</span>
                        <ChevronDown size={16} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ruột thư lì xì (Thông tin chuyển khoản - Chỉ hiện ra khi bấm mở) */}
            <AnimatePresence>
              {openedBride && (
                <motion.div
                  className="envelope-letter-insert"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="letter-inner-content">
                    <div className="letter-header-tag">
                      <Heart size={14} fill="#FF6B8B" color="#FF6B8B" />
                      <span>THÔNG TIN MỪNG CƯỚI CÔ DÂU</span>
                    </div>

                    {/* QR Code */}
                    <div
                      className="letter-qr-wrap"
                      onClick={() =>
                        setPreviewQr({
                          title: `Mừng cưới Cô Dâu (${weddingData.bride.shortName})`,
                          qrUrl: weddingData.bride.bank.qrUrl,
                          bankName: weddingData.bride.bank.bankName,
                          accNumber: weddingData.bride.bank.accountNumber,
                          accName: weddingData.bride.bank.accountName,
                        })
                      }
                      title="Chạm để phóng to mã QR"
                    >
                      <img
                        src={weddingData.bride.bank.qrUrl}
                        alt="Mã QR Cô Dâu"
                        className="letter-qr-img"
                      />
                      <div className="letter-qr-overlay-hint">
                        <QrCode size={14} />
                        <span>Chạm để phóng to QR</span>
                      </div>
                    </div>

                    {/* Chi tiết tài khoản */}
                    <div className="letter-bank-details">
                      <div className="detail-field">
                        <span className="field-label">Ngân hàng:</span>
                        <strong className="field-value">{weddingData.bride.bank.bankName}</strong>
                      </div>

                      <div className="detail-field">
                        <span className="field-label">Số tài khoản:</span>
                        <div className="field-acc-copy-row">
                          <strong className="field-acc-number">{weddingData.bride.bank.accountNumber}</strong>
                          <button
                            className={`btn-letter-copy ${copiedBride ? "copied" : ""}`}
                            onClick={() => handleCopy(weddingData.bride.bank.accountNumber, "bride")}
                            title="Sao chép số tài khoản"
                          >
                            {copiedBride ? (
                              <>
                                <Check size={14} />
                                <span>Đã chép!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="detail-field">
                        <span className="field-label">Chủ tài khoản:</span>
                        <strong className="field-value highlight">{weddingData.bride.bank.accountName}</strong>
                      </div>

                      {weddingData.bride.bank.branch && (
                        <div className="detail-field">
                          <span className="field-label">Chi nhánh:</span>
                          <span className="field-value-sub">{weddingData.bride.bank.branch}</span>
                        </div>
                      )}
                    </div>

                    <div className="letter-note">
                      <span>Nội dung gửi: <em>Mung cuoi Long Toi - [Ten ban]</em></span>
                    </div>

                    <button
                      className="btn-fold-envelope"
                      onClick={() => setOpenedBride(false)}
                    >
                      <span>Gập phong bao lại</span>
                      <ChevronUp size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Modal phóng to mã QR */}
      <AnimatePresence>
        {previewQr && (
          <motion.div
            className="qr-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewQr(null)}
          >
            <motion.div
              className="qr-modal-card"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn-qr-modal-close"
                onClick={() => setPreviewQr(null)}
                aria-label="Đóng xem mã QR"
              >
                <X size={20} />
              </button>

              <div className="qr-modal-header">
                <Sparkles size={16} className="modal-sparkle" />
                <h3>{previewQr.title}</h3>
                <p>Quét mã VietQR bằng app Ngân hàng bất kỳ</p>
              </div>

              <div className="qr-modal-image-box">
                <img
                  src={previewQr.qrUrl}
                  alt={previewQr.title}
                  className="qr-modal-big-img"
                />
              </div>

              <div className="qr-modal-acc-info">
                <p><strong>{previewQr.bankName}</strong></p>
                <p className="qr-modal-acc-no">{previewQr.accNumber}</p>
                <p>{previewQr.accName}</p>
              </div>

              <button
                className="btn-modal-copy"
                onClick={() => {
                  navigator.clipboard.writeText(previewQr.accNumber);
                  alert("Đã sao chép số tài khoản!");
                }}
              >
                <Copy size={16} />
                <span>Sao chép số tài khoản</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
