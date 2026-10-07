import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import axios from "axios";
import {
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Banknote,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Sparkles,
  Info,
  Layers,
  ArrowDownUp,
  X,
  SlidersHorizontal,
} from "lucide-react";

// ── Currency / Country mapping ────────────────────────────────────────────────
const SUPPORTED_CURRENCIES = [
  { code: "FJD", country: "Fiji", label: "Fiji Dollar", symbol: "$" },
  { code: "AUD", country: "Australia", label: "Australian Dollar", symbol: "A$" },
  { code: "USD", country: "USA", label: "US Dollar", symbol: "$" },
  { code: "NZD", country: "New Zealand", label: "NZ Dollar", symbol: "NZ$" },
  { code: "EUR", country: "Euro Area", label: "Euro", symbol: "€" },
  { code: "GBP", country: "UK", label: "British Pound", symbol: "£" },
  { code: "CAD", country: "Canada", label: "Canadian Dollar", symbol: "C$" },
  { code: "JPY", country: "Japan", label: "Japanese Yen", symbol: "¥" },
  { code: "VUV", country: "Vanuatu", label: "Vanuatu Vatu", symbol: "VT" },
  { code: "WST", country: "Samoa", label: "Samoan Tala", symbol: "WS$" },
  { code: "TOP", country: "Tonga", label: "Tongan Paʻanga", symbol: "T$" },
];

// ── Print Vault Transfer Thermal Slip ───────────────────────────────────────
function printVaultTransferSlip({ transferData, fromWh, toWh, direction, tellerName, company }) {
  const printWindow = window.open("", "_blank", "width=420,height=650");
  if (!printWindow) {
    alert("Please allow popups to print transfer receipt.");
    return;
  }

  const items = transferData?.items || [];
  const totalAmount = Number(transferData?.total_amount || 0).toFixed(2);
  const totalQty = transferData?.total_qty || 0;
  const seName = transferData?.stock_entry || "—";
  const dateStr = transferData?.posting_date || new Date().toISOString().split("T")[0];
  const timeStr = (transferData?.posting_time || new Date().toTimeString().split(" ")[0]).split(".")[0];
  const dirLabel = direction === "VAULT_TO_COUNTER" ? "VAULT -> CASH COUNTER (REPLENISH)" : "CASH COUNTER -> VAULT (DEPOSIT)";

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vault Transfer Slip - ${seName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Share Tech Mono', monospace; font-size: 11px; }
          body { width: 78mm; padding: 12px; margin: 0 auto; color: #111; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .divider { border: none; border-top: 1px dashed #666; margin: 8px 0; }
          .divider-solid { border: none; border-top: 1.5px solid #000; margin: 8px 0; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { font-size: 10px; color: #444; }
          .badge { display: inline-block; padding: 2px 6px; background: #eee; font-weight: bold; font-size: 10px; border-radius: 3px; margin: 4px 0; }
          .total { font-size: 15px; font-weight: bold; }
          .sig-box { margin-top: 18px; display: flex; justify-content: space-between; }
          .sig-line { width: 45%; border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${company || "MH MONEY EXPRESS"}</div>
          <div class="subtitle">INTERNAL VAULT TRANSFER RECEIPT</div>
          <div class="badge">${dirLabel}</div>
        </div>
        <hr class="divider" />
        <div class="row"><span>ENTRY NO:</span><span class="bold">${seName}</span></div>
        <div class="row"><span>DATE / TIME:</span><span>${dateStr} ${timeStr}</span></div>
        <div class="row"><span>TELLER:</span><span>${tellerName || "Authorized Teller"}</span></div>
        <hr class="divider" />
        <div class="row"><span>SOURCE (FROM):</span><span class="bold">${fromWh}</span></div>
        <div class="row"><span>TARGET (TO):</span><span class="bold">${toWh}</span></div>
        <hr class="divider" />
        <div class="row bold"><span>DENOMINATION</span><span>QTY &times; RATE</span><span style="text-align:right">SUBTOTAL</span></div>
        <hr class="divider" />
        ${items.map(it => `
          <div class="row">
            <span>${it.item_code}</span>
            <span>${it.qty} &times; ${Number(it.rate).toFixed(2)}</span>
            <span class="bold">${(Number(it.qty) * Number(it.rate)).toFixed(2)}</span>
          </div>
        `).join("")}
        <hr class="divider-solid" />
        <div class="row total">
          <span>TOTAL AMOUNT:</span>
          <span>$${totalAmount}</span>
        </div>
        <div class="row"><span>TOTAL PIECES:</span><span class="bold">${totalQty} units</span></div>
        <hr class="divider" />
        <div class="center subtitle" style="margin-top:6px;">
          Both parties confirm physical verification of the counted cash listed above.
        </div>
        <div class="sig-box">
          <div class="sig-line">TELLER SIGNATURE</div>
          <div class="sig-line">VAULT CUSTODIAN</div>
        </div>
        <div class="center" style="margin-top:14px; font-size:9px; color:#666;">
          Generated automatically via Moneygram System
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ── CRED-Style Slider Component ─────────────────────────────────────────────
function CredSlider({ onConfirm, disabled, amount, currency = "FJD", loading }) {
  const [dragProgress, setDragProgress] = useState(0); // 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const handlePointerDown = (e) => {
    if (disabled || loading) return;
    setIsDragging(true);
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || disabled || loading || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const width = rect.width - 56; // thumb width
    const percentage = Math.min(Math.max((currentX / width) * 100, 0), 100);
    setDragProgress(percentage);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress >= 85) {
      setDragProgress(100);
      onConfirm();
      setTimeout(() => setDragProgress(0), 1000);
    } else {
      setDragProgress(0);
    }
  };

  return (
    <div className="relative select-none">
      <div
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative h-14 rounded-2xl overflow-hidden p-1.5 flex items-center transition-all duration-300 border ${
          disabled
            ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
            : "bg-[#141416] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        }`}
      >
        {/* Glow track underlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#E00000] via-[#FF3B30] to-[#E00000] transition-opacity duration-300 opacity-20 pointer-events-none"
          style={{ width: `${Math.max(dragProgress, 10)}%` }}
        />

        {/* Dynamic completed bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#E00000] to-[#FF453A] rounded-2xl pointer-events-none transition-all duration-75 shadow-[0_0_20px_rgba(224,0,0,0.5)]"
          style={{ width: `calc(${dragProgress}% + ${dragProgress > 0 ? "48px" : "0px"})`, opacity: dragProgress > 0 ? 0.35 : 0 }}
        />

        {/* Center Prompt Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
          {loading ? (
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <RefreshCw size={18} className="animate-spin text-[#E00000]" />
              <span>Securing Transfer...</span>
            </div>
          ) : (
            <span
              className={`text-xs md:text-sm font-bold tracking-wider uppercase transition-opacity duration-200 ${
                disabled ? "text-gray-400" : "text-white/80"
              }`}
              style={{ opacity: isDragging ? Math.max(1 - dragProgress / 50, 0.1) : 1 }}
            >
              Slide to Transfer ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency} &rarr;
            </span>
          )}
        </div>

        {/* Drag Thumb (Slider Knob) */}
        {!disabled && !loading && (
          <div
            onPointerDown={handlePointerDown}
            className="relative z-10 w-11 h-11 rounded-xl bg-gradient-to-b from-white to-gray-200 text-gray-900 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-transform duration-75 active:scale-95 touch-none"
            style={{
              transform: `translateX(${(dragProgress / 100) * ((trackRef.current?.offsetWidth || 300) - 56)}px)`,
            }}
          >
            <ArrowRight size={20} className="text-[#E00000] font-black stroke-[3]" />
          </div>
        )}
      </div>

      {/* Mobile/Quick fallback button */}
      <div className="mt-2 text-center md:hidden">
        <button
          onClick={onConfirm}
          disabled={disabled || loading}
          className="text-xs font-semibold text-[#E00000] underline disabled:text-gray-400"
        >
          Or tap here to confirm
        </button>
      </div>
    </div>
  );
}

// ── Main Vault Transfer Page ─────────────────────────────────────────────────
export default function VaultTransfer() {
  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();

  // Location & Vault State
  const [vaultInfo, setVaultInfo] = useState(null);
  const [vaultLoading, setVaultLoading] = useState(true);
  const [vaultError, setVaultError] = useState(null);

  // Transfer Direction: "VAULT_TO_COUNTER" | "COUNTER_TO_VAULT"
  const [direction, setDirection] = useState("VAULT_TO_COUNTER");

  // Currency Selection
  const [selectedCurrency, setSelectedCurrency] = useState("FJD");
  const selectedCountryObj = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0],
    [selectedCurrency]
  );

  // Denominations & Stock
  const [denominationsData, setDenominationsData] = useState(null);
  const [denomLoading, setDenomLoading] = useState(false);
  const [denomCounts, setDenomCounts] = useState({}); // { [item_code]: qty }

  // Remarks / Reason
  const [remarks, setRemarks] = useState("");

  // Submission & CRED Animation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredSuccess, setShowCredSuccess] = useState(false);
  const [transferSuccessData, setTransferSuccessData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // 1. Resolve Active Warehouse Name
  const activeBranchName = useMemo(() => {
    let name = selectedWarehouse?.warehouse;
    if (!name) {
      try {
        const stored = localStorage.getItem("selected_warehouse");
        if (stored) {
          const parsed = JSON.parse(stored);
          name = parsed?.warehouse || (typeof parsed === "string" ? parsed : null);
        }
      } catch {
        // ignore
      }
    }
    return name;
  }, [selectedWarehouse]);

  // 2. Fetch Vault Info for Active Branch
  const fetchVaultInfo = useCallback(async () => {
    if (!activeBranchName) {
      setVaultLoading(false);
      return;
    }
    try {
      setVaultLoading(true);
      setVaultError(null);
      const res = await axios.get(
        "/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info",
        {
          params: { warehouse: activeBranchName },
          headers: {
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
        }
      );
      if (res.data?.message) {
        setVaultInfo(res.data.message);
      }
    } catch (err) {
      console.error("Failed to load vault info:", err);
      setVaultError(err.response?.data?.message || err.message || "Failed to load linked vault.");
    } finally {
      setVaultLoading(false);
    }
  }, [activeBranchName, loginUser?.user?.api_key, loginUser?.user?.api_secret]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  // 3. Compute Source & Target Warehouses based on Direction
  const sourceWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.vault_warehouse : vaultInfo.branch_warehouse;
  }, [direction, vaultInfo]);

  const targetWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.branch_warehouse : vaultInfo.vault_warehouse;
  }, [direction, vaultInfo]);

  // 4. Fetch Denominations and Stock for the Source Warehouse
  const fetchDenominationsStock = useCallback(async () => {
    if (!sourceWarehouse || !selectedCountryObj) return;
    try {
      setDenomLoading(true);
      const res = await axios.get(
        "/api/method/moneygram.moneygram.api.vault_transfer.get_warehouse_denominations_stock",
        {
          params: {
            warehouse: sourceWarehouse,
            country: selectedCountryObj.country,
          },
          headers: {
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
        }
      );
      const countryResult = res.data?.message?.[selectedCountryObj.country];
      setDenominationsData(countryResult || null);
    } catch (err) {
      console.error("Failed to load denominations stock:", err);
    } finally {
      setDenomLoading(false);
    }
  }, [sourceWarehouse, selectedCountryObj, loginUser?.user?.api_key, loginUser?.user?.api_secret]);

  useEffect(() => {
    fetchDenominationsStock();
    // Reset entered counts when direction or currency changes
    setDenomCounts({});
  }, [fetchDenominationsStock]);

  // Count Handlers
  const handleCountChange = (itemCode, newQty, maxAvail) => {
    const qty = Math.max(0, Math.min(Number(newQty) || 0, maxAvail));
    setDenomCounts((prev) => {
      if (qty === 0) {
        const next = { ...prev };
        delete next[itemCode];
        return next;
      }
      return { ...prev, [itemCode]: qty };
    });
  };

  const handleStepCount = (itemCode, delta, maxAvail) => {
    const current = denomCounts[itemCode] || 0;
    handleCountChange(itemCode, current + delta, maxAvail);
  };

  const handleSetMax = (itemCode, maxAvail) => {
    handleCountChange(itemCode, maxAvail, maxAvail);
  };

  const handleClearAll = () => {
    setDenomCounts({});
  };

  // Combine Notes and Coins with their entered counts
  const notesList = denominationsData?.notes || [];
  const coinsList = denominationsData?.coins || [];
  const allItemsList = useMemo(() => [...notesList, ...coinsList], [notesList, coinsList]);

  // Calculate Totals
  const { totalPieces, totalTransferAmount } = useMemo(() => {
    let pieces = 0;
    let amount = 0;
    for (const item of allItemsList) {
      const count = denomCounts[item.item_code] || 0;
      if (count > 0) {
        pieces += count;
        amount += count * (item.value || 0);
      }
    }
    return { totalPieces: pieces, totalTransferAmount: amount };
  }, [allItemsList, denomCounts]);

  // Switch Direction
  const toggleDirection = () => {
    setDirection((prev) => (prev === "VAULT_TO_COUNTER" ? "COUNTER_TO_VAULT" : "VAULT_TO_COUNTER"));
  };

  // 5. Submit Transfer API
  const handleExecuteTransfer = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      alert("Source and Target warehouses must be identified.");
      return;
    }
    if (totalPieces <= 0 || totalTransferAmount <= 0) {
      alert("Please select at least one denomination quantity to transfer.");
      return;
    }

    const payloadItems = [];
    for (const item of allItemsList) {
      const count = denomCounts[item.item_code] || 0;
      if (count > 0) {
        payloadItems.push({
          item_code: item.item_code,
          qty: count,
          rate: item.value,
        });
      }
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.vault_transfer.create_vault_transfer",
        {
          from_warehouse: sourceWarehouse,
          to_warehouse: targetWarehouse,
          items: payloadItems,
          direction,
          currency: selectedCurrency,
          country: selectedCountryObj.country,
          remarks: remarks || `Vault Transfer ${direction === "VAULT_TO_COUNTER" ? "Vault -> Counter" : "Counter -> Vault"}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
        }
      );

      if (res.data?.message?.status === "success") {
        setTransferSuccessData(res.data.message);
        setShowCredSuccess(true);
        // Refresh stock
        fetchDenominationsStock();
        setDenomCounts({});
        setRemarks("");
      } else {
        alert("Transfer could not be completed: " + JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Transfer error:", err);
      const msg = err.response?.data?.message || err.response?.data?.exception || err.message || "Failed to create transfer.";
      alert("Transfer Error: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 pb-24">
      <Navbar />

      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-50 text-[#E00000] dark:bg-red-950/40">
                  <ShieldCheck size={22} className="stroke-[2.5]" />
                </span>
                <div>
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    Vault Cash Transfer
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400">
                      Live Physical Transfer
                    </span>
                  </h1>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    Seamlessly move currency notes & coins between branch counter drawer and secure vault.
                  </p>
                </div>
              </div>
            </div>

            {/* Active Branch and Vault Badges */}
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-700">
              <div className="text-left px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Active Branch</span>
                <span className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#E00000]" />
                  {activeBranchName || "No Branch Selected"}
                </span>
              </div>
              <div className="h-7 w-[1px] bg-gray-200 dark:bg-gray-700" />
              <div className="text-left px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Linked Vault</span>
                <span className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-500" />
                  {vaultInfo?.vault_warehouse || (vaultLoading ? "Locating Vault..." : "Not Configured")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Container ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {vaultError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300 flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-semibold">{vaultError}</p>
          </div>
        )}

        {/* ── Transfer Direction Switcher Bar ──────────────────────────────── */}
        <div className="mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-3xl p-4 md:p-6 shadow-xl border border-gray-800 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#E00000]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Direction Indicator */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-4">
              {/* FROM (SOURCE) */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Source (Withdraw Cash)
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                    {direction === "VAULT_TO_COUNTER" ? "🏦 Vault" : "🏪 Cash Drawer"}
                  </span>
                </div>
                <div className="text-base md:text-lg font-black tracking-tight text-white truncate" title={sourceWarehouse}>
                  {sourceWarehouse || "—"}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Cash will be deducted from this location
                </div>
              </div>

              {/* TOGGLE BUTTON */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={toggleDirection}
                  className="group relative p-3 md:p-4 rounded-2xl bg-gradient-to-b from-[#E00000] to-[#b30000] text-white shadow-[0_4px_20px_rgba(224,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-200 border border-red-400/30"
                  title="Switch Transfer Direction"
                >
                  <ArrowLeftRight size={22} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-180" />
                </button>
              </div>

              {/* TO (TARGET) */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Destination (Deposit Cash)
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                    {direction === "VAULT_TO_COUNTER" ? "🏪 Cash Drawer" : "🏦 Vault"}
                  </span>
                </div>
                <div className="text-base md:text-lg font-black tracking-tight text-white truncate" title={targetWarehouse}>
                  {targetWarehouse || "—"}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">
                  Cash will be credited into this location
                </div>
              </div>
            </div>

            {/* Quick Direction Selector Buttons */}
            <div className="flex flex-row lg:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDirection("VAULT_TO_COUNTER")}
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  direction === "VAULT_TO_COUNTER"
                    ? "bg-[#E00000] text-white border-red-500 shadow-md"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                <span>🏦 Vault &rarr; 🏪 Counter</span>
                <span className="text-[10px] opacity-80">(Cash In)</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection("COUNTER_TO_VAULT")}
                className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  direction === "COUNTER_TO_VAULT"
                    ? "bg-[#E00000] text-white border-red-500 shadow-md"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                <span>🏪 Counter &rarr; 🏦 Vault</span>
                <span className="text-[10px] opacity-80">(Cash Out)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Layout: Denominations Left, Summary Right ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Currency Tabs + Denomination Grids */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Currency Selector Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Banknote size={18} className="text-[#E00000]" />
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Select Currency to Transfer</span>
                </div>
                <span className="text-xs text-gray-400">
                  {selectedCountryObj.label} ({selectedCountryObj.code})
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const isActive = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 border ${
                        isActive
                          ? "bg-[#E00000] text-white border-red-600 shadow-md scale-105"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span>{c.code}</span>
                      <span className="opacity-70 font-normal">({c.symbol})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Denomination Items Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    Physical Denomination Counts
                    {denomLoading && <RefreshCw size={14} className="animate-spin text-[#E00000]" />}
                  </h2>
                  <p className="text-xs text-gray-400">
                    Enter note & coin counts to transfer from <strong className="text-gray-700 dark:text-gray-200">{sourceWarehouse}</strong>
                  </p>
                </div>
                {totalPieces > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    Reset All Counts
                  </button>
                )}
              </div>

              {denomLoading ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={24} className="animate-spin text-[#E00000]" />
                  <span className="text-sm font-semibold text-gray-500">Checking physical stock in source warehouse...</span>
                </div>
              ) : allItemsList.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Banknote size={36} className="mx-auto mb-2 text-gray-300 stroke-[1.5]" />
                  <p className="text-sm font-semibold">No denomination items found for {selectedCountryObj.country}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Banknotes Section */}
                  {notesList.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Banknote size={15} className="text-[#E00000]" />
                          Banknotes
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {notesList.filter((n) => (denomCounts[n.item_code] || 0) > 0).length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {notesList.map((item) => {
                          const count = denomCounts[item.item_code] || 0;
                          const maxAvail = item.available_qty || 0;
                          const subtotal = count * item.value;
                          const isMax = count >= maxAvail && maxAvail > 0;
                          const outOfStock = maxAvail <= 0;

                          return (
                            <div
                              key={item.item_code}
                              className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                                count > 0
                                  ? "bg-red-50/50 dark:bg-red-950/20 border-red-300 dark:border-red-900 shadow-sm"
                                  : outOfStock
                                  ? "bg-gray-50/60 dark:bg-gray-800/30 border-gray-200/60 dark:border-gray-800 opacity-60"
                                  : "bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-[#b30000] text-white flex items-center justify-center font-black text-sm shadow-sm">
                                    {selectedCountryObj.symbol}
                                    {item.value >= 1 ? item.value : item.value * 100 + "c"}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.item_name}</div>
                                    <div className="text-[11px] font-medium text-gray-400">
                                      Rate: {selectedCountryObj.symbol}
                                      {item.value.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {/* Available Stock Badge */}
                                <div className="text-right">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                      maxAvail > 0
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-500"
                                    }`}
                                  >
                                    In Stock: {maxAvail}
                                  </span>
                                  {count > 0 && (
                                    <div className="text-xs font-black text-[#E00000] mt-1">
                                      {selectedCountryObj.symbol}
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Input and Step Buttons */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                <button
                                  type="button"
                                  disabled={outOfStock || isMax}
                                  onClick={() => handleSetMax(item.item_code, maxAvail)}
                                  className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-40"
                                >
                                  Max
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={count <= 0}
                                    onClick={() => handleStepCount(item.item_code, -1, maxAvail)}
                                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center font-black text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-95 transition-transform"
                                  >
                                    -
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    max={maxAvail}
                                    value={count === 0 ? "" : count}
                                    placeholder="0"
                                    onChange={(e) => handleCountChange(item.item_code, parseInt(e.target.value) || 0, maxAvail)}
                                    disabled={outOfStock}
                                    className="w-16 h-8 text-center text-sm font-black rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000] disabled:bg-gray-100"
                                  />

                                  <button
                                    type="button"
                                    disabled={count >= maxAvail}
                                    onClick={() => handleStepCount(item.item_code, 1, maxAvail)}
                                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center font-black text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-95 transition-transform"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Coins Section */}
                  {coinsList.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Coins size={15} className="text-amber-500" />
                          Coins & Small Denominations
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {coinsList.filter((c) => (denomCounts[c.item_code] || 0) > 0).length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {coinsList.map((item) => {
                          const count = denomCounts[item.item_code] || 0;
                          const maxAvail = item.available_qty || 0;
                          const subtotal = count * item.value;
                          const isMax = count >= maxAvail && maxAvail > 0;
                          const outOfStock = maxAvail <= 0;

                          return (
                            <div
                              key={item.item_code}
                              className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                                count > 0
                                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900 shadow-sm"
                                  : outOfStock
                                  ? "bg-gray-50/60 dark:bg-gray-800/30 border-gray-200/60 dark:border-gray-800 opacity-60"
                                  : "bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                                    {item.value >= 1 ? item.value : item.value * 100 + "c"}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{item.item_name}</div>
                                    <div className="text-[11px] font-medium text-gray-400">
                                      Rate: {selectedCountryObj.symbol}
                                      {item.value.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                      maxAvail > 0
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        : "bg-gray-100 text-gray-400 border border-gray-200 dark:bg-gray-800 dark:text-gray-500"
                                    }`}
                                  >
                                    In Stock: {maxAvail}
                                  </span>
                                  {count > 0 && (
                                    <div className="text-xs font-black text-amber-600 mt-1">
                                      {selectedCountryObj.symbol}
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                <button
                                  type="button"
                                  disabled={outOfStock || isMax}
                                  onClick={() => handleSetMax(item.item_code, maxAvail)}
                                  className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 disabled:opacity-40"
                                >
                                  Max
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={count <= 0}
                                    onClick={() => handleStepCount(item.item_code, -1, maxAvail)}
                                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center font-black text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-95 transition-transform"
                                  >
                                    -
                                  </button>

                                  <input
                                    type="number"
                                    min="0"
                                    max={maxAvail}
                                    value={count === 0 ? "" : count}
                                    placeholder="0"
                                    onChange={(e) => handleCountChange(item.item_code, parseInt(e.target.value) || 0, maxAvail)}
                                    disabled={outOfStock}
                                    className="w-16 h-8 text-center text-sm font-black rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000] disabled:bg-gray-100"
                                  />

                                  <button
                                    type="button"
                                    disabled={count >= maxAvail}
                                    onClick={() => handleStepCount(item.item_code, 1, maxAvail)}
                                    className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center font-black text-gray-700 dark:text-gray-200 disabled:opacity-30 active:scale-95 transition-transform"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): Transfer Review & CRED Interactive Submit */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Transfer Summary</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E00000] dark:bg-red-950/40">
                  {selectedCurrency}
                </span>
              </div>

              {/* Big Grand Total Callout */}
              <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Banknote size={80} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Total Transfer Value
                </span>
                <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
                  <span>{selectedCountryObj.symbol}</span>
                  <span>{totalTransferAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10 text-xs text-gray-300">
                  <span>
                    Total Pieces: <strong className="text-white">{totalPieces} units</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Currency: <strong className="text-white">{selectedCurrency}</strong>
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">From (Source)</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{sourceWarehouse || "—"}</div>
                </div>

                <div className="flex justify-center text-gray-400">
                  <ArrowDownUp size={16} />
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">To (Destination)</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{targetWarehouse || "—"}</div>
                </div>
              </div>

              {/* Transfer Purpose / Remarks Input */}
              <div className="mb-6">
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                  Transfer Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder={direction === "VAULT_TO_COUNTER" ? "Morning Cash Replenishment" : "End-of-day Cash Deposit"}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E00000]"
                />
              </div>

              {/* CRED Interactive Slider Submit */}
              <div className="pt-2">
                <CredSlider
                  onConfirm={handleExecuteTransfer}
                  disabled={totalPieces <= 0 || !sourceWarehouse || !targetWarehouse}
                  amount={totalTransferAmount}
                  currency={selectedCurrency}
                  loading={isSubmitting}
                />
              </div>

              <div className="mt-4 text-center">
                <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  ERPNext Material Transfer &bull; Instant Stock Validation
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CRED-STYLE LUXURY SUCCESS MODAL ANIMATION ──────────────────────── */}
      {showCredSuccess && transferSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
          {/* Ambient Glow Rays */}
          <div className="absolute w-[600px] h-[600px] bg-gradient-to-r from-red-600/30 via-amber-500/20 to-red-600/30 rounded-full blur-[120px] pointer-events-none" />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-lg bg-[#141417] text-white rounded-3xl p-6 md:p-8 border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden">
            <style>{`
              @keyframes strokeDash {
                0% { stroke-dashoffset: 48; opacity: 0; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
              .animate-dash {
                stroke-dasharray: 48;
                stroke-dashoffset: 0;
                animation: strokeDash 0.7s cubic-bezier(0.65, 0, 0.45, 1) forwards;
              }
            `}</style>
            {/* Top Close Button */}
            <button
              onClick={() => setShowCredSuccess(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Cred Iconic Checkmark Spring Animation */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5 flex items-center justify-center">
                {/* Concentric Pulsing Ripples */}
                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-[#E00000] to-amber-500 opacity-25 animate-ping" />
                <div className="absolute w-24 h-24 rounded-full border border-[#E00000]/40 animate-pulse" />

                {/* Central Emblem */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E00000] via-[#FF3B30] to-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(224,0,0,0.6)]">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" className="animate-dash" />
                  </svg>
                </div>
              </div>

              {/* Success Badges */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                <Sparkles size={12} />
                Transfer Verified &amp; Submitted
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                ${Number(transferSuccessData.total_amount).toFixed(2)} {selectedCurrency}
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mb-6">
                Transferred {transferSuccessData.total_qty} units between vault and cash drawer.
              </p>

              {/* Receipt Details Card */}
              <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10 text-left space-y-3 mb-6">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stock Entry Reference</span>
                  <button
                    onClick={() => copyToClipboard(transferSuccessData.stock_entry)}
                    className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300"
                  >
                    <span>{transferSuccessData.stock_entry}</span>
                    {copiedId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Source:</span>
                  <span className="font-semibold text-gray-200">{transferSuccessData.from_warehouse}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Destination:</span>
                  <span className="font-semibold text-gray-200">{transferSuccessData.to_warehouse}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Timestamp:</span>
                  <span className="font-mono text-gray-300">{transferSuccessData.posting_date} {transferSuccessData.posting_time?.split(".")[0]}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    printVaultTransferSlip({
                      transferData: transferSuccessData,
                      fromWh: transferSuccessData.from_warehouse,
                      toWh: transferSuccessData.to_warehouse,
                      direction,
                      tellerName: loginUser?.user?.full_name || loginUser?.user?.user,
                      company: vaultInfo?.company || "MH MONEY EXPRESS",
                    })
                  }
                  className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Printer size={16} />
                  Print Slip
                </button>

                <button
                  type="button"
                  onClick={() => setShowCredSuccess(false)}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#E00000] to-[#b30000] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(224,0,0,0.4)] hover:brightness-110 transition-all"
                >
                  <Check size={16} />
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
