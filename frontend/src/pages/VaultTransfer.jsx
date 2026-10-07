import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import axios from "axios";
import {
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  Coins,
  Printer,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
  ShieldCheck,
  Building2,
} from "lucide-react";

// ── Supported Currencies ────────────────────────────────────────────────────
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

// ── Print Slip Helper ───────────────────────────────────────────────────────
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
  const dirLabel =
    direction === "VAULT_TO_COUNTER"
      ? "VAULT -> CASH COUNTER (REPLENISH)"
      : "CASH COUNTER -> VAULT (DEPOSIT)";

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
  const [dragProgress, setDragProgress] = useState(0);
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
    const width = rect.width - 52;
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
        className={`relative h-13 rounded-2xl overflow-hidden p-1 flex items-center transition-all duration-300 border ${
          disabled
            ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed"
            : "bg-gray-900 border-gray-800 shadow-md"
        }`}
      >
        {/* Glow fill */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#E00000] to-[#FF453A] rounded-2xl pointer-events-none transition-all duration-75"
          style={{
            width: `calc(${dragProgress}% + ${dragProgress > 0 ? "46px" : "0px"})`,
            opacity: dragProgress > 0 ? 0.4 : 0,
          }}
        />

        {/* Center Prompt Label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-10">
          {loading ? (
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <RefreshCw size={15} className="animate-spin text-[#E00000]" />
              <span>Processing Transfer...</span>
            </div>
          ) : (
            <span
              className={`text-xs font-bold tracking-wider uppercase transition-opacity duration-200 ${
                disabled ? "text-gray-400" : "text-white"
              }`}
              style={{ opacity: isDragging ? Math.max(1 - dragProgress / 50, 0.15) : 1 }}
            >
              Slide to Transfer ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency} &rarr;
            </span>
          )}
        </div>

        {/* Thumb */}
        {!disabled && !loading && (
          <div
            onPointerDown={handlePointerDown}
            className="relative z-10 w-11 h-11 rounded-xl bg-white text-gray-900 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-transform duration-75 active:scale-95 touch-none"
            style={{
              transform: `translateX(${(dragProgress / 100) * ((trackRef.current?.offsetWidth || 280) - 52)}px)`,
            }}
          >
            <ArrowRight size={18} className="text-[#E00000] font-black stroke-[3]" />
          </div>
        )}
      </div>

      {/* Fallback button */}
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || loading}
          className="text-xs font-semibold text-[#E00000] hover:underline disabled:text-gray-300 transition-colors"
        >
          Or click here to submit
        </button>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function VaultTransfer() {
  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();

  // Internal vault details (fetched silently)
  const [vaultInfo, setVaultInfo] = useState(null);
  const [vaultLoading, setVaultLoading] = useState(true);

  // Direction: "VAULT_TO_COUNTER" | "COUNTER_TO_VAULT"
  const [direction, setDirection] = useState("VAULT_TO_COUNTER");

  // Selected Currency
  const [selectedCurrency, setSelectedCurrency] = useState("FJD");
  const selectedCountryObj = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0],
    [selectedCurrency]
  );

  // Denominations & Count State
  const [denominationsData, setDenominationsData] = useState(null);
  const [denomLoading, setDenomLoading] = useState(false);
  const [denomCounts, setDenomCounts] = useState({});
  const [remarks, setRemarks] = useState("");

  // Submission & CRED Success Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredSuccess, setShowCredSuccess] = useState(false);
  const [transferSuccessData, setTransferSuccessData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Active branch warehouse from settings
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
        // fallback
      }
    }
    return name;
  }, [selectedWarehouse]);

  // Fetch Vault info silently
  useEffect(() => {
    if (!activeBranchName) {
      setVaultLoading(false);
      return;
    }
    setVaultLoading(true);
    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info", {
        params: { warehouse: activeBranchName },
        headers: {
          Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
        },
      })
      .then((res) => {
        if (res.data?.message) {
          setVaultInfo(res.data.message);
        }
      })
      .catch((err) => console.error("Error loading vault info:", err))
      .finally(() => setVaultLoading(false));
  }, [activeBranchName, loginUser?.user?.api_key, loginUser?.user?.api_secret]);

  // Compute Source & Target Warehouses
  const sourceWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.vault_warehouse : vaultInfo.branch_warehouse;
  }, [direction, vaultInfo]);

  const targetWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.branch_warehouse : vaultInfo.vault_warehouse;
  }, [direction, vaultInfo]);

  // Fetch Denomination Stock in Source Warehouse
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

  // Submit Transfer
  const handleExecuteTransfer = async () => {
    if (!sourceWarehouse || !targetWarehouse) {
      alert("Transfer location not ready. Please verify your assigned location in Settings.");
      return;
    }
    if (totalPieces <= 0 || totalTransferAmount <= 0) {
      alert("Please enter at least one denomination count to transfer.");
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
        fetchDenominationsStock();
        setDenomCounts({});
        setRemarks("");
      } else {
        alert("Transfer could not be processed.");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to create transfer.";
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navbar />

      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto w-full">
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-gray-900 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Vault <span className="text-[#E00000] italic">Transfer</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Transfer physical cash notes and coins between Cash Counter and Vault.
            </p>
          </div>

          {/* Simple Direction Switcher */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <button
              type="button"
              onClick={() => setDirection("VAULT_TO_COUNTER")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                direction === "VAULT_TO_COUNTER"
                  ? "bg-[#E00000] text-white shadow-sm font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🏦 Vault &rarr; 🏪 Counter</span>
              <span className="text-[10px] opacity-80">(Cash In)</span>
            </button>

            <button
              type="button"
              onClick={() => setDirection("COUNTER_TO_VAULT")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                direction === "COUNTER_TO_VAULT"
                  ? "bg-[#E00000] text-white shadow-sm font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>🏪 Counter &rarr; 🏦 Vault</span>
              <span className="text-[10px] opacity-80">(Cash Out)</span>
            </button>
          </div>
        </div>

        {/* ── Two Column Layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Currency + Denomination Cards */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Currency Tabs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <p className="text-xs font-bold tracking-widest uppercase text-[#E00000] mb-3">
                Select Currency
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {SUPPORTED_CURRENCIES.map((c) => {
                  const isActive = selectedCurrency === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCurrency(c.code)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        isActive
                          ? "bg-[#E00000] text-white border-[#E00000] shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <span>{c.code}</span>
                      <span className="opacity-75 ml-1">({c.symbol})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Denomination Counts Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    Enter Denomination Counts
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Count notes and coins to transfer {direction === "VAULT_TO_COUNTER" ? "from Vault into Counter" : "from Counter into Vault"}.
                  </p>
                </div>
                {totalPieces > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {denomLoading ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={22} className="animate-spin text-[#E00000]" />
                  <span className="text-xs font-semibold text-gray-400">Loading available stock...</span>
                </div>
              ) : allItemsList.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Banknote size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold">No denomination items found for {selectedCountryObj.country}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Notes List */}
                  {notesList.length > 0 && (
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                        <Banknote size={14} className="text-[#E00000]" />
                        Banknotes
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {notesList.map((item) => {
                          const count = denomCounts[item.item_code] || 0;
                          const maxAvail = item.available_qty || 0;
                          const subtotal = count * item.value;
                          const outOfStock = maxAvail <= 0;

                          return (
                            <div
                              key={item.item_code}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                count > 0
                                  ? "bg-red-50/40 border-red-200 shadow-2xs"
                                  : outOfStock
                                  ? "bg-gray-50 border-gray-100 opacity-60"
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    {selectedCountryObj.symbol}
                                    {item.value >= 1 ? item.value : item.value * 100 + "c"}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-gray-900">{item.item_name}</div>
                                    <div className="text-[11px] text-gray-400">
                                      Rate: {selectedCountryObj.symbol}{item.value.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                      maxAvail > 0
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    Available: {maxAvail}
                                  </span>
                                  {count > 0 && (
                                    <div className="text-xs font-black text-[#E00000] mt-0.5">
                                      {selectedCountryObj.symbol}
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Input and Controls */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  disabled={outOfStock || count >= maxAvail}
                                  onClick={() => handleSetMax(item.item_code, maxAvail)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 cursor-pointer"
                                >
                                  Max
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={count <= 0}
                                    onClick={() => handleStepCount(item.item_code, -1, maxAvail)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 disabled:opacity-30 cursor-pointer"
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
                                    className="w-14 h-8 text-center text-sm font-bold rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E00000]"
                                  />

                                  <button
                                    type="button"
                                    disabled={count >= maxAvail}
                                    onClick={() => handleStepCount(item.item_code, 1, maxAvail)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 disabled:opacity-30 cursor-pointer"
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

                  {/* Coins List */}
                  {coinsList.length > 0 && (
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                        <Coins size={14} className="text-amber-500" />
                        Coins &amp; Small Denominations
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coinsList.map((item) => {
                          const count = denomCounts[item.item_code] || 0;
                          const maxAvail = item.available_qty || 0;
                          const subtotal = count * item.value;
                          const outOfStock = maxAvail <= 0;

                          return (
                            <div
                              key={item.item_code}
                              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                count > 0
                                  ? "bg-amber-50/40 border-amber-200 shadow-2xs"
                                  : outOfStock
                                  ? "bg-gray-50 border-gray-100 opacity-60"
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    {item.value >= 1 ? item.value : item.value * 100 + "c"}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-gray-900">{item.item_name}</div>
                                    <div className="text-[11px] text-gray-400">
                                      Rate: {selectedCountryObj.symbol}{item.value.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                      maxAvail > 0
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    Available: {maxAvail}
                                  </span>
                                  {count > 0 && (
                                    <div className="text-xs font-black text-amber-600 mt-0.5">
                                      {selectedCountryObj.symbol}
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Input and Controls */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  disabled={outOfStock || count >= maxAvail}
                                  onClick={() => handleSetMax(item.item_code, maxAvail)}
                                  className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-40 cursor-pointer"
                                >
                                  Max
                                </button>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={count <= 0}
                                    onClick={() => handleStepCount(item.item_code, -1, maxAvail)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 disabled:opacity-30 cursor-pointer"
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
                                    className="w-14 h-8 text-center text-sm font-bold rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#E00000]"
                                  />

                                  <button
                                    type="button"
                                    disabled={count >= maxAvail}
                                    onClick={() => handleStepCount(item.item_code, 1, maxAvail)}
                                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 disabled:opacity-30 cursor-pointer"
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

          {/* Right Column: Summary & CRED Submit Slider */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-7 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <span className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  Transfer Summary
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E00000]">
                  {selectedCurrency}
                </span>
              </div>

              {/* Total Amount Callout */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Total Transfer Amount
                </span>
                <div className="text-3xl font-black text-gray-900 tracking-tight">
                  <span>{selectedCountryObj.symbol}</span>
                  <span>{totalTransferAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Total Items: <strong className="text-gray-900">{totalPieces} units</strong>
                </div>
              </div>

              {/* Direction Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Transfer Type:</span>
                  <span className="font-bold text-gray-900">
                    {direction === "VAULT_TO_COUNTER" ? "Vault Replenish (In)" : "Vault Deposit (Out)"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Currency:</span>
                  <span className="font-bold text-gray-900">{selectedCountryObj.label}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder={direction === "VAULT_TO_COUNTER" ? "Morning Cash Replenishment" : "Excess Cash Sweep to Vault"}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E00000]"
                />
              </div>

              {/* CRED Interactive Submit Slider */}
              <div className="pt-2">
                <CredSlider
                  onConfirm={handleExecuteTransfer}
                  disabled={totalPieces <= 0 || !sourceWarehouse || !targetWarehouse}
                  amount={totalTransferAmount}
                  currency={selectedCurrency}
                  loading={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── CRED-Style Success Modal ───────────────────────────────────────── */}
      {showCredSuccess && transferSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center">
            <style>{`
              @keyframes strokeDash {
                0% { stroke-dashoffset: 48; opacity: 0; }
                50% { opacity: 1; }
                100% { stroke-dashoffset: 0; opacity: 1; }
              }
              .animate-dash {
                stroke-dasharray: 48;
                stroke-dashoffset: 0;
                animation: strokeDash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
              }
            `}</style>

            <button
              onClick={() => setShowCredSuccess(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Cred Icon */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E00000] to-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" className="animate-dash" />
                </svg>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-bold mb-2">
              <Sparkles size={12} />
              Transfer Successful
            </div>

            <h2 className="text-2xl font-black text-gray-900 mb-1">
              ${Number(transferSuccessData.total_amount).toFixed(2)} {selectedCurrency}
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Transferred {transferSuccessData.total_qty} units successfully.
            </p>

            {/* Details Box */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left text-xs space-y-2 mb-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-gray-500">Entry Reference:</span>
                <button
                  onClick={() => copyToClipboard(transferSuccessData.stock_entry)}
                  className="font-bold text-[#E00000] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{transferSuccessData.stock_entry}</span>
                  {copiedId ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span className="font-mono text-gray-700">
                  {transferSuccessData.posting_date} {transferSuccessData.posting_time?.split(".")[0]}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
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
                className="py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} />
                Print Slip
              </button>

              <button
                type="button"
                onClick={() => setShowCredSuccess(false)}
                className="py-2.5 px-4 rounded-xl bg-[#E00000] hover:bg-[#c20000] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check size={15} />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
