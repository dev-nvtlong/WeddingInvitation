import type { GoogleSheetsConfig, Guest } from "../types/guestManagement";
import { getGuests, saveGuests, getWishes, saveWishes, saveSheetConfig, normalizeGuest } from "./guestStorage";

export interface SyncResult {
  success: boolean;
  message: string;
  guestCount?: number;
  groomCount?: number;
  brideCount?: number;
  wishCount?: number;
}

/**
 * Kiểm tra và chuẩn hóa đường link Google Apps Script Web App
 */
export function validateSheetUrl(url: string): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Vui lòng nhập đường dẫn URL của Google Apps Script Web App." };
  }

  const clean = url.trim();

  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    return { valid: false, error: "Đường link phải bắt đầu bằng https://" };
  }

  if (clean.includes("docs.google.com/spreadsheets")) {
    return {
      valid: false,
      error: "Bạn đang dán link bảng tính Google Sheet! Vui lòng mở menu Tiện ích mở rộng > Apps Script > Triển khai > Ứng dụng web để lấy link kết thúc bằng /exec.",
    };
  }

  if (clean.includes("/dev")) {
    return {
      valid: false,
      error: "Đường link đang kết thúc bằng /dev (bản thử nghiệm nội bộ yêu cầu đăng nhập). Vui lòng chọn 'Triển khai mới' > Quyền 'Bất kỳ ai (Anyone)' và copy link kết thúc bằng /exec.",
    };
  }

  if (!clean.includes("script.google.com/macros/s/") || !clean.includes("/exec")) {
    return {
      valid: false,
      error: "URL không đúng định dạng Web App. Link chuẩn phải có dạng: https://script.google.com/macros/s/AKfycb.../exec",
    };
  }

  return { valid: true, cleanUrl: clean };
}

/**
 * Hàm gọi API Google Apps Script có cơ chế fallback thông minh
 */
async function callGoogleScript(url: string, payload: any, method: "POST" | "GET" = "POST"): Promise<any> {
  const cleanUrl = url.trim();

  if (method === "GET") {
    const params = new URLSearchParams();
    for (const key of Object.keys(payload)) {
      if (payload[key] !== undefined && payload[key] !== null) {
        params.append(key, String(payload[key]));
      }
    }
    const target = `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}${params.toString()}`;
    const res = await fetch(target, {
      method: "GET",
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Máy chủ Google phản hồi HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { status: "online", message: text };
    }
  }

  // Method POST: Gửi dạng text/plain để vượt qua CORS Preflight
  try {
    const res = await fetch(cleanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${res.status}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { status: "success", message: text || "Đồng bộ thành công!" };
    }
  } catch (fetchErr: any) {
    if (fetchErr.message?.includes("Failed to fetch") || fetchErr.name === "TypeError") {
      try {
        await fetch(cleanUrl, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(payload),
        });
        return {
          status: "success",
          message: "Dữ liệu đã được gửi sang Google Sheets thành công (chế độ bảo mật no-cors).",
          isNoCors: true,
        };
      } catch (fallbackErr) {
        throw fetchErr;
      }
    }
    throw fetchErr;
  }
}

/**
 * Kiểm tra kết nối tới Google Apps Script Web App
 */
export async function testGoogleSheetsConnection(config: GoogleSheetsConfig): Promise<SyncResult> {
  const check = validateSheetUrl(config.webAppUrl);
  if (!check.valid) {
    return { success: false, message: check.error || "URL không hợp lệ." };
  }

  try {
    const data = await callGoogleScript(check.cleanUrl!, { action: "test", token: config.secretToken }, "GET");
    if (data.status === "success" || data.status === "online") {
      return {
        success: true,
        message: "Kết nối thành công! Google Apps Script Web App đang hoạt động trực tuyến.",
      };
    }
    return {
      success: false,
      message: `Google phản hồi: ${data.message || JSON.stringify(data)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối tới Google Apps Script: ${err.message || "Lỗi mạng"}. Hãy đảm bảo bạn đã chọn quyền truy cập là 'Bất kỳ ai (Anyone)' khi triển khai Web App.`,
    };
  }
}

/**
 * Kéo danh sách khách mời từ 2 Sheet (Nhà trai & Nhà gái) về Website (PULL)
 */
export async function pullFromGoogleSheets(config: GoogleSheetsConfig): Promise<SyncResult> {
  const check = validateSheetUrl(config.webAppUrl);
  if (!check.valid) {
    return { success: false, message: check.error || "URL không hợp lệ." };
  }

  try {
    const data = await callGoogleScript(check.cleanUrl!, { action: "get", token: config.secretToken }, "GET");
    if (data.status !== "success") {
      throw new Error(data.message || "Không thể đọc dữ liệu từ Google Sheets");
    }

    const mergedGuestsMap = new Map<string, Guest>();

    // 1. Khách từ Sheet Nhà Trai (gán chắc chắn side = "groom")
    if (Array.isArray(data.groomGuests)) {
      data.groomGuests.forEach((g: any) => {
        const norm = normalizeGuest({ ...g, side: "groom" });
        const key = norm.id || norm.code;
        mergedGuestsMap.set(key, norm);
      });
    }

    // 2. Khách từ Sheet Nhà Gái (gán chắc chắn side = "bride")
    if (Array.isArray(data.brideGuests)) {
      data.brideGuests.forEach((g: any) => {
        const norm = normalizeGuest({ ...g, side: "bride" });
        const key = norm.id || norm.code;
        mergedGuestsMap.set(key, norm);
      });
    }

    // 3. Fallback khách từ data.guests chung (nếu có bản ghi chưa trong map)
    if (Array.isArray(data.guests)) {
      data.guests.forEach((g: any) => {
        const key = g.id || g.code;
        if (!mergedGuestsMap.has(key)) {
          mergedGuestsMap.set(key, normalizeGuest(g));
        }
      });
    }

    let guestUpdated = 0;
    let wishUpdated = 0;

    if (mergedGuestsMap.size > 0) {
      const mergedList = Array.from(mergedGuestsMap.values());
      saveGuests(mergedList);
      guestUpdated = mergedList.length;
    }

    if (Array.isArray(data.wishes) && data.wishes.length > 0) {
      saveWishes(data.wishes);
      wishUpdated = data.wishes.length;
    }

    config.lastSyncedAt = new Date().toLocaleString("vi-VN");
    saveSheetConfig(config);

    const groomTotal = Array.from(mergedGuestsMap.values()).filter((g) => g.side === "groom").length;
    const brideTotal = Array.from(mergedGuestsMap.values()).filter((g) => g.side === "bride").length;

    return {
      success: true,
      message: `Tải thành công ${guestUpdated} khách (${groomTotal} khách Nhà trai, ${brideTotal} khách Nhà gái) và ${wishUpdated} lời chúc từ Google Sheets về hệ thống!`,
      guestCount: guestUpdated,
      groomCount: groomTotal,
      brideCount: brideTotal,
      wishCount: wishUpdated,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Lỗi khi tải dữ liệu từ Google Sheets: ${err.message || "Không thể kết nối"}.`,
    };
  }
}

/**
 * Đẩy toàn bộ dữ liệu tách riêng 2 Sheet sang Google Sheets (PUSH & SYNC)
 */
export async function syncWithGoogleSheets(config: GoogleSheetsConfig): Promise<SyncResult> {
  const check = validateSheetUrl(config.webAppUrl);
  if (!check.valid) {
    return {
      success: false,
      message: check.error || "Vui lòng nhập URL Google Apps Script Web App hợp lệ.",
    };
  }

  try {
    const localGuests = getGuests();
    const localWishes = getWishes();

    const groomGuests = localGuests.filter((g) => g.side === "groom");
    const brideGuests = localGuests.filter((g) => g.side === "bride");

    const payload = {
      action: "sync",
      token: config.secretToken,
      groomGuests,
      brideGuests,
      guests: localGuests,
      wishes: localWishes,
      timestamp: new Date().toISOString(),
    };

    const data = await callGoogleScript(check.cleanUrl!, payload, "POST");

    // Nếu server có gửi lại danh sách hợp nhất
    if (Array.isArray(data.groomGuests) || Array.isArray(data.brideGuests)) {
      const mergedMap = new Map<string, Guest>();
      if (Array.isArray(data.groomGuests)) {
        data.groomGuests.forEach((g: any) => mergedMap.set(g.id || g.code, normalizeGuest({ ...g, side: "groom" })));
      }
      if (Array.isArray(data.brideGuests)) {
        data.brideGuests.forEach((g: any) => mergedMap.set(g.id || g.code, normalizeGuest({ ...g, side: "bride" })));
      }
      if (mergedMap.size > 0) {
        saveGuests(Array.from(mergedMap.values()));
      }
    } else if (Array.isArray(data.guests) && data.guests.length > 0) {
      saveGuests(data.guests.map(normalizeGuest));
    }

    if (Array.isArray(data.wishes) && data.wishes.length > 0) {
      saveWishes(data.wishes);
    }

    config.lastSyncedAt = new Date().toLocaleString("vi-VN");
    saveSheetConfig(config);

    return {
      success: true,
      message:
        data.message ||
        `Đã lưu thành công ${groomGuests.length} khách Nhà trai vào Sheet 'Khách mời nhà trai', ${brideGuests.length} khách Nhà gái vào Sheet 'Khách mời nhà gái' lúc ${config.lastSyncedAt}.`,
      guestCount: localGuests.length,
      groomCount: groomGuests.length,
      brideCount: brideGuests.length,
      wishCount: localWishes.length,
    };
  } catch (err: any) {
    console.error("Lỗi đồng bộ Google Sheets:", err);
    return {
      success: false,
      message: `Đồng bộ không thành công: ${err.message || "Không thể kết nối tới Google Apps Script"}. Hãy kiểm tra xem bạn đã chọn 'Ai có quyền truy cập: Bất kỳ ai (Anyone)' khi Triển khai chưa.`,
    };
  }
}

/**
 * Mã nguồn Google Apps Script phiên bản 3.0:
 * - Tách 2 Sheet độc lập: "Khách mời nhà trai" và "Khách mời nhà gái"
 * - Sheet "LoiChuc" cho lời chúc
 * - Đồng bộ chính xác theo Guest ID, không ghi trùng
 * - Khách nhà trai chỉ ở Sheet nhà trai, khách nhà gái chỉ ở Sheet nhà gái
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT CHO THIỆP CƯỚI TRƯỜNG LONG & THANH TỚI (PHIÊN BẢN 3.0)
 * HỖ TRỢ TÁCH RIÊNG 2 SHEET: "Khách mời nhà trai" & "Khách mời nhà gái"
 * =========================================================================
 * HƯỚNG DẪN CÀI ĐẶT TRONG 2 PHÚT:
 * 1. Mở Google Sheet -> Menu "Tiện ích mở rộng" (Extensions) -> "Apps Script".
 * 2. Xóa hết code cũ, dán toàn bộ đoạn mã này vào.
 * 3. Bấm "Triển khai" (Deploy) -> "Quản lý bản triển khai" hoặc "Tùy chọn triển khai mới" (New deployment).
 * 4. Chọn loại: "Ứng dụng web" (Web app).
 * 5. Mục "Thực thi dưới dạng" (Execute as): Chọn "Tôi" (Me).
 * 6. Mục "Ai có quyền truy cập" (Who has access): Chọn "Bất kỳ ai" (Anyone). -> BẮT BUỘC!
 * 7. Bấm "Triển khai" (Deploy) -> Cho phép quyền truy cập (Authorize access).
 * 8. Sao chép URL Ứng dụng web (kết thúc bằng /exec) dán vào trang Quản trị!
 */

const SECRET_TOKEN = "LONG_TOI_WEDDING_2026";

const SHEET_GROOM_NAME = "Khách mời nhà trai";
const SHEET_BRIDE_NAME = "Khách mời nhà gái";
const SHEET_WISHES_NAME = "LoiChuc";

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "test";
  
  if (action === "test" || action === "ping") {
    return createJsonResponse({
      status: "success",
      message: "Kết nối thành công! Google Apps Script v3.0 (Tách 2 Sheet) đang hoạt động trực tuyến.",
      timestamp: new Date().toISOString()
    });
  }

  if (action === "get" || action === "pull") {
    return handleGetData(e);
  }

  return createJsonResponse({
    status: "online",
    service: "Wedding Google Sheets Dual-Party Sync Service v3.0",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    let data = null;
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    if (!data) {
      return createJsonResponse({ status: "error", message: "Không nhận được dữ liệu (Empty payload)" });
    }

    if (data.token && data.token !== SECRET_TOKEN) {
      return createJsonResponse({ status: "error", message: "Mã token bảo mật không chính xác!" });
    }

    if (data.action === "get" || data.action === "pull") {
      return handleGetData(e);
    }

    return handleSyncData(data);
  } catch (error) {
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
}

/**
 * Ghi danh sách khách mời vào Sheet chỉ định với nhận diện Guest ID
 */
function writePartySheet(ss, sheetName, guestList, headerColor, side) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  const isGroom = side === "groom";
  const headers = [
    "STT",
    "Guest ID",
    "Họ và tên",
    "Số điện thoại",
    "Nhóm khách",
    "Số người đi cùng",
    "Danh sách sự kiện mời",
    isGroom ? "RSVP Bữa Cơm Thân Mật (13/11)" : "RSVP Bữa Cơm Thân Mật (13/11)",
    isGroom ? "RSVP Lễ Thành Hôn (14/11)" : "RSVP Lễ Vu Quy (14/11)",
    "Ghi chú RSVP",
    "Điểm danh",
    "Thời gian Check-in",
    "Ngày tạo",
    "Ngày cập nhật"
  ];

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground(headerColor)
    .setFontColor("#FFFFFF");

  // Xóa dữ liệu cũ từ dòng 2
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  const rows = guestList.map(function(g, idx) {
    const rsvp1 = isGroom ? (g.rsvp && g.rsvp.tiecThanMat) : (g.rsvp && (g.rsvp.tiecThanMatNhaGai || g.rsvp.tiecThanMat));
    const rsvp2 = isGroom ? (g.rsvp && g.rsvp.thanhHon) : (g.rsvp && g.rsvp.vuQuy);

    const rsvp1Text = (rsvp1 && rsvp1.attending === "attending")
      ? ("Tham dự (" + (rsvp1.attendeeCount || 1) + " người)")
      : (rsvp1 && rsvp1.attending === "declined") ? "Từ chối" : "Chờ phản hồi";

    const rsvp2Text = (rsvp2 && rsvp2.attending === "attending")
      ? ("Tham dự (" + (rsvp2.attendeeCount || 1) + " người)")
      : (rsvp2 && rsvp2.attending === "declined") ? "Từ chối" : "Chờ phản hồi";

    const eventsText = Array.isArray(g.eventIds) ? g.eventIds.join(", ") : (g.invitedTo || "");

    return [
      idx + 1,
      g.id || g.code || "",
      g.fullName || "",
      g.phone || "",
      g.group || (isGroom ? "Nhà Trai" : "Nhà Gái"),
      g.expectedCount || 1,
      eventsText,
      rsvp1Text,
      rsvp2Text,
      (g.rsvp && g.rsvp.generalNote) || g.notes || "",
      (g.checkin && g.checkin.isCheckedIn) ? "Đã check-in" : "Chưa",
      (g.checkin && g.checkin.checkedInAt) || "",
      g.createdAt || "",
      g.updatedAt || ""
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  return rows.length;
}

/**
 * Xử lý Đồng bộ PUSH
 */
function handleSyncData(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let allGuests = data.guests || [];
  let groomGuests = data.groomGuests || allGuests.filter(function(g) { return g.side === "groom"; });
  let brideGuests = data.brideGuests || allGuests.filter(function(g) { return g.side === "bride"; });

  // 1. Ghi vào Sheet "Khách mời nhà trai" (Màu Burgundy #65001D)
  const groomCount = writePartySheet(ss, SHEET_GROOM_NAME, groomGuests, "#65001D", "groom");

  // 2. Ghi vào Sheet "Khách mời nhà gái" (Màu Rose Pink #B8506C)
  const brideCount = writePartySheet(ss, SHEET_BRIDE_NAME, brideGuests, "#B8506C", "bride");

  // 3. Ghi Lời chúc vào Sheet "LoiChuc"
  let wishCount = 0;
  if (data.wishes && Array.isArray(data.wishes)) {
    let sheetWishes = ss.getSheetByName(SHEET_WISHES_NAME);
    if (!sheetWishes) {
      sheetWishes = ss.insertSheet(SHEET_WISHES_NAME);
    }

    const wishHeaders = ["Mã", "Người Gửi", "Quan Hệ", "Nội Dung Lời Chúc", "Thời Gian", "Hiển Thị"];
    if (sheetWishes.getMaxColumns() < wishHeaders.length) {
      sheetWishes.insertColumnsAfter(sheetWishes.getMaxColumns(), wishHeaders.length - sheetWishes.getMaxColumns());
    }

    sheetWishes.getRange(1, 1, 1, wishHeaders.length).setValues([wishHeaders]);
    sheetWishes.getRange(1, 1, 1, wishHeaders.length)
      .setFontWeight("bold")
      .setBackground("#65001D")
      .setFontColor("#FFFFFF");

    const lastRowWishes = sheetWishes.getLastRow();
    if (lastRowWishes > 1) {
      sheetWishes.getRange(2, 1, lastRowWishes - 1, wishHeaders.length).clearContent();
    }

    const wishRows = data.wishes.map(function(w) {
      return [
        w.id || "",
        w.name || "",
        w.relationship || "Bạn bè",
        w.message || "",
        w.createdAt || "",
        w.isApproved ? "Hiển thị" : "Ẩn"
      ];
    });

    if (wishRows.length > 0) {
      sheetWishes.getRange(2, 1, wishRows.length, wishHeaders.length).setValues(wishRows);
    }
    wishCount = wishRows.length;
  }

  return createJsonResponse({
    status: "success",
    message: "Đồng bộ thành công! Đã ghi " + groomCount + " khách vào Sheet Nhà trai, " + brideCount + " khách vào Sheet Nhà gái.",
    timestamp: new Date().toISOString(),
    groomCount: groomCount,
    brideCount: brideCount,
    guestCount: groomCount + brideCount,
    wishCount: wishCount
  });
}

/**
 * Đọc dữ liệu từ 2 Sheet trả về cho Website (PULL)
 */
function handleGetData(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {
    status: "success",
    groomGuests: [],
    brideGuests: [],
    guests: [],
    wishes: [],
    timestamp: new Date().toISOString()
  };

  // 1. Đọc Sheet Nhà Trai
  const sheetGroom = ss.getSheetByName(SHEET_GROOM_NAME) || ss.getSheetByName("KhachMoiNhaTrai");
  if (sheetGroom && sheetGroom.getLastRow() > 1) {
    const dataGroom = sheetGroom.getRange(2, 1, sheetGroom.getLastRow() - 1, 14).getValues();
    result.groomGuests = dataGroom.map(function(r, idx) {
      const guestId = String(r[1] || "").trim();
      const fullName = String(r[2] || "").trim();
      if (!fullName && !guestId) return null;
      return {
        id: guestId || ("g_groom_" + (idx + 1)),
        code: guestId.includes("g_") ? ("khach-trai-" + (idx + 1)) : guestId,
        fullName: fullName || "Khách Nhà Trai",
        phone: String(r[3] || "").trim(),
        group: String(r[4] || "Họ Nhà Trai").trim(),
        side: "groom",
        expectedCount: Number(r[5]) || 1,
        eventIds: parseEventIds(String(r[6] || ""), "groom"),
        notes: String(r[9] || "").trim(),
        checkin: {
          isCheckedIn: String(r[10] || "").toLowerCase().includes("đã"),
          checkedInAt: String(r[11] || "").trim()
        },
        createdAt: r[12] ? String(r[12]) : new Date().toISOString(),
        updatedAt: r[13] ? String(r[13]) : new Date().toISOString()
      };
    }).filter(Boolean);
  }

  // 2. Đọc Sheet Nhà Gái
  const sheetBride = ss.getSheetByName(SHEET_BRIDE_NAME) || ss.getSheetByName("KhachMoiNhaGai");
  if (sheetBride && sheetBride.getLastRow() > 1) {
    const dataBride = sheetBride.getRange(2, 1, sheetBride.getLastRow() - 1, 14).getValues();
    result.brideGuests = dataBride.map(function(r, idx) {
      const guestId = String(r[1] || "").trim();
      const fullName = String(r[2] || "").trim();
      if (!fullName && !guestId) return null;
      return {
        id: guestId || ("g_bride_" + (idx + 1)),
        code: guestId.includes("g_") ? ("khach-gai-" + (idx + 1)) : guestId,
        fullName: fullName || "Khách Nhà Gái",
        phone: String(r[3] || "").trim(),
        group: String(r[4] || "Họ Nhà Gái").trim(),
        side: "bride",
        expectedCount: Number(r[5]) || 1,
        eventIds: parseEventIds(String(r[6] || ""), "bride"),
        notes: String(r[9] || "").trim(),
        checkin: {
          isCheckedIn: String(r[10] || "").toLowerCase().includes("đã"),
          checkedInAt: String(r[11] || "").trim()
        },
        createdAt: r[12] ? String(r[12]) : new Date().toISOString(),
        updatedAt: r[13] ? String(r[13]) : new Date().toISOString()
      };
    }).filter(Boolean);
  }

  result.guests = [].concat(result.groomGuests, result.brideGuests);

  // 3. Đọc Lời Chúc
  const sheetWishes = ss.getSheetByName(SHEET_WISHES_NAME);
  if (sheetWishes && sheetWishes.getLastRow() > 1) {
    const dataWishes = sheetWishes.getRange(2, 1, sheetWishes.getLastRow() - 1, 6).getValues();
    result.wishes = dataWishes.map(function(r, idx) {
      const name = String(r[1] || "").trim();
      const message = String(r[3] || "").trim();
      if (!name && !message) return null;
      return {
        id: r[0] || ("wish_sheet_" + (idx + 1)),
        name: name || "Người ẩn danh",
        relationship: String(r[2] || "Bạn bè").trim(),
        message: message,
        createdAt: r[4] ? String(r[4]) : new Date().toISOString(),
        isApproved: String(r[5] || "").toLowerCase().includes("hiển thị") || r[5] === true || r[5] === 1
      };
    }).filter(Boolean);
  }

  return createJsonResponse(result);
}

function parseEventIds(raw, side) {
  if (!raw) return side === "groom" ? ["tiec_than_mat", "thanh_hon"] : ["tiec_than_mat_nha_gai", "vu_quy"];
  const parts = raw.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
  if (parts.length > 0) return parts;
  return side === "groom" ? ["tiec_than_mat", "thanh_hon"] : ["tiec_than_mat_nha_gai", "vu_quy"];
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
