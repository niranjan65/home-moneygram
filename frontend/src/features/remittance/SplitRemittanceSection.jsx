import React, { useMemo } from "react";
import {
  Split,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Banknote,
  ShieldCheck,
} from "lucide-react";

const CHANNELS = [
  { id: "Cash", label: "Cash Over Counter", icon: Banknote, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { id: "M-PAiSA", label: "Vodafone M-PAiSA", icon: Smartphone, color: "text-red-700 bg-red-50 border-red-200" },
  { id: "MyCash", label: "Digicel MyCash", icon: Smartphone, color: "text-blue-700 bg-blue-50 border-blue-200" },
];

export default function SplitRemittanceSection({
  netAmount = 0,
  currency = "FJD",
  enabled = false,
  onToggle,
  legs = [],
  onChangeLegs,
  consent = false,
  onChangeConsent,
  disabled = false,
}) {
  const numericTotal = Math.max(0, parseFloat(netAmount) || 0);

  // Calculate allocated sum
  const allocatedTotal = useMemo(() => {
    return legs.reduce((sum, leg) => sum + (parseFloat(leg.amount) || 0), 0);
  }, [legs]);

  const difference = useMemo(() => {
    return Math.round((numericTotal - allocatedTotal) * 100) / 100;
  }, [numericTotal, allocatedTotal]);

  const isBalanced = numericTotal > 0 && Math.abs(difference) < 0.01;

  const handleAddLeg = () => {
    // Default to the remaining amount if positive
    const remaining = Math.max(0, difference);
    const newLeg = {
      channel: legs.length === 0 ? "Cash" : legs.some((l) => l.channel === "M-PAiSA") ? "MyCash" : "M-PAiSA",
      amount: remaining > 0 ? remaining : 0,
      wallet_reference: "",
      status: "Planned",
    };
    onChangeLegs([...legs, newLeg]);
  };

  const handleUpdateLeg = (index, field, value) => {
    const updated = legs.map((leg, i) => {
      if (i !== index) return leg;
      if (field === "amount") {
        const val = value === "" ? "" : parseFloat(value) || 0;
        return { ...leg, amount: val };
      }
      return { ...leg, [field]: value };
    });
    onChangeLegs(updated);
  };

  const handleRemoveLeg = (index) => {
    if (legs.length <= 1) return;
    onChangeLegs(legs.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-8 rounded-3xl border border-gray-200/90 bg-white p-6 shadow-sm">
      {/* Header with Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E00000] flex items-center justify-center font-bold">
            <Split size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">Multi-Channel Distribution</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-50 text-[#E00000] border border-red-100">
                Cash + Mobile Wallets
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Split incoming remittance across cash collection and mobile wallets (M-PAiSA / MyCash)
            </p>
          </div>
        </div>

        {/* Toggle Pill */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled}
            onChange={(e) => {
              const checked = e.target.checked;
              onToggle(checked);
              if (checked && legs.length === 0) {
                // Initialize with 2 legs by default (Cash + M-PAiSA)
                const half = Math.round((numericTotal / 2) * 100) / 100;
                const rest = Math.round((numericTotal - half) * 100) / 100;
                onChangeLegs([
                  { channel: "Cash", amount: half, wallet_reference: "", status: "Planned" },
                  { channel: "M-PAiSA", amount: rest, wallet_reference: "", status: "Planned" },
                ]);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E00000]"></div>
          <span className="ml-3 text-xs font-bold text-gray-700">
            {enabled ? "Split Enabled" : "Single Payout"}
          </span>
        </label>
      </div>

      {enabled && (
        <div className="pt-6 space-y-6 animate-in fade-in duration-200">
          {/* Distribution Legs List */}
          <div className="space-y-3">
            {legs.map((leg, index) => {
              const channelInfo = CHANNELS.find((c) => c.id === leg.channel) || CHANNELS[0];
              const Icon = channelInfo.icon;

              return (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-white hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex items-center gap-2 md:w-48 shrink-0">
                    <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                      {index + 1}
                    </span>
                    <select
                      value={leg.channel}
                      disabled={disabled}
                      onChange={(e) => handleUpdateLeg(index, "channel", e.target.value)}
                      className="h-11 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E00000]"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="flex-1 min-w-[160px]">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        {currency} $
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={leg.amount === 0 && legs.length === 1 ? "" : leg.amount}
                        disabled={disabled}
                        placeholder="0.00"
                        onChange={(e) => handleUpdateLeg(index, "amount", e.target.value)}
                        className="h-11 w-full bg-white border border-gray-200 rounded-xl pl-16 pr-4 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]"
                      />
                    </div>
                  </div>

                  {/* Wallet Phone Number (Required for M-PAiSA / MyCash) */}
                  {leg.channel !== "Cash" ? (
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Smartphone
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={leg.wallet_reference || ""}
                          disabled={disabled}
                          placeholder="Wallet Phone (679XXXXXXX)"
                          onChange={(e) => handleUpdateLeg(index, "wallet_reference", e.target.value)}
                          className="h-11 w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E00000]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-[200px] flex items-center text-xs text-gray-400 px-3 italic">
                      Disbursed in physical cash over counter
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={disabled || legs.length <= 1}
                    onClick={() => handleRemoveLeg(index)}
                    className="h-11 w-11 shrink-0 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Remove Leg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Leg Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={handleAddLeg}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
            >
              <Plus size={14} className="text-[#E00000]" />
              <span>Add Distribution Leg</span>
            </button>

            {/* Quick Auto-Balance Button if difference exists */}
            {difference !== 0 && legs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const lastIdx = legs.length - 1;
                  const currentLastAmt = parseFloat(legs[lastIdx].amount) || 0;
                  const adjusted = Math.max(0, currentLastAmt + difference);
                  handleUpdateLeg(lastIdx, "amount", Math.round(adjusted * 100) / 100);
                }}
                className="text-xs font-bold text-[#E00000] hover:underline"
              >
                Auto-balance remaining (${Math.abs(difference).toFixed(2)})
              </button>
            )}
          </div>

          {/* Allocation Balance Summary Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isBalanced
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                {isBalanced ? (
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-bold">
                    {isBalanced
                      ? "Distribution fully allocated and balanced"
                      : difference > 0
                      ? `Unallocated remainder: $${difference.toFixed(2)} ${currency}`
                      : `Over-allocated by: $${Math.abs(difference).toFixed(2)} ${currency}`}
                  </p>
                  <p className="text-[11px] opacity-80">
                    Net Remittance: ${numericTotal.toFixed(2)} · Allocated: ${allocatedTotal.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] uppercase font-bold tracking-wider opacity-60">Status</span>
                <p className="text-sm font-black">
                  {isBalanced ? "MATCHED (100%)" : `${Math.round((allocatedTotal / (numericTotal || 1)) * 100)}% ALLOCATED`}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/80 cursor-pointer select-none transition">
              <input
                type="checkbox"
                checked={consent}
                disabled={disabled}
                onChange={(e) => onChangeConsent(e.target.checked)}
                className="mt-0.5 rounded text-[#E00000] focus:ring-[#E00000]"
              />
              <div className="text-xs text-gray-700">
                <span className="font-bold flex items-center gap-1.5 text-gray-900">
                  <ShieldCheck size={14} className="text-[#E00000]" />
                  Customer Payout Allocation Consent
                </span>
                <span className="text-gray-500 block mt-0.5">
                  The recipient has reviewed and confirmed the split payout distribution between cash and designated mobile wallets.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
