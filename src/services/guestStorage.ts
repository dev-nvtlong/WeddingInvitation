import type { Guest, WishItem, AdminStats, GoogleSheetsConfig } from "../types/guestManagement";
import { weddingData } from "../data/weddingData";
import { getGuestInvitationUrl } from "../utils/guestList";
import { escapeCSV, parseCSV } from "../utils/csv";

const STORAGE_KEY_GUESTS = "wedding_guests_v2";
const STORAGE_KEY_WISHES = "wedding_wishes_v2";
const STORAGE_KEY_SHEETS = "wedding_sheets_config_v2";
const STORAGE_KEY_AUTH = "wedding_admin_auth_v2";
const STORAGE_KEY_PASSWORD = "wedding_admin_pin_v2";

const DEFAULT_ADMIN_PIN = "14112026"; // Mật mã mặc định ngày cưới (có thể đổi)

// Chuyển đổi tên tiếng Việt có dấu thành mã URL slug không dấu
export function generateGuestSlug(fullName: string): string {
  const normalized = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return normalized || `khach-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Dữ liệu mẫu ban đầu trích từ danh sách khách mời của gia đình
const INITIAL_SEED_GUESTS: Guest[] = [
  {
    id: "g_1",
    code: "tuan-diu",
    fullName: "Tuấn Dịu",
    phone: "0912 345 678",
    group: "Bạn Thế (Nhà Trai)",
    invitedTo: "both",
    expectedCount: 2,
    notes: "Khách mời thân thiết",
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "attending", attendeeCount: 2, updatedAt: "2026-11-04T10:00:00Z" },
      vuQuy: { attending: "attending", attendeeCount: 2, updatedAt: "2026-11-04T10:00:00Z" },
      generalNote: "Chúc hai cháu trăm năm hạnh phúc!",
      updatedAt: "2026-11-04T10:00:00Z",
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_2",
    code: "hien-cham",
    fullName: "Hiền Châm",
    phone: "0983 234 567",
    group: "Bạn Thế (Nhà Trai)",
    invitedTo: "tiec_than_mat",
    expectedCount: 2,
    notes: "Mời tiệc thân mật tối thứ 7",
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "attending", attendeeCount: 2, updatedAt: "2026-11-05T14:30:00Z" },
      updatedAt: "2026-11-05T14:30:00Z",
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_3",
    code: "bac-huan",
    fullName: "Bác Huân",
    phone: "0904 111 222",
    group: "Bạn Thế (Nhà Trai)",
    invitedTo: "both",
    expectedCount: 1,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "pending", attendeeCount: 1 },
      vuQuy: { attending: "pending", attendeeCount: 1 },
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_4",
    code: "tham",
    fullName: "Anh Thám",
    phone: "0978 999 888",
    group: "Gia Phong",
    invitedTo: "tiec_than_mat",
    expectedCount: 1,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "attending", attendeeCount: 1 },
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_5",
    code: "giang",
    fullName: "Chú Giang",
    phone: "",
    group: "Gia Phong",
    invitedTo: "vu_quy",
    expectedCount: 1,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      vuQuy: { attending: "pending", attendeeCount: 1 },
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_6",
    code: "thuan",
    fullName: "Anh Thuần",
    phone: "0915 678 901",
    group: "Bạn Bè",
    invitedTo: "both",
    expectedCount: 2,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "attending", attendeeCount: 2 },
      vuQuy: { attending: "declined", attendeeCount: 0 },
      generalNote: "Hôm đó mình bận công tác chỉ đi tiệc tối được thôi nhé",
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_7",
    code: "hau",
    fullName: "Bạn Hậu",
    phone: "",
    group: "Bạn Chú Rể",
    invitedTo: "both",
    expectedCount: 1,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "pending", attendeeCount: 1 },
      vuQuy: { attending: "pending", attendeeCount: 1 },
    },
    checkin: { isCheckedIn: false },
  },
  {
    id: "g_8",
    code: "cuong-v",
    fullName: "Cường V",
    phone: "",
    group: "Bạn Thế (Nhà Trai)",
    invitedTo: "tiec_than_mat",
    expectedCount: 1,
    createdAt: "2026-11-01T08:00:00Z",
    rsvp: {
      tiecThanMat: { attending: "attending", attendeeCount: 1 },
    },
    checkin: { isCheckedIn: false },
  },
];

// --------------------------------------------------------------------------
// KHÁCH MỜI (GUESTS CRUD)
// --------------------------------------------------------------------------

export function getGuests(): Guest[] {
  if (typeof window === "undefined") return INITIAL_SEED_GUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GUESTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(INITIAL_SEED_GUESTS));
      return INITIAL_SEED_GUESTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Lỗi khi đọc danh sách khách mời:", err);
    return INITIAL_SEED_GUESTS;
  }
}

export function saveGuests(guests: Guest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(guests));
  } catch (err) {
    console.error("Lỗi khi lưu danh sách khách mời:", err);
  }
}

export function addGuest(data: Omit<Guest, "id" | "createdAt" | "checkin">): Guest {
  const guests = getGuests();
  const id = `g_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  let code = data.code?.trim() || generateGuestSlug(data.fullName);

  // Đảm bảo mã mời là duy nhất
  const baseCode = code;
  let suffix = 2;
  while (guests.some((g) => g.code.toLowerCase() === code.toLowerCase())) {
    code = `${baseCode}-${suffix++}`;
  }

  const newGuest: Guest = {
    ...data,
    id,
    code,
    createdAt: new Date().toISOString(),
    checkin: { isCheckedIn: false },
    rsvp: data.rsvp || {
      tiecThanMat: { attending: "pending", attendeeCount: data.expectedCount || 1 },
      thanhHon: (data.invitedTo === "thiep_chu_re" || data.invitedTo === "both") ? { attending: "pending", attendeeCount: data.expectedCount || 1 } : undefined,
      vuQuy: (data.invitedTo === "thiep_co_dau" || data.invitedTo === "both" || data.invitedTo === "vu_quy") ? { attending: "pending", attendeeCount: data.expectedCount || 1 } : undefined,
    },
  };

  const updated = [newGuest, ...guests];
  saveGuests(updated);
  return newGuest;
}

export function updateGuest(guest: Guest): Guest {
  const guests = getGuests();
  const index = guests.findIndex((g) => g.id === guest.id);
  if (index !== -1) {
    guests[index] = { ...guest };
    saveGuests(guests);
  }
  return guest;
}

export function deleteGuest(id: string): void {
  const guests = getGuests().filter((g) => g.id !== id);
  saveGuests(guests);
}

export function getGuestByCode(codeOrSlug: string): Guest | undefined {
  if (!codeOrSlug) return undefined;
  const clean = codeOrSlug.trim().toLowerCase();
  const guests = getGuests();
  return (
    guests.find((g) => g.code.toLowerCase() === clean) ||
    guests.find((g) => generateGuestSlug(g.fullName) === clean) ||
    guests.find((g) => g.fullName.toLowerCase() === clean)
  );
}

// Cập nhật phản hồi RSVP của khách
export function updateGuestRSVP(
  guestId: string,
  event: "tiec_than_mat" | "vu_quy",
  attending: "attending" | "declined" | "pending",
  count: number,
  note?: string
): Guest | undefined {
  const guests = getGuests();
  const guest = guests.find((g) => g.id === guestId);
  if (!guest) return undefined;

  const now = new Date().toISOString();
  if (!guest.rsvp) {
    guest.rsvp = {};
  }

  if (event === "tiec_than_mat") {
    guest.rsvp.tiecThanMat = {
      attending,
      attendeeCount: count,
      updatedAt: now,
    };
  } else if (event === "vu_quy") {
    guest.rsvp.vuQuy = {
      attending,
      attendeeCount: count,
      updatedAt: now,
    };
  }

  if (note !== undefined) {
    guest.rsvp.generalNote = note;
  }
  guest.rsvp.updatedAt = now;

  saveGuests(guests);
  return guest;
}

// Điểm danh (Check-in) khách tại đám cưới
export function toggleCheckin(guestId: string, isCheckedIn: boolean, actualCount?: number): Guest | undefined {
  const guests = getGuests();
  const guest = guests.find((g) => g.id === guestId);
  if (!guest) return undefined;

  guest.checkin = {
    isCheckedIn,
    checkedInAt: isCheckedIn ? new Date().toISOString() : undefined,
    actualCount: actualCount ?? (isCheckedIn ? guest.expectedCount || 1 : 0),
  };

  saveGuests(guests);
  return guest;
}

// --------------------------------------------------------------------------
// THỐNG KÊ (ANALYTICS STATS)
// --------------------------------------------------------------------------

export function calculateAdminStats(): AdminStats {
  const guests = getGuests();
  const wishes = getWishes();

  const stats: AdminStats = {
    totalGuests: guests.length,
    totalExpectedCount: 0,
    tiecThanMat: {
      invited: 0,
      attendingCount: 0,
      declinedCount: 0,
      pendingCount: 0,
      totalHeadcount: 0,
    },
    vuQuy: {
      invited: 0,
      attendingCount: 0,
      declinedCount: 0,
      pendingCount: 0,
      totalHeadcount: 0,
    },
    checkedIn: {
      total: 0,
      tiecThanMat: 0,
      vuQuy: 0,
    },
    totalWishes: wishes.length,
  };

  guests.forEach((g) => {
    stats.totalExpectedCount += Number(g.expectedCount) || 1;

    // Tiệc thân mật (có trong cả thiệp chú rể và thiệp cô dâu)
    if (
      g.invitedTo === "both" ||
      g.invitedTo === "tiec_than_mat" ||
      g.invitedTo === "thiep_chu_re" ||
      g.invitedTo === "thiep_co_dau"
    ) {
      stats.tiecThanMat.invited += 1;
      const rsvp = g.rsvp?.tiecThanMat;
      if (rsvp?.attending === "attending") {
        stats.tiecThanMat.attendingCount += 1;
        stats.tiecThanMat.totalHeadcount += Number(rsvp.attendeeCount) || 1;
      } else if (rsvp?.attending === "declined") {
        stats.tiecThanMat.declinedCount += 1;
      } else {
        stats.tiecThanMat.pendingCount += 1;
      }
    }

    // Lễ vu quy (có trong thiệp cô dâu và cả hai)
    if (
      g.invitedTo === "both" ||
      g.invitedTo === "vu_quy" ||
      g.invitedTo === "thiep_co_dau"
    ) {
      stats.vuQuy.invited += 1;
      const rsvp = g.rsvp?.vuQuy;
      if (rsvp?.attending === "attending") {
        stats.vuQuy.attendingCount += 1;
        stats.vuQuy.totalHeadcount += Number(rsvp.attendeeCount) || 1;
      } else if (rsvp?.attending === "declined") {
        stats.vuQuy.declinedCount += 1;
      } else {
        stats.vuQuy.pendingCount += 1;
      }
    }

    // Checkin
    if (g.checkin?.isCheckedIn) {
      stats.checkedIn.total += 1;
    }
  });

  return stats;
}

// --------------------------------------------------------------------------
// LỜI CHÚC (WISHES CRUD)
// --------------------------------------------------------------------------

export function getWishes(): WishItem[] {
  if (typeof window === "undefined") {
    return weddingData.defaultWishes.map((w) => ({ ...w, isApproved: true }));
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WISHES);
    if (!raw) {
      const initial = weddingData.defaultWishes.map((w) => ({ ...w, isApproved: true }));
      localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Lỗi khi đọc sổ lời chúc:", err);
    return weddingData.defaultWishes.map((w) => ({ ...w, isApproved: true }));
  }
}

export function saveWishes(wishes: WishItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_WISHES, JSON.stringify(wishes));
  } catch (err) {
    console.error("Lỗi khi lưu lời chúc:", err);
  }
}

export function addWish(data: Omit<WishItem, "id" | "createdAt" | "isApproved">): WishItem {
  const wishes = getWishes();
  const newWish: WishItem = {
    ...data,
    id: Date.now(),
    createdAt: "Vừa xong",
    isApproved: true,
  };
  const updated = [newWish, ...wishes];
  saveWishes(updated);
  return newWish;
}

export function toggleApproveWish(id: number | string): void {
  const wishes = getWishes().map((w) => {
    if (w.id === id) {
      return { ...w, isApproved: !w.isApproved };
    }
    return w;
  });
  saveWishes(wishes);
}

export function deleteWish(id: number | string): void {
  const wishes = getWishes().filter((w) => w.id !== id);
  saveWishes(wishes);
}

// --------------------------------------------------------------------------
// GOOGLE SHEETS CONFIG
// --------------------------------------------------------------------------

export function getSheetConfig(): GoogleSheetsConfig {
  const defaultConf: GoogleSheetsConfig = {
    webAppUrl: "",
    secretToken: "LONG_TOI_WEDDING_2026",
    autoSync: false,
  };

  if (typeof window === "undefined") return defaultConf;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEETS);
    return raw ? JSON.parse(raw) : defaultConf;
  } catch {
    return defaultConf;
  }
}

export function saveSheetConfig(config: GoogleSheetsConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_SHEETS, JSON.stringify(config));
}

// --------------------------------------------------------------------------
// ADMIN AUTHENTICATION
// --------------------------------------------------------------------------

export function getAdminPin(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PIN;
  return localStorage.getItem(STORAGE_KEY_PASSWORD) || DEFAULT_ADMIN_PIN;
}

export function setAdminPin(newPin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_PASSWORD, newPin.trim());
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === "authenticated";
}

export function loginAdmin(pin: string): boolean {
  const currentPin = getAdminPin();
  if (pin.trim() === currentPin) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, "authenticated");
    return true;
  }
  return false;
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
}

// --------------------------------------------------------------------------
// IMPORT & EXPORT CSV
// --------------------------------------------------------------------------

export function exportGuestsToCSV(): string {
  const guests = getGuests();
  const headers = [
    "Mã Khách (Code)",
    "Họ và Tên",
    "Số Điện Thoại",
    "Nhóm Khách",
    "Sự Kiện Mời",
    "Số Lượng Dự Kiến",
    "RSVP Tiệc Thân Mật",
    "Số Người Tiệc Thân Mật",
    "RSVP Lễ Vu Quy",
    "Số Người Lễ Vu Quy",
    "Ghi Chú RSVP",
    "Trạng Thái Check-in",
    "Link Thiệp Mời Cá Nhân",
  ];

  const rows = guests.map((g) => {
    const inviteEvent = g.invitedTo;
    const rsvpThanMat = g.rsvp?.tiecThanMat?.attending || "pending";
    const countThanMat = g.rsvp?.tiecThanMat?.attendeeCount || 0;
    const rsvpVuQuy = g.rsvp?.vuQuy?.attending || "pending";
    const countVuQuy = g.rsvp?.vuQuy?.attendeeCount || 0;
    const checkin = g.checkin?.isCheckedIn ? "Đã check-in" : "Chưa";
    const link = typeof window !== "undefined" ? getGuestInvitationUrl(g.code) : `?g=${encodeURIComponent(g.code)}`;

    return [
      g.code,
      g.fullName,
      g.phone || "",
      g.group,
      inviteEvent,
      g.expectedCount || 1,
      rsvpThanMat,
      countThanMat,
      rsvpVuQuy,
      countVuQuy,
      g.rsvp?.generalNote || "",
      checkin,
      link,
    ].map(escapeCSV).join(",");
  });

  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

export function importGuestsFromCSV(csvText: string): number {
  try {
    const lines = parseCSV(csvText);
    if (lines.length <= 1) return 0;

    const existing = getGuests();
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i];
      if (!values || values.length < 2) continue;

      const clean = (val: string) => val?.trim() || "";
      const name = clean(values[1]);
      if (!name) continue;

      const phone = clean(values[2] || "");
      const group = clean(values[3] || "Bạn Bè");
      const eventRaw = clean(values[4] || "").toLowerCase();
      const count = Math.max(1, parseInt(clean(values[5] || "1"), 10) || 1);

      let invitedTo: Guest["invitedTo"] = "both";
      if (eventRaw === "thiep_chu_re" || eventRaw.includes("chú rể")) {
        invitedTo = "thiep_chu_re";
      } else if (eventRaw === "thiep_co_dau" || eventRaw.includes("cô dâu")) {
        invitedTo = "thiep_co_dau";
      } else if (eventRaw.includes("thân mật") || eventRaw.includes("than_mat")) {
        invitedTo = "tiec_than_mat";
      } else if (eventRaw.includes("vu quy") || eventRaw.includes("vu_quy")) {
        invitedTo = "vu_quy";
      }

      const baseCode = clean(values[0]) || generateGuestSlug(name);
      let code = baseCode;
      let suffix = 2;
      while (existing.some((g) => g.code.toLowerCase() === code.toLowerCase())) {
        code = `${baseCode}-${suffix++}`;
      }
      // Kiểm tra trùng
      if (!existing.some((g) => g.fullName.toLowerCase() === name.toLowerCase())) {
        existing.push({
          id: `g_imp_${Date.now()}_${i}`,
          code,
          fullName: name,
          phone,
          group,
          invitedTo,
          expectedCount: count,
          createdAt: new Date().toISOString(),
          rsvp: {
            tiecThanMat: invitedTo !== "vu_quy" ? { attending: "pending", attendeeCount: count } : undefined,
            vuQuy: invitedTo !== "tiec_than_mat" ? { attending: "pending", attendeeCount: count } : undefined,
          },
          checkin: { isCheckedIn: false },
        });
        importedCount++;
      }
    }

    if (importedCount > 0) {
      saveGuests(existing);
    }
    return importedCount;
  } catch (err) {
    console.error("Lỗi import CSV:", err);
    return 0;
  }
}
