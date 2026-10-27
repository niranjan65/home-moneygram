import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import { sessionAxios as axios } from "../api/sessionClient.js";
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
  Landmark,
  Truck,
  Layers,
  DollarSign,
  Trash2,
  RotateCcw,
} from "lucide-react";

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
  const currencyTotals = transferData?.currency_totals || {};
  const isMultiCurrency = Object.keys(currencyTotals).length > 1;
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
          <div class="subtitle">INTERNAL VAULT TRANSFER RECEIPT ${isMultiCurrency ? "(BULK)" : ""}</div>
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
        ${isMultiCurrency ? `
          <div class="row bold" style="margin-bottom: 4px;"><span>CURRENCY BREAKDOWN</span><span style="text-align:right">TOTAL VALUE</span></div>
          ${Object.entries(currencyTotals).map(([cur, amt]) => `
            <div class="row">
              <span>${cur}</span>
              <span class="bold">${Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          `).join("")}
          <hr class="divider" />
          <div class="row total">
            <span>TOTAL ITEMS:</span>
            <span>${totalQty} units</span>
          </div>
        ` : `
          <div class="row total">
            <span>TOTAL AMOUNT:</span>
            <span>$${totalAmount}</span>
          </div>
          <div class="row"><span>TOTAL PIECES:</span><span class="bold">${totalQty} units</span></div>
        `}
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
function CredSlider({ onConfirm, disabled, amount, currency = "FJD", loading, customLabel }) {
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6 text-center">
          {loading ? (
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <RefreshCw size={15} className="animate-spin text-[#E00000]" />
              <span>Processing Transfer...</span>
            </div>
          ) : (
            <span
              className={`text-xs font-bold tracking-wider uppercase transition-opacity duration-200 truncate ${
                disabled ? "text-gray-400" : "text-white"
              }`}
              style={{ opacity: isDragging ? Math.max(1 - dragProgress / 50, 0.15) : 1 }}
            >
              {customLabel || `Slide to Transfer $${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} \u2192`}
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

  // Transfer Mode: "SINGLE" | "BULK"
  const [transferMode, setTransferMode] = useState("SINGLE");

  // All Denominations & Count State
  const [allDenominationsData, setAllDenominationsData] = useState(null);
  const [denomLoading, setDenomLoading] = useState(false);
  const [denomCounts, setDenomCounts] = useState({});
  const [remarks, setRemarks] = useState("");

  // Dynamically derived currencies directly from ERPNext denominations data
  const dynamicCurrencies = useMemo(() => {
    if (!allDenominationsData || Object.keys(allDenominationsData).length === 0) {
      return [{ code: "FJD", country: "Fiji", label: "Fiji Dollar", symbol: "$" }];
    }
    return Object.values(allDenominationsData)
      .filter((c) => (c.notes && c.notes.length > 0) || (c.coins && c.coins.length > 0))
      .map((c) => ({
        code: c.currency || c.country,
        country: c.country,
        label: `${c.country} (${c.currency || ""})`,
        symbol: c.symbol || "$",
      }));
  }, [allDenominationsData]);

  // Selected Currency
  const [selectedCurrency, setSelectedCurrency] = useState("FJD");
  const selectedCountryObj = useMemo(
    () => dynamicCurrencies.find((c) => c.code === selectedCurrency) || dynamicCurrencies[0] || { code: "FJD", country: "Fiji", symbol: "$" },
    [dynamicCurrencies, selectedCurrency]
  );

  // Keep selectedCurrency valid when dynamic currencies load from ERPNext
  useEffect(() => {
    if (dynamicCurrencies.length > 0 && !dynamicCurrencies.some((c) => c.code === selectedCurrency)) {
      setSelectedCurrency(dynamicCurrencies[0].code);
    }
  }, [dynamicCurrencies, selectedCurrency]);

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

    if (selectedWarehouse?.vault_warehouse) {
      setVaultInfo({
        branch_warehouse: activeBranchName,
        vault_warehouse: selectedWarehouse.vault_warehouse,
        is_vault: false,
        company: "MMEL"
      });
    }

    setVaultLoading(true);
    const headers = {};

    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info", {
        params: { warehouse: activeBranchName },
        headers,
        withCredentials: true,
      })
      .then((res) => {
        if (res.data?.message) {
          setVaultInfo(res.data.message);
        }
      })
      .catch((err) => console.error("Error loading vault info:", err))
      .finally(() => setVaultLoading(false));
  }, [activeBranchName, selectedWarehouse?.vault_warehouse, loginUser?.user?.email]);

  // Compute Source & Target Warehouses
  const sourceWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.vault_warehouse : vaultInfo.branch_warehouse;
  }, [direction, vaultInfo]);

  const targetWarehouse = useMemo(() => {
    if (!vaultInfo) return null;
    return direction === "VAULT_TO_COUNTER" ? vaultInfo.branch_warehouse : vaultInfo.vault_warehouse;
  }, [direction, vaultInfo]);

  // Fetch Denomination Stock in Source Warehouse (all currencies at once)
  const fetchDenominationsStock = useCallback(async () => {
    if (!sourceWarehouse) return;
    try {
      setDenomLoading(true);
      const res = await axios.get(
        "/api/method/moneygram.moneygram.api.vault_transfer.get_warehouse_denominations_stock",
        {
          params: { warehouse: sourceWarehouse },
          headers: {},
        }
      );
      setAllDenominationsData(res.data?.message || {});
    } catch (err) {
      console.error("Failed to load denominations stock:", err);
    } finally {
      setDenomLoading(false);
    }
  }, [sourceWarehouse]);

  useEffect(() => {
    fetchDenominationsStock();
    setDenomCounts({});
  }, [fetchDenominationsStock, direction]);

  // Denominations for the selected currency
  const denominationsData = useMemo(() => {
    if (!allDenominationsData || !selectedCountryObj) return null;
    return allDenominationsData[selectedCountryObj.country] || null;
  }, [allDenominationsData, selectedCountryObj]);

  const notesList = denominationsData?.notes || [];
  const coinsList = denominationsData?.coins || [];
  const allItemsList = useMemo(() => [...notesList, ...coinsList], [notesList, coinsList]);

  // Universal lookup map for all denomination items across all countries
  const itemLookup = useMemo(() => {
    const map = {};
    if (!allDenominationsData) return map;
    Object.entries(allDenominationsData).forEach(([countryName, countryData]) => {
      const matchedCurr = dynamicCurrencies.find((c) => c.country === countryName);
      const curr = countryData.currency || matchedCurr?.code || countryName;
      const symbol = countryData.symbol || matchedCurr?.symbol || "$";
      (countryData.notes || []).forEach((item) => {
        map[item.item_code] = { ...item, currency: curr, symbol, country: countryName };
      });
      (countryData.coins || []).forEach((item) => {
        map[item.item_code] = { ...item, currency: curr, symbol, country: countryName };
      });
    });
    return map;
  }, [allDenominationsData, dynamicCurrencies]);

  // Breakdown across all counted currencies
  const bulkBreakdown = useMemo(() => {
    const breakdown = {};
    Object.entries(denomCounts).forEach(([code, qty]) => {
      const numQty = Number(qty) || 0;
      if (numQty > 0 && itemLookup[code]) {
        const item = itemLookup[code];
        const curr = item.currency || "FJD";
        if (!breakdown[curr]) {
          breakdown[curr] = {
            currency: curr,
            symbol: item.symbol || "$",
            country: item.country,
            count: 0,
            amount: 0,
            items: [],
          };
        }
        breakdown[curr].count += numQty;
        breakdown[curr].amount += numQty * (item.value || 0);
        breakdown[curr].items.push({
          item_code: item.item_code,
          item_name: item.item_name,
          qty: numQty,
          value: item.value,
          subtotal: numQty * item.value,
        });
      }
    });
    return breakdown;
  }, [denomCounts, itemLookup]);

  const bulkActiveCurrenciesList = useMemo(() => Object.values(bulkBreakdown), [bulkBreakdown]);

  const totalBulkPieces = useMemo(() => {
    return Object.values(denomCounts).reduce((sum, q) => sum + (Number(q) || 0), 0);
  }, [denomCounts]);

  const getCurrencyPiecesCount = useCallback(
    (code) => {
      return bulkBreakdown[code]?.count || 0;
    },
    [bulkBreakdown]
  );

  // Tab and Mode Handlers
  const handleSelectCurrency = (currencyCode) => {
    setSelectedCurrency(currencyCode);
    if (transferMode === "SINGLE") {
      setDenomCounts({});
    }
  };

  const handleToggleMode = (newMode) => {
    if (newMode === transferMode) return;
    setTransferMode(newMode);
    if (newMode === "SINGLE") {
      const currentCodes = new Set(allItemsList.map((i) => i.item_code));
      setDenomCounts((prev) => {
        const next = {};
        Object.entries(prev).forEach(([code, qty]) => {
          if (currentCodes.has(code)) {
            next[code] = qty;
          }
        });
        return next;
      });
    }
  };

  const handleClearCurrency = (currencyCode) => {
    setDenomCounts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((code) => {
        if (itemLookup[code]?.currency === currencyCode) {
          delete next[code];
        }
      });
      return next;
    });
  };

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

  // Calculate Single Mode Totals
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

    const isBulk = transferMode === "BULK";
    const payloadItems = [];

    if (isBulk) {
      Object.entries(denomCounts).forEach(([code, qty]) => {
        const count = Number(qty) || 0;
        if (count > 0 && itemLookup[code]) {
          const item = itemLookup[code];
          payloadItems.push({
            item_code: item.item_code,
            qty: count,
            rate: item.value,
            currency: item.currency,
          });
        }
      });
    } else {
      for (const item of allItemsList) {
        const count = denomCounts[item.item_code] || 0;
        if (count > 0) {
          payloadItems.push({
            item_code: item.item_code,
            qty: count,
            rate: item.value,
            currency: selectedCurrency,
          });
        }
      }
    }

    if (payloadItems.length === 0) {
      alert("Please enter at least one denomination count to transfer.");
      return;
    }

    const curCount = isBulk ? bulkActiveCurrenciesList.length : 1;
    const curLabel = isBulk && curCount > 1 ? "MULTI" : selectedCurrency;
    const countryLabel = isBulk && curCount > 1 ? "All" : selectedCountryObj.country;

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.vault_transfer.create_vault_transfer",
        {
          from_warehouse: sourceWarehouse,
          to_warehouse: targetWarehouse,
          items: payloadItems,
          direction,
          currency: curLabel,
          country: countryLabel,
          remarks:
            remarks ||
            `${isBulk && curCount > 1 ? "Bulk Multi-Currency " : ""}Vault Transfer (${
              direction === "VAULT_TO_COUNTER" ? "Vault -> Counter" : "Counter -> Vault"
            })`,
        },
        {
          headers: {
            "Content-Type": "application/json",
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
        {/* ── Transfer Sub-Navigation Tabs ── */}
        <div className="flex items-center gap-1.5 mb-6 p-1 bg-gray-200/70 rounded-2xl w-fit">
          <Link
            to="/vault-transfer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all bg-white text-gray-900 shadow-xs"
          >
            <Landmark size={15} className="text-[#E00000]" />
            <span>Vault Transfer</span>
          </Link>
          <Link
            to="/branch-transfer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
          >
            <Truck size={15} className="text-gray-400" />
            <span>Branch Transfer</span>
          </Link>
        </div>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-gray-900 text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Vault <span className="text-[#E00000] italic">Transfer</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Transfer physical cash notes and coins between Cash Counter and Vault in both directions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Transfer Mode Switcher: Single vs Bulk Multi-Currency */}
            <div className="inline-flex p-1 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <button
                type="button"
                onClick={() => handleToggleMode("SINGLE")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  transferMode === "SINGLE"
                    ? "bg-gray-900 text-white shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <DollarSign size={13} className={transferMode === "SINGLE" ? "text-white" : "text-gray-400"} />
                <span>Single</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleMode("BULK")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  transferMode === "BULK"
                    ? "bg-[#E00000] text-white shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Layers size={13} className={transferMode === "BULK" ? "text-white" : "text-gray-400"} />
                <span>Bulk Multi-Currency</span>
                {bulkActiveCurrenciesList.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      transferMode === "BULK" ? "bg-white text-[#E00000]" : "bg-red-100 text-[#E00000]"
                    }`}
                  >
                    {bulkActiveCurrenciesList.length}
                  </span>
                )}
              </button>
            </div>

            {/* Direction Switcher (Both ways: Cash In and Cash Out) */}
            <div className="inline-flex p-1 rounded-2xl bg-white border border-gray-200 shadow-xs">
              <button
                type="button"
                onClick={() => setDirection("VAULT_TO_COUNTER")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
        </div>

        {/* ── Two Column Layout ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Currency + Denomination Cards */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Currency Tabs */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">
                    Select Currency
                  </p>
                  {transferMode === "BULK" && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-[#E00000] border border-red-100">
                      Multi-Currency Mode Active
                    </span>
                  )}
                </div>
                {transferMode === "BULK" && (
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    Switch between tabs to count multiple currencies
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {dynamicCurrencies.map((c) => {
                  const isActive = selectedCurrency === c.code;
                  const countedUnits = getCurrencyPiecesCount(c.code);
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleSelectCurrency(c.code)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                        isActive
                          ? "bg-[#E00000] text-white border-[#E00000] shadow-sm"
                          : countedUnits > 0
                          ? "bg-red-50 text-gray-900 border-red-300 font-extrabold"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <span>{c.code}</span>
                      <span className="opacity-75">({c.symbol})</span>
                      {countedUnits > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                            isActive ? "bg-white text-[#E00000]" : "bg-[#E00000] text-white"
                          }`}
                        >
                          {countedUnits}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Denomination Counts Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <span>Enter {selectedCurrency} Denominations</span>
                    {transferMode === "BULK" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 uppercase">
                        Bulk Mode
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Count notes and coins to transfer {direction === "VAULT_TO_COUNTER" ? "from Vault into Counter (Cash In)" : "from Counter into Vault (Cash Out)"}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {transferMode === "BULK" && getCurrencyPiecesCount(selectedCurrency) > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearCurrency(selectedCurrency)}
                      className="text-xs font-bold text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Clear {selectedCurrency}</span>
                    </button>
                  )}
                  {((transferMode === "BULK" && totalBulkPieces > 0) || (transferMode === "SINGLE" && totalPieces > 0)) && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      <span>{transferMode === "BULK" ? "Reset All" : "Reset"}</span>
                    </button>
                  )}
                </div>
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
                  {transferMode === "BULK" ? "Bulk Summary" : "Transfer Summary"}
                </span>
                {transferMode === "BULK" ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E00000] border border-red-100">
                    {bulkActiveCurrenciesList.length} {bulkActiveCurrenciesList.length === 1 ? "Currency" : "Currencies"}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E00000]">
                    {selectedCurrency}
                  </span>
                )}
              </div>

              {transferMode === "BULK" ? (
                /* ── Bulk Multi-Currency Summary Card ── */
                <div className="flex flex-col gap-4">
                  {/* Total Units Callout */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      Total Pieces to Transfer
                    </span>
                    <div className="text-3xl font-black text-gray-900 tracking-tight">
                      <span>{totalBulkPieces}</span>
                      <span className="text-sm font-bold text-gray-500 ml-1.5">units</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Across <strong className="text-gray-900">{bulkActiveCurrenciesList.length}</strong> active {bulkActiveCurrenciesList.length === 1 ? "currency" : "currencies"}
                    </div>
                  </div>

                  {/* Per-Currency Breakdown List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Selected Currencies</span>
                      {totalBulkPieces > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[11px] text-red-500 hover:text-red-700 cursor-pointer font-bold lowercase"
                        >
                          clear all
                        </button>
                      )}
                    </div>

                    {bulkActiveCurrenciesList.length === 0 ? (
                      <div className="p-4 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                        No denomination counts added yet. Select currency tabs on the left and enter quantities.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                        {bulkActiveCurrenciesList.map((item) => (
                          <div
                            key={item.currency}
                            className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs transition-all hover:border-gray-300"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                                {item.currency}
                              </span>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {item.symbol} {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {item.count} {item.count === 1 ? "unit" : "units"} ({item.country})
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleClearCurrency(item.currency)}
                              title={`Remove ${item.currency}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Single Currency Summary Card ── */
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
              )}

              {/* Direction Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Transfer Type:</span>
                  <span className="font-bold text-gray-900">
                    {direction === "VAULT_TO_COUNTER" ? "Vault Replenish (Cash In)" : "Vault Deposit (Cash Out)"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Mode:</span>
                  <span className="font-bold text-gray-900">
                    {transferMode === "BULK" ? "Bulk Multi-Currency" : selectedCountryObj.label}
                  </span>
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
                  disabled={
                    transferMode === "BULK"
                      ? totalBulkPieces <= 0 || !sourceWarehouse || !targetWarehouse
                      : totalPieces <= 0 || !sourceWarehouse || !targetWarehouse
                  }
                  amount={
                    transferMode === "BULK"
                      ? bulkActiveCurrenciesList.length === 1
                        ? bulkActiveCurrenciesList[0]?.amount
                        : 0
                      : totalTransferAmount
                  }
                  currency={
                    transferMode === "BULK"
                      ? bulkActiveCurrenciesList.length === 1
                        ? bulkActiveCurrenciesList[0]?.currency
                        : ""
                      : selectedCurrency
                  }
                  customLabel={
                    transferMode === "BULK"
                      ? totalBulkPieces <= 0
                        ? "Select Denominations to Transfer"
                        : `Slide to Transfer ${totalBulkPieces} units (${bulkActiveCurrenciesList.length} ${
                            bulkActiveCurrenciesList.length === 1 ? "currency" : "currencies"
                          }) \u2192`
                      : null
                  }
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

            {transferSuccessData.currency_totals && Object.keys(transferSuccessData.currency_totals).length > 1 ? (
              <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  Bulk Multi-Currency Transfer
                </h2>
                <p className="text-xs text-gray-500 mb-3">
                  Transferred <strong className="text-gray-900">{transferSuccessData.total_qty} units</strong> across{" "}
                  <strong className="text-gray-900">{Object.keys(transferSuccessData.currency_totals).length} currencies</strong>.
                </p>

                {/* Multi-currency breakdown pills */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {Object.entries(transferSuccessData.currency_totals).map(([curr, amt]) => (
                    <span
                      key={curr}
                      className="px-2.5 py-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800"
                    >
                      <span className="text-[#E00000] mr-1">{curr}</span>
                      <span>{Number(amt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-900 mb-1">
                  ${Number(transferSuccessData.total_amount).toFixed(2)} {selectedCurrency}
                </h2>
                <p className="text-xs text-gray-500">
                  Transferred {transferSuccessData.total_qty} units successfully.
                </p>
              </div>
            )}

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
