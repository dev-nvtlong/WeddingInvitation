import type { GoogleSheetsConfig } from "../types/guestManagement";
import { getGuests, saveGuests, getWishes, saveWishes, saveSheetConfig } from "./guestStorage";

export interface SyncResult {
  success: boolean;
  message: string;
  guestCount?: number;
  wishCount?: number;
}

/**
 * Đồng bộ hai chiều với Google Sheets thông qua Google Apps Script Web App
 */
export async function syncWithGoogleSheets(config: GoogleSheetsConfig): Promise<SyncResult> {
  if (!config.webAppUrl || !config.webAppUrl.startsWith("http")) {
    return {
      success: false,
      message: "Vui lòng nhập URL Google Apps Script Web App hợp lệ.",
    };
  }

  try {
    const localGuests = getGuests();
    const localWishes = getWishes();

    const payload = {
      action: "sync",
      token: config.secretToken,
      guests: localGuests,
      wishes: localWishes,
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(config.webAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // Google Apps Script yêu cầu text/plain để tránh CORS preflight
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Máy chủ Google phản hồi mã lỗi HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error(data.message || "Xác thực token bảo mật thất bại");
    }

    // Nếu Google Sheets gửi danh sách mới về, hòa trộn và cập nhật
    if (Array.isArray(data.guests) && data.guests.length > 0) {
      saveGuests(data.guests);
    }
    if (Array.isArray(data.wishes) && data.wishes.length > 0) {
      saveWishes(data.wishes);
    }

    // Cập nhật thời gian đồng bộ
    config.lastSyncedAt = new Date().toLocaleString("vi-VN");
    saveSheetConfig(config);

    return {
      success: true,
      message: `Đồng bộ thành công! Đã lưu dữ liệu lên Google Sheets lúc ${config.lastSyncedAt}.`,
      guestCount: data.guests?.length || localGuests.length,
      wishCount: data.wishes?.length || localWishes.length,
    };
  } catch (err: any) {
    console.error("Lỗi đồng bộ Google Sheets:", err);
    return {
      success: false,
      message: `Đồng bộ không thành công: ${err.message || "Không thể kết nối tới Google Apps Script"}`,
    };
  }
}

/**
 * Mã nguồn Google Apps Script mẫu để người dùng copy trực tiếp vào Google Spreadsheet
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * GOOGLE APPS SCRIPT CHO THIỆP CƯỚI TRƯỜNG LONG & THANH TỚI
 * Cách cài đặt trong 2 phút:
 * 1. Mở Google Sheet mới -> Tiện ích mở rộng (Extensions) -> Apps Script
 * 2. Xóa code cũ, dán toàn bộ đoạn mã này vào.
 * 3. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 * 4. Chọn loại: "Ứng dụng web" (Web app).
 * 5. Ai có quyền truy cập: "Bất kỳ ai" (Anyone).
 * 6. Copy URL Web App dán vào trang Quản trị!
 */

const SECRET_TOKEN = "LONG_TOI_WEDDING_2026"; // Đặt trùng với token trên trang Admin

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Kiểm tra token bảo mật
    if (data.token !== SECRET_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Sai token bảo mật!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ghi dữ liệu Khách mời
    if (data.guests && Array.isArray(data.guests)) {
      let sheetGuests = ss.getSheetByName("KhachMoi");
      if (!sheetGuests) {
        sheetGuests = ss.insertSheet("KhachMoi");
        sheetGuests.appendRow([
          "Mã Khách", "Họ Tên", "Số ĐT", "Nhóm", "Sự Kiện Mời", 
          "Dự Kiến", "RSVP Thân Mật", "Người Thân Mật", 
          "RSVP Vu Quy", "Người Vu Quy", "Ghi Chú RSVP", 
          "Đã Checkin", "Thời Gian Checkin"
        ]);
        sheetGuests.getRange("A1:M1").setFontWeight("bold").setBackground("#65001D").setFontColor("#FFFFFF");
      }

      // Xóa dữ liệu cũ (từ dòng 2) và ghi mới
      const lastRow = sheetGuests.getLastRow();
      if (lastRow > 1) {
        sheetGuests.getRange(2, 1, lastRow - 1, 13).clearContent();
      }

      const rows = data.guests.map(g => [
        g.code || "",
        g.fullName || "",
        g.phone || "",
        g.group || "",
        g.invitedTo || "both",
        g.expectedCount || 1,
        g.rsvp?.tiecThanMat?.attending || "pending",
        g.rsvp?.tiecThanMat?.attendeeCount || 0,
        g.rsvp?.vuQuy?.attending || "pending",
        g.rsvp?.vuQuy?.attendeeCount || 0,
        g.rsvp?.generalNote || "",
        g.checkin?.isCheckedIn ? "Đã check-in" : "Chưa",
        g.checkin?.checkedInAt || ""
      ]);

      if (rows.length > 0) {
        sheetGuests.getRange(2, 1, rows.length, 13).setValues(rows);
      }
    }

    // 2. Ghi dữ liệu Lời chúc
    if (data.wishes && Array.isArray(data.wishes)) {
      let sheetWishes = ss.getSheetByName("LoiChuc");
      if (!sheetWishes) {
        sheetWishes = ss.insertSheet("LoiChuc");
        sheetWishes.appendRow(["Mã", "Người Gửi", "Quan Hệ", "Nội Dung Lời Chúc", "Thời Gian", "Hiển Thị"]);
        sheetWishes.getRange("A1:F1").setFontWeight("bold").setBackground("#65001D").setFontColor("#FFFFFF");
      }

      const lastRowWishes = sheetWishes.getLastRow();
      if (lastRowWishes > 1) {
        sheetWishes.getRange(2, 1, lastRowWishes - 1, 6).clearContent();
      }

      const wishRows = data.wishes.map(w => [
        w.id,
        w.name,
        w.relationship || "Bạn bè",
        w.message,
        w.createdAt || "",
        w.isApproved ? "Hiển thị" : "Ẩn"
      ]);

      if (wishRows.length > 0) {
        sheetWishes.getRange(2, 1, wishRows.length, 6).setValues(wishRows);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đồng bộ thành công!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Wedding Invitation Google Sheets Sync Service"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
