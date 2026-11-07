import { useState, useEffect } from "react";
import type { Guest } from "../types/guestManagement.ts";
import { getGuestByCode, getGuests, saveGuests, normalizeGuest } from "../services/guestStorage.ts";

export interface InvitationViewState {
  isGuestView: boolean;
  isOwnerView: boolean;
  guestSide: "groom" | "bride";
  guestId?: string;
  guestCode?: string;
  guestToken?: string;
  guestName: string;
  eventIds: string[];
  currentGuest?: Guest;
}

const GUEST_SESSION_KEY = "wedding_current_guest_session_v1";

/**
 * Chuẩn hóa tham số 'side' từ URL thành 'groom' hoặc 'bride'
 */
export function normalizeSideParam(raw?: string | null): "groom" | "bride" | undefined {
  if (!raw) return undefined;
  const clean = raw.trim().toLowerCase();
  if (["bride", "gai", "nha-gai", "nhagai", "co-dau", "codau", "nha_gai"].includes(clean)) {
    return "bride";
  }
  if (["groom", "trai", "nha-trai", "nhatrai", "chu-re", "chure", "nha_trai"].includes(clean)) {
    return "groom";
  }
  return undefined;
}

/**
 * Chuyển slug (ví dụ: 'tuan-diu') thành tên dễ đọc ('Tuấn Dịu' / 'Tuan Diu')
 */
export function formatSlugToName(slug: string): string {
  if (!slug) return "";
  return slug
    .split(/[-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .trim();
}

/**
 * Xác định chính xác trạng thái chế độ xem thiệp cưới (Owner vs Guest; Groom vs Bride)
 * Hàm chạy ĐỒNG BỘ ngay từ lần render đầu tiên, không có độ trễ hay trạng thái chớp nhầm.
 */
export function resolveInvitationState(): InvitationViewState {
  if (typeof window === "undefined") {
    return {
      isGuestView: false,
      isOwnerView: true,
      guestSide: "groom",
      guestName: "",
      eventIds: ["tiec_than_mat", "thanh_hon"],
    };
  }

  const search = window.location.search;
  const params = new URLSearchParams(search);
  const hash = window.location.hash;
  const pathname = window.location.pathname;

  // 1. Kiểm tra tham số quản trị viên / chủ sở hữu
  const isAdminPath = hash === "#admin" || pathname.startsWith("/admin");
  const isExplicitOwnerParam =
    params.get("mode") === "owner" ||
    params.get("view") === "owner" ||
    params.get("owner") === "true";

  // 2. Kiểm tra các tham số khách mời
  const rawCode = (params.get("g") || params.get("code") || "").trim();
  const rawId = (params.get("guestId") || params.get("id") || "").trim();
  const rawToken = (params.get("guestToken") || params.get("token") || "").trim();
  const rawName = (params.get("guest") || params.get("to") || params.get("khach") || "").trim();
  const rawSide = params.get("side") || params.get("phe") || params.get("nha");
  const rawEvents = params.get("events") || params.get("event") || params.get("eventIds");
  const isExplicitGuestParam =
    params.get("mode") === "guest" ||
    params.get("view") === "guest" ||
    params.get("guest_view") === "true";

  const hasGuestParams = Boolean(
    rawCode ||
    rawId ||
    rawToken ||
    rawName ||
    rawSide ||
    rawEvents ||
    isExplicitGuestParam
  );

  // NẾU LÀ TRANG QUẢN TRỊ HOẶC CHỦ SỞ HỮU RÕ RÀNG (KHÔNG CÓ ĐỊNH DANH KHÁCH MỜI)
  if (isAdminPath || (isExplicitOwnerParam && !hasGuestParams)) {
    try {
      sessionStorage.removeItem(GUEST_SESSION_KEY);
    } catch {
      // ignore
    }
    return {
      isGuestView: false,
      isOwnerView: true,
      guestSide: "groom",
      guestName: "",
      eventIds: ["tiec_than_mat", "thanh_hon"],
    };
  }

  // NẾU TRUY CẬP LINK GỐC KHÔNG CÓ BẤT KỲ THAM SỐ KHÁCH MỜI NÀO
  if (!hasGuestParams) {
    // Thử kiểm tra xem phiên hiện tại có session khách mời đang lưu không (để không mất trạng thái khi tải lại trang hoặc đổi hash)
    try {
      const cached = sessionStorage.getItem(GUEST_SESSION_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.isGuestView) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Mặc định truy cập link gốc không có tham số: Chế độ Chủ sở hữu (xem thiệp toàn diện)
    return {
      isGuestView: false,
      isOwnerView: true,
      guestSide: "groom",
      guestName: "",
      eventIds: ["tiec_than_mat", "thanh_hon"],
    };
  }

  // =========================================================================
  // XỬ LÝ CHẾ ĐỘ THIỆP KHÁCH MỜI (GUEST VIEW)
  // =========================================================================

  // Tìm khách trong kho dữ liệu đã lưu (nếu có)
  const lookupKey = rawCode || rawId || rawToken || rawName;
  let matchedGuest: Guest | undefined = lookupKey ? getGuestByCode(lookupKey) : undefined;

  // Xác định bên Nhà trai hay Nhà gái
  const explicitSide = normalizeSideParam(rawSide);
  let side: "groom" | "bride" = "groom";

  if (explicitSide) {
    side = explicitSide;
  } else if (matchedGuest?.side) {
    side = matchedGuest.side;
  } else {
    // Thử suy luận từ code/id nếu có từ khóa
    const hint = (rawCode + " " + rawId + " " + rawName).toLowerCase();
    if (hint.includes("bride") || hint.includes("gai") || hint.includes("codau")) {
      side = "bride";
    } else {
      side = "groom";
    }
  }

  // Xác định tên hiển thị của khách
  let guestName = "";
  if (matchedGuest?.fullName) {
    guestName = matchedGuest.fullName;
  } else if (rawName) {
    guestName = rawName;
  } else if (rawCode) {
    guestName = formatSlugToName(rawCode);
  } else {
    guestName = side === "groom" ? "Khách Quý Nhà Trai" : "Khách Quý Nhà Gái";
  }

  // Xác định sự kiện được mời
  let eventIds: string[] = [];
  if (matchedGuest?.eventIds && matchedGuest.eventIds.length > 0) {
    // Lọc theo side
    eventIds = side === "groom"
      ? matchedGuest.eventIds.filter((id) => id === "tiec_than_mat" || id === "thanh_hon")
      : matchedGuest.eventIds.filter((id) => id === "tiec_than_mat_nha_gai" || id === "vu_quy");
  } else if (rawEvents) {
    eventIds = rawEvents.split(",").map((s) => s.trim()).filter(Boolean);
  }

  // Nếu chưa có eventIds hợp lệ, mặc định các sự kiện chính của bên đó
  if (eventIds.length === 0) {
    eventIds = side === "groom"
      ? ["tiec_than_mat", "thanh_hon"]
      : ["tiec_than_mat_nha_gai", "vu_quy"];
  }

  // Nếu khách chưa có trong local storage (ví dụ: mở link trên điện thoại lần đầu):
  // Tự động tạo bản ghi khách mời chuẩn hóa và lưu trữ cục bộ để phục vụ chức năng RSVP và Chúc phúc
  if (!matchedGuest) {
    const syntheticGuest: Guest = normalizeGuest({
      id: rawId || `guest_${rawCode || Date.now()}`,
      code: rawCode || (rawName ? rawName.toLowerCase().replace(/\s+/g, "-") : `khach-${Date.now()}`),
      fullName: guestName,
      group: side === "groom" ? "Khách Nhà Trai" : "Khách Nhà Gái",
      side,
      eventIds,
      expectedCount: 1,
      createdAt: new Date().toISOString(),
      checkin: { isCheckedIn: false },
      rsvp: {
        tiecThanMat: { attending: "pending", attendeeCount: 1 },
        thanhHon: side === "groom" ? { attending: "pending", attendeeCount: 1 } : undefined,
        vuQuy: side === "bride" ? { attending: "pending", attendeeCount: 1 } : undefined,
        tiecThanMatNhaGai: side === "bride" ? { attending: "pending", attendeeCount: 1 } : undefined,
      },
    });

    matchedGuest = syntheticGuest;

    try {
      const allGuests = getGuests();
      if (!allGuests.some((g) => g.id === syntheticGuest.id || g.code === syntheticGuest.code)) {
        saveGuests([syntheticGuest, ...allGuests]);
      }
    } catch {
      // ignore
    }
  }

  const result: InvitationViewState = {
    isGuestView: true,
    isOwnerView: false,
    guestSide: side,
    guestId: rawId || matchedGuest?.id,
    guestCode: rawCode || matchedGuest?.code,
    guestToken: rawToken || undefined,
    guestName,
    eventIds,
    currentGuest: matchedGuest,
  };

  // Lưu vào sessionStorage để đảm bảo khi tải lại trang hoặc đổi tab/hash không bị mất trạng thái
  try {
    sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }

  return result;
}

/**
 * React Hook cung cấp trạng thái xem thiệp thống nhất cho toàn bộ website
 */
export function useInvitationMode(): InvitationViewState {
  const [state, setState] = useState<InvitationViewState>(() => resolveInvitationState());

  useEffect(() => {
    const update = () => {
      setState(resolveInvitationState());
    };

    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);

    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return state;
}
