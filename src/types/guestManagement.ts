export type InvitedEventType = "both" | "thiep_chu_re" | "thiep_co_dau" | "tiec_than_mat" | "tiec_than_mat_nha_gai" | "vu_quy";

export type WeddingSide = "groom" | "bride";

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
  id: string;                      // ID duy nhất (Guest ID, ví dụ: "g_1")
  code: string;                    // Mã mời ngắn (slug) cho URL: ?g=tuan-diu
  fullName: string;                // Họ và tên khách mời
  phone?: string;                  // Số điện thoại
  group: string;                   // Nhóm khách (Bạn Thế, Gia Phong, Bạn Long, Bạn Tới, Họ Nhà Trai, Họ Nhà Gái...)
  side: WeddingSide;               // Phân loại độc lập: "groom" (Nhà trai) hoặc "bride" (Nhà gái)
  eventIds: string[];              // Danh sách ID các sự kiện được mời
  invitedTo?: InvitedEventType;    // Loại thiệp (giữ để tương thích ngược)
  expectedCount: number;           // Số lượng người dự kiến (hoặc người đi cùng)
  notes?: string;                  // Ghi chú của ban tổ chức
  createdAt: string;               // Ngày tạo
  updatedAt?: string;              // Ngày cập nhật
  
  // RSVP từng sự kiện riêng biệt
  rsvp: {
    tiecThanMat?: EventRSVPDetail;
    thanhHon?: EventRSVPDetail;
    tiecThanMatNhaGai?: EventRSVPDetail;
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

export interface SingleEventStat {
  eventId: string;
  eventName: string;
  invitedCount: number;     // Số khách được mời tham dự sự kiện này
  attendingCount: number;   // Số khách xác nhận "Có"
  declinedCount: number;    // Số khách xác nhận "Không"
  pendingCount: number;     // Số khách "Chờ phản hồi"
  totalHeadcount: number;   // Tổng số người thực tế tham dự (gồm người đi cùng)
}

export interface PartyDetailedStats {
  totalGuests: number;        // Tổng số khách mời (records)
  totalExpectedCount: number; // Tổng số người dự kiến tham dự
  confirmedGuests: number;    // Số khách xác nhận Có (tham dự ít nhất 1 sự kiện)
  declinedGuests: number;     // Số khách từ chối
  pendingGuests: number;      // Số khách chưa phản hồi
  totalHeadcount: number;     // Tổng số người thực tế đi cùng đã xác nhận tham dự
  events: {
    tiecThanMat?: SingleEventStat;
    thanhHon?: SingleEventStat;
    tiecThanMatNhaGai?: SingleEventStat;
    vuQuy?: SingleEventStat;
    [key: string]: SingleEventStat | undefined;
  };
}

export interface AdminStats {
  // Thống kê tách biệt độc lập 100% giữa hai bên
  groom: PartyDetailedStats;
  bride: PartyDetailedStats;
  
  // Tổng quan chung
  overall: {
    totalGuests: number;
    totalExpectedCount: number;
    totalHeadcount: number;
    totalWishes: number;
    checkedInTotal: number;
  };

  // Backward compatibility fields
  totalGuests: number;
  totalExpectedCount: number;
  totalWishes: number;
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
}

export interface GoogleSheetsConfig {
  webAppUrl: string;       // URL Web App của Google Apps Script
  secretToken: string;     // Mã token xác thực bảo mật
  sheetId?: string;        // ID của Spreadsheet (tùy chọn)
  lastSyncedAt?: string;   // Thời gian đồng bộ gần nhất
  autoSync: boolean;       // Tự động đồng bộ khi có thay đổi
}
