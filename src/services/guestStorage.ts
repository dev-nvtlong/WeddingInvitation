import type { Guest, WishItem, AdminStats, GoogleSheetsConfig, WeddingSide, PartyDetailedStats, SingleEventStat } from "../types/guestManagement";
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


// Hàm chuẩn hóa dữ liệu khách mời, tự động suy ra side và eventIds nếu chưa có
// Hàm chuẩn hóa dữ liệu khách mời, phân loại độc lập "groom" hoặc "bride"
export function normalizeGuest(guest: any): Guest {
  let side: WeddingSide = guest.side === "bride" ? "bride" : "groom";

  // Phân loại dữ liệu cũ nếu chưa có side hoặc có side là "both"
  if (!guest.side || guest.side === "both") {
    const inv = String(guest.invitedTo || "").toLowerCase();
    const grp = String(guest.group || "").toLowerCase();
    const evs = Array.isArray(guest.eventIds) ? guest.eventIds : [];

    if (
      inv === "thiep_co_dau" ||
      inv === "vu_quy" ||
      inv === "tiec_than_mat_nha_gai" ||
      grp.includes("nhà gái") ||
      grp.includes("cô dâu") ||
      evs.includes("vu_quy") ||
      evs.includes("tiec_than_mat_nha_gai")
    ) {
      side = "bride";
    } else {
      side = "groom";
    }
  }

  // Chuẩn hóa danh sách sự kiện theo side
  let eventIds: string[] = Array.isArray(guest.eventIds) ? [...guest.eventIds] : [];
  if (side === "groom") {
    // Chỉ giữ sự kiện của Nhà Trai
    eventIds = eventIds.filter((id) => id === "tiec_than_mat" || id === "thanh_hon");
    if (eventIds.length === 0) {
      const inv = guest.invitedTo;
      if (inv === "tiec_than_mat") eventIds = ["tiec_than_mat"];
      else eventIds = ["tiec_than_mat", "thanh_hon"];
    }
  } else {
    // Chỉ giữ sự kiện của Nhà Gái
    eventIds = eventIds.filter((id) => id === "tiec_than_mat_nha_gai" || id === "vu_quy");
    if (eventIds.length === 0) {
      const inv = guest.invitedTo;
      if (inv === "vu_quy") eventIds = ["vu_quy"];
      else if (inv === "tiec_than_mat_nha_gai") eventIds = ["tiec_than_mat_nha_gai"];
      else eventIds = ["tiec_than_mat_nha_gai", "vu_quy"];
    }
  }

  const now = new Date().toISOString();
  const createdAt = guest.createdAt || now;
  const updatedAt = guest.updatedAt || now;

  return {
    ...guest,
    side,
    eventIds,
    expectedCount: Number(guest.expectedCount) || 1,
    createdAt,
    updatedAt,
  };
}

// Dữ liệu mẫu ban đầu trích từ danh sách khách mời của gia đình
const INITIAL_SEED_GUESTS: Guest[] = [];

// --------------------------------------------------------------------------
// KHÁCH MỜI (GUESTS CRUD)
// --------------------------------------------------------------------------

export function getGuests(): Guest[] {
  if (typeof window === "undefined") return INITIAL_SEED_GUESTS.map(normalizeGuest);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GUESTS);
    if (!raw) {
      const seeded = INITIAL_SEED_GUESTS.map(normalizeGuest);
      localStorage.setItem(STORAGE_KEY_GUESTS, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_SEED_GUESTS.map(normalizeGuest);

    let needsSave = false;
    // Loại bỏ dữ liệu ảo nếu đã lưu từ các phiên trước
    const cleaned = parsed.filter(
      (g) => g.id !== "g_1" && g.code !== "ban-long" && g.fullName !== "Bạn Long"
    );
    if (cleaned.length !== parsed.length) {
      needsSave = true;
    }

    const normalized = cleaned.map((g) => {
      if (!g.side || !Array.isArray(g.eventIds)) {
        needsSave = true;
      }
      return normalizeGuest(g);
    });

    if (needsSave) {
      saveGuests(normalized);
    }
    return normalized;
  } catch (err) {
    console.error("Lỗi khi đọc danh sách khách mời:", err);
    return INITIAL_SEED_GUESTS.map(normalizeGuest);
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

  const normalized = normalizeGuest({
    ...data,
    id,
    code,
    createdAt: new Date().toISOString(),
    checkin: { isCheckedIn: false },
    rsvp: data.rsvp || {
      tiecThanMat: { attending: "pending", attendeeCount: data.expectedCount || 1 },
      thanhHon: (data.eventIds?.includes("thanh_hon") || data.invitedTo === "thiep_chu_re" || data.invitedTo === "both") ? { attending: "pending", attendeeCount: data.expectedCount || 1 } : undefined,
      vuQuy: (data.eventIds?.includes("vu_quy") || data.invitedTo === "thiep_co_dau" || data.invitedTo === "both" || data.invitedTo === "vu_quy") ? { attending: "pending", attendeeCount: data.expectedCount || 1 } : undefined,
    },
  });

  const updated = [normalized, ...guests];
  saveGuests(updated);
  return normalized;
}

export function updateGuest(guest: Guest): Guest {
  const guests = getGuests();
  const index = guests.findIndex((g) => g.id === guest.id);
  const normalized = normalizeGuest(guest);
  if (index !== -1) {
    guests[index] = normalized;
    saveGuests(guests);
  }
  return normalized;
}

export function deleteGuest(id: string): void {
  const guests = getGuests().filter((g) => g.id !== id);
  saveGuests(guests);
}

export function getGuestByCode(codeOrSlug: string): Guest | undefined {
  if (!codeOrSlug) return undefined;
  const clean = codeOrSlug.trim().toLowerCase();
  const guests = getGuests();
  const found = (
    guests.find((g) => g.code.toLowerCase() === clean) ||
    guests.find((g) => generateGuestSlug(g.fullName) === clean) ||
    guests.find((g) => g.fullName.toLowerCase() === clean)
  );
  return found ? normalizeGuest(found) : undefined;
}

// Cập nhật phản hồi RSVP của khách
export function updateGuestRSVP(
  guestId: string,
  event: "tiec_than_mat" | "thanh_hon" | "vu_quy" | "tiec_than_mat_nha_gai",
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

  const detail = {
    attending,
    attendeeCount: count,
    updatedAt: now,
  };

  if (event === "tiec_than_mat") {
    guest.rsvp.tiecThanMat = detail;
  } else if (event === "thanh_hon") {
    guest.rsvp.thanhHon = detail;
  } else if (event === "vu_quy") {
    guest.rsvp.vuQuy = detail;
  } else if (event === "tiec_than_mat_nha_gai") {
    guest.rsvp.tiecThanMatNhaGai = detail;
  }

  if (note !== undefined) {
    guest.rsvp.generalNote = note;
  }
  guest.rsvp.updatedAt = now;
  guest.updatedAt = now;

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

// Tính toán thống kê chi tiết cho một bên (Nhà Trai hoặc Nhà Gái)
function calculatePartySideStats(
  partyGuests: Guest[],
  eventDefs: { id: string; name: string; rsvpKey: "tiecThanMat" | "thanhHon" | "tiecThanMatNhaGai" | "vuQuy" }[]
): PartyDetailedStats {
  const eventsStat: { [key: string]: SingleEventStat } = {};

  eventDefs.forEach((def) => {
    eventsStat[def.id] = {
      eventId: def.id,
      eventName: def.name,
      invitedCount: 0,
      attendingCount: 0,
      declinedCount: 0,
      pendingCount: 0,
      totalHeadcount: 0,
    };
  });

  let totalExpectedCount = 0;
  let confirmedGuests = 0;
  let declinedGuests = 0;
  let pendingGuests = 0;
  let totalHeadcount = 0;

  partyGuests.forEach((g) => {
    totalExpectedCount += Number(g.expectedCount) || 1;
    const evIds = g.eventIds || [];

    let hasAttending = false;
    let allDeclined = evIds.length > 0;
    let maxGuestHeadcount = 0;

    eventDefs.forEach((def) => {
      if (evIds.includes(def.id)) {
        const stat = eventsStat[def.id];
        stat.invitedCount += 1;

        const rsvpDetail = g.rsvp ? g.rsvp[def.rsvpKey] : undefined;
        const status = rsvpDetail?.attending || "pending";
        const count = Number(rsvpDetail?.attendeeCount) || 0;

        if (status === "attending") {
          hasAttending = true;
          allDeclined = false;
          stat.attendingCount += 1;
          const attendingNum = count > 0 ? count : (Number(g.expectedCount) || 1);
          stat.totalHeadcount += attendingNum;
          if (attendingNum > maxGuestHeadcount) {
            maxGuestHeadcount = attendingNum;
          }
        } else if (status === "declined") {
          stat.declinedCount += 1;
        } else {
          allDeclined = false;
          stat.pendingCount += 1;
        }
      }
    });

    if (hasAttending) {
      confirmedGuests += 1;
      totalHeadcount += maxGuestHeadcount > 0 ? maxGuestHeadcount : (Number(g.expectedCount) || 1);
    } else if (allDeclined && evIds.length > 0) {
      declinedGuests += 1;
    } else {
      pendingGuests += 1;
    }
  });

  return {
    totalGuests: partyGuests.length,
    totalExpectedCount,
    confirmedGuests,
    declinedGuests,
    pendingGuests,
    totalHeadcount,
    events: eventsStat,
  };
}

export function calculateAdminStats(): AdminStats {
  const guests = getGuests();
  const wishes = getWishes();

  const groomGuests = guests.filter((g) => g.side === "groom");
  const brideGuests = guests.filter((g) => g.side === "bride");

  // Sự kiện Nhà Trai: Bữa Cơm Thân Mật (13.11) và Lễ Thành Hôn (14.11)
  const groomStats = calculatePartySideStats(groomGuests, [
    { id: "tiec_than_mat", name: "Bữa cơm thân mật (13/11)", rsvpKey: "tiecThanMat" },
    { id: "thanh_hon", name: "Lễ Thành Hôn (14/11)", rsvpKey: "thanhHon" },
  ]);

  // Sự kiện Nhà Gái: Bữa Cơm Thân Mật (13.11) và Lễ Vu Quy (14.11)
  const brideStats = calculatePartySideStats(brideGuests, [
    { id: "tiec_than_mat_nha_gai", name: "Bữa cơm thân mật (13/11)", rsvpKey: "tiecThanMatNhaGai" },
    { id: "vu_quy", name: "Lễ Vu Quy (14/11)", rsvpKey: "vuQuy" },
  ]);

  let checkedInTotal = 0;
  guests.forEach((g) => {
    if (g.checkin?.isCheckedIn) checkedInTotal += 1;
  });

  const overall = {
    totalGuests: guests.length,
    totalExpectedCount: groomStats.totalExpectedCount + brideStats.totalExpectedCount,
    totalHeadcount: groomStats.totalHeadcount + brideStats.totalHeadcount,
    totalWishes: wishes.length,
    checkedInTotal,
  };

  // Backward compatibility
  const legacyTiecThanMat = {
    invited: (groomStats.events.tiec_than_mat?.invitedCount || 0) + (brideStats.events.tiec_than_mat_nha_gai?.invitedCount || 0),
    attendingCount: (groomStats.events.tiec_than_mat?.attendingCount || 0) + (brideStats.events.tiec_than_mat_nha_gai?.attendingCount || 0),
    declinedCount: (groomStats.events.tiec_than_mat?.declinedCount || 0) + (brideStats.events.tiec_than_mat_nha_gai?.declinedCount || 0),
    pendingCount: (groomStats.events.tiec_than_mat?.pendingCount || 0) + (brideStats.events.tiec_than_mat_nha_gai?.pendingCount || 0),
    totalHeadcount: (groomStats.events.tiec_than_mat?.totalHeadcount || 0) + (brideStats.events.tiec_than_mat_nha_gai?.totalHeadcount || 0),
  };

  const legacyVuQuy = {
    invited: brideStats.events.vu_quy?.invitedCount || 0,
    attendingCount: brideStats.events.vu_quy?.attendingCount || 0,
    declinedCount: brideStats.events.vu_quy?.declinedCount || 0,
    pendingCount: brideStats.events.vu_quy?.pendingCount || 0,
    totalHeadcount: brideStats.events.vu_quy?.totalHeadcount || 0,
  };

  return {
    groom: groomStats,
    bride: brideStats,
    overall,
    totalGuests: overall.totalGuests,
    totalExpectedCount: overall.totalExpectedCount,
    totalWishes: wishes.length,
    tiecThanMat: legacyTiecThanMat,
    vuQuy: legacyVuQuy,
    checkedIn: {
      total: checkedInTotal,
      tiecThanMat: 0,
      vuQuy: 0,
    },
  };
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
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Loại bỏ các lời chúc mẫu ảo trước đây (nếu có trong localStorage)
    const cleaned = parsed.filter(
      (w) => !(typeof w.id === "number" && w.id >= 1 && w.id <= 6 && ["Huy", "Chanh", "Chính", "Linh", "Tuấn Dịu", "Hiền Châm"].includes(w.name))
    );
    if (cleaned.length !== parsed.length) {
      saveWishes(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error("Lỗi khi đọc sổ lời chúc:", err);
    return [];
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
    ].map((val) => escapeCSV(val ?? "")).join(",");
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
        existing.push(normalizeGuest({
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
        }));
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
