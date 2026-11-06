import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeGuestSearch, getGuestRSVPStatus, getGuestInvitationUrl } from "../src/utils/guestList.ts";
import { parseCSV, escapeCSV } from "../src/utils/csv.ts";

test("search matches Vietnamese names without accents", () => {
  assert.equal(normalizeGuestSearch("  Đặng Thùy  "), "dang thuy");
});

test("RSVP ignores events the guest was not invited to", () => {
  const guest = { invitedTo: "vu_quy", rsvp: {
    tiecThanMat: { attending: "attending" }, vuQuy: { attending: "declined" },
  }};
  assert.equal(getGuestRSVPStatus(guest), "declined");
});

test("groom ceremony confirmation counts toward attending", () => {
  assert.equal(getGuestRSVPStatus({ invitedTo: "thiep_chu_re", rsvp: {
    thanhHon: { attending: "attending" },
  }}), "attending");
});

test("unanswered invited events remain pending", () => {
  assert.equal(getGuestRSVPStatus({ invitedTo: "both", rsvp: {
    tiecThanMat: { attending: "declined" }, vuQuy: { attending: "declined" },
  }}), "pending");
});

test("invitation URL leaves admin and encodes guest codes", () => {
  globalThis.window = { location: { href: "https://example.com/wedding/admin?old=1#admin" } };
  const result = new URL(getGuestInvitationUrl("anh & chị"));
  assert.equal(result.pathname, "/wedding/");
  assert.equal(result.hash, "");
  assert.equal(result.searchParams.get("g"), "anh & chị");
  assert.equal(result.searchParams.has("old"), false);
  delete globalThis.window;
});

test("CSV keeps empty phone columns, quoted commas, quotes and newlines", () => {
  const values = ["an", 'Anh "An", Chị Bình', "", "Bạn bè", "both", 2, "Dòng 1\nDòng 2"];
  const csv = "\uFEFFcode,name,phone,group,event,count,note\r\n" + values.map(escapeCSV).join(",");
  assert.deepEqual(parseCSV(csv)[1], values.map(String));
  assert.deepEqual(parseCSV("a,,b\r\n"), [["a", "", "b"]]);
});

test("invalid CSV does not silently import a partial row", () => {
  assert.throws(() => parseCSV('code,name\nan,"Anh An'), /chưa đóng/);
});
