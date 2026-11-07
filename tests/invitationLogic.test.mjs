import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import {
  resolveInvitationState,
} from "../src/utils/invitationMode.ts";
import { weddingData } from "../src/data/weddingData.ts";
import { getGuestInvitationUrl } from "../src/utils/guestList.ts";

// Giả lập môi trường trình duyệt cho Node.js test
let mockStorage = {};
let mockSession = {};

beforeEach(() => {
  mockStorage = {};
  mockSession = {};

  globalThis.localStorage = {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key) => {
      delete mockStorage[key];
    },
    clear: () => {
      mockStorage = {};
    },
  };

  globalThis.sessionStorage = {
    getItem: (key) => mockSession[key] || null,
    setItem: (key, val) => {
      mockSession[key] = String(val);
    },
    removeItem: (key) => {
      delete mockSession[key];
    },
    clear: () => {
      mockSession = {};
    },
  };
});

afterEach(() => {
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.sessionStorage;
});

function setupWindow(href) {
  const url = new URL(href);
  globalThis.window = {
    location: {
      href: url.href,
      search: url.search,
      hash: url.hash,
      pathname: url.pathname,
      origin: url.origin,
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

// ---------------------------------------------------------------------------
// TEST TRƯỜNG HỢP 1: CHỦ SỞ HỮU MỞ THIỆP
// ---------------------------------------------------------------------------
test("Trường hợp 1: Chủ sở hữu mở thiệp gốc (không có tham số khách mời)", () => {
  setupWindow("https://example.com/");
  const state = resolveInvitationState();

  // Có nút chia sẻ (isOwnerView = true, isGuestView = false)
  assert.equal(state.isOwnerView, true);
  assert.equal(state.isGuestView, false);

  // Xem được cả lịch trình Nhà trai và Nhà gái từ weddingData
  const groomEvents = [
    weddingData.events.tiecThanMat,
    weddingData.events.thanhHon,
  ].filter((ev) => ev.side === "groom");

  const brideEvents = [
    weddingData.events.tiecThanMatNhaGai,
    weddingData.events.vuQuy,
  ].filter((ev) => ev.side === "bride");

  assert.equal(groomEvents.length, 2);
  assert.equal(groomEvents.every((e) => e.side === "groom"), true);

  assert.equal(brideEvents.length, 2);
  assert.equal(brideEvents.every((e) => e.side === "bride"), true);
});

test("Trường hợp 1b: Chủ sở hữu mở thiệp với mode=owner", () => {
  setupWindow("https://example.com/?mode=owner");
  const state = resolveInvitationState();

  assert.equal(state.isOwnerView, true);
  assert.equal(state.isGuestView, false);
});

// ---------------------------------------------------------------------------
// TEST TRƯỜNG HỢP 2: KHÁCH NHÀ TRAI MỞ LINK THIỆP RIÊNG
// ---------------------------------------------------------------------------
test("Trường hợp 2: Khách Nhà trai mở link thiệp riêng (?g=tuan-diu&side=groom)", () => {
  setupWindow("https://example.com/?g=tuan-diu&side=groom");
  const state = resolveInvitationState();

  // 1. Không có nút Chia sẻ
  assert.equal(state.isGuestView, true);
  assert.equal(state.isOwnerView, false);

  // 2. Xác định đúng Nhà trai
  assert.equal(state.guestSide, "groom");
  assert.equal(state.guestCode, "tuan-diu");

  // 3. Chỉ có lịch trình Nhà trai, KHÔNG CÓ sự kiện Nhà gái
  const allEvents = Object.values(weddingData.events);
  const groomOnly = allEvents.filter(
    (ev) => ev.side === "groom" && state.eventIds.includes(ev.id)
  );
  const brideEvents = allEvents.filter(
    (ev) => ev.side === "bride" && state.eventIds.includes(ev.id)
  );

  assert.equal(groomOnly.length > 0, true);
  assert.equal(groomOnly.every((ev) => ev.side === "groom"), true);
  assert.equal(brideEvents.length, 0); // Tuyệt đối 0 sự kiện nhà gái
});

test("Trường hợp 2b: Khách Nhà trai mở link có tên và id (?guest=Bác+Tuấn&side=trai&id=g_trai_1)", () => {
  setupWindow("https://example.com/?guest=Bác+Tuấn&side=trai&id=g_trai_1");
  const state = resolveInvitationState();

  assert.equal(state.isGuestView, true);
  assert.equal(state.isOwnerView, false);
  assert.equal(state.guestSide, "groom");
  assert.equal(state.guestName, "Bác Tuấn");
  assert.equal(state.guestId, "g_trai_1");
});

// ---------------------------------------------------------------------------
// TEST TRƯỜNG HỢP 3: KHÁCH NHÀ GÁI MỞ LINK THIỆP RIÊNG
// ---------------------------------------------------------------------------
test("Trường hợp 3: Khách Nhà gái mở link thiệp riêng (?g=lan-huong&side=bride)", () => {
  setupWindow("https://example.com/?g=lan-huong&side=bride");
  const state = resolveInvitationState();

  // 1. Không có nút Chia sẻ
  assert.equal(state.isGuestView, true);
  assert.equal(state.isOwnerView, false);

  // 2. Xác định đúng Nhà gái
  assert.equal(state.guestSide, "bride");
  assert.equal(state.guestCode, "lan-huong");

  // 3. Chỉ có lịch trình Nhà gái, KHÔNG CÓ sự kiện Nhà trai
  const allEvents = Object.values(weddingData.events);
  const brideOnly = allEvents.filter(
    (ev) => ev.side === "bride" && state.eventIds.includes(ev.id)
  );
  const groomEvents = allEvents.filter(
    (ev) => ev.side === "groom" && state.eventIds.includes(ev.id)
  );

  assert.equal(brideOnly.length > 0, true);
  assert.equal(brideOnly.every((ev) => ev.side === "bride"), true);
  assert.equal(groomEvents.length, 0); // Tuyệt đối 0 sự kiện nhà trai
});

test("Trường hợp 3b: Khách Nhà gái mở link có token (?guestToken=tok_gai_99&side=gai&to=Chị+Thúy)", () => {
  setupWindow("https://example.com/?guestToken=tok_gai_99&side=gai&to=Chị+Thúy");
  const state = resolveInvitationState();

  assert.equal(state.isGuestView, true);
  assert.equal(state.isOwnerView, false);
  assert.equal(state.guestSide, "bride");
  assert.equal(state.guestName, "Chị Thúy");
  assert.equal(state.guestToken, "tok_gai_99");
});

// ---------------------------------------------------------------------------
// TEST TRƯỜNG HỢP 4: KHÁCH TẢI LẠI TRANG (RELOAD / F5)
// ---------------------------------------------------------------------------
test("Trường hợp 4: Khách tải lại trang - không mất trạng thái, không hiện lại nút Chia sẻ", () => {
  // Lần đầu mở link khách nhà gái
  setupWindow("https://example.com/?g=ngoc-anh&side=bride");
  const firstState = resolveInvitationState();
  assert.equal(firstState.isGuestView, true);
  assert.equal(firstState.guestSide, "bride");

  // Giả lập tải lại trang (F5): Vẫn giữ nguyên query params và sessionStorage
  setupWindow("https://example.com/?g=ngoc-anh&side=bride");
  const reloadedState = resolveInvitationState();

  // Không mất trạng thái khách mời
  assert.equal(reloadedState.isGuestView, true);
  assert.equal(reloadedState.isOwnerView, false); // Nút chia sẻ KHÔNG xuất hiện lại
  assert.equal(reloadedState.guestSide, "bride"); // Lịch trình không bị đổi sang nhà trai
  assert.equal(reloadedState.guestCode, "ngoc-anh");
});

test("Trường hợp 4b: Khách tải lại trang khi URL tạm thời bị lược bớt query", () => {
  // Lần đầu mở link khách nhà trai
  setupWindow("https://example.com/?g=hoang-nam&side=groom&guest=Hoàng+Nam");
  resolveInvitationState();

  // Người dùng tải lại trang mà URL bị mất query search params
  setupWindow("https://example.com/");
  const restoredState = resolveInvitationState();

  // SessionStorage khôi phục chính xác trạng thái khách mời
  assert.equal(restoredState.isGuestView, true);
  assert.equal(restoredState.isOwnerView, false);
  assert.equal(restoredState.guestSide, "groom");
  assert.equal(restoredState.guestName, "Hoàng Nam");
});

// ---------------------------------------------------------------------------
// TEST TRƯỜNG HỢP 5: KHÁCH CHUYỂN GIỮA CÁC TAB / PHẦN THIỆP
// ---------------------------------------------------------------------------
test("Trường hợp 5: Khách chuyển giữa các phần Lời ngỏ, Sự kiện, Album, Chúc phúc, Mừng cưới", () => {
  // Khách mở link ban đầu
  setupWindow("https://example.com/?g=minh-duc&side=groom&guest=Minh+Đức");
  const initial = resolveInvitationState();
  assert.equal(initial.isGuestView, true);

  // Cuộn/chuyển sang phần Sự kiện (#ceremony)
  setupWindow("https://example.com/?g=minh-duc&side=groom&guest=Minh+Đức#ceremony");
  const stateCeremony = resolveInvitationState();
  assert.equal(stateCeremony.isGuestView, true);
  assert.equal(stateCeremony.guestSide, "groom");

  // Cuộn/chuyển sang phần Album (#gallery)
  setupWindow("https://example.com/?g=minh-duc&side=groom&guest=Minh+Đức#gallery");
  const stateGallery = resolveInvitationState();
  assert.equal(stateGallery.isGuestView, true);
  assert.equal(stateGallery.guestSide, "groom");

  // Cuộn/chuyển sang phần Chúc phúc (#guestbook)
  setupWindow("https://example.com/?g=minh-duc&side=groom&guest=Minh+Đức#guestbook");
  const stateGuestbook = resolveInvitationState();
  assert.equal(stateGuestbook.isGuestView, true);
  assert.equal(stateGuestbook.guestSide, "groom");

  // Cuộn/chuyển sang phần Mừng cưới (#gift)
  setupWindow("https://example.com/?g=minh-duc&side=groom&guest=Minh+Đức#gift");
  const stateGift = resolveInvitationState();
  assert.equal(stateGift.isGuestView, true);
  assert.equal(stateGift.guestSide, "groom");
  assert.equal(stateGift.guestName, "Minh Đức");
});

// ---------------------------------------------------------------------------
// TEST TẠO LINK MỜI VÀ MÃ HÓA
// ---------------------------------------------------------------------------
test("Tạo link mời khách với đầy đủ side và guestName", () => {
  setupWindow("https://example.com/admin#admin");
  const urlGroom = getGuestInvitationUrl("anh-tuan", "groom", "Anh Tuấn", "g_1");
  const parsedGroom = new URL(urlGroom);
  assert.equal(parsedGroom.searchParams.get("g"), "anh-tuan");
  assert.equal(parsedGroom.searchParams.get("side"), "groom");
  assert.equal(parsedGroom.searchParams.get("guest"), "Anh Tuấn");
  assert.equal(parsedGroom.searchParams.get("id"), "g_1");

  const urlBride = getGuestInvitationUrl("chi-lan", "bride", "Chị Lan", "g_2");
  const parsedBride = new URL(urlBride);
  assert.equal(parsedBride.searchParams.get("g"), "chi-lan");
  assert.equal(parsedBride.searchParams.get("side"), "bride");
  assert.equal(parsedBride.searchParams.get("guest"), "Chị Lan");
});
