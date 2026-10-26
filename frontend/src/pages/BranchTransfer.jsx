import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useSettings } from "../context/SettingsContext";
import { useUser } from "../context/UserContext";
import { sessionAxios as axios } from "../api/sessionClient.js";
import {
  Building2,
  ArrowRight,
  ArrowLeftRight,
  Banknote,
  Coins,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Truck,
  DollarSign,
  Landmark,
} from "lucide-react";

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

export default function BranchTransfer() {
  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();

  // Mode: "SELL_TRANSFER" (I am selling to target branch) | "BUY_TRANSFER" (I am buying from target branch)
  const [transferMode, setTransferMode] = useState("SELL_TRANSFER");

  // Warehouses list
  const [warehouses, setWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);
  const [targetBranch, setTargetBranch] = useState("");

  // Currency & Denominations
  const [selectedCurrency, setSelectedCurrency] = useState("FJD");
  const selectedCountryObj = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0],
    [selectedCurrency]
  );

  const [denominationsData, setDenominationsData] = useState(null);
  const [denomLoading, setDenomLoading] = useState(false);
  const [denomCounts, setDenomCounts] = useState({});
  const [remarks, setRemarks] = useState("");

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Active user's branch warehouse
  const activeBranchName = useMemo(() => {
    let name = selectedWarehouse?.warehouse;
    if (!name) {
      try {
        const stored = localStorage.getItem("selected_warehouse");
        if (stored) {
          const parsed = JSON.parse(stored);
          name = parsed?.warehouse || (typeof parsed === "string" ? parsed : null);
        }
      } catch {}
    }
    return name;
  }, [selectedWarehouse]);

  // Fetch available branches
  useEffect(() => {
    setLoadingWarehouses(true);
    axios
      .get("/api/method/moneygram.moneygram.api.branch_transfer.get_branch_transfer_warehouses")
      .then((res) => {
        if (res.data?.message) {
          setWarehouses(res.data.message);
        }
      })
      .catch((err) => console.error("Error fetching branch warehouses:", err))
      .finally(() => setLoadingWarehouses(false));
  }, []);

  // Set default target branch once loaded (excluding current branch)
  useEffect(() => {
    if (warehouses.length > 0 && !targetBranch) {
      const other = warehouses.find((w) => w.name !== activeBranchName && !w.custom_is_vault);
      if (other) setTargetBranch(other.name);
    }
  }, [warehouses, activeBranchName, targetBranch]);

  // Source warehouse for stock validation (if SELL, stock comes from active branch; if BUY, requested from target)
  const sourceStockWarehouse = transferMode === "SELL_TRANSFER" ? activeBranchName : targetBranch;

  // Fetch stock and denominations
  const fetchDenominationsStock = () => {
    if (!sourceStockWarehouse) return;
    setDenomLoading(true);
    setErrorMsg("");
    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_warehouse_denominations_stock", {
        params: {
          warehouse: sourceStockWarehouse,
          country: selectedCountryObj.country,
        },
      })
      .then((res) => {
        if (res.data?.message) {
          setDenominationsData(res.data.message);
        }
      })
      .catch((err) => {
        console.error("Error loading denominations stock:", err);
        setErrorMsg("Failed to load denomination stock balance.");
      })
      .finally(() => setDenomLoading(false));
  };

  useEffect(() => {
    fetchDenominationsStock();
    setDenomCounts({});
  }, [sourceStockWarehouse, selectedCountryObj.country, transferMode]);

  const currentCountryDenom = denominationsData?.[selectedCountryObj.country] || null;
  const notesList = currentCountryDenom?.notes || [];
  const coinsList = currentCountryDenom?.coins || [];
  const allItemsList = useMemo(() => [...notesList, ...coinsList], [notesList, coinsList]);

  // Calculations
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

  const handleCountChange = (itemCode, value, maxAvail) => {
    const numeric = parseInt(value, 10);
    if (isNaN(numeric) || numeric <= 0) {
      setDenomCounts((prev) => {
        const next = { ...prev };
        delete next[itemCode];
        return next;
      });
      return;
    }
    if (transferMode === "SELL_TRANSFER" && maxAvail !== undefined && numeric > maxAvail) {
      alert(`Entered count (${numeric}) exceeds available stock in branch (${maxAvail}).`);
      setDenomCounts((prev) => ({ ...prev, [itemCode]: maxAvail }));
      return;
    }
    setDenomCounts((prev) => ({ ...prev, [itemCode]: numeric }));
  };

  const handleClearAll = () => {
    setDenomCounts({});
    setRemarks("");
  };

  // Submission handler
  const handleSubmitTransfer = async () => {
    if (!activeBranchName) {
      alert("Active branch not found. Please set your branch in Settings.");
      return;
    }
    if (!targetBranch) {
      alert("Please select the target branch warehouse.");
      return;
    }
    if (activeBranchName === targetBranch) {
      alert("Current branch and target branch cannot be the same.");
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

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      // Create transfer record
      const fromWh = transferMode === "SELL_TRANSFER" ? activeBranchName : targetBranch;
      const toWh = transferMode === "SELL_TRANSFER" ? targetBranch : activeBranchName;
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.vault_transfer.create_vault_transfer",
        {
          from_warehouse: fromWh,
          to_warehouse: toWh,
          items: payloadItems,
          currency: selectedCurrency,
          country: selectedCountryObj.country,
          remarks:
            remarks ||
            `Branch Transfer: ${transferMode === "SELL_TRANSFER" ? "Sell to" : "Buy from"} ${targetBranch} (${fromWh} -> ${toWh})`,
        }
      );

      if (res.data?.message?.status === "success") {
        setSuccessInfo({
          ...res.data.message,
          mode: transferMode,
          source: fromWh,
          target: toWh,
          amount: totalTransferAmount,
          currency: selectedCurrency,
          pieces: totalPieces,
          partner: targetBranch,
        });
        handleClearAll();
        fetchDenominationsStock();
      } else {
        alert("Transfer could not be processed.");
      }
    } catch (err) {
      console.error("Branch Transfer Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to execute branch transfer.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ── Transfer Sub-Navigation Tabs ── */}
        <div className="flex items-center gap-1.5 mb-6 p-1 bg-gray-200/70 rounded-2xl w-fit">
          <Link
            to="/vault-transfer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all text-gray-600 hover:text-gray-900"
          >
            <Landmark size={15} className="text-gray-400" />
            <span>Vault Transfer</span>
          </Link>
          <Link
            to="/branch-transfer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all bg-white text-gray-900 shadow-xs"
          >
            <Truck size={15} className="text-[#E00000]" />
            <span>Branch Transfer</span>
          </Link>
        </div>

        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              <span>Transfer</span>
              <span>&gt;</span>
              <span className="text-[#E00000]">Branch to Branch</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Truck size={28} className="text-[#E00000]" />
              Branch Transfer
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Transfer physical cash between branch locations using Customer and Supplier accounts for BUY and SELL exchange.
            </p>
          </div>

          {/* Mode Switcher: SELL / BUY */}
          <div className="inline-flex p-1 rounded-2xl bg-white border border-gray-200 shadow-xs shrink-0">
            <button
              type="button"
              onClick={() => setTransferMode("SELL_TRANSFER")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                transferMode === "SELL_TRANSFER"
                  ? "bg-[#E00000] text-white shadow-sm font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>📤 Transfer Out / Sell</span>
              <span className="text-[10px] opacity-80">(Target as Customer)</span>
            </button>

            <button
              type="button"
              onClick={() => setTransferMode("BUY_TRANSFER")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                transferMode === "BUY_TRANSFER"
                  ? "bg-[#E00000] text-white shadow-sm font-black"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>📥 Transfer In / Buy</span>
              <span className="text-[10px] opacity-80">(Target as Supplier)</span>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#E00000] shrink-0 mt-0.5" />
            <div className="text-sm font-semibold text-red-800">{errorMsg}</div>
          </div>
        )}

        {/* Success Modal / Banner */}
        {successInfo && (
          <div className="my-6 p-6 rounded-3xl bg-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-emerald-950">Branch Transfer Executed Successfully</h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Stock Entry: <span className="font-mono font-bold">{successInfo.stock_entry}</span> · {successInfo.amount?.toFixed(2)} {successInfo.currency} ({successInfo.source} &rarr; {successInfo.target})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessInfo(null)}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
          {/* Left Column: Branch selector, Currency, Denominations */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Branch Selection Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xs font-bold tracking-widest uppercase text-[#E00000] mb-4 flex items-center gap-2">
                <Building2 size={15} />
                Branch Location &amp; Counterparty
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* My Active Branch */}
                <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    My Branch (Active Origin)
                  </span>
                  <div className="text-base font-black text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    {activeBranchName || "No Branch Selected in Settings"}
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Account: <span className="font-mono">{activeBranchName ? `${activeBranchName} - MME` : "—"}</span>
                  </span>
                </div>

                {/* Target Partner Branch */}
                <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Target Branch {transferMode === "SELL_TRANSFER" ? "(Customer)" : "(Supplier)"}
                  </label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    disabled={loadingWarehouses}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000]"
                  >
                    {warehouses
                      .filter((w) => w.name !== activeBranchName && !w.custom_is_vault)
                      .map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.warehouse_name || w.name}
                        </option>
                      ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1.5 block">
                    Linked ID: <span className="font-mono font-bold text-gray-700">{targetBranch || "—"}</span>
                  </span>
                </div>
              </div>
            </div>

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
                          ? "bg-[#E00000] text-white border-[#E00000] shadow-sm font-black"
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
                  <h2 className="text-base font-black text-gray-900">Enter Cash Denominations</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {transferMode === "SELL_TRANSFER"
                      ? `Stock available at ${activeBranchName || "your branch"}`
                      : `Requesting cash receipt from ${targetBranch || "target branch"}`}
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
                  <span className="text-xs font-semibold text-gray-400">Loading branch denomination stock...</span>
                </div>
              ) : allItemsList.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Banknote size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold">No denominations found for {selectedCountryObj.country}.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Banknotes */}
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
                          const outOfStock = transferMode === "SELL_TRANSFER" && maxAvail <= 0;

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
                                  </div>
                                  <div>
                                    <div className="font-black text-sm text-gray-900">
                                      {item.value} {selectedCurrency}
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                      {transferMode === "SELL_TRANSFER" ? (
                                        <>Avail: <span className="font-bold text-gray-600">{maxAvail}</span></>
                                      ) : (
                                        "Note"
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {count > 0 && (
                                  <div className="text-right">
                                    <div className="text-xs font-black text-[#E00000]">
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedCurrency}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-semibold">{count} pcs</div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={transferMode === "SELL_TRANSFER" ? maxAvail : undefined}
                                  placeholder="0"
                                  value={denomCounts[item.item_code] || ""}
                                  disabled={outOfStock}
                                  onChange={(e) => handleCountChange(item.item_code, e.target.value, maxAvail)}
                                  className="w-full text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                {transferMode === "SELL_TRANSFER" && maxAvail > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleCountChange(item.item_code, maxAvail, maxAvail)}
                                    className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shrink-0"
                                  >
                                    All
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Coins */}
                  {coinsList.length > 0 && (
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                        <Coins size={14} className="text-[#E00000]" />
                        Coins
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {coinsList.map((item) => {
                          const count = denomCounts[item.item_code] || 0;
                          const maxAvail = item.available_qty || 0;
                          const subtotal = count * item.value;
                          const outOfStock = transferMode === "SELL_TRANSFER" && maxAvail <= 0;

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
                                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                    {selectedCountryObj.symbol}
                                  </div>
                                  <div>
                                    <div className="font-black text-sm text-gray-900">
                                      {item.value} {selectedCurrency}
                                    </div>
                                    <div className="text-[11px] text-gray-400">
                                      {transferMode === "SELL_TRANSFER" ? (
                                        <>Avail: <span className="font-bold text-gray-600">{maxAvail}</span></>
                                      ) : (
                                        "Coin"
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {count > 0 && (
                                  <div className="text-right">
                                    <div className="text-xs font-black text-[#E00000]">
                                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedCurrency}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-semibold">{count} pcs</div>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={transferMode === "SELL_TRANSFER" ? maxAvail : undefined}
                                  placeholder="0"
                                  value={denomCounts[item.item_code] || ""}
                                  disabled={outOfStock}
                                  onChange={(e) => handleCountChange(item.item_code, e.target.value, maxAvail)}
                                  className="w-full text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                {transferMode === "SELL_TRANSFER" && maxAvail > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleCountChange(item.item_code, maxAvail, maxAvail)}
                                    className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shrink-0"
                                  >
                                    All
                                  </button>
                                )}
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

          {/* Right Column: Transfer Summary & Execution */}
          <div className="lg:col-span-4 sticky top-24 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
              <h3 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100 flex items-center justify-between">
                <span>Transfer Summary</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-red-50 text-[#E00000]">
                  {transferMode === "SELL_TRANSFER" ? "Selling / Out" : "Buying / In"}
                </span>
              </h3>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">From Warehouse</span>
                  <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                    {transferMode === "SELL_TRANSFER" ? activeBranchName : targetBranch}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">To Warehouse</span>
                  <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                    {transferMode === "SELL_TRANSFER" ? targetBranch : activeBranchName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Counterparty Party</span>
                  <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                    {transferMode === "SELL_TRANSFER" ? `Customer: ${targetBranch}` : `Supplier: ${targetBranch}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Total Counted Pieces</span>
                  <span className="font-bold text-gray-900">{totalPieces} pcs</span>
                </div>
              </div>

              {/* Total Amount Box */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">
                  Total Transfer Value
                </span>
                <div className="text-2xl font-black text-[#E00000]">
                  {totalTransferAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                  <span className="text-sm font-bold text-gray-500">{selectedCurrency}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Remarks / Tracking Note
                </label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional note for this branch transfer..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000]"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleSubmitTransfer}
                disabled={isSubmitting || totalPieces <= 0 || !activeBranchName || !targetBranch}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#E00000] hover:bg-[#b70000] text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Executing Transfer...
                  </>
                ) : (
                  <>
                    <span>Confirm Branch Transfer</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
