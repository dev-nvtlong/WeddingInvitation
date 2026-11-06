export interface EventDetail {
  title: string;
  subtitle: string;
  time: string;
  date: string;
  lunarDate: string;
  locationName: string;
  address: string;
  mapsUrl: string;
  descriptionTime?: string;
  dateFormatted?: string;
  lunarDateFormatted?: string;
  locationTitle?: string;
  addressFormatted?: string;
  calendarEvent: {
    title: string;
    details: string;
    location: string;
    start: string;
    end: string;
  };
}

export interface LoveStoryItem {
  year: string;
  title: string;
  description: string;
  image?: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
  qrUrl: string;
}

export interface WeddingData {
  groom: {
    fullName: string;
    shortName: string;
    role: string;
    image: string;
    fatherName: string;
    motherName: string;
    birthOrder: string;
    phone: string;
    description: string;
    bank: BankAccount;
  };
  bride: {
    fullName: string;
    shortName: string;
    role: string;
    image: string;
    fatherName: string;
    motherName: string;
    birthOrder: string;
    phone: string;
    description: string;
    bank: BankAccount;
  };
  weddingDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    fullString: string;
    lunarString: string;
  };
  events: {
    tiecThanMat: EventDetail;
    vuQuy: EventDetail;
    thanhHon: EventDetail;
    tiecMung: EventDetail;
  };
  timeline: {
    time: string;
    title: string;
    description: string;
  }[];
  loveStory: LoveStoryItem[];
  dressCode: {
    title: string;
    description: string;
    colors: { name: string; hex: string }[];
  };
  gallery: {
    id: number;
    src: string;
    title: string;
    category: "gate" | "romantic" | "studio";
  }[];
  defaultWishes: {
    id: number;
    name: string;
    relationship: string;
    message: string;
    createdAt: string;
  }[];
  music: {
    title: string;
    artist: string;
    url: string;
  };
  quote: {
    text: string;
    author: string;
  };
}

export const weddingData: WeddingData = {
  groom: {
    fullName: "Nguyễn Vũ Trường Long",
    shortName: "Trường Long",
    role: "Chú Rể",
    image: "/images/AIMGL9214.jpg",
    fatherName: "Ông Nguyễn Văn Thế",
    motherName: "Bà Vũ Thị Nhung",
    birthOrder: "Hoàng tử",
    phone: "0988 123 456",
    description: "Cảm ơn em đã bước vào cuộc đời anh, biến những ngày bình thường thành những ngày ngập tràn nụ cười và hạnh phúc.",
    bank: {
      bankName: "Vietcombank",
      accountNumber: "1023456789",
      accountName: "NGUYEN VU TRUONG LONG",
      branch: "Chi nhánh Hải Phòng",
      qrUrl: "https://img.vietqr.io/image/VCB-1023456789-compact2.png?amount=0&addInfo=Mung%20cuoi%20Long%20Toi&accountName=NGUYEN%20VU%20TRUONG%20LONG",
    },
  },
  bride: {
    fullName: "Nguyễn Thanh Tới",
    shortName: "Thanh Tới",
    role: "Cô Dâu",
    image: "/images/AIMGL9560.jpg",
    fatherName: "Ông Nguyễn Văn Tích",
    motherName: "Bà Đỗ Thị Tòng",
    birthOrder: "Tứ công chúa",
    phone: "0977 654 321",
    description: "Hạnh phúc không phải là tìm được người hoàn hảo, mà là tìm được một người cùng mình già đi trong bình yên và yêu thương.",
    bank: {
      bankName: "MB Bank (Ngân hàng Quân Đội)",
      accountNumber: "9876543210",
      accountName: "NGUYEN THI TOI",
      branch: "Chi nhánh Ninh Bình",
      qrUrl: "https://img.vietqr.io/image/MB-9876543210-compact2.png?amount=0&addInfo=Mung%20cuoi%20Long%20Toi&accountName=NGUYEN%20THANH%20TOI",
    },
  },
  weddingDate: {
    year: 2026,
    month: 11,
    day: 14,
    hour: 10,
    minute: 30,
    fullString: "Thứ 7, ngày 14 tháng 11 năm 2026",
    lunarString: "Ngày 06 tháng 10 năm Bính Ngọ",
  },
  events: {
    tiecThanMat: {
      title: "BỮA CƠM THÂN MẬT",
      subtitle: "Bữa cơm thân mật cùng gia đình và bạn bè thân thiết",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 17:30 - THỨ BẢY",
      dateFormatted: "22.12.2026",
      lunarDateFormatted: "(Tức ngày 17 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ TRAI",
      addressFormatted: "Số 1 Lương Yên - Bạch Đằng - Hà Nội",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Số+1+Lương+Yên+Bạch+Đằng+Hà+Nội",
      time: "17:30",
      date: "Thứ Bảy, ngày 22 tháng 12 năm 2026",
      lunarDate: "Ngày 17 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Trai",
      address: "Số 1 Lương Yên - Bạch Đằng - Hà Nội",
      calendarEvent: {
        title: "Bữa Cơm Thân Mật - Long & Tới",
        details: "Bữa cơm thân mật cùng gia đình và bạn bè tại Số 1 Lương Yên, Bạch Đằng, Hà Nội",
        location: "Số 1 Lương Yên, Bạch Đằng, Hà Nội",
        start: "20261222T173000",
        end: "20261222T210000",
      },
    },
    vuQuy: {
      title: "LỄ VU QUY",
      subtitle: "Nghi lễ trang trọng tại tư gia nhà gái",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 09:00 - THỨ BẢY",
      dateFormatted: "14.11.2026",
      lunarDateFormatted: "(Tức ngày 06 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ GÁI",
      addressFormatted: "Ngã 5 Thanh Sơn - Phù Vân - Ninh Bình",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ngã+5+Thanh+Sơn+Phù+Vân+Ninh+Bình",
      time: "09:00",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Nhằm ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Gái",
      address: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
      calendarEvent: {
        title: "Lễ Vu Quy - Long & Tới",
        details: "Lễ Vu Quy và Tiệc mừng cùng Họ Nhà Gái tại Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        location: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        start: "20261114T090000",
        end: "20261114T130000",
      },
    },
    thanhHon: {
      title: "LỄ THÀNH HÔN",
      subtitle: "Tiệc cưới và Nghi thức thành hôn tại Nhà Trai",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 10:30 - THỨ BẢY",
      dateFormatted: "14.11.2026",
      lunarDateFormatted: "(Tức ngày 06 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ TRAI",
      addressFormatted: "Thôn Đông Thái - Vĩnh Bảo - Hải Phòng",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Thôn+Đông+Thái+Vĩnh+Bảo+Hải+Phòng",
      time: "10:30",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Nhằm ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Trai",
      address: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
      calendarEvent: {
        title: "Lễ Thành Hôn - Long & Tới",
        details: "Lễ Thành Hôn và Tiệc cưới mừng hạnh phúc tại Tư gia Nhà Trai, Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        location: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        start: "20261115T110000",
        end: "20261115T140000",
      },
    },
    tiecMung: {
      title: "TIỆC CƯỚI CHUNG VUI",
      subtitle: "Bữa cơm thân mật và giao lưu âm nhạc",
      time: "10:30",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Nhằm ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Hội Trường Tiệc Cưới Tư Gia Nhà Trai",
      address: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
      mapsUrl: "https://www.google.com/maps/search/?api=1&query=Thôn+Đông+Thái+Vĩnh+Bảo+Hải+Phòng",
      calendarEvent: {
        title: "Tiệc Cưới Chung Vui - Long & Tới",
        details: "Bữa cơm thân mật chung vui mừng ngày hạnh phúc của Long & Tới tại Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        location: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        start: "20261115T113000",
        end: "20261115T143000",
      },
    },
  },
  timeline: [
    {
      time: "04:30",
      title: "Lễ Xuất Phát Rước Dâu",
      description: "Đoàn nhà trai khởi hành sang tư gia nhà gái để chuẩn bị nghi thức đón dâu.",
    },
    {
      time: "06:30",
      title: "Nghi Thức Gia Tiên",
      description: "Cô dâu chú rể thắp nén hương tri ân tổ tiên và nhận lời chúc phúc từ song thân phụ mẫu.",
    },
    {
      time: "10:00",
      title: "Đón Tiếp Quan Khách",
      description: "Cô dâu chú rể chụp ảnh lưu niệm cùng bạn bè, người thân tại cổng hoa.",
    },
    {
      time: "10:15",
      title: "Khai Tiệc Mừng Hạnh Phúc",
      description: "Nghi thức trao nhẫn, rót rượu champagne, cắt bánh cưới và nâng ly chúc mừng.",
    },
    {
      time: "10:30",
      title: "Giao Lưu Âm Nhạc & Trò Chơi",
      description: "Những tiết mục văn nghệ đặc sắc từ bạn bè và người thân.",
    },
    {
      time: "11:00",
      title: "Tri Ân & Tiễn Khách",
      description: "Gia đình cô dâu chú rể gửi lời cảm ơn sâu sắc và tiễn quan khách.",
    },
  ],
  loveStory: [
    {
      year: "2019 – 2026",
      title: "Hành Trình Yêu Thương",
      description: "Từ ngày đầu gặp gỡ năm 2019 đến những năm tháng cùng nhau trưởng thành, chia sẻ từng buồn vui và gắn kết để tình yêu đơm hoa kết trái.",
      image: "/images/IMGL9185k.jpg",
    },
    {
      year: "Tháng 05 / 2026",
      title: "Lễ Dạm Ngõ",
      description: "Hai bên gia đình chính thức gặp gỡ thân tình trong sự chúc phúc trọn vẹn của hai dòng họ, mở đầu cho lời ước hẹn trăm năm.",
      image: "/images/IMGL9305b.jpg",
    },
    {
      year: "Tháng 11 / 2026",
      title: "Ngày Chung Đôi",
      description: "Chính thức về chung một nhà, hai ta cùng nắm tay nhau bước vào chương mới của cuộc đời, xây đắp tổ ấm hạnh phúc vẹn tròn.",
      image: "/images/IMGL9264.jpg",
    },
  ],
  dressCode: {
    title: "Gợi Ý Trang Phục (Dress Code)",
    description: "Để những bức ảnh kỷ niệm thêm phần hài hòa và trang nhã, quý khách có thể lựa chọn trang phục theo bảng màu gợi ý dưới đây:",
    colors: [
      { name: "Trắng Tinh Khôi", hex: "#F8F9FA" },
      { name: "Be / Champagne", hex: "#EAD7C0" },
      { name: "Hồng Pastel", hex: "#F4C2C2" },
      { name: "Xanh Navy", hex: "#2B3A67" },
    ],
  },
  gallery: [
    { id: 1, src: "/images/AIMGL9214.jpg", title: "Ảnh Cổng Hoàng Gia", category: "gate" },
    { id: 2, src: "/images/AIMGL9560.jpg", title: "Nụ Cười Rạng Rỡ", category: "gate" },
    { id: 3, src: "/images/IMGL9305b.jpg", title: "Bàn Tiệc Kỷ Niệm", category: "romantic" },
    { id: 4, src: "/images/IMGL9185k.jpg", title: "Ánh Mắt Yêu Thương", category: "romantic" },
    { id: 5, src: "/images/IMGL9209k.jpg", title: "Nắm Tay Nhau Đi", category: "romantic" },
    { id: 6, src: "/images/IMGL9221.jpg", title: "Thanh Xuân Cùng Em", category: "studio" },
    { id: 7, src: "/images/IMGL9228ka.jpg", title: "Váy Cưới Lộng Lẫy", category: "studio" },
    { id: 8, src: "/images/IMGL9234.jpg", title: "Bên Nhau Dịu Dàng", category: "romantic" },
    { id: 9, src: "/images/IMGL9240.jpg", title: "Nụ Cười Hạnh Phúc", category: "studio" },
    { id: 10, src: "/images/IMGL9254.jpg", title: "Cái Ôm Bình Yên", category: "romantic" },
    { id: 11, src: "/images/IMGL9264.jpg", title: "Ngày Chung Đôi", category: "romantic" },
    { id: 12, src: "/images/IMGL9274.jpg", title: "Tình Yêu Vĩnh Cửu", category: "studio" },
    { id: 13, src: "/images/IMGL9331.jpg", title: "Nguyện Ước Trăm Năm", category: "romantic" },
    { id: 14, src: "/images/IMGL9346k.jpg", title: "Bình Minh Của Chúng Ta", category: "romantic" },
    { id: 15, src: "/images/IMGL9358.jpg", title: "Chạm Nhẹ Bàn Tay", category: "romantic" },
    { id: 16, src: "/images/IMGL9367.jpg", title: "Phút Giây Hạnh Ngộ", category: "studio" },
    { id: 17, src: "/images/IMGL9374k.jpg", title: "Lời Hứa Trọn Đời", category: "romantic" },
    { id: 18, src: "/images/IMGL9513k.jpg", title: "Chuyện Tình Ta", category: "studio" },
    { id: 19, src: "/images/IMGL9529.jpg", title: "Ngập Tràn Hạnh Phúc", category: "romantic" },
    { id: 20, src: "/images/IMGL9540.jpg", title: "Khoảnh Khắc Vàng", category: "romantic" },
    { id: 21, src: "/images/IMGL9633k.jpg", title: "Giai Điệu Tình Yêu", category: "studio" },
    { id: 22, src: "/images/IMGL9818.jpg", title: "Dưới Tán Hoa", category: "romantic" },
    { id: 23, src: "/images/IMGL9826.jpg", title: "Ánh Nhìn Ngọt Ngào", category: "romantic" },
    { id: 24, src: "/images/IMGL9833k.jpg", title: "Bên Nhau Mãi Mãi", category: "studio" },
    { id: 25, src: "/images/IMGL9879.jpg", title: "Vẹn Tròn Hạnh Phúc", category: "romantic" },
  ],
  defaultWishes: [
    {
      id: 1,
      name: "Huy",
      relationship: "Bạn thân",
      message: "Chúc hai bạn trăm năm hạnh phúc!",
      createdAt: "Vừa xong",
    },
    {
      id: 2,
      name: "Chanh",
      relationship: "Bạn Cô Dâu",
      message: "Chúc mừng hạnh phúc trăm năm!",
      createdAt: "1 phút trước",
    },
    {
      id: 3,
      name: "Chính",
      relationship: "Bạn Chú Rể",
      message: "Chúc hai bạn sớm có tin vui nhé!",
      createdAt: "3 phút trước",
    },
    {
      id: 4,
      name: "Linh",
      relationship: "Đồng nghiệp",
      message: "💫 Đồng tâm đồng lòng, xây đắp tổ ấm thịnh vượng!",
      createdAt: "5 phút trước",
    },
    {
      id: 5,
      name: "Tuấn Dịu",
      relationship: "Bạn thân",
      message: "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long! Tổ ấm nhỏ luôn rộn rã tiếng cười!",
      createdAt: "10 phút trước",
    },
    {
      id: 6,
      name: "Hiền Châm",
      relationship: "Bạn Chú Rể",
      message: "Mừng ngày hạnh phúc của hai bạn! Chúc Long và Tới mãi luôn thấu hiểu và yêu thương nhau!",
      createdAt: "15 phút trước",
    },
  ],
  music: {
    title: "A Thousand Years (Romantic Piano)",
    artist: "Wedding Melody",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=romantic-wedding-piano-10651.mp3",
  },
  quote: {
    text: "Hạnh phúc không phải là tìm kiếm một người hoàn hảo, mà là học cách yêu trọn vẹn một người không hoàn hảo.",
    author: "Antoine de Saint-Exupéry",
  },
};
