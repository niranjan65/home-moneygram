import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold tracking-widest uppercase text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function InfoCell({ value }) {
  return (
    <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 font-medium tracking-wide">
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
      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E00000] bg-white text-gray-900 placeholder-gray-400 transition"
    />
  );
}

export default function SettingsPanel() {
  const { user, updateUser, selectedWarehouse, setSelectedWarehouse, warehouses } = useSettings();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: user.name, phone: user.phone });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateUser(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCancel = () => {
    setDraft({ name: user.name, phone: user.phone });
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-[url('../assets/redbg.png')] font-sans flex flex-col">
      <Navbar />

      <div className="w-full max-w-2xl mx-auto px-4 mt-12 mb-20 relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100">

          {/* header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-snug">Settings</h2>
              <p className="text-gray-500 text-sm mt-1">Manage your profile &amp; workspace</p>
            </div>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#E00000] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#E00000]/30">
                {user.avatar}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-gray-900 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                {user.role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 mb-8" />

          {/* user details */}
          <div className="mb-2">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000] mb-5">User Details</p>
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
          <div className="flex items-center gap-3 mt-5">
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
          </div>

          <div className="border-t border-gray-100 my-8" />

          {/* warehouse */}
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000] mb-5">Location</p>
            <Field label="Active Location">
              <div className="relative">
                <select
                  value={selectedWarehouse?.warehouse}
                  onChange={(e) => setSelectedWarehouse(warehouses.find((w) => w.warehouse === e.target.value))}
                  className="w-full appearance-none border border-gray-300 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#E00000] bg-gray-50 text-gray-900 transition cursor-pointer"
                >
                  {warehouses?.map((wh) => (
                    <option key={wh.name} value={wh.warehouse} className="bg-white text-gray-900">{wh.warehouse}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </Field>
            <div className="mt-4">
              <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Currently active:&nbsp;<span className="font-bold text-gray-900">{selectedWarehouse?.warehouse}</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}