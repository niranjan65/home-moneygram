import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useState, useEffect } from "react";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-label font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

function InfoCell({ value }) {
  return (
    <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-body font-medium text-ink bg-gray-50 tnum">
      {value}
    </div>
  );
}

function EditInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-body font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white text-ink placeholder-muted transition tnum"
    />
  );
}

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

export default function SettingsPanel() {
  const { user, updateUser, selectedWarehouse, setSelectedWarehouse, warehouses } = useSettings();
  const loginUser = useUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: user.name, phone: user.phone });
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
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft({ name: user.name, phone: user.phone });
    setEditing(false);
  };

  const handleFontSizeChange = (event) => {
    const selectedKey = event.target.value;
    setFontSize(selectedKey);
    applyAndSaveFontSize(selectedKey);
  };

  return (
    <div className="min-h-screen bg-[url('../assets/redbg.png')] font-sans flex flex-col">
      <Navbar />

      <div className="w-full max-w-2xl mx-auto px-4 mt-12 mb-20 relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">

          {/* header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-h1 font-bold text-ink tracking-tight leading-snug">Settings</h1>
              <p className="text-muted text-body mt-1">Manage your profile &amp; workspace</p>
            </div>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-600/30">
                {user.avatar}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-ink text-overline font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* user details */}
          <div className="mb-2">
            <p className="text-overline font-semibold tracking-wider uppercase text-brand-600 mb-5">User Details</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Full Name">
                {editing
                  ? <EditInput value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} placeholder="Your name" />
                  : <InfoCell value={user.name} />}
              </Field>
              <Field label="Email">
                <InfoCell value={user.email} />
              </Field>
              <Field label="Phone">
                {editing
                  ? <EditInput value={draft.phone} onChange={(v) => setDraft((d) => ({ ...d, phone: v }))} placeholder="+91 …" />
                  : <InfoCell value={user.phone} />}
              </Field>
              <Field label="Member Since">
                <InfoCell value={user.joined} />
              </Field>
            </div>
          </div>

          {/* edit controls */}
          {/* <div className="flex items-center gap-3 mt-5">
            {!editing ? (
              <button
                onClick={() => { setDraft({ name: user.name, phone: user.phone }); setEditing(true); }}
                className="text-sm font-bold text-gray-600 hover:text-[#E00000] transition-colors px-4 py-2 rounded-xl border border-gray-200 hover:border-[#E00000]/40"
              >
                ✏️ Edit profile
              </button>
            ) : (
              <>
                <button onClick={handleSave} className="text-sm font-bold bg-[#E00000] hover:bg-[#b5f000] hover:text-[#421010] text-white px-5 py-2 rounded-xl transition-all shadow-md">
                  Save changes
                </button>
                <button onClick={handleCancel} className="text-sm font-bold text-gray-500 hover:text-gray-900 px-4 py-2 rounded-xl border border-gray-200 transition-colors">
                  Cancel
                </button>
              </>
            )}
            {saved && <span className="text-xs font-bold text-green-600 animate-pulse ml-2">✓ Saved successfully</span>}
          </div> */}

          <div className="border-t border-gray-100 my-8" />

          {/* warehouse & vault */}
          <div>
            <p className="text-overline font-semibold tracking-wider uppercase text-brand-600 mb-5">Branch &amp; Vault Location</p>
            <div className="space-y-4">
              <Field label="Active Branch Location (Cash Counter)">
                {warehouses && warehouses.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedWarehouse?.warehouse || ""}
                      onChange={(e) => setSelectedWarehouse(warehouses.find((w) => w.warehouse === e.target.value))}
                      className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 text-body font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 bg-gray-50 text-ink transition cursor-pointer"
                    >
                      {warehouses.map((wh) => (
                        <option key={wh.warehouse || wh.name} value={wh.warehouse} className="bg-white text-ink">
                          {wh.warehouse}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="w-full border border-amber-300 rounded-xl px-4 py-3 text-label text-amber-800 bg-amber-50 font-normal flex items-center gap-2">
                    <span>⚠️ User is not assigned to any branch location. Please assign a branch in ERPNext.</span>
                  </div>
                )}
              </Field>

              <Field label="Linked Vault Warehouse">
                <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-body font-medium text-ink bg-gray-50 flex items-center justify-between">
                  <span>{vaultLoading ? "Locating Vault..." : (vaultWarehouse || "No Vault Configured")}</span>
                  <span className="text-caption font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    Secure Vault
                  </span>
                </div>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-caption text-muted font-normal">
                <span className={`w-2 h-2 rounded-full ${selectedWarehouse?.warehouse ? "bg-green-500 animate-pulse" : "bg-amber-500"}`} />
                Active Counter:&nbsp;<span className={`font-semibold ${selectedWarehouse?.warehouse ? "text-ink" : "text-amber-700"}`}>{selectedWarehouse?.warehouse || "No branch location assigned"}</span>
              </span>
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 text-caption text-amber-800 font-normal">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Linked Vault:&nbsp;<span className="font-semibold text-ink">{vaultWarehouse || "—"}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 my-8" />

          {/* preferences */}
          <div className="mb-2">
            <p className="text-overline font-semibold tracking-wider uppercase text-brand-600 mb-5">Preferences</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Font Size">
                <div className="relative">
                  <select
                    value={fontSize}
                    onChange={handleFontSizeChange}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 text-body font-medium focus:outline-none focus:ring-2 focus:ring-brand-600 bg-gray-50 text-ink transition cursor-pointer"
                  >
                    <option value="small">Small</option>
                    <option value="normal">Normal</option>
                    <option value="large">Large</option>
                    <option value="larger">Larger</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>
              {/* <Field label="Email">
                <InfoCell value={user.email} />
              </Field> */}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}