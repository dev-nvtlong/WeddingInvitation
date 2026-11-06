export type InvitedEventType = "both" | "thiep_chu_re" | "thiep_co_dau" | "tiec_than_mat" | "vu_quy";

export type RSVPStatus = "attending" | "declined" | "pending";

export interface EventRSVPDetail {
  attending: RSVPStatus;
  attendeeCount: number;
  updatedAt?: string;
}

export interface GuestCheckin {
  isCheckedIn: boolean;
  checkedInAt?: string;
  actualCount?: number;
  event?: InvitedEventType;
}

export interface Guest {
  id: string;                      // ID duy nhất (ví dụ: "g_1")
  code: string;                    // Mã mời ngắn (slug) cho URL: ?g=tuan-diu
  fullName: string;                // Họ và tên khách mời
  phone?: string;                  // Số điện thoại
  group: string;                   // Nhóm khách (Bạn Thế, Gia Phong, Bạn Long, Bạn Tới, Nhà Trai, Nhà Gái...)
  invitedTo: InvitedEventType;     // Loại thiệp: Thiệp Chú Rể, Thiệp Cô Dâu hoặc Cả hai
  expectedCount: number;           // Số lượng người dự kiến (mặc định: 1)
  notes?: string;                  // Ghi chú của ban tổ chức
  createdAt: string;               // Ngày tạo
  
  // RSVP từng sự kiện riêng biệt
  rsvp: {
    tiecThanMat?: EventRSVPDetail;
    thanhHon?: EventRSVPDetail;
    vuQuy?: EventRSVPDetail;
    generalNote?: string;
    updatedAt?: string;
  };

  // Trạng thái Check-in tại ngày cưới
  checkin: GuestCheckin;
}

export interface WishItem {
  id: number | string;
  name: string;
  relationship: string;
  message: string;
  createdAt: string;
  isApproved: boolean;
  guestCode?: string;
  guestId?: string;
}

export interface AdminStats {
  totalGuests: number;
  totalExpectedCount: number;
  tiecThanMat: {
    invited: number;
    attendingCount: number;
    declinedCount: number;
    pendingCount: number;
    totalHeadcount: number;
  };
  vuQuy: {
    invited: number;
    attendingCount: number;
    declinedCount: number;
    pendingCount: number;
    totalHeadcount: number;
  };
  checkedIn: {
    total: number;
    tiecThanMat: number;
    vuQuy: number;
  };
  totalWishes: number;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;       // URL Web App của Google Apps Script
  secretToken: string;     // Mã token xác thực bảo mật
  sheetId?: string;        // ID của Spreadsheet (tùy chọn)
  lastSyncedAt?: string;   // Thời gian đồng bộ gần nhất
  autoSync: boolean;       // Tự động đồng bộ khi có thay đổi
}
