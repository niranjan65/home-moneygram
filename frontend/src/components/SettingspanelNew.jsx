import { sessionFetch as fetch } from "../api/sessionClient.js";
import React, { useState, useEffect, useMemo } from "react";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import {
  User,
  Building,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  X,
  Edit3,
  Phone,
  Mail,
  Calendar,
  Lock,
  ChevronDown,
  Moon,
  Sun,
  Info
} from "lucide-react";

const FONT_SIZE_MAP = {
  small: 14,
  normal: 16,
  large: 18,
  larger: 20,
};

const FONT_SIZE_TO_KEY = {
  "14": "small",
  "16": "normal",
  "18": "large",
  "20": "larger",
  "14px": "small",
  "16px": "normal",
  "18px": "large",
  "20px": "larger",
  small: "small",
  normal: "normal",
  large: "large",
  larger: "larger",
};

export default function SettingsPanelNew() {
  const { user, updateUser, selectedWarehouse, setSelectedWarehouse, warehouses, theme, setTheme } = useSettings();
  const loginUser = useUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: user.name || "", phone: user.phone || "" });
  const [saved, setSaved] = useState(false);
  const [vaultWarehouse, setVaultWarehouse] = useState(null);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      const stored = localStorage.getItem("document_font_size");
      return FONT_SIZE_TO_KEY[stored] || "normal";
    } catch {
      return "normal";
    }
  });

  // Sync draft when user context updates
  useEffect(() => {
    if (user) {
      setDraft({ name: user.name || "", phone: user.phone || "" });
    }
  }, [user]);

  // Fetch linked vault info
  useEffect(() => {
    if (!selectedWarehouse?.warehouse) {
      setVaultWarehouse(null);
      return;
    }

    if (selectedWarehouse?.vault_warehouse) {
      setVaultWarehouse(selectedWarehouse.vault_warehouse);
    }

    setVaultLoading(true);
    const headers = {};

    fetch(
      `/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info?warehouse=${encodeURIComponent(
        selectedWarehouse.warehouse
      )}`,
      {
        headers,
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const v = data?.message?.vault_warehouse || selectedWarehouse?.vault_warehouse;
        setVaultWarehouse(v || "No Vault Configured");
      })
      .catch(() => setVaultWarehouse(selectedWarehouse?.vault_warehouse || "No Vault Configured"))
      .finally(() => setVaultLoading(false));
  }, [selectedWarehouse?.warehouse, selectedWarehouse?.vault_warehouse, loginUser?.user?.email]);

  const applyAndSaveFontSize = (key) => {
    const px = FONT_SIZE_MAP[key] || 16;
    document.documentElement.style.fontSize = `${px}px`;
    try {
      localStorage.setItem("document_font_size", px);
    } catch (e) {
      console.error("Error saving font size to localStorage:", e);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("document_font_size");
      const key = FONT_SIZE_TO_KEY[stored] || "normal";
      setFontSize(key);
      const px = FONT_SIZE_MAP[key] || 16;
      document.documentElement.style.fontSize = `${px}px`;
    } catch (e) {
      console.error("Error loading font size from localStorage:", e);
    }
  }, []);

  const handleSave = () => {
    updateUser(draft);
    applyAndSaveFontSize(fontSize);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setDraft({ name: user.name || "", phone: user.phone || "" });
    setEditing(false);
  };

  const handleFontSizeChange = (selectedKey) => {
    setFontSize(selectedKey);
    applyAndSaveFontSize(selectedKey);
  };

  // Readiness checklist calculations
  const readiness = useMemo(() => {
    const userDone = Boolean(user.name && user.email);
    const counterDone = Boolean(selectedWarehouse?.warehouse);
    const vaultDone = Boolean(vaultWarehouse && vaultWarehouse !== "No Vault Configured");
    const fontDone = Boolean(fontSize);

    const items = [
      { id: "profile", label: "User Profile Configured", done: userDone },
      { id: "counter", label: "Branch Counter Assigned", done: counterDone },
      { id: "vault", label: "Secure Vault Linked", done: vaultDone },
      { id: "display", label: "Display Scaling Applied", done: fontDone },
    ];

    const completed = items.filter((i) => i.done).length;
    return { items, completed, total: items.length };
  }, [user, selectedWarehouse, vaultWarehouse, fontSize]);

  return (
    <div className="money-settings-new min-h-screen flex flex-col bg-page text-ink transition-colors">
      <style>{`
        .money-settings-new {
          background-color: var(--color-page);
          min-height: 100vh;
          font-family: var(--font-sans);
          color: var(--color-ink);
        }
        .money-settings-new .card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-card);
        }
        .money-settings-new .lbl {
          display: block;
          font-size: var(--text-label);
          line-height: var(--text-label--line-height);
          font-weight: var(--text-label--font-weight);
          color: var(--color-ink);
          margin-bottom: 6px;
        }
        .money-settings-new .inp {
          width: 100%;
          height: 48px;
          border: 1px solid var(--color-line-strong);
          border-radius: var(--radius-input);
          padding: 0 14px;
          font-size: 15px;
          color: var(--color-ink);
          background-color: var(--color-surface);
          box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .money-settings-new .inp:focus {
          outline: none;
          border-color: var(--color-brand-600);
          box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.15);
        }
        .money-settings-new .sec {
          padding: 28px;
          border-bottom: 1px solid var(--color-line);
        }
        .money-settings-new .h {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          font-size: 18px;
          line-height: 24px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .money-settings-new .n {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--color-ink);
          color: var(--color-surface);
          font-size: 13px;
          line-height: 18px;
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .money-settings-new .g2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .money-settings-new .g3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 840px) {
          .money-settings-new .g2,
          .money-settings-new .g3 {
            grid-template-columns: 1fr;
          }
        }
        .money-settings-new .chip {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: 13px;
          line-height: 18px;
          font-weight: 600;
          background-color: var(--color-chip);
          color: var(--color-ink-soft);
        }
        .money-settings-new .ok {
          background-color: var(--color-success-bg);
          color: var(--color-success-fg);
          border: 1px solid var(--color-success-border);
        }
        .money-settings-new .warn {
          background-color: var(--color-warning-bg);
          color: var(--color-warning-fg);
          border: 1px solid var(--color-warning-border);
        }
        .money-settings-new .opt {
          border: 1.5px solid var(--color-line-strong);
          border-radius: 12px;
          padding: 16px;
          background-color: var(--color-surface);
          cursor: pointer;
          transition: all .15s;
        }
        .money-settings-new .opt:hover {
          border-color: var(--color-brand-600);
        }
        .money-settings-new .opt.sel {
          border-color: var(--color-brand-600);
          background-color: var(--color-brand-50);
        }
        .money-settings-new .row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          line-height: 20px;
          font-weight: 400;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-line-subtle);
        }
        .money-settings-new .row:last-child {
          border-bottom: none;
        }
        .money-settings-new .row span:first-child {
          color: var(--color-muted);
        }
        .money-settings-new .row span:last-child {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--color-ink);
        }
        .money-settings-new .btn {
          height: 48px;
          padding: 0 24px;
          border-radius: 12px;
          border: 0;
          background-color: var(--color-brand-600);
          color: #fff;
          font: 600 15px / 22px var(--font-sans);
          cursor: pointer;
          transition: all .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .money-settings-new .btn:hover:not(:disabled) {
          background-color: var(--color-brand-700);
        }
        .money-settings-new .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .money-settings-new .ghost {
          background-color: var(--color-surface);
          color: var(--color-ink);
          border: 1px solid var(--color-line-strong);
        }
        .money-settings-new .ghost:hover:not(:disabled) {
          background-color: var(--color-surface-alt);
        }
        .money-settings-new .chk {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          line-height: 20px;
          font-weight: 600;
          padding: 6px 0;
          color: var(--color-ink);
        }
        .money-settings-new .dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--color-success);
          flex: none;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 12px;
        }
        .money-settings-new .dot.o {
          background-color: var(--color-surface);
          border: 2px solid var(--color-line-strong);
        }
        @media (max-width: 1024px) {
          .money-settings-new .main-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      <main className="grow py-6 px-4 sm:px-6 w-full pb-20">
        <div className="max-w-[80%] mx-auto">

          {/* Top Page Header Bar */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-brand-50 text-brand-600 border border-brand-200">
                  <Sliders size={12} strokeWidth={2.5} />
                  Configuration
                </span>
                <span className="text-xs text-muted font-medium">
                  POS &amp; Terminal Management
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                Workstation Settings
              </h1>
              <p className="text-sm text-muted mt-0.5">
                Manage teller credentials, assigned branch cash counter, secure vault routing, and visual display scaling.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="chip ok gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Active Session
              </span>
              <span className="chip">
                Branch: {selectedWarehouse?.warehouse ? selectedWarehouse.warehouse : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div
            className="main-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 380px",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* Left Column: Form Sections Card */}
            <div className="card" style={{ overflow: "hidden" }}>

              {/* Notice if warehouse not assigned */}
              {!selectedWarehouse?.warehouse && (
                <div
                  className="warn"
                  style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid var(--color-line)",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <AlertTriangle size={18} className="shrink-0 text-warning" />
                  <div>
                    <strong>Branch location required:</strong> User is not assigned to an active branch location. Please assign a branch in ERPNext.
                  </div>
                </div>
              )}

              {/* Saved Notification Banner */}
              {saved && (
                <div
                  className="ok"
                  style={{
                    padding: "16px 28px",
                    borderBottom: "1px solid var(--color-line)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-success" />
                    <span className="font-semibold text-sm">
                      Settings updated and applied successfully!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaved(false)}
                    className="text-success-fg hover:opacity-75 transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* ── Section 1: User Profile ─────────────────────────────── */}
              <div className="sec">
                <div className="h">
                  <div className="n">1</div>
                  <div className="flex-1">
                    <span className="font-bold text-lg text-ink">User Profile &amp; Identity</span>
                    <span className="text-xs text-muted font-medium block">
                      Account credentials and workstation teller details
                    </span>
                  </div>
                  {/* !editing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({ name: user.name || "", phone: user.phone || "" });
                        setEditing(true);
                      }}
                      className="btn ghost text-xs font-bold"
                      style={{ height: "36px", padding: "0 14px" }}
                    >
                      <Edit3 size={13} />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="btn text-xs font-bold"
                        style={{ height: "36px", padding: "0 14px" }}
                      >
                        <Save size={13} />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn ghost text-xs font-bold"
                        style={{ height: "36px", padding: "0 14px" }}
                      >
                        <X size={13} />
                        Cancel
                      </button>
                    </div>
                  ) */}
                </div>

                <div className="g2">
                  <div>
                    <label className="lbl">Full Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                        placeholder="Your full name"
                        className="inp"
                      />
                    ) : (
                      <div className="h-12 border border-line rounded-[10px] px-3.5 flex items-center bg-surface-alt text-ink font-medium text-sm">
                        <User size={15} className="mr-2.5 text-muted" />
                        {user.name || "—"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="lbl">Email Address</label>
                    <div className="h-12 border border-line rounded-[10px] px-3.5 flex items-center bg-surface-alt text-ink font-medium text-sm">
                      <Mail size={15} className="mr-2.5 text-muted" />
                      <span className="truncate">{user.email || "—"}</span>
                      <span className="ml-auto text-[11px] font-semibold text-success-fg bg-success-bg border border-success-border px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="lbl">Phone Number</label>
                    {editing ? (
                      <input
                        type="text"
                        value={draft.phone}
                        onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="+679 000 0000"
                        className="inp"
                      />
                    ) : (
                      <div className="h-12 border border-line rounded-[10px] px-3.5 flex items-center bg-surface-alt text-ink font-medium text-sm">
                        <Phone size={15} className="mr-2.5 text-muted" />
                        {user.phone || "—"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="lbl">Member Since</label>
                    <div className="h-12 border border-line rounded-[10px] px-3.5 flex items-center bg-surface-alt text-ink font-medium text-sm">
                      <Calendar size={15} className="mr-2.5 text-muted" />
                      <span>{user.joined || "Current Session"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Branch & Cash Counter ─────────────────────── */}
              <div className="sec">
                <div className="h">
                  <div className="n">2</div>
                  <div className="flex-1">
                    <span className="font-bold text-lg text-ink">Branch Location &amp; Cash Counter</span>
                    <span className="text-xs text-muted font-medium block">
                      Active POS drawer and inventory warehouse mapping
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="lbl">Active Branch Counter</label>
                    {warehouses && warehouses.length > 0 ? (
                      <div className="relative">
                        <select
                          value={selectedWarehouse?.warehouse || ""}
                          onChange={(e) =>
                            setSelectedWarehouse(
                              warehouses.find((w) => w.warehouse === e.target.value)
                            )
                          }
                          className="inp appearance-none pr-10 cursor-pointer font-medium"
                        >
                          {warehouses.map((wh) => (
                            <option
                              key={wh.warehouse || wh.name}
                              value={wh.warehouse}
                            >
                              {wh.warehouse}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full border border-warning-border rounded-[10px] px-4 py-3 text-sm text-warning-fg bg-warning-bg flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>No branch locations assigned to this user profile.</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-alt border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${selectedWarehouse?.warehouse
                          ? "bg-success animate-pulse"
                          : "bg-warning"
                          }`}
                      />
                      <span className="font-medium text-muted">Active POS Counter:</span>
                      <strong className="text-ink">
                        {selectedWarehouse?.warehouse || "None Selected"}
                      </strong>
                    </div>
                    <span className="text-muted text-[11px]">
                      Changes update immediately across Money Transfer &amp; Exchange.
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Linked Vault Warehouse ─────────────────────── */}
              <div className="sec">
                <div className="h">
                  <div className="n">3</div>
                  <div className="flex-1">
                    <span className="font-bold text-lg text-ink">Linked Secure Vault</span>
                    <span className="text-xs text-muted font-medium block">
                      Target repository for vault transfers and end-of-day balances
                    </span>
                  </div>
                </div>

                <div>
                  <label className="lbl">Linked Vault Destination</label>
                  <div className="h-12 border border-line rounded-[10px] px-3.5 flex items-center justify-between bg-surface-alt text-ink font-medium text-sm">
                    <div className="flex items-center gap-2.5">
                      <Lock size={15} className="text-muted" />
                      <span>
                        {vaultLoading ? "Locating Vault..." : vaultWarehouse || "No Vault Configured"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-bg text-warning-fg border border-warning-border">
                      <ShieldCheck size={13} className="text-warning" />
                      Secure Vault
                    </span>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center gap-2 bg-surface-alt border border-line rounded-xl px-3 py-1.5 text-xs text-muted">
                    <span className={`w-2 h-2 rounded-full ${selectedWarehouse?.warehouse ? "bg-success" : "bg-muted"}`} />
                    Counter Warehouse:&nbsp;
                    <strong className="text-ink">{selectedWarehouse?.warehouse || "—"}</strong>
                  </span>
                  <span className="inline-flex items-center gap-2 bg-warning-bg border border-warning-border rounded-xl px-3 py-1.5 text-xs text-warning-fg">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    Vault Transfer Route:&nbsp;
                    <strong className="text-ink">{vaultWarehouse || "—"}</strong>
                  </span>
                </div>
              </div>

              {/* ── Section 4: Interface & Theme Preferences ──────────────── */}
              <div className="sec">
                <div className="h">
                  <div className="n">4</div>
                  <div className="flex-1">
                    <span className="font-bold text-lg text-ink">Interface &amp; Display Preferences</span>
                    <span className="text-xs text-muted font-medium block">
                      Light/dark theme toggle, workstation text scale, and readability optimization
                    </span>
                  </div>
                </div>

                {/* Theme Selector */}
                <div className="mb-6">
                  <label className="lbl">Workstation Theme Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setTheme("light")}
                      className={`opt flex items-center justify-between ${theme === "light" ? "sel" : ""}`}
                      style={{ padding: "14px 16px" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                          <Sun size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-ink">Light Theme</div>
                          <div className="text-xs text-muted">Crisp white and clean slate</div>
                        </div>
                      </div>
                      {theme === "light" && (
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => setTheme("dark")}
                      className={`opt flex items-center justify-between ${theme === "dark" ? "sel" : ""}`}
                      style={{ padding: "14px 16px" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 text-indigo-300 flex items-center justify-center border border-gray-700">
                          <Moon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-ink">Dark Theme</div>
                          <div className="text-xs text-muted">Reduced glare for night/long shifts</div>
                        </div>
                      </div>
                      {theme === "dark" && (
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="lbl">Base Document Font Scaling</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "small", label: "Small", px: "" },
                      { key: "normal", label: "Normal", px: "(Default)" },
                      { key: "large", label: "Large", px: "" },
                      { key: "larger", label: "Larger", px: "" },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        onClick={() => handleFontSizeChange(opt.key)}
                        className={`opt ${fontSize === opt.key ? "sel" : ""}`}
                        style={{ padding: "12px 14px" }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-ink">{opt.label}</span>
                          {fontSize === opt.key && (
                            <span className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted">{opt.px}</span>
                      </div>
                    ))}
                  </div>

                  {/* Font Preview Card */}
                  <div className="mt-4 p-4 rounded-xl border border-dashed border-line-strong bg-surface-alt">
                    <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
                      <span>Typography Live Preview</span>
                      <span className="font-semibold text-ink">Current Scale: {FONT_SIZE_MAP[fontSize] || 16}px</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-ink">
                        MH Money Express • Foreign Currency Exchange
                      </p>
                      <p className="text-muted text-sm">
                        Buy USD 1,000.00 @ Rate 2.2150 → Pay FJD 2,215.00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div
                className="bg-surface-alt border-t border-line"
                style={{
                  padding: "20px 28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div className="text-xs text-muted">
                  Settings and theme preferences are stored locally on this machine and synced across views.
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn"
                  >
                    <Save size={16} />
                    <span>Save All Changes</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Workstation & Readiness Sidebar */}
            <aside
              className="custom-scrollbar"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                position: "sticky",
                top: "24px",
              }}
            >
              {/* Account Summary Card */}
              <div className="card" style={{ padding: "24px" }}>
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : "TE")}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-surface" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-base text-ink truncate">
                      {user.name || "Teller Operator"}
                    </h2>
                    <p className="text-xs text-muted truncate">{user.email || "No email"}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-warning-fg bg-warning-bg px-2 py-0.5 rounded-full border border-warning-border uppercase tracking-wider">
                      {user.role || "Cashier"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-3 border-t border-line">
                  <div className="row">
                    <span>Assigned Counter</span>
                    <span className="truncate max-w-[170px]">
                      {selectedWarehouse?.warehouse || "Unassigned"}
                    </span>
                  </div>
                  <div className="row">
                    <span>Linked Vault</span>
                    <span className="truncate max-w-[170px]">
                      {vaultWarehouse || "—"}
                    </span>
                  </div>
                  <div className="row">
                    <span>Active Theme</span>
                    <span className="capitalize font-semibold text-brand-600">{theme} Mode</span>
                  </div>
                  <div className="row">
                    <span>Base Font Scale</span>
                    <span>{FONT_SIZE_TO_KEY[FONT_SIZE_MAP[fontSize] || 16]}</span>
                  </div>
                  <div className="row">
                    <span>Workstation Status</span>
                    <span className="text-success-fg font-semibold">Active &amp; Ready</span>
                  </div>
                </div>
              </div>

              {/* Ready to submit / Workstation Readiness Checklist */}
              <div className="card" style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  <strong className="text-ink">Workstation Readiness</strong>
                  <span className="text-muted">
                    {readiness.completed} of {readiness.total}
                  </span>
                </div>

                <div
                  style={{
                    height: "8px",
                    borderRadius: "8px",
                    background: "var(--color-line)",
                    marginBottom: "16px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((readiness.completed / readiness.total) * 100)}%`,
                      height: "8px",
                      borderRadius: "8px",
                      background: "var(--color-success)",
                      transition: "width .3s ease",
                    }}
                  />
                </div>

                <div className="space-y-1">
                  {readiness.items.map((item) => (
                    <div key={item.id} className="chk">
                      <span className={`dot ${item.done ? "" : "o"}`}>
                        {item.done ? "✓" : ""}
                      </span>
                      <span className={`font-medium ${item.done ? "text-ink" : "text-muted"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Notice & Guidance Card */}
              <div
                className="card"
                style={{
                  padding: "20px",
                  background: "var(--color-surface-alt)",
                  borderColor: "var(--color-line)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-brand-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted leading-relaxed">
                    <strong className="text-ink block mb-1">
                      Multi-Counter Operations:
                    </strong>
                    Switching your active counter updates stock availability queries and transaction journaling for the current session. Always ensure your counter aligns with your physical cash drawer.
                  </div>
                </div>
              </div>
            </aside>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
