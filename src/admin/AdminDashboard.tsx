import { useState, useEffect, useMemo, useRef } from "react";
import {
  Users,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Upload,
  RefreshCw,
  LogOut,
  KeyRound,
  ExternalLink,
  Edit2,
  Trash2,
  QrCode,
  MessageSquare,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import type { Guest, WishItem, AdminStats, GoogleSheetsConfig } from "../types/guestManagement";
import {
  getGuests,
  addGuest,
  updateGuest,
  deleteGuest,
  calculateAdminStats,
  getWishes,
  toggleApproveWish,
  deleteWish,
  getSheetConfig,
  saveSheetConfig,
  exportGuestsToCSV,
  importGuestsFromCSV,
  logoutAdmin,
  getAdminPin,
  setAdminPin,
} from "../services/guestStorage";
import {
  syncWithGoogleSheets,
  testGoogleSheetsConnection,
  pullFromGoogleSheets,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
} from "../services/googleSheetsService";
import GuestModal from "./GuestModal";
import QRModal from "./QRModal";
import { getGuestInvitationUrl, getGuestRSVPStatus, normalizeGuestSearch } from "../utils/guestList";

interface AdminDashboardProps {
  onExit: () => void;
}

type TabType = "overview" | "guests" | "wishes" | "sheets";

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("guests");

  // State Dữ liệu
  const [guests, setGuests] = useState<Guest[]>(() => getGuests());
  const [wishes, setWishes] = useState<WishItem[]>(() => getWishes());
  const [stats, setStats] = useState<AdminStats>(() => calculateAdminStats());
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig>(() => getSheetConfig());

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedRsvp, setSelectedRsvp] = useState<string>("all");

  // Modal State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [qrModalGuest, setQrModalGuest] = useState<Guest | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ success?: boolean; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // PIN Change State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cập nhật thống kê khi danh sách khách thay đổi
  const reloadData = () => {
    const freshGuests = getGuests();
    const freshWishes = getWishes();
    setGuests(freshGuests);
    setWishes(freshWishes);
    setStats(calculateAdminStats());
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Danh sách các nhóm khách hiện có để hiển thị trong bộ lọc
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    guests.forEach((g) => {
      if (g.group) set.add(g.group);
    });
    return Array.from(set);
  }, [guests]);

  // Lọc danh sách khách mời
  const filteredGuests = useMemo(() => {
    const query = normalizeGuestSearch(searchTerm);
    return guests.filter((g) => {
      // Tìm kiếm từ khóa
      const searchMatch =
        [g.fullName, g.code, g.phone || "", g.group].some((value) =>
          normalizeGuestSearch(value).includes(query)
        );

      if (!searchMatch) return false;

      // Lọc nhóm
      if (selectedGroup !== "all" && g.group !== selectedGroup) return false;

      // Lọc sự kiện
      const invitationType = g.invitedTo === "tiec_than_mat" ? "thiep_chu_re"
        : g.invitedTo === "vu_quy" ? "thiep_co_dau" : g.invitedTo;
      if (selectedEvent !== "all" && invitationType !== selectedEvent && invitationType !== "both") {
        return false;
      }

      // Lọc RSVP
      if (selectedRsvp !== "all" && getGuestRSVPStatus(g) !== selectedRsvp) return false;

      return true;
    });
  }, [guests, searchTerm, selectedGroup, selectedEvent, selectedRsvp]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedGroup("all");
    setSelectedEvent("all");
    setSelectedRsvp("all");
  };


  // Lưu hoặc cập nhật khách mời
  const handleSaveGuest = (guestData: any) => {
    if (editingGuest) {
      updateGuest(guestData as Guest);
    } else {
      addGuest(guestData);
      resetFilters();
    }
    reloadData();
    setActiveTab("guests");
    setIsGuestModalOpen(false);
    setEditingGuest(null);
  };

  // Xóa khách mời
  const handleDeleteGuest = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách mời "${name}" không?`)) {
      deleteGuest(id);
      reloadData();
    }
  };

  // Xuất file CSV
  const handleExportCSV = () => {
    const csvContent = exportGuestsToCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh_sach_khach_moi_long_toi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Nhập file CSV
  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const count = importGuestsFromCSV(text);
        reloadData();
        alert(`Đã nhập thành công ${count} khách mời mới từ file CSV!`);
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // 1. Kiểm tra kết nối Google Apps Script
  const handleTestConnection = async () => {
    setIsTesting(true);
    setSyncStatusMsg(null);
    const cleanConfig = {
      ...sheetConfig,
      webAppUrl: (sheetConfig.webAppUrl || "").trim(),
      secretToken: (sheetConfig.secretToken || "").trim(),
    };
    saveSheetConfig(cleanConfig);
    setSheetConfig(cleanConfig);
    const result = await testGoogleSheetsConnection(cleanConfig);
    setIsTesting(false);
    setSyncStatusMsg({ success: result.success, text: result.message });
  };

  // 2. Đẩy dữ liệu lên Google Sheets (Push)
  const handleSyncSheets = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    const cleanConfig = {
      ...sheetConfig,
      webAppUrl: (sheetConfig.webAppUrl || "").trim(),
      secretToken: (sheetConfig.secretToken || "").trim(),
    };
    saveSheetConfig(cleanConfig);
    setSheetConfig(cleanConfig);
    const result = await syncWithGoogleSheets(cleanConfig);
    setIsSyncing(false);
    setSyncStatusMsg({ success: result.success, text: result.message });
    if (result.success) {
      reloadData();
      setSheetConfig(getSheetConfig());
    }
  };

  // 3. Kéo dữ liệu từ Google Sheets về Web (Pull)
  const handlePullSheets = async () => {
    setIsPulling(true);
    setSyncStatusMsg(null);
    const cleanConfig = {
      ...sheetConfig,
      webAppUrl: (sheetConfig.webAppUrl || "").trim(),
      secretToken: (sheetConfig.secretToken || "").trim(),
    };
    saveSheetConfig(cleanConfig);
    setSheetConfig(cleanConfig);
    const result = await pullFromGoogleSheets(cleanConfig);
    setIsPulling(false);
    setSyncStatusMsg({ success: result.success, text: result.message });
    if (result.success) {
      reloadData();
      setSheetConfig(getSheetConfig());
    }
  };

  // Đổi mã PIN quản trị
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    const curPin = getAdminPin();
    if (currentPinInput.trim() !== curPin) {
      setPinChangeMsg("Mã PIN hiện tại không chính xác!");
      return;
    }
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg("Mã PIN mới phải có ít nhất 4 ký tự!");
      return;
    }

    setAdminPin(newPinInput.trim());
    setPinChangeMsg("Đổi mã PIN thành công!");
    setTimeout(() => {
      setIsPinModalOpen(false);
      setPinChangeMsg("");
      setCurrentPinInput("");
      setNewPinInput("");
    }, 1500);
  };

  return (
    <div className="admin-root-wrapper">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: "none" }}
      />

      {/* TOP NAVBAR */}
      <header className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-brand">
            <div className="brand-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div className="admin-brand-info">
              <h1>HỆ THỐNG QUẢN TRỊ KHÁCH MỜI</h1>
              <p>Đám cưới Trường Long & Thanh Tới • 2026</p>
            </div>
          </div>

          <div className="admin-nav-actions">
            <button onClick={onExit} className="btn-nav-action" title="Quay lại giao diện thiệp">
              <ExternalLink size={15} />
              <span>Xem Thiệp</span>
            </button>

            <button
              onClick={() => setIsPinModalOpen(true)}
              className="btn-nav-action"
              title="Thay đổi mật khẩu quản trị"
            >
              <KeyRound size={15} />
              <span>Đổi PIN</span>
            </button>

            <button
              onClick={() => {
                logoutAdmin();
                onExit();
              }}
              className="btn-nav-action danger"
              title="Đăng xuất khỏi trang quản trị"
            >
              <LogOut size={15} />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* TABS HEADER */}
      <nav className="admin-tabs-bar">
        <div className="admin-tabs-container">
          <button
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={17} />
            <span>Tổng Quan & Thống Kê</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === "guests" ? "active" : ""}`}
            onClick={() => setActiveTab("guests")}
          >
            <Users size={17} />
            <span>Danh Sách Khách Mời</span>
            <span className="tab-badge">{stats.totalGuests}</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === "wishes" ? "active" : ""}`}
            onClick={() => setActiveTab("wishes")}
          >
            <MessageSquare size={17} />
            <span>Sổ Lời Chúc</span>
            <span className="tab-badge">{stats.totalWishes}</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === "sheets" ? "active" : ""}`}
            onClick={() => setActiveTab("sheets")}
          >
            <FileSpreadsheet size={17} />
            <span>Đồng Bộ Google Sheets</span>
          </button>
        </div>
      </nav>

      {/* MAIN BODY CONTENT */}
      <main className="admin-main-content">
        {/* ====================================================================
            TAB 1: TỔNG QUAN & THỐNG KÊ (OVERVIEW)
            ==================================================================== */}
        {activeTab === "overview" && (
          <div>
            {/* ===== THỐNG KÊ TÁCH BIỆT NHÀ TRAI / NHÀ GÁI ===== */}
            {/* Hàng 1: Nhà Trai và Nhà Gái song song */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

              {/* ---- NHÀ TRAI ---- */}
              <div style={{ background: "linear-gradient(135deg,#FDF0F3 0%,#FFF8FA 100%)", border: "1.5px solid #E6BDC6", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ background: "#65001D", borderRadius: "10px", padding: "8px", display: "flex" }}>
                    <Users size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#65001D", fontSize: "15px" }}>🤵 Nhà Trai (Chú Rể)</div>
                    <div style={{ fontSize: "12px", color: "#8C7B7E" }}>Trường Long</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#65001D", lineHeight: "1" }}>{stats.groom.totalGuests}</div>
                    <div style={{ fontSize: "11px", color: "#8C7B7E" }}>khách mời</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <span style={{ background: "#D4EDDA", color: "#155724", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>✓ Có: {stats.groom.confirmedGuests}</span>
                  <span style={{ background: "#F8D7DA", color: "#721C24", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>✗ Không: {stats.groom.declinedGuests}</span>
                  <span style={{ background: "#E9ECEF", color: "#6C757D", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>⏳ Chờ: {stats.groom.pendingGuests}</span>
                </div>
                <div style={{ borderTop: "1px solid #E6BDC6", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#65001D", marginBottom: "5px" }}>🍽️ Bữa Cơm Thân Mật (13/11)</div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#554448" }}>Mời: <strong>{stats.groom.events.tiec_than_mat?.invitedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#12824C" }}>Có: <strong>{stats.groom.events.tiec_than_mat?.attendingCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#C02640" }}>Không: <strong>{stats.groom.events.tiec_than_mat?.declinedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#8C7B7E" }}>Chờ: <strong>{stats.groom.events.tiec_than_mat?.pendingCount ?? 0}</strong></span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#65001D", marginBottom: "5px" }}>💍 Lễ Thành Hôn (14/11)</div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#554448" }}>Mời: <strong>{stats.groom.events.thanh_hon?.invitedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#12824C" }}>Có: <strong>{stats.groom.events.thanh_hon?.attendingCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#C02640" }}>Không: <strong>{stats.groom.events.thanh_hon?.declinedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#8C7B7E" }}>Chờ: <strong>{stats.groom.events.thanh_hon?.pendingCount ?? 0}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- NHÀ GÁI ---- */}
              <div style={{ background: "linear-gradient(135deg,#FFF4F9 0%,#FFFAFB 100%)", border: "1.5px solid #EAC8D2", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ background: "#B8506C", borderRadius: "10px", padding: "8px", display: "flex" }}>
                    <Users size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#B8506C", fontSize: "15px" }}>👰 Nhà Gái (Cô Dâu)</div>
                    <div style={{ fontSize: "12px", color: "#8C7B7E" }}>Thanh Tới</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#B8506C", lineHeight: "1" }}>{stats.bride.totalGuests}</div>
                    <div style={{ fontSize: "11px", color: "#8C7B7E" }}>khách mời</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
                  <span style={{ background: "#D4EDDA", color: "#155724", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>✓ Có: {stats.bride.confirmedGuests}</span>
                  <span style={{ background: "#F8D7DA", color: "#721C24", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>✗ Không: {stats.bride.declinedGuests}</span>
                  <span style={{ background: "#E9ECEF", color: "#6C757D", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", fontWeight: 600 }}>⏳ Chờ: {stats.bride.pendingGuests}</span>
                </div>
                <div style={{ borderTop: "1px solid #EAC8D2", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#B8506C", marginBottom: "5px" }}>🍽️ Bữa Cơm Thân Mật (13/11)</div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#554448" }}>Mời: <strong>{stats.bride.events.tiec_than_mat_nha_gai?.invitedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#12824C" }}>Có: <strong>{stats.bride.events.tiec_than_mat_nha_gai?.attendingCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#C02640" }}>Không: <strong>{stats.bride.events.tiec_than_mat_nha_gai?.declinedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#8C7B7E" }}>Chờ: <strong>{stats.bride.events.tiec_than_mat_nha_gai?.pendingCount ?? 0}</strong></span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#B8506C", marginBottom: "5px" }}>🌸 Lễ Vu Quy (14/11)</div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "#554448" }}>Mời: <strong>{stats.bride.events.vu_quy?.invitedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#12824C" }}>Có: <strong>{stats.bride.events.vu_quy?.attendingCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#C02640" }}>Không: <strong>{stats.bride.events.vu_quy?.declinedCount ?? 0}</strong></span>
                      <span style={{ fontSize: "12px", color: "#8C7B7E" }}>Chờ: <strong>{stats.bride.events.vu_quy?.pendingCount ?? 0}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hàng 2: 3 thẻ thống kê tổng cộng */}

            {/* PHÍM TẮT HÀNH ĐỘNG NHANH */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid #EBE2E5",
                marginBottom: "28px",
              }}
            >
              <h3 style={{ margin: "0 0 16px 0", color: "#65001D", fontSize: "16px" }}>
                Thao Tác Nhanh
              </h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  className="btn-primary-action"
                  onClick={() => {
                    setEditingGuest(null);
                    setIsGuestModalOpen(true);
                  }}
                >
                  <UserPlus size={16} />
                  <span>Thêm Khách Mới</span>
                </button>

                <button className="btn-secondary-action" onClick={handleExportCSV}>
                  <Download size={16} />
                  <span>Tải File Excel Khách Mời (CSV)</span>
                </button>

                <button className="btn-secondary-action" onClick={() => setActiveTab("sheets")}>
                  <RefreshCw size={16} />
                  <span>Đồng Bộ Google Sheets</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: QUẢN LÝ DANH SÁCH KHÁCH MỜI (GUEST LIST)
            ==================================================================== */}
        {activeTab === "guests" && (
          <div>
            {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC */}
            <div className="guest-list-toolbar">
              <div className="toolbar-search-group">
                <div className="search-input-box">
                  <Search size={18} />
                  <input
                    type="text"
                    aria-label="Tìm khách mời"
                    placeholder="Tìm tên, số điện thoại, mã link hoặc nhóm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="toolbar-filters">
                {/* Lọc Nhóm */}
                <select
                  className="select-filter"
                  aria-label="Lọc theo nhóm"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                >
                  <option value="all">Tất cả các nhóm</option>
                  {availableGroups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>

                {/* Lọc Sự Kiện / Loại Thiệp Mời */}
                <select
                  className="select-filter"
                  aria-label="Lọc theo loại thiệp"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                >
                  <option value="all">Tất cả loại thiệp</option>
                  <option value="thiep_chu_re">🤵 Thiệp Chú Rể (Nhà Trai)</option>
                  <option value="thiep_co_dau">👰 Thiệp Cô Dâu (Nhà Gái)</option>
                  <option value="both">✨ Cả hai bên</option>
                </select>

                {/* Lọc RSVP */}
                <select
                  className="select-filter"
                  aria-label="Lọc theo RSVP"
                  value={selectedRsvp}
                  onChange={(e) => setSelectedRsvp(e.target.value)}
                >
                  <option value="all">Tất cả RSVP</option>
                  <option value="attending">Sẽ tham dự</option>
                  <option value="declined">Đã từ chối</option>
                  <option value="pending">Chưa phản hồi</option>
                </select>

              </div>

              <div className="toolbar-actions">
                <button
                  className="btn-primary-action"
                  onClick={() => {
                    setEditingGuest(null);
                    setIsGuestModalOpen(true);
                  }}
                >
                  <UserPlus size={16} />
                  <span>Thêm Khách</span>
                </button>

                <button className="btn-secondary-action" onClick={handleExportCSV} title="Xuất CSV">
                  <Download size={15} />
                  <span>Xuất Excel</span>
                </button>

                <button
                  className="btn-secondary-action"
                  onClick={handleImportCSVClick}
                  title="Nhập khách từ file CSV"
                >
                  <Upload size={15} />
                  <span>Nhập CSV</span>
                </button>
              </div>
            </div>

            {/* BẢNG DỮ LIỆU KHÁCH MỜI */}
            <div className="admin-table-card">
              <div className="guest-list-summary">
                <span role="status">Hiển thị {filteredGuests.length} / {guests.length} khách mời</span>
                <button className="btn-secondary-action" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
              <div className="table-responsive">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Khách Mời</th>
                      <th>Nhóm</th>
                      <th>Sự Kiện Mời</th>
                      <th style={{ textAlign: "center" }}>Dự Kiến</th>
                      <th>RSVP Tiệc Thân Mật</th>
                      <th>RSVP Lễ Vu Quy</th>
                      <th style={{ textAlign: "center" }}>Link / QR</th>
                      <th style={{ textAlign: "center" }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGuests.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: "40px", color: "#8C7B7E" }}>
                          {guests.length === 0
                            ? "Chưa có khách mời. Chọn Thêm Khách hoặc Nhập CSV để tạo danh sách."
                            : "Không tìm thấy khách mời nào phù hợp với bộ lọc."}
                        </td>
                      </tr>
                    ) : (
                      filteredGuests.map((g) => {
                        const guestUrl = getGuestInvitationUrl(g.code, g.side, g.fullName, g.id, g.eventIds);

                        return (
                          <tr key={g.id}>
                            {/* Khách mời */}
                            <td>
                              <div style={{ fontWeight: 600, color: "#1E1719" }}>{g.fullName}</div>
                              {g.phone && (
                                <div style={{ fontSize: "12px", color: "#8C7B7E" }}>{g.phone}</div>
                              )}
                            </td>

                            {/* Nhóm */}
                            <td>
                              <span style={{ fontSize: "12.5px", color: "#554448" }}>{g.group}</span>
                            </td>

                            {/* Sự kiện mời */}
                            <td>
                              {(g.invitedTo === "thiep_chu_re" || g.invitedTo === "tiec_than_mat") && (
                                <span className="event-badge than_mat" style={{ background: "#FDF0F3", color: "#65001D", border: "1px solid #E6BDC6" }}>
                                  🤵 Thiệp Chú Rể
                                </span>
                              )}
                              {(g.invitedTo === "thiep_co_dau" || g.invitedTo === "vu_quy" || g.invitedTo === "tiec_than_mat_nha_gai") && (
                                <span className="event-badge vu_quy" style={{ background: "#FDF4F6", color: "#B8506C", border: "1px solid #EAC8D2" }}>
                                  👰 Thiệp Cô Dâu
                                </span>
                              )}
                              {g.invitedTo === "both" && (
                                <span className="event-badge both">
                                  ✨ Cả hai bên
                                </span>
                              )}
                            </td>

                            {/* Dự kiến */}
                            <td style={{ textAlign: "center", fontWeight: 600 }}>
                              {g.expectedCount || 1}
                            </td>

                            {/* RSVP Tiệc Thân Mật */}
                            <td>
                              {g.invitedTo === "vu_quy" ? (
                                <span style={{ color: "#B5A4A7", fontSize: "12px" }}>Không mời</span>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  {g.rsvp?.tiecThanMat?.attending === "attending" && (
                                    <span className="rsvp-badge attending">
                                      <CheckCircle2 size={12} />
                                      Tham dự ({g.rsvp.tiecThanMat.attendeeCount} người)
                                    </span>
                                  )}
                                  {g.rsvp?.tiecThanMat?.attending === "declined" && (
                                    <span className="rsvp-badge declined">
                                      <XCircle size={12} />
                                      Bận không tới
                                    </span>
                                  )}
                                  {(!g.rsvp?.tiecThanMat ||
                                    g.rsvp?.tiecThanMat?.attending === "pending") && (
                                    <span className="rsvp-badge pending">
                                      <Clock size={12} />
                                      Chưa phản hồi
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* RSVP Lễ Vu Quy */}
                            <td>
                              {(g.invitedTo === "tiec_than_mat" || g.invitedTo === "thiep_chu_re") ? (
                                <span style={{ color: "#B5A4A7", fontSize: "12px" }}>Không mời</span>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  {g.rsvp?.vuQuy?.attending === "attending" && (
                                    <span className="rsvp-badge attending">
                                      <CheckCircle2 size={12} />
                                      Tham dự ({g.rsvp.vuQuy.attendeeCount} người)
                                    </span>
                                  )}
                                  {g.rsvp?.vuQuy?.attending === "declined" && (
                                    <span className="rsvp-badge declined">
                                      <XCircle size={12} />
                                      Bận không tới
                                    </span>
                                  )}
                                  {(!g.rsvp?.vuQuy || g.rsvp?.vuQuy?.attending === "pending") && (
                                    <span className="rsvp-badge pending">
                                      <Clock size={12} />
                                      Chưa phản hồi
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>


                            {/* Link / QR Code */}
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  className="btn-icon-action"
                                  onClick={() => setQrModalGuest(g)}
                                  title="Mở mã QR & Link cá nhân"
                                >
                                  <QrCode size={16} />
                                </button>

                                <a
                                  href={guestUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-icon-action"
                                  title="Xem trước thiệp mời của khách này"
                                >
                                  <ExternalLink size={15} />
                                </a>
                              </div>
                            </td>

                            {/* Thao tác */}
                            <td style={{ textAlign: "center" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  className="btn-icon-action"
                                  onClick={() => {
                                    setEditingGuest(g);
                                    setIsGuestModalOpen(true);
                                  }}
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit2 size={14} />
                                </button>

                                <button
                                  className="btn-icon-action danger"
                                  onClick={() => handleDeleteGuest(g.id, g.fullName)}
                                  title="Xóa khách này"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: SỔ LỜI CHÚC (WISHES MANAGER)
            ==================================================================== */}
        {activeTab === "wishes" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#65001D", fontFamily: "'Times New Roman', Georgia, serif", fontSize: "20px" }}>
                Lời Chúc Phúc Từ Quan Khách ({wishes.length})
              </h3>
            </div>

            <div className="wishes-grid">
              {wishes.map((w) => (
                <div key={w.id} className="admin-wish-card">
                  <div>
                    <div className="wish-card-top">
                      <div className="wish-sender-info">
                        <h4>{w.name}</h4>
                        <span className="wish-relation-badge">{w.relationship}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#8C7B7E" }}>{w.createdAt}</span>
                    </div>
                    <p className="wish-card-text">“{w.message}”</p>
                  </div>

                  <div className="wish-card-actions">
                    <button
                      className="btn-secondary-action"
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                      onClick={() => {
                        toggleApproveWish(w.id);
                        reloadData();
                      }}
                    >
                      {w.isApproved ? (
                        <>
                          <CheckCircle2 size={13} color="#12824C" />
                          <span>Đang Hiển Thị</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} color="#8C7B7E" />
                          <span>Đang Ẩn</span>
                        </>
                      )}
                    </button>

                    <button
                      className="btn-icon-action danger"
                      onClick={() => {
                        if (window.confirm("Xóa lời chúc này?")) {
                          deleteWish(w.id);
                          reloadData();
                        }
                      }}
                      title="Xóa lời chúc này"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: ĐỒNG BỘ GOOGLE SHEETS (SHEETS SYNC)
            ==================================================================== */}
        {activeTab === "sheets" && (
          <div className="sheets-sync-card">
            <h3 style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: "22px", color: "#65001D", margin: "0 0 10px 0" }}>
              Đồng Bộ Danh Sách Khách & Lời Chúc Với Google Sheets
            </h3>
            <p style={{ color: "#6C5B5D", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
              Hệ thống kết nối trực tiếp với bảng tính Google Spreadsheet cá nhân của bạn thông qua Google Apps Script Web App an toàn. Bạn có thể mở Google Sheets trên điện thoại hoặc máy tính để quản lý khách mọi lúc mọi nơi.
            </p>

            {syncStatusMsg && (
              <div className={`sync-status-banner ${syncStatusMsg.success ? "success" : "warning"}`}>
                {syncStatusMsg.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span>{syncStatusMsg.text}</span>
              </div>
            )}

            {/* Cấu hình URL và Secret Token */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div className="form-field-group">
                <label style={{ fontWeight: 600, color: "#4A3A3D" }}>
                  URL Google Apps Script Web App (Kết thúc bằng /exec):
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={sheetConfig.webAppUrl}
                  onChange={(e) => setSheetConfig({ ...sheetConfig, webAppUrl: e.target.value })}
                />
                <small style={{ color: "#8C7B7E", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  * Lưu ý: Không dùng link trang tính (docs.google.com/spreadsheets) hay link /dev. Chỉ dùng link Web App kết thúc bằng <strong>/exec</strong>.
                </small>
              </div>

              <div className="form-field-group">
                <label style={{ fontWeight: 600, color: "#4A3A3D" }}>Mã Token Bảo Mật (Secret Token):</label>
                <input
                  type="text"
                  value={sheetConfig.secretToken}
                  onChange={(e) => setSheetConfig({ ...sheetConfig, secretToken: e.target.value })}
                />
                <small style={{ color: "#8C7B7E", fontSize: "12px", marginTop: "4px", display: "block" }}>
                  * Mặc định là: <code>LONG_TOI_WEDDING_2026</code> (phải trùng khớp với SECRET_TOKEN trong code Apps Script).
                </small>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSyncing || isPulling}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={15} className={isTesting ? "spin" : ""} />
                  <span>{isTesting ? "Đang Kiểm Tra..." : "1. Kiểm Tra Kết Nối"}</span>
                </button>

                <button
                  type="button"
                  className="btn-primary-action"
                  onClick={handleSyncSheets}
                  disabled={isSyncing || isTesting || isPulling}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Upload size={15} className={isSyncing ? "spin" : ""} />
                  <span>{isSyncing ? "Đang Đẩy Dữ Liệu..." : "2. Đẩy Lên Google Sheets (Push)"}</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handlePullSheets}
                  disabled={isPulling || isTesting || isSyncing}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={15} className={isPulling ? "spin" : ""} />
                  <span>{isPulling ? "Đang Tải Về..." : "3. Kéo Từ Google Sheets (Pull)"}</span>
                </button>

                {sheetConfig.lastSyncedAt && (
                  <span style={{ fontSize: "12.5px", color: "#65001D", fontWeight: 500, marginLeft: "auto" }}>
                    ✓ Lần đồng bộ gần nhất: {sheetConfig.lastSyncedAt}
                  </span>
                )}
              </div>
            </div>

            {/* HƯỚNG DẪN CÀI ĐẶT 2 PHÚT & MÃ NGUỒN APPS SCRIPT */}
            <div style={{ borderTop: "1px solid #EBE2E5", paddingTop: "24px" }}>
              <h4 style={{ color: "#65001D", margin: "0 0 12px 0" }}>
                Hướng Dẫn Cài Đặt Google Apps Script Trong 2 Phút:
              </h4>
              <ol style={{ paddingLeft: "20px", color: "#4A3A3D", fontSize: "13.5px", lineHeight: "1.7", margin: "0 0 16px 0" }}>
                <li>Mở một Google Sheet mới trên trình duyệt của bạn (đặt tên ví dụ: <em>Thiệp Cưới Long & Tới</em>).</li>
                <li>Vào menu: <strong>Tiện ích mở rộng (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Xóa toàn bộ code mặc định trong file, sau đó bấm nút <strong>Sao Chép Toàn Bộ Mã Script</strong> bên dưới và dán vào.</li>
                <li>Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Tùy chọn triển khai mới (New deployment)</strong> &gt; Chọn loại <strong>Ứng dụng web (Web app)</strong>.</li>
                <li>Mục "Ai có quyền truy cập" (Who has access): Chọn <strong>Bất kỳ ai (Anyone)</strong> &gt; Bấm <strong>Triển khai</strong>.</li>
                <li>Copy đường link Web App dán vào ô URL bên trên và bấm <strong>Lưu & Đồng Bộ Ngay</strong>!</li>
              </ol>

              <div className="script-code-box">
                <button
                  className="btn-copy-script"
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                >
                  {copiedScript ? "Đã Sao Chép!" : "Sao Chép Toàn Bộ Mã Script"}
                </button>
                <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL THÊM / SỬA KHÁCH MỜI */}
      {isGuestModalOpen && <GuestModal
        key={editingGuest?.id || "new"}
        guest={editingGuest}
        isOpen={isGuestModalOpen}
        onClose={() => {
          setIsGuestModalOpen(false);
          setEditingGuest(null);
        }}
        onSave={handleSaveGuest}
      />}

      {/* MODAL XEM MÃ QR & LINK MỜI */}
      <QRModal
        guest={qrModalGuest}
        isOpen={!!qrModalGuest}
        onClose={() => setQrModalGuest(null)}
      />

      {/* MODAL ĐỔI MÃ PIN QUẢN TRỊ */}
      {isPinModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setIsPinModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "380px" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#65001D", fontFamily: "'Times New Roman', Georgia, serif" }}>
              Thay Đổi Mã PIN Quản Trị
            </h3>
            <form onSubmit={handleSaveNewPin}>
              <div className="form-field-group">
                <label>Mã PIN hiện tại:</label>
                <input
                  type="password"
                  placeholder="Nhập PIN cũ"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Mã PIN mới:</label>
                <input
                  type="password"
                  placeholder="Nhập PIN mới (ít nhất 4 số)"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  required
                />
              </div>

              {pinChangeMsg && (
                <div style={{ fontSize: "13px", color: pinChangeMsg.includes("thành công") ? "#12824C" : "#C02640", marginBottom: "12px" }}>
                  {pinChangeMsg}
                </div>
              )}

              <div className="form-actions-row">
                <button type="button" className="btn-secondary-action" onClick={() => setIsPinModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  Lưu Mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
