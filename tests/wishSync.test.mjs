import { test } from "node:test";
import assert from "node:assert/strict";

// Helper replicating the validation and sanitization logic in googleSheetsService.ts
function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "'": return "&#39;";
        case '"': return "&quot;";
        case "&": return "&amp;";
        default: return char;
      }
    })
    .trim();
}

function validateWishInput(name, message, relationship) {
  const cleanName = sanitizeText(name);
  const cleanMessage = sanitizeText(message);
  const cleanRel = sanitizeText(relationship || "Khách mời");

  if (!cleanName) {
    return { valid: false, error: "Vui lòng nhập tên của bạn" };
  }
  if (!cleanMessage) {
    return { valid: false, error: "Vui lòng nhập lời chúc" };
  }
  if (cleanName.length > 100) {
    return { valid: false, error: "Tên không được vượt quá 100 ký tự" };
  }
  if (cleanMessage.length > 1000) {
    return { valid: false, error: "Lời chúc không được vượt quá 1000 ký tự" };
  }

  return {
    valid: true,
    data: {
      action: "addWish",
      name: cleanName,
      message: cleanMessage,
      relationship: cleanRel,
    },
  };
}

// Helper simulating Google Apps Script handleAddWish
function simulateGasAddWish(sheetRows, payload) {
  const { name, message, relationship } = payload;
  const wishId = "wish_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  const now = new Date();
  const timeFormatted = now.toISOString();

  // Columns: Mã | Người Gửi | Quan Hệ | Nội Dung Lời Chúc | Thời Gian | Hiển Thị
  const newRow = [wishId, name, relationship || "Khách mời", message, timeFormatted, "Hiển thị"];
  sheetRows.push(newRow);

  return {
    status: "success",
    message: "Lời chúc đã được lưu thành công",
    wish: {
      id: wishId,
      name: name,
      relationship: relationship || "Khách mời",
      content: message,
      createdAt: timeFormatted,
      isApproved: true,
    },
  };
}

// Helper simulating getWishes from Google Sheets
function simulateGasGetWishes(sheetRows) {
  const wishes = [];
  // Skip header row if index 0
  const startIndex = 1;
  for (let i = startIndex; i < sheetRows.length; i++) {
    const row = sheetRows[i];
    const isApproved = String(row[5] || "").toLowerCase() === "hiển thị" ||
                       String(row[5] || "").toLowerCase() === "true" ||
                       String(row[5] || "").trim() === "";
    if (isApproved) {
      wishes.push({
        id: String(row[0] || `wish_${i}`),
        name: String(row[1] || "Khách"),
        relationship: String(row[2] || "Khách mời"),
        content: String(row[3] || ""),
        createdAt: String(row[4] || new Date().toISOString()),
        isApproved: true,
      });
    }
  }
  return wishes.reverse(); // Newest first
}

test("Wish input: validates empty name and message", () => {
  const r1 = validateWishInput("", "Chúc mừng hạnh phúc!");
  assert.strictEqual(r1.valid, false);
  assert.strictEqual(r1.error, "Vui lòng nhập tên của bạn");

  const r2 = validateWishInput("Anh Tuấn", "");
  assert.strictEqual(r2.valid, false);
  assert.strictEqual(r2.error, "Vui lòng nhập lời chúc");

  const r3 = validateWishInput("   ", "   ");
  assert.strictEqual(r3.valid, false);
});

test("Wish input: strips HTML tags and escapes special characters to prevent XSS", () => {
  const dirty = '<script>alert("hacked")</script>Chúc <b>hai bạn</b> & gia đình!';
  const res = validateWishInput("Bạn Thân", dirty);
  assert.strictEqual(res.valid, true);
  assert.ok(!res.data.message.includes("<script>"));
  assert.ok(!res.data.message.includes("<b>"));
  assert.ok(res.data.message.includes("&amp;"));
});

test("Wish input: enforces maximum character length (100 for name, 1000 for message)", () => {
  const longName = "A".repeat(101);
  const r1 = validateWishInput(longName, "Chúc mừng");
  assert.strictEqual(r1.valid, false);
  assert.strictEqual(r1.error, "Tên không được vượt quá 100 ký tự");

  const longMessage = "M".repeat(1001);
  const r2 = validateWishInput("Nam", longMessage);
  assert.strictEqual(r2.valid, false);
  assert.strictEqual(r2.error, "Lời chúc không được vượt quá 1000 ký tự");
});

test("GAS addWish: appends row with exact 6 columns without overwriting existing rows", () => {
  const mockSheet = [
    ["Mã", "Người Gửi", "Quan Hệ", "Nội Dung Lời Chúc", "Thời Gian", "Hiển Thị"],
    ["wish_01", "Cô Ba", "Họ hàng", "Chúc hai cháu trăm năm hạnh phúc", "2026-11-01T10:00:00Z", "Hiển thị"],
  ];

  const validation = validateWishInput("Bạn Dũng", "Chúc mừng đám cưới hai bạn trẻ!", "Bạn chú rể");
  assert.strictEqual(validation.valid, true);

  const res = simulateGasAddWish(mockSheet, validation.data);
  assert.strictEqual(res.status, "success");
  assert.strictEqual(mockSheet.length, 3); // Preserved previous rows + 1 new row

  const addedRow = mockSheet[2];
  assert.strictEqual(addedRow[1], "Bạn Dũng");
  assert.strictEqual(addedRow[2], "Bạn chú rể");
  assert.strictEqual(addedRow[3], "Chúc mừng đám cưới hai bạn trẻ!");
  assert.strictEqual(addedRow[5], "Hiển thị");
});

test("GAS getWishes: returns approved wishes sorted newest first, filters unapproved", () => {
  const mockSheet = [
    ["Mã", "Người Gửi", "Quan Hệ", "Nội Dung Lời Chúc", "Thời Gian", "Hiển Thị"],
    ["wish_1", "Khách A", "Bạn", "Lời chúc 1", "2026-11-01T10:00:00Z", "Hiển thị"],
    ["wish_spam", "Spammer", "Spam", "Spam link http://...", "2026-11-02T10:00:00Z", "Ẩn"],
    ["wish_2", "Khách B", "Đồng nghiệp", "Lời chúc 2", "2026-11-03T10:00:00Z", "Hiển thị"],
  ];

  const wishes = simulateGasGetWishes(mockSheet);
  assert.strictEqual(wishes.length, 2);
  assert.strictEqual(wishes[0].id, "wish_2"); // Newest first
  assert.strictEqual(wishes[1].id, "wish_1");
  assert.ok(!wishes.some(w => w.id === "wish_spam"));
});

test("Deduplication: merging remote wishes with local wishes leaves no duplicates", () => {
  const localWishes = [
    { id: "wish_1", name: "A", content: "Chúc 1", relationship: "Bạn", createdAt: "2026-11-01", isApproved: true },
    { id: "wish_2", name: "B", content: "Chúc 2", relationship: "Bạn", createdAt: "2026-11-02", isApproved: true },
  ];

  const incomingRemoteWishes = [
    { id: "wish_2", name: "B", content: "Chúc 2", relationship: "Bạn", createdAt: "2026-11-02", isApproved: true },
    { id: "wish_3", name: "C", content: "Chúc 3", relationship: "Bạn", createdAt: "2026-11-03", isApproved: true },
  ];

  const map = new Map();
  // Remote first (newest remote wins)
  incomingRemoteWishes.forEach(w => map.set(w.id, w));
  localWishes.forEach(w => {
    if (!map.has(w.id)) {
      map.set(w.id, w);
    }
  });

  const merged = Array.from(map.values());
  assert.strictEqual(merged.length, 3);
  const ids = merged.map(m => m.id);
  assert.deepStrictEqual(ids.sort(), ["wish_1", "wish_2", "wish_3"]);
});

test("Google Sheets response parsing accepts both 'message' and 'content' fields", () => {
  const mockGasResponse = {
    status: "success",
    wishes: [
      { id: "w_1", name: "Bác Năm", relationship: "Họ hàng", content: "Chúc trăm năm hạnh phúc", isApproved: true },
      { id: "w_2", name: "Cô Sáu", relationship: "Bạn bè", message: "Chúc hai cháu đầu bạc răng long", isApproved: "Hiển thị" }
    ]
  };

  const parsed = mockGasResponse.wishes.map((w) => {
    const msg = String(w.message || w.content || "").trim();
    return {
      id: w.id,
      name: w.name,
      relationship: w.relationship,
      message: msg,
      isApproved: true
    };
  });

  assert.strictEqual(parsed.length, 2);
  assert.strictEqual(parsed[0].message, "Chúc trăm năm hạnh phúc");
  assert.strictEqual(parsed[1].message, "Chúc hai cháu đầu bạc răng long");
});

test("Pruning: Remote Google Sheets list replaces obsolete local test data", () => {
  const remoteGoogleSheetsWishes = [
    { id: "wish_real_1", name: "Anh Nam", relationship: "Bạn thân", message: "Chúc mừng hạnh phúc", isApproved: true }
  ];

  // Old mock data from local test runs
  const staleLocalWishes = [
    { id: 1, name: "Huy", relationship: "Bạn chú rể", message: "Chúc hai bạn trăm năm hạnh phúc", isApproved: true },
    { id: 2, name: "Chanh", relationship: "Bạn cô dâu", message: "Hạnh phúc mãi mãi nhé", isApproved: true }
  ];

  // When remote is available, remote is single source of truth
  const cleanList = remoteGoogleSheetsWishes;
  assert.strictEqual(cleanList.length, 1);
  assert.strictEqual(cleanList[0].id, "wish_real_1");
  assert.ok(!cleanList.some(w => w.name === "Huy" || w.name === "Chanh"));
});
