export interface EventDetail {
  id: string;
  side: "groom" | "bride";
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
    tiecThanMatNhaTrai?: EventDetail;
    tiecThanMatNhaGai?: EventDetail;
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
    phone: "0966824278",
    description: "Cảm ơn em đã bước vào cuộc đời anh, biến những ngày bình thường thành những ngày ngập tràn nụ cười và hạnh phúc.",
    bank: {
      bankName: "VIETINBANK",
      accountNumber: "100870851721",
      accountName: "NGUYEN VU TRUONG LONG",
      branch: "Chi nhánh Cầu Giấy - Hà Nội",
      qrUrl: "https://img.vietqr.io/image/ICB-100870851721-compact2.png?amount=0&addInfo=Mung%20cuoi%20Long%20Toi&accountName=NGUYEN%20VU%20TRUONG%20LONG",
    },
  },
  bride: {
    fullName: "Nguyễn Thị Tới",
    shortName: "Thanh Tới",
    role: "Cô Dâu",
    image: "/images/IMGL9185k.jpg",
    fatherName: "Ông Nguyễn Văn Tích",
    motherName: "Bà Đỗ Thị Tòng",
    birthOrder: "Tứ công chúa",
    phone: "0584254914",
    description: "Hạnh phúc không phải là tìm được người hoàn hảo, mà là tìm được một người cùng mình già đi trong bình yên và yêu thương.",
    bank: {
      bankName: "VIETINBANK",
      accountNumber: "102870851704",
      accountName: "NGUYEN THI TOI",
      branch: "Chi nhánh Cầu Giấy - Hà Nội",
      qrUrl: "https://img.vietqr.io/image/ICB-102870851704-compact2.png?amount=0&addInfo=Mung%20cuoi%20Long%20Toi&accountName=NGUYEN%20THANH%20TOI",
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
      id: "tiec_than_mat",
      side: "groom",
      title: "BỮA CƠM THÂN MẬT",
      subtitle: "Bữa cơm thân mật cùng gia đình và bạn bè thân thiết",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 18:00 - THỨ SÁU",
      dateFormatted: "13.11.2026",
      lunarDateFormatted: "(Tức ngày 05 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ TRAI",
      addressFormatted: "Thôn Đông Thái - Vĩnh Bảo - Hải Phòng",
      mapsUrl: "https://maps.app.goo.gl/aR8Aw5EoDVKw2FoQ8",
      time: "18:00",
      date: "Thứ Sáu, ngày 13 tháng 11 năm 2026",
      lunarDate: "Tức ngày 05 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Trai",
      address: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
      calendarEvent: {
        title: "Bữa Cơm Thân Mật - Long & Tới",
        details: "Bữa cơm thân mật cùng gia đình và bạn bè tại Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        location: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        start: "20261113T180000",
        end: "20261113T210000",
      },
    },
    tiecThanMatNhaGai: {
      id: "tiec_than_mat_nha_gai",
      side: "bride",
      title: "BỮA CƠM THÂN MẬT",
      subtitle: "Bữa cơm thân mật cùng gia đình và bạn bè thân thiết",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 18:00 - THỨ SÁU",
      dateFormatted: "13.11.2026",
      lunarDateFormatted: "(Tức ngày 05 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ GÁI",
      addressFormatted: "Ngã 5 Thanh Sơn - Phù Vân - Ninh Bình",
      mapsUrl: "https://maps.app.goo.gl/wZn8pssBgCSsieMDA",
      time: "18:00",
      date: "Thứ Sáu, ngày 13 tháng 11 năm 2026",
      lunarDate: "Tức ngày 05 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Gái",
      address: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
      calendarEvent: {
        title: "Bữa Cơm Thân Mật (Nhà Gái) - Long & Tới",
        details: "Bữa cơm thân mật cùng gia đình và bạn bè tại Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        location: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        start: "20261113T180000",
        end: "20261113T210000",
      },
    },
    vuQuy: {
      id: "vu_quy",
      side: "bride",
      title: "LỄ VU QUY",
      subtitle: "Nghi lễ trang trọng tại tư gia nhà gái",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 07:00 - THỨ BẢY",
      dateFormatted: "14.11.2026",
      lunarDateFormatted: "(Tức ngày 06 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ GÁI",
      addressFormatted: "Ngã 5 Thanh Sơn - Phù Vân - Ninh Bình",
      mapsUrl: "https://maps.app.goo.gl/wZn8pssBgCSsieMDA",
      time: "07:00",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Tức ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Gái",
      address: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
      calendarEvent: {
        title: "Lễ Vu Quy - Long & Tới",
        details: "Lễ Vu Quy và Tiệc mừng cùng Họ Nhà Gái tại Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        location: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
        start: "20261114T070000",
        end: "20261114T110000",
      },
    },
    thanhHon: {
      id: "thanh_hon",
      side: "groom",
      title: "LỄ THÀNH HÔN",
      subtitle: "Tiệc cưới và Nghi thức thành hôn tại Nhà Trai",
      descriptionTime: "ĐƯỢC TỔ CHỨC VÀO LÚC 10:30 - THỨ BẢY",
      dateFormatted: "14.11.2026",
      lunarDateFormatted: "(Tức ngày 06 tháng 10 năm Bính Ngọ)",
      locationTitle: "TẠI TƯ GIA NHÀ TRAI",
      addressFormatted: "Thôn Đông Thái - Vĩnh Bảo - Hải Phòng",
      mapsUrl: "https://maps.app.goo.gl/aR8Aw5EoDVKw2FoQ8",
      time: "10:00",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Tức ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Tư gia Nhà Trai",
      address: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
      calendarEvent: {
        title: "Lễ Thành Hôn - Long & Tới",
        details: "Lễ Thành Hôn và Tiệc cưới mừng hạnh phúc tại Tư gia Nhà Trai, Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        location: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
        start: "20261115T100000",
        end: "20261115T130000",
      },
    },
    tiecMung: {
      id: "tiec_mung",
      side: "groom",
      title: "TIỆC CƯỚI CHUNG VUI",
      subtitle: "Bữa cơm thân mật và giao lưu âm nhạc",
      time: "10:30",
      date: "Thứ Bảy, ngày 14 tháng 11 năm 2026",
      lunarDate: "Tức ngày 06 tháng 10 năm Bính Ngọ",
      locationName: "Hội Trường Tiệc Cưới Tư Gia Nhà Trai",
      address: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
      mapsUrl: "https://maps.app.goo.gl/aR8Aw5EoDVKw2FoQ8",
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
      image: "/images/AIMGL9214.jpg",
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
    { id: 2, src: "/images/IMGL9221.jpg", title: "Nụ Cười Rạng Rỡ", category: "gate" },
    { id: 3, src: "/images/IMGL9826.jpg", title: "Ánh Mắt Yêu Thương", category: "romantic" },
    { id: 4, src: "/images/IMGL9513k.jpg", title: "Nụ Cười Hạnh Phúc", category: "studio" },
    { id: 5, src: "/images/IMGL9346k.jpg", title: "Nguyện Ước Trăm Năm", category: "studio" },
    { id: 6, src: "/images/IMGL9305b.jpg", title: "Thanh Xuân Cùng Em", category: "studio" },
    { id: 7, src: "/images/IMGL9374k.jpg", title: "Tình Yêu Vĩnh Cửu", category: "studio" },
    { id: 8, src: "/images/IMGL9818.jpg", title: "Ánh Nhìn Ngọt Ngào", category: "studio" },
    { id: 9, src: "/images/IMGL9633k.jpg", title: "Ngày Chung Đôi", category: "studio" },
    { id: 10, src: "/images/IMGL9540.jpg", title: "Giai Điệu Tình Yêu", category: "studio" },
  ],
  defaultWishes: [],
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


export interface WeddingEventMeta {
  id: string;
  side: "groom" | "bride";
  name: string;
  timeDate: string;
  location: string;
}

export const AVAILABLE_EVENTS: WeddingEventMeta[] = [
  {
    id: "tiec_than_mat",
    side: "groom",
    name: "Bữa cơm thân mật (Nhà trai)",
    timeDate: "18:00 - 13/11/2026",
    location: "KDC Đông Thái, Vĩnh Bảo, Hải Phòng",
  },
  {
    id: "thanh_hon",
    side: "groom",
    name: "Lễ Thành Hôn (Nhà trai)",
    timeDate: "10:30 - 14/11/2026",
    location: "Thôn Đông Thái, Vĩnh Bảo, Hải Phòng",
  },
  {
    id: "tiec_than_mat_nha_gai",
    side: "bride",
    name: "Bữa cơm thân mật (Nhà gái)",
    timeDate: "18:00 - 13/11/2026",
    location: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
  },
  {
    id: "vu_quy",
    side: "bride",
    name: "Lễ Vu Quy (Nhà gái)",
    timeDate: "07:00 - 14/11/2026",
    location: "Ngã 5 Thanh Sơn, Phù Vân, Ninh Bình",
  },
];

export function getEventDetailById(id: string): EventDetail | undefined {
  switch (id) {
    case "tiec_than_mat":
      return weddingData.events.tiecThanMat;
    case "thanh_hon":
      return weddingData.events.thanhHon;
    case "tiec_than_mat_nha_gai":
      return weddingData.events.tiecThanMatNhaGai;
    case "vu_quy":
      return weddingData.events.vuQuy;
    case "tiec_mung":
      return weddingData.events.tiecMung;
    default:
      return undefined;
  }
}
