# 💍 Thiệp Cưới Online - Văn Thế & Thúy Nông

Dự án website Thiệp Cưới Điện Tử (Online Wedding Invitation) sang trọng, hiện đại và lãng mạn, được xây dựng bằng **React 19**, **TypeScript**, **Vite** và **Framer Motion**.

---

## ✨ Các Tính Năng Nổi Bật

1. 🚪 **Opening Card (Hiệu ứng mở cửa song hỷ hoàng gia)**:
   - Hiệu ứng cánh cửa trượt 2 cánh mạ vàng với chữ Song Hỷ 囍 và thông tin Chú Rể & Cô Dâu.
   - Nút "Chạm để mở thiệp" kích hoạt âm thanh lãng mạn và cuộn mượt mà vào trang chính.

2. 🎵 **Trình Phát Nhạc Nền (Romantic Music Player)**:
   - Tích hợp bộ tổng hợp âm thanh **Web Audio API** giai điệu Piano/Music-box lãng mạn không phụ thuộc mạng ngoài.
   - Hỗ trợ phát trực tiếp file MP3 tự chọn (`/public/audio/wedding-music.mp3`).
   - Widget nổi điều khiển bật/tắt nhạc với biểu tượng đĩa than xoay tròn.

3. 🌸 **Hiệu Ứng Cánh Hoa & Trái Tim Bay (Falling Petals Canvas)**:
   - Hiệu ứng cánh hoa anh đào và bụi vàng bay lượn nhẹ nhàng trong gió.

4. 💌 **Cá Nhân Hóa Tên Khách Mời (Personalized Invitation Link)**:
   - Tự động nhận diện tên khách mời qua đường dẫn URL: `?guest=Tuấn+Dịu` hoặc `?to=Hiền+Châm`.
   - Hiển thị huy hiệu trang trọng: *"Trân trọng kính mời: [Tên khách mời]"*.
   - Công cụ tạo nhanh link mời cá nhân hóa và nút chia sẻ qua Zalo, Messenger, SMS.

5. ⏳ **Đếm Ngược Thời Gian (Live Wedding Countdown)**:
   - Đếm ngược Ngày - Giờ - Phút - Giây đến ngày hôn lễ (15/11/2026).
   - Nút **"Lưu ngày vào Lịch nhắc"** tự động tạo sự kiện trên Google Calendar.

6. 📖 **Câu Chuyện Tình Yêu (Love Story Timeline)**:
   - Dòng thời gian tình yêu từ lần đầu gặp gỡ, ngày tỏ tình, lễ dạm ngõ đến ngày về chung một nhà.

7. 🏛️ **Chi Tiết Lễ Vu Quy & Lễ Thành Hôn**:
   - Thời gian (Dương lịch & Âm lịch), địa điểm rõ ràng.
   - Nút **"Chỉ đường Google Maps"** mở vị trí chính xác chỉ bằng 1 chạm.
   - Lịch trình chi tiết trong ngày tiệc cưới và gợi ý màu trang phục (**Dress Code**).

8. 📸 **Album Ảnh Cưới Lung Linh (Photo Gallery & Lightbox)**:
   - 25 bức ảnh cưới thực tế đã được tối ưu hóa dung lượng web siêu nhẹ (~75KB/ảnh).
   - Bộ lọc ảnh: *Tất cả*, *Ảnh Cổng*, *Lãng Mạn*, *Studio*.
   - Trình xem ảnh phóng to toàn màn hình (Lightbox) hỗ trợ phím mũi tên và nút Next/Prev.

9. 📝 **Xác Nhận Tham Dự (RSVP) & Sổ Lưu Bút Chúc Phúc**:
   - Form xác nhận tham dự (Có tham gia / Rất tiếc không thể đến, số lượng người, nhà trai/nhà gái).
   - Form gửi lời chúc phúc và danh sách lời chúc hiển thị sinh động (lưu trữ trên `localStorage`).

10. 🎁 **Hộp Mừng Cưới Online (VietQR Code)**:
    - Tab chuyển đổi tài khoản Chú Rể & Cô Dâu.
    - Mã VietQR chuẩn ngân hàng Việt Nam tự động điền sẵn nội dung mừng cưới.
    - Nút **"Sao chép số tài khoản"** nhanh chóng với thông báo phản hồi.

11. 📱 **Responsive Hoàn Hảo**:
    - Tối ưu hóa tuyệt đẹp trên mọi thiết bị: iPhone, Android, iPad, Laptop, Màn hình lớn.
    - Thanh điều hướng nhanh nổi cố định dưới đáy màn hình điện thoại.

---

## 🛠️ Cấu Trúc Thư Mục

```text
wedding-invitation/
├── public/
│   ├── images/              # 25 ảnh cưới web-optimized
│   ├── audio/               # Thư mục chứa file wedding-music.mp3 (tùy chọn)
│   └── favicon.svg          # Icon nhẫn cưới trang trọng
├── src/
│   ├── data/
│   │   └── weddingData.ts   # TẤT CẢ thông tin cô dâu, chú rể, ngày giờ, địa điểm, STK
│   ├── components/
│   │   ├── OpeningCard.tsx       # Mở cửa thiệp đầu trang
│   │   ├── HeroSection.tsx       # Ảnh bìa, đếm ngược, tên cặp đôi
│   │   ├── InvitationSection.tsx # Lời ngỏ, profile Chú rể & Cô dâu
│   │   ├── LoveStorySection.tsx  # Dòng thời gian tình yêu
│   │   ├── CeremonySection.tsx   # Lễ Vu Quy & Lễ Thành Hôn
│   │   ├── ReceptionSection.tsx  # Tiệc cưới, timeline, dress code
│   │   ├── GallerySection.tsx    # Album ảnh & Lightbox
│   │   ├── GuestBookSection.tsx  # RSVP & Sổ lưu bút
│   │   ├── GiftSection.tsx       # Hộp mừng cưới & VietQR
│   │   ├── MusicPlayer.tsx       # Nút bật/tắt nhạc nổi
│   │   ├── PetalAnimation.tsx    # Cánh hoa rơi
│   │   ├── Navigation.tsx        # Thanh điều hướng nhanh
│   │   ├── ShareModal.tsx        # Popup tạo link mời
│   │   └── Footer.tsx            # Chân trang tri ân
│   ├── utils/
│   │   └── audioSynth.ts         # Bộ phát nhạc Piano Web Audio API
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
```

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Khởi động môi trường phát triển (Dev)
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ hiển thị trong terminal (mặc định: `http://localhost:5173`).

### 2. Thử nghiệm với tên khách mời cá nhân hóa
Thêm tham số `?guest=Tên+Khách` vào sau đường dẫn, ví dụ:
```text
http://localhost:5173/?guest=Tuấn+Dịu
http://localhost:5173/?guest=Hiền+Châm
```

### 3. Đóng gói cho Production
```bash
npm run build
```
Thư mục `dist/` đã sẵn sàng để deploy lên bất kỳ hosting nào (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Firebase Hosting,...).

---

## ✏️ Hướng Dẫn Tùy Chỉnh Thông Tin

Bạn có thể chỉnh sửa mọi thông tin một cách cực kỳ dễ dàng tại file [`src/data/weddingData.ts`](file:///t:/1.%20Sự%20kiện%20của%20Nong/wedding-invitation/src/data/weddingData.ts):
- **Tên cô dâu, chú rể**: `weddingData.groom.fullName`, `weddingData.bride.fullName`.
- **Họ tên phụ mẫu**: `fatherName`, `motherName`.
- **Ngày giờ tổ chức**: `weddingDate`, `events.vuQuy`, `events.thanhHon`.
- **Địa chỉ & Google Maps**: `address`, `mapsUrl`.
- **Tài khoản ngân hàng & QR**: `bank.bankName`, `bank.accountNumber`, `bank.accountName`.
- **Nhạc nền**: Đặt file nhạc yêu thích của bạn vào `public/audio/wedding-music.mp3`.
