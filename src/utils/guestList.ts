import type { Guest, RSVPStatus } from "../types/guestManagement";

export function normalizeGuestSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d").toLowerCase().trim();
}

export function getGuestRSVPStatus(guest: Guest): RSVPStatus {
  const responses = [];
  if (guest.invitedTo !== "vu_quy") responses.push(guest.rsvp?.tiecThanMat);
  if (guest.invitedTo === "thiep_chu_re" || guest.invitedTo === "both") {
    responses.push(guest.rsvp?.thanhHon);
  }
  if (["vu_quy", "thiep_co_dau", "both"].includes(guest.invitedTo)) {
    responses.push(guest.rsvp?.vuQuy);
  }
  if (responses.some((response) => response?.attending === "attending")) return "attending";
  if (responses.every((response) => response?.attending === "declined")) return "declined";
  return "pending";
}

export function getGuestInvitationUrl(code: string): string {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/\/admin\/?$/, "/");
  url.search = "";
  url.hash = "";
  url.searchParams.set("g", code);
  return url.toString();
}
