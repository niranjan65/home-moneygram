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
  Check,
  ChevronRight,
  Edit3,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function BranchTransfer() {
  const loginUser = useUser();
  const { selectedWarehouse, warehouses: settingsWarehouses } = useSettings();

  // Company details
  const [companyName, setCompanyName] = useState("");
  const [companyAbbr, setCompanyAbbr] = useState("MME");

  // All active branch warehouses in ERPNext
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  // ── Step 1: Branch Route Selection Gate ──────────────────────────────────────
  // When opening the page, isRouteConfirmed is false so ONLY the branch selection is shown.
  const [isRouteConfirmed, setIsRouteConfirmed] = useState(false);
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");

  // Determine user's assigned/accessible branches
  const accessibleBranchNames = useMemo(() => {
    const list = [];
    if (Array.isArray(settingsWarehouses)) {
      settingsWarehouses.forEach((w) => {
        const name = typeof w === "string" ? w : w.warehouse || w.name;
        if (name && !list.includes(name)) list.push(name);
      });
    }
    const userWhs = loginUser?.user?.warehouses;
    if (Array.isArray(userWhs)) {
      userWhs.forEach((w) => {
        const name = typeof w === "string" ? w : w.warehouse || w.name;
        if (name && !list.includes(name)) list.push(name);
      });
    }
    if (loginUser?.user?.warehouse && !list.includes(loginUser.user.warehouse)) {
      list.push(loginUser.user.warehouse);
    }
    if (selectedWarehouse?.warehouse && !list.includes(selectedWarehouse.warehouse)) {
      list.push(selectedWarehouse.warehouse);
    }
    return list;
  }, [settingsWarehouses, loginUser, selectedWarehouse]);

  // Allowed From-Branch options:
  // If user is assigned to specific branches, strictly limit "From" to those branches.
  const fromBranchOptions = useMemo(() => {
    if (loadingWarehouses || allWarehouses.length === 0) return [];
    if (accessibleBranchNames.length > 0) {
      const filtered = allWarehouses.filter((w) =>
        accessibleBranchNames.includes(w.name) || accessibleBranchNames.includes(w.warehouse_name)
      );
      if (filtered.length > 0) return filtered;
    }
    // Fallback: If user is Administrator or has unrestricted access, allow all non-vault branches
    return allWarehouses.filter((w) => !w.custom_is_vault);
  }, [allWarehouses, accessibleBranchNames, loadingWarehouses]);

  // Allowed To-Branch options: all active branches except selected From branch
  const toBranchOptions = useMemo(() => {
    return allWarehouses.filter((w) => w.name !== fromBranch && !w.custom_is_vault);
  }, [allWarehouses, fromBranch]);

  // Fetch branches and system company details on mount
  useEffect(() => {
    setLoadingWarehouses(true);
    axios
      .get("/api/method/moneygram.moneygram.api.branch_transfer.get_branch_transfer_warehouses")
      .then((res) => {
        if (res.data?.message) {
          const data = res.data.message;
          const whs = Array.isArray(data) ? data : data.warehouses || [];
          setAllWarehouses(whs);
          if (data.company) setCompanyName(data.company);
          if (data.abbr) setCompanyAbbr(data.abbr);
        }
      })
      .catch((err) => console.error("Error fetching branch warehouses:", err))
      .finally(() => setLoadingWarehouses(false));
  }, []);

  // Initialize From and To branches once warehouses load
  useEffect(() => {
    if (allWarehouses.length === 0) return;

    // Pick active selected warehouse if accessible, else first allowed
    const activeCurrent = selectedWarehouse?.warehouse;
    let initialFrom = "";
    if (activeCurrent && fromBranchOptions.some((w) => w.name === activeCurrent)) {
      initialFrom = activeCurrent;
    } else if (fromBranchOptions.length > 0) {
      initialFrom = fromBranchOptions[0].name;
    }

    if (!fromBranch && initialFrom) {
      setFromBranch(initialFrom);
    }

    // Set initial To branch
    if (!toBranch) {
      const other = allWarehouses.find((w) => w.name !== initialFrom && !w.custom_is_vault);
      if (other) setToBranch(other.name);
    }
  }, [allWarehouses, fromBranchOptions, selectedWarehouse, fromBranch, toBranch]);

  // Adjust To branch if it matches From branch
  useEffect(() => {
    if (fromBranch && toBranch && fromBranch === toBranch) {
      const other = allWarehouses.find((w) => w.name !== fromBranch && !w.custom_is_vault);
      if (other) setToBranch(other.name);
    }
  }, [fromBranch, toBranch, allWarehouses]);

  // ── Step 2: Currency, Live Rates & Denominations ─────────────────────────────
  const [currenciesData, setCurrenciesData] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState("USD");
  const [customRate, setCustomRate] = useState("");
  const [isCustomRateActive, setIsCustomRateActive] = useState(false);

  // Denomination counts & remarks
  const [denomCounts, setDenomCounts] = useState({});
  const [remarks, setRemarks] = useState("");

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPrintSlip, setShowPrintSlip] = useState(false);

  // Fetch currencies, live rates and stock balances for fromBranch
  const fetchCurrenciesAndStock = (warehouseName) => {
    if (!warehouseName) return;
    setLoadingCurrencies(true);
    setErrorMsg("");
    axios
      .get(
        "/api/method/moneygram.moneygram.api.branch_transfer.get_branch_transfer_currencies_and_rates",
        {
          params: { warehouse: warehouseName },
        }
      )
      .then((res) => {
        if (res.data?.message?.currencies) {
          const list = res.data.message.currencies;
          setCurrenciesData(list);

          // Default to USD or first available foreign currency
          if (list.length > 0) {
            const hasCurr = list.find((c) => c.code === selectedCurrencyCode);
            if (!hasCurr) {
              const usdOrFirst = list.find((c) => c.code === "USD") || list[0];
              setSelectedCurrencyCode(usdOrFirst.code);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Error loading branch transfer currencies:", err);
        setErrorMsg("Failed to load currency rates and branch stock balance.");
      })
      .finally(() => setLoadingCurrencies(false));
  };

  // Re-fetch currencies & stock when Route is confirmed or fromBranch changes
  useEffect(() => {
    if (isRouteConfirmed && fromBranch) {
      fetchCurrenciesAndStock(fromBranch);
      setDenomCounts({});
    }
  }, [isRouteConfirmed, fromBranch]);

  // Currently selected currency object
  const activeCurrency = useMemo(() => {
    if (currenciesData.length === 0) {
      return {
        code: "USD",
        currency: "USD",
        country: "USA",
        symbol: "$",
        selling_price: 0.442,
        buying_price: 0.4765,
        fjd_rate: 2.2624,
        notes: [],
        coins: [],
      };
    }
    return (
      currenciesData.find((c) => c.code === selectedCurrencyCode) ||
      currenciesData[0]
    );
  }, [currenciesData, selectedCurrencyCode]);

  // Effective Exchange Rate: FJD per 1 foreign unit
  const effectiveFjdRate = useMemo(() => {
    if (isCustomRateActive && customRate && parseFloat(customRate) > 0) {
      return parseFloat(customRate);
    }
    return activeCurrency?.fjd_rate || 1.0;
  }, [isCustomRateActive, customRate, activeCurrency]);

  const notesList = activeCurrency?.notes || [];
  const coinsList = activeCurrency?.coins || [];
  const allItemsList = useMemo(() => [...notesList, ...coinsList], [notesList, coinsList]);

  // Calculations for total transfer value
  const { totalPieces, totalForeignAmount, totalLocalFjdAmount } = useMemo(() => {
    let pieces = 0;
    let foreignAmt = 0;
    for (const item of allItemsList) {
      const count = denomCounts[item.item_code] || 0;
      if (count > 0) {
        pieces += count;
        foreignAmt += count * (item.value || 0);
      }
    }
    const localFjd = foreignAmt * effectiveFjdRate;
    return {
      totalPieces: pieces,
      totalForeignAmount: foreignAmt,
      totalLocalFjdAmount: localFjd,
    };
  }, [allItemsList, denomCounts, effectiveFjdRate]);

  // Denomination count handler
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
    if (maxAvail !== undefined && numeric > maxAvail) {
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

  // ── Step 3: Execute Transfer API Call ─────────────────────────────────────────
  const handleSubmitTransfer = async () => {
    if (!fromBranch || !toBranch) {
      alert("Please select both From Branch and To Branch.");
      return;
    }
    if (fromBranch === toBranch) {
      alert("Source Branch and Target Branch cannot be the same.");
      return;
    }
    if (totalPieces <= 0 || totalForeignAmount <= 0) {
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
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.branch_transfer.execute_branch_transfer",
        {
          from_warehouse: fromBranch,
          to_warehouse: toBranch,
          currency: activeCurrency.code,
          country: activeCurrency.country,
          items: payloadItems,
          exchange_rate: effectiveFjdRate,
          fjd_rate: effectiveFjdRate,
          remarks:
            remarks ||
            `Inter-Branch FX Transfer: ${totalForeignAmount.toFixed(2)} ${activeCurrency.code} (${fromBranch} -> ${toBranch})`,
        }
      );

      if (res.data?.message?.status === "success") {
        setSuccessInfo({
          ...res.data.message,
          items: payloadItems,
          exchange_rate: effectiveFjdRate,
          executed_at: new Date().toLocaleString(),
        });
        handleClearAll();
        fetchCurrenciesAndStock(fromBranch);
      } else {
        alert("Transfer could not be processed.");
      }
    } catch (err) {
      console.error("Branch Transfer Error:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to execute branch transfer.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Sub-Navigation Tabs */}
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

        {/* Page Header */}
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
              Inter-branch foreign currency transfer with automated Sales Invoice, Purchase Invoice, Cash Payments, and local stock adjustments.
            </p>
          </div>

          {/* Quick Route Status Pill */}
          {isRouteConfirmed && (
            <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-black text-gray-900">{fromBranch}</span>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
              <div className="text-xs font-black text-gray-900">{toBranch}</div>
              <button
                type="button"
                onClick={() => setIsRouteConfirmed(false)}
                className="ml-2 text-[11px] font-bold text-[#E00000] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={12} />
                Change
              </button>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-[#E00000] shrink-0 mt-0.5" />
            <div className="text-sm font-semibold text-red-800">{errorMsg}</div>
          </div>
        )}

        {/* ── STATE 1: INITIAL BRANCH SELECTION GATE ───────────────────────────────── */}
        {!isRouteConfirmed && (
          <div className="max-w-3xl mx-auto my-12">
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-md p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-[#E00000] to-rose-600" />

              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 text-[#E00000] flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ArrowLeftRight size={26} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Select Transfer Route
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Choose the originating branch and destination branch. Only branches assigned to your account or accessible in Settings can be selected as the source.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* From Branch (Source) */}
                <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 shadow-2xs">
                  <label className="text-[11px] font-black tracking-widest uppercase text-gray-400 block mb-2 flex items-center gap-1.5">
                    <Building2 size={14} className="text-[#E00000]" />
                    From Branch (Origin)
                  </label>
                  <select
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    disabled={loadingWarehouses}
                    className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] transition-all cursor-pointer"
                  >
                    {fromBranchOptions.map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.warehouse_name || w.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-500 mt-2 block font-medium">
                    Cash Account: <span className="font-mono font-bold text-gray-800">{fromBranch ? `${fromBranch} - ${companyAbbr}` : "—"}</span>
                  </span>
                </div>

                {/* To Branch (Destination) */}
                <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 shadow-2xs">
                  <label className="text-[11px] font-black tracking-widest uppercase text-gray-400 block mb-2 flex items-center gap-1.5">
                    <Truck size={14} className="text-[#E00000]" />
                    To Branch (Destination)
                  </label>
                  <select
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value)}
                    disabled={loadingWarehouses}
                    className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] transition-all cursor-pointer"
                  >
                    {toBranchOptions.map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.warehouse_name || w.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-500 mt-2 block font-medium">
                    Cash Account: <span className="font-mono font-bold text-gray-800">{toBranch ? `${toBranch} - ${companyAbbr}` : "—"}</span>
                  </span>
                </div>
              </div>

              {/* Continue Action */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-400 font-medium">
                  Transferring from <span className="font-bold text-gray-800">{fromBranch || "Source"}</span> to{" "}
                  <span className="font-bold text-gray-800">{toBranch || "Destination"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!fromBranch || !toBranch) {
                      alert("Please select both source and destination branches.");
                      return;
                    }
                    if (fromBranch === toBranch) {
                      alert("Source and Destination branches cannot be identical.");
                      return;
                    }
                    setIsRouteConfirmed(true);
                  }}
                  disabled={loadingWarehouses || !fromBranch || !toBranch || fromBranch === toBranch}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E00000] hover:bg-[#b70000] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Proceed to Transfer Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE 2: ACTIVE TRANSFER DETAILS & EXECUTION ─────────────────────────── */}
        {isRouteConfirmed && (
          <div className="mt-8 flex flex-col gap-8">
            {/* Active Route Header Banner */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E00000] flex items-center justify-center font-black shrink-0">
                  <ArrowLeftRight size={22} />
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Active Transfer Route
                  </div>
                  <div className="text-base font-black text-gray-900 flex items-center gap-2 mt-0.5">
                    <span className="text-emerald-700">{fromBranch}</span>
                    <ArrowRight size={16} className="text-gray-400" />
                    <span className="text-blue-700">{toBranch}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRouteConfirmed(false)}
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Change Branches</span>
              </button>
            </div>

            {/* Main 2-Column Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Currency tabs & Denominations */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Foreign Currency Tabs & Rates */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xs font-black tracking-widest uppercase text-[#E00000] flex items-center gap-2">
                        <DollarSign size={15} />
                        Select Foreign Currency
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Live exchange rates and denomination availability loaded directly from ERPNext
                      </p>
                    </div>

                    {/* Rate Display / Custom Rate Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCustomRateActive(!isCustomRateActive)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                          isCustomRateActive
                            ? "bg-amber-50 border-amber-300 text-amber-900"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Edit3 size={11} />
                        <span>{isCustomRateActive ? "Custom Rate Active" : "Edit Rate"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Currencies Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {loadingCurrencies ? (
                      <div className="py-2 text-xs text-gray-400 flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin text-[#E00000]" />
                        <span>Loading currencies...</span>
                      </div>
                    ) : (
                      currenciesData.map((c) => {
                        const isActive = selectedCurrencyCode === c.code;
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrencyCode(c.code);
                              setDenomCounts({});
                              setIsCustomRateActive(false);
                              setCustomRate("");
                            }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                              isActive
                                ? "bg-[#E00000] text-white border-[#E00000] shadow-sm font-black"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            <span>{c.code}</span>
                            <span className="opacity-75 text-[10px]">({c.symbol})</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Active Currency Exchange Rate Info Card */}
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-sm text-gray-900 shadow-2xs">
                        {activeCurrency.symbol}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {activeCurrency.country} ({activeCurrency.code})
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          ERPNext Selling Rate: <span className="font-mono font-bold text-gray-700">{activeCurrency.selling_price || "—"}</span> · Buying Rate: <span className="font-mono font-bold text-gray-700">{activeCurrency.buying_price || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isCustomRateActive ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-bold">1 {activeCurrency.code} =</span>
                          <input
                            type="number"
                            step="0.0001"
                            value={customRate}
                            placeholder={activeCurrency.fjd_rate?.toString()}
                            onChange={(e) => setCustomRate(e.target.value)}
                            className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-amber-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <span className="text-xs font-bold text-gray-700">FJD</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-black text-emerald-800">
                            1 {activeCurrency.code} = {effectiveFjdRate?.toFixed(4)} FJD
                          </div>
                          <div className="text-[10px] text-gray-400">Live Valuation Multiplier</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Denomination Counts Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                    <div>
                      <h2 className="text-base font-black text-gray-900">
                        Enter Transfer Denominations ({activeCurrency.code})
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Stock available in source branch: <span className="font-bold text-gray-700">{fromBranch}</span>
                      </p>
                    </div>
                    {totalPieces > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {loadingCurrencies ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-[#E00000]" />
                      <span className="text-xs font-semibold text-gray-400">
                        Loading denomination stock balances...
                      </span>
                    </div>
                  ) : allItemsList.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Banknote size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-semibold">
                        No denomination items found for {activeCurrency.country}.
                      </p>
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
                                        {activeCurrency.symbol}
                                      </div>
                                      <div>
                                        <div className="font-black text-sm text-gray-900">
                                          {item.value} {activeCurrency.code}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          In Branch: <span className="font-bold text-gray-700">{maxAvail}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {count > 0 && (
                                      <div className="text-right">
                                        <div className="text-xs font-black text-[#E00000]">
                                          {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeCurrency.code}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-semibold">{count} pcs</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxAvail}
                                      placeholder="0"
                                      value={denomCounts[item.item_code] || ""}
                                      disabled={outOfStock}
                                      onChange={(e) => handleCountChange(item.item_code, e.target.value, maxAvail)}
                                      className="w-full text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {maxAvail > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleCountChange(item.item_code, maxAvail, maxAvail)}
                                        className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shrink-0 cursor-pointer"
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
                                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                                        {activeCurrency.symbol}
                                      </div>
                                      <div>
                                        <div className="font-black text-sm text-gray-900">
                                          {item.value} {activeCurrency.code}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          In Branch: <span className="font-bold text-gray-700">{maxAvail}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {count > 0 && (
                                      <div className="text-right">
                                        <div className="text-xs font-black text-[#E00000]">
                                          {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeCurrency.code}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-semibold">{count} pcs</div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      max={maxAvail}
                                      placeholder="0"
                                      value={denomCounts[item.item_code] || ""}
                                      disabled={outOfStock}
                                      onChange={(e) => handleCountChange(item.item_code, e.target.value, maxAvail)}
                                      className="w-full text-center py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    />
                                    {maxAvail > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleCountChange(item.item_code, maxAvail, maxAvail)}
                                        className="px-2.5 py-2 text-[11px] font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors shrink-0 cursor-pointer"
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
                      FX Inter-Branch
                    </span>
                  </h3>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Source Warehouse (A)</span>
                      <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                        {fromBranch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Destination Warehouse (B)</span>
                      <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                        {toBranch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Exchange Rate</span>
                      <span className="font-bold text-gray-800">
                        1 {activeCurrency.code} = {effectiveFjdRate?.toFixed(4)} FJD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Total Counted Pieces</span>
                      <span className="font-bold text-gray-900">{totalPieces} pcs</span>
                    </div>
                  </div>

                  {/* Foreign Currency Amount Box */}
                  <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100">
                    <span className="text-[11px] uppercase font-bold text-gray-500 block mb-1">
                      Foreign Transfer Total ({activeCurrency.code})
                    </span>
                    <div className="text-2xl font-black text-[#E00000]">
                      {totalForeignAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-bold text-gray-600">{activeCurrency.code}</span>
                    </div>
                  </div>

                  {/* Local Currency FJD Equivalent Box */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                    <span className="text-[11px] uppercase font-bold text-gray-400 block mb-1">
                      Local Currency Value (FJD)
                    </span>
                    <div className="text-xl font-black text-gray-900">
                      ${totalLocalFjdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                      <span className="text-xs font-bold text-gray-500">FJD</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Valued at mapped cash accounts and stock ledgers
                    </span>
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
                      placeholder="Optional tracking remarks..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000]"
                    />
                  </div>

                  {/* Automated Accounting Flow Breakdown */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex flex-col gap-1.5">
                    <span className="font-black uppercase tracking-wider text-[10px] text-blue-700 flex items-center gap-1">
                      <Sparkles size={12} />
                      Automated Accounting &amp; Stock Flow:
                    </span>
                    <div>• <b>Sales Invoice</b> (Stock out from {fromBranch}, Customer = {toBranch})</div>
                    <div>• <b>Purchase Invoice</b> (Stock in to {toBranch}, Supplier = {fromBranch})</div>
                    <div>• <b>Payment Entries</b> via mapped cash accounts for {fromBranch} and {toBranch}</div>
                    <div>• <b>Material Receipt</b> (FJD) at {fromBranch} &amp; <b>Material Issue</b> (FJD) at {toBranch}</div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleSubmitTransfer}
                    disabled={isSubmitting || totalPieces <= 0 || !fromBranch || !toBranch}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#E00000] hover:bg-[#b70000] text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Executing 6-Document Flow...
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
          </div>
        )}

        {/* ── SUCCESS MODAL & DETAILS ────────────────────────────────────────────── */}
        {successInfo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Branch Transfer Complete</h3>
                    <p className="text-xs text-gray-500">
                      All 6 ERPNext accounting and stock documents generated successfully
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Transfer Metrics Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">From</span>
                  <span className="text-xs font-black text-gray-900 truncate block">{successInfo.from_warehouse}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">To</span>
                  <span className="text-xs font-black text-gray-900 truncate block">{successInfo.to_warehouse}</span>
                </div>
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                  <span className="text-[10px] uppercase font-bold text-red-500 block">Foreign Value</span>
                  <span className="text-xs font-black text-[#E00000]">
                    {successInfo.total_foreign_amount?.toFixed(2)} {successInfo.currency}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block">Local Value</span>
                  <span className="text-xs font-black text-emerald-900">
                    ${successInfo.total_local_amount?.toFixed(2)} FJD
                  </span>
                </div>
              </div>

              {/* Linked Documents Reference Table */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden mb-6 text-xs">
                <div className="bg-gray-100/80 px-4 py-2 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Generated ERPNext Transactions
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">1. Sales Invoice (Out of {successInfo.from_warehouse})</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.sales_invoice}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">2. Purchase Invoice (Into {successInfo.to_warehouse})</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.purchase_invoice}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">3. Payment Entry (Sales Invoice Receipt)</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.payment_entry_sales}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">4. Payment Entry (Purchase Invoice Payment)</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.payment_entry_purchase}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">5. Stock Entry Material Receipt (Local FJD at {successInfo.from_warehouse})</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.material_receipt_a}</span>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="font-semibold text-gray-600">6. Stock Entry Material Issue (Local FJD at {successInfo.to_warehouse})</span>
                    <span className="font-mono font-bold text-gray-900">{successInfo.material_issue_b}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={15} />
                  Print Transfer Slip
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#E00000] hover:bg-[#b70000] text-white text-xs font-black transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
