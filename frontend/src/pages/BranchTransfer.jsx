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
  Printer,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";

// ── Print Official Branch Transfer Receipt Slip ─────────────────────────────
function printBranchTransferSlip({
  successData,
  fromWh,
  toWh,
  currency,
  totalForeignAmount,
  totalLocalAmount,
  exchangeRate,
  items = [],
  tellerName,
  company,
}) {
  const printWindow = window.open("", "_blank", "width=460,height=720");
  if (!printWindow) {
    alert("Please allow popups to print the transfer receipt slip.");
    return;
  }

  const dateStr = new Date().toISOString().split("T")[0];
  const timeStr = new Date().toTimeString().split(" ")[0].split(".")[0];

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Branch Transfer Receipt - ${fromWh} to ${toWh}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Share Tech Mono', monospace; font-size: 11px; }
          body { width: 82mm; padding: 12px; margin: 0 auto; color: #111; line-height: 1.35; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .divider { border: none; border-top: 1px dashed #777; margin: 7px 0; }
          .divider-solid { border: none; border-top: 1.5px solid #000; margin: 8px 0; }
          .title { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { font-size: 10px; color: #444; }
          .badge { display: inline-block; padding: 2px 7px; background: #eee; font-weight: bold; font-size: 10px; border-radius: 3px; margin: 4px 0; }
          .total { font-size: 14px; font-weight: bold; }
          .doc-box { background: #fafafa; border: 1px solid #ddd; padding: 6px; margin: 6px 0; border-radius: 4px; font-size: 10px; }
          .sig-box { margin-top: 22px; display: flex; justify-content: space-between; }
          .sig-line { width: 46%; border-top: 1px solid #333; padding-top: 4px; text-align: center; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${company || "MH MONEY EXPRESS"}</div>
          <div class="subtitle">OFFICIAL INTER-BRANCH FOREIGN CURRENCY TRANSFER</div>
          <div class="badge">BRANCH TO BRANCH TRANSFER</div>
        </div>
        <hr class="divider" />
        <div class="row"><span>DATE / TIME:</span><span>${dateStr} ${timeStr}</span></div>
        <div class="row"><span>INITIATING TELLER:</span><span>${tellerName || "Authorized Teller"}</span></div>
        <hr class="divider" />
        <div class="row"><span>ORIGIN BRANCH (A):</span><span class="bold">${fromWh}</span></div>
        <div class="row"><span>TARGET BRANCH (B):</span><span class="bold">${toWh}</span></div>
        <hr class="divider" />

        <div class="doc-box">
          <div class="bold" style="margin-bottom: 2px;">ERP AUDIT RECONCILIATION:</div>
          <div>Purchase Inv: <span class="bold">${successData?.purchase_invoice || "—"}</span></div>
          <div>Sales Inv:    <span class="bold">${successData?.sales_invoice || "—"}</span></div>
          <div>Recpt (Local A): <span class="bold">${successData?.material_receipt_local || "—"}</span></div>
          <div>Recpt (Forn B):  <span class="bold">${successData?.material_receipt_foreign || "—"}</span></div>
          <div>Issue (Forn A):  <span class="bold">${successData?.material_issue_foreign || "—"}</span></div>
        </div>

        <hr class="divider" />
        <div class="row bold"><span>TRANSFERRED ITEMS</span><span>QTY &times; VALUE</span><span style="text-align:right">SUBTOTAL</span></div>
        <hr class="divider" />
        ${items
          .map(
            (it) => `
          <div class="row">
            <span>${it.item_code}</span>
            <span>${it.qty} &times; ${Number(it.rate || it.value || 0).toFixed(2)}</span>
            <span class="bold">${(Number(it.qty) * Number(it.rate || it.value || 0)).toFixed(2)} ${currency}</span>
          </div>
        `
          )
          .join("")}

        <hr class="divider-solid" />
        <div class="row total">
          <span>TOTAL ${currency}:</span>
          <span>${Number(totalForeignAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}</span>
        </div>
        ${
          exchangeRate
            ? `
          <div class="row"><span>CONVERSION RATE:</span><span>1 ${currency} = ${Number(exchangeRate).toFixed(4)} FJD</span></div>
          <div class="row bold"><span>EQUIVALENT LOCAL TOTAL:</span><span>$${Number(totalLocalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FJD</span></div>
        `
            : ""
        }

        <hr class="divider" />
        <div class="center subtitle" style="margin-top:6px;">
          Both branch custodians confirm verification and physical handover of the cash listed above.
        </div>
        <div class="sig-box">
          <div class="sig-line">ORIGIN DISPATCHER<br/>(${fromWh})</div>
          <div class="sig-line">TARGET RECEIVER<br/>(${toWh})</div>
        </div>
        <div class="center" style="margin-top:14px; font-size:9px; color:#666;">
          Generated automatically via MH Money Express ERP System
        </div>
        <script>window.onload = () => { window.print(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function BranchTransfer() {
  const loginUser = useUser();
  const { selectedWarehouse, warehouses: userWarehouses } = useSettings();

  // Company details
  const [companyName, setCompanyName] = useState("MH Money Express");
  const [companyAbbr, setCompanyAbbr] = useState("MME");

  // System Warehouses list
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  // ── 1. Assigned Branches Filter ──────────────────────────────────────────
  // User can ONLY select From Branch from branches they have access to in Settings or are assigned to
  const assignedBranches = useMemo(() => {
    const list =
      Array.isArray(userWarehouses) && userWarehouses.length > 0
        ? userWarehouses
        : loginUser?.user?.warehouses || [];

    const names = list
      .map((w) => (typeof w === "string" ? w : w?.warehouse || w?.name))
      .filter(Boolean);

    // If no specific warehouse was assigned to user, allow fallback to all non-vault warehouses
    return names;
  }, [userWarehouses, loginUser]);

  // Initial source branch defaults to selectedWarehouse or first assigned branch
  const defaultSourceBranch = useMemo(() => {
    if (selectedWarehouse?.warehouse) return selectedWarehouse.warehouse;
    if (typeof selectedWarehouse === "string") return selectedWarehouse;
    if (assignedBranches.length > 0) return assignedBranches[0];
    return "";
  }, [selectedWarehouse, assignedBranches]);

  // Routing State: From Branch & To Branch
  const [fromBranch, setFromBranch] = useState(defaultSourceBranch);
  const [targetBranch, setTargetBranch] = useState("");
  // Routing gate: When true, shows full transfer interface; when false, focuses on From/To selection
  const [isRoutingConfirmed, setIsRoutingConfirmed] = useState(false);

  // Keep fromBranch synced if default resolves later
  useEffect(() => {
    if (!fromBranch && defaultSourceBranch) {
      setFromBranch(defaultSourceBranch);
    }
  }, [defaultSourceBranch, fromBranch]);

  // Fetch available branches and system company details
  useEffect(() => {
    setLoadingWarehouses(true);
    axios
      .get("/api/method/moneygram.moneygram.api.branch_transfer.get_branch_transfer_warehouses")
      .then((res) => {
        if (res.data?.message) {
          const data = res.data.message;
          if (Array.isArray(data)) {
            setAllWarehouses(data);
          } else if (data.warehouses) {
            setAllWarehouses(data.warehouses);
            if (data.company) setCompanyName(data.company);
            if (data.abbr) setCompanyAbbr(data.abbr);
          }
        }
      })
      .catch((err) => console.error("Error fetching branch warehouses:", err))
      .finally(() => setLoadingWarehouses(false));
  }, []);

  // Filter non-vault leaf branches
  const nonVaultWarehouses = useMemo(() => {
    return allWarehouses.filter((w) => !w.custom_is_vault);
  }, [allWarehouses]);

  // Selectable From-Branch options: restricted to assigned branches if any, else all branches
  const fromBranchOptions = useMemo(() => {
    if (assignedBranches.length > 0) {
      return nonVaultWarehouses.filter((w) => assignedBranches.includes(w.name));
    }
    return nonVaultWarehouses;
  }, [nonVaultWarehouses, assignedBranches]);

  // Selectable Target-Branch options: all branches except selected fromBranch
  const targetBranchOptions = useMemo(() => {
    return nonVaultWarehouses.filter((w) => w.name !== fromBranch);
  }, [nonVaultWarehouses, fromBranch]);

  // Default target branch once options load
  useEffect(() => {
    if (targetBranchOptions.length > 0 && (!targetBranch || targetBranch === fromBranch)) {
      setTargetBranch(targetBranchOptions[0].name);
    }
  }, [targetBranchOptions, fromBranch, targetBranch]);

  // ── 2. All Foreign Currencies & Denominations from ERPNext ────────────────
  const [denominationsData, setDenominationsData] = useState(null);
  const [denomLoading, setDenomLoading] = useState(false);
  const [denomCounts, setDenomCounts] = useState({});
  const [remarks, setRemarks] = useState("");
  const [exchangeRatesMap, setExchangeRatesMap] = useState({});

  // Fetch real-time exchange rates for From Branch
  useEffect(() => {
    if (!fromBranch) return;
    const today = new Date().toISOString().split("T")[0];
    axios
      .post("/api/method/moneygram.api.get_currency_exchange_rate", {
        today_date: today,
        location: fromBranch,
      })
      .then((res) => {
        const rows = res.data?.message?.table_luxr || [];
        const rMap = {};
        for (const row of rows) {
          const cCode = row.currency_name;
          const buyP = parseFloat(row.buying_price);
          const sellP = parseFloat(row.selling_price);
          // In standard exchange: buying rate gives 1 / buyP (FJD per foreign unit)
          const fjdRate = buyP > 0 ? 1 / buyP : sellP > 0 ? 1 / sellP : 1.0;
          rMap[cCode] = {
            buying_price: buyP,
            selling_price: sellP,
            fjdRate: Math.round(fjdRate * 10000) / 10000,
          };
        }
        setExchangeRatesMap(rMap);
      })
      .catch((err) => console.warn("Notice: exchange rates lookup returned:", err?.message));
  }, [fromBranch]);

  // Dynamically derived currencies directly from ERPNext denominations stock
  const dynamicCurrencies = useMemo(() => {
    if (!denominationsData || Object.keys(denominationsData).length === 0) {
      return [
        { code: "USD", country: "USA", label: "US Dollar", symbol: "$" },
        { code: "AUD", country: "Australia", label: "Australian Dollar", symbol: "A$" },
        { code: "NZD", country: "New Zealand", label: "NZ Dollar", symbol: "NZ$" },
        { code: "EUR", country: "Euro", label: "Euro", symbol: "€" },
        { code: "GBP", country: "UK", label: "British Pound", symbol: "£" },
        { code: "CAD", country: "Canada", label: "Canadian Dollar", symbol: "C$" },
      ];
    }
    return Object.values(denominationsData)
      .filter((c) => (c.notes && c.notes.length > 0) || (c.coins && c.coins.length > 0))
      .map((c) => ({
        code: c.currency || c.country,
        country: c.country,
        label: `${c.country} (${c.currency || ""})`,
        symbol: c.symbol || "$",
      }));
  }, [denominationsData]);

  // Selected Currency
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const selectedCountryObj = useMemo(
    () =>
      dynamicCurrencies.find((c) => c.code === selectedCurrency) ||
      dynamicCurrencies[0] || { code: "USD", country: "USA", symbol: "$" },
    [dynamicCurrencies, selectedCurrency]
  );

  // Live Exchange Rate for selected currency to FJD
  const currentExchangeRate = useMemo(() => {
    if (selectedCurrency === "FJD") return 1.0;
    const rateEntry = exchangeRatesMap[selectedCurrency];
    if (rateEntry?.fjdRate) return rateEntry.fjdRate;
    // Fallback standard currency conversions if master rate row is not published for today
    const defaults = {
      USD: 2.26,
      AUD: 1.52,
      NZD: 1.38,
      EUR: 2.45,
      GBP: 2.92,
      CAD: 1.65,
      JPY: 0.015,
      SGD: 1.70,
    };
    return defaults[selectedCurrency] || 1.0;
  }, [exchangeRatesMap, selectedCurrency]);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch stock and denominations for fromBranch
  const fetchDenominationsStock = () => {
    if (!fromBranch) return;
    setDenomLoading(true);
    setErrorMsg("");
    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_warehouse_denominations_stock", {
        params: {
          warehouse: fromBranch,
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
  }, [fromBranch]);

  const currentCountryDenom = denominationsData?.[selectedCountryObj.country] || null;
  const notesList = currentCountryDenom?.notes || [];
  const coinsList = currentCountryDenom?.coins || [];
  const allItemsList = useMemo(() => [...notesList, ...coinsList], [notesList, coinsList]);

  // Totals calculations
  const { totalPieces, totalForeignAmount, totalLocalAmount } = useMemo(() => {
    let pieces = 0;
    let foreignAmt = 0;
    for (const item of allItemsList) {
      const count = denomCounts[item.item_code] || 0;
      if (count > 0) {
        pieces += count;
        foreignAmt += count * (item.value || 0);
      }
    }
    const localAmt = Math.round(foreignAmt * currentExchangeRate * 100) / 100;
    return {
      totalPieces: pieces,
      totalForeignAmount: foreignAmt,
      totalLocalAmount: localAmt,
    };
  }, [allItemsList, denomCounts, currentExchangeRate]);

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

  // ── 3. Execute Inter-Branch Transfer ──────────────────────────────────────
  const handleSubmitTransfer = async () => {
    if (!fromBranch) {
      alert("Please select the Source Branch (From).");
      return;
    }
    if (!targetBranch) {
      alert("Please select the Target Branch (To).");
      return;
    }
    if (fromBranch === targetBranch) {
      alert("Source branch and Target branch cannot be the same.");
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
          to_warehouse: targetBranch,
          currency: selectedCurrency,
          country: selectedCountryObj.country,
          items: payloadItems,
          exchange_rate: currentExchangeRate,
          remarks:
            remarks ||
            `Branch Transfer: ${selectedCurrency} ${totalForeignAmount.toFixed(2)} from ${fromBranch} to ${targetBranch}`,
        }
      );

      if (res.data?.message?.status === "success") {
        setSuccessInfo({
          ...res.data.message,
          source: fromBranch,
          target: targetBranch,
          foreignAmount: totalForeignAmount,
          localAmount: totalLocalAmount,
          currency: selectedCurrency,
          pieces: totalPieces,
          exchangeRate: currentExchangeRate,
          items: payloadItems,
        });
        handleClearAll();
        fetchDenominationsStock();
      } else {
        alert("Transfer could not be processed.");
      }
    } catch (err) {
      console.error("Branch Transfer Error:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.exception ||
        err.message ||
        "Failed to execute branch transfer.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              <Building2 size={13} />
              <span>Inter-Branch Multi-Leg Logistics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Branch Cash &amp; Forex Transfer
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Transfer foreign currency banknotes &amp; coins between branches with automated Purchase Invoice,
              Sales Invoice, and dual-branch cash account stock entries.
            </p>
          </div>

          {/* Active Status Badge */}
          {isRoutingConfirmed && (
            <button
              type="button"
              onClick={() => setIsRoutingConfirmed(false)}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors self-start md:self-auto cursor-pointer"
            >
              <RotateCcw size={14} className="text-[#E00000]" />
              <span>Change Branches</span>
            </button>
          )}
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-red-700 font-medium">
              <span className="font-bold">Transfer Error: </span>
              {errorMsg}
            </div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-red-400 hover:text-red-700 font-bold text-xs"
            >
              &times;
            </button>
          </div>
        )}

        {/* Success Modal / Banner */}
        {successInfo && (
          <div className="my-6 p-6 sm:p-8 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/70">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">
                    Branch Transfer Completed Successfully
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Transferred <span className="font-black">{successInfo.currency} {successInfo.foreignAmount?.toFixed(2)}</span>{" "}
                    (equiv. ${successInfo.localAmount?.toFixed(2)} FJD) from{" "}
                    <span className="font-bold">{successInfo.source}</span> &rarr;{" "}
                    <span className="font-bold">{successInfo.target}</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printBranchTransferSlip({
                      successData: successInfo,
                      fromWh: successInfo.source,
                      toWh: successInfo.target,
                      currency: successInfo.currency,
                      totalForeignAmount: successInfo.foreignAmount,
                      totalLocalAmount: successInfo.localAmount,
                      exchangeRate: successInfo.exchangeRate,
                      items: successInfo.items || [],
                      tellerName: loginUser?.user?.full_name || loginUser?.user?.user,
                      company: companyName,
                    })
                  }
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100/60 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Transfer Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Generated Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  1. Purchase Invoice
                </span>
                <span className="font-mono text-xs font-black text-gray-900 block truncate">
                  {successInfo.purchase_invoice}
                </span>
                <span className="text-[10px] text-gray-400">Supplier: {successInfo.source}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  2. Recpt Local Cash (A)
                </span>
                <span className="font-mono text-xs font-black text-gray-900 block truncate">
                  {successInfo.material_receipt_local}
                </span>
                <span className="text-[10px] text-gray-400">In: {successInfo.source}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  3. Sales Invoice
                </span>
                <span className="font-mono text-xs font-black text-gray-900 block truncate">
                  {successInfo.sales_invoice}
                </span>
                <span className="text-[10px] text-gray-400">Customer: {successInfo.target}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  4. Recpt Forn Cash (B)
                </span>
                <span className="font-mono text-xs font-black text-gray-900 block truncate">
                  {successInfo.material_receipt_foreign}
                </span>
                <span className="text-[10px] text-gray-400">In: {successInfo.target}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block mb-0.5">
                  5. Issue Forn Cash (A)
                </span>
                <span className="font-mono text-xs font-black text-gray-900 block truncate">
                  {successInfo.material_issue_foreign}
                </span>
                <span className="text-[10px] text-gray-400">Out: {successInfo.source}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 1: ROUTING SELECTION CARD (Point 1 of User Request) ──────── */}
        {(!isRoutingConfirmed || !fromBranch || !targetBranch) && (
          <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10 max-w-4xl mx-auto flex flex-col gap-6">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E00000] mx-auto flex items-center justify-center font-black mb-3">
                <Truck size={24} />
              </div>
              <h2 className="text-xl font-black text-gray-900">Select Transfer Branches</h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose the Origin Branch (where cash will be dispatched) and the Destination Branch
                (where cash will be received). You can only initiate transfers from branches assigned to your account.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
              {/* FROM BRANCH SELECTOR */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-gray-50/80 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    From Branch (Origin)
                  </span>
                  {assignedBranches.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Assigned Access
                    </span>
                  )}
                </div>

                <select
                  value={fromBranch}
                  onChange={(e) => setFromBranch(e.target.value)}
                  disabled={loadingWarehouses}
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] cursor-pointer"
                >
                  <option value="">-- Select Your Branch --</option>
                  {fromBranchOptions.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.warehouse_name || w.name}
                    </option>
                  ))}
                </select>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Cash Account:</span>
                  <span className="font-mono font-bold text-gray-700">
                    {fromBranch ? `${fromBranch} - ${companyAbbr}` : "—"}
                  </span>
                </div>
              </div>

              {/* TRANSITION ARROW */}
              <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                <div className="w-10 h-10 rounded-full bg-red-100 text-[#E00000] flex items-center justify-center font-bold">
                  <ArrowRight size={18} />
                </div>
              </div>

              {/* TO BRANCH SELECTOR */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-gray-50/80 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    To Branch (Destination)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Target Branch
                  </span>
                </div>

                <select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  disabled={loadingWarehouses || targetBranchOptions.length === 0}
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-xl text-sm font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000] cursor-pointer"
                >
                  <option value="">-- Select Target Branch --</option>
                  {targetBranchOptions.map((w) => (
                    <option key={w.name} value={w.name}>
                      {w.warehouse_name || w.name}
                    </option>
                  ))}
                </select>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Target Counterparty:</span>
                  <span className="font-mono font-bold text-gray-700 truncate max-w-[180px]">
                    {targetBranch || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* CONFIRM BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!fromBranch) {
                    alert("Please select a Source Branch where you have assigned access.");
                    return;
                  }
                  if (!targetBranch) {
                    alert("Please select a Destination Branch.");
                    return;
                  }
                  if (fromBranch === targetBranch) {
                    alert("Origin branch and destination branch must be different.");
                    return;
                  }
                  setIsRoutingConfirmed(true);
                }}
                disabled={!fromBranch || !targetBranch || fromBranch === targetBranch}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E00000] hover:bg-[#b70000] text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Currency &amp; Denominations</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: TRANSFER WORKSPACE (Unlocked once routing is confirmed) ── */}
        {isRoutingConfirmed && fromBranch && targetBranch && (
          <div className="mt-8">
            {/* Active Routing Summary Ribbon */}
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">From (Origin):</span>
                  <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-xl">
                    {fromBranch}
                  </span>
                </div>
                <ArrowRight size={16} className="text-[#E00000]" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-400">To (Target):</span>
                  <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-xl">
                    {targetBranch}
                  </span>
                </div>
                <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 border-l pl-4">
                  <span>Exchange Rate:</span>
                  <span className="font-mono font-bold text-[#E00000]">
                    1 {selectedCurrency} = {currentExchangeRate.toFixed(4)} FJD
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRoutingConfirmed(false)}
                className="text-xs font-bold text-[#E00000] hover:underline self-start sm:self-auto"
              >
                Change Branches
              </button>
            </div>

            {/* Main 2-Column Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Currency Selector & Denominations Grid */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Currency Tabs */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">
                      Select Transfer Currency
                    </p>
                    <span className="text-xs text-gray-400 font-medium">
                      All currencies loaded from ERPNext
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {dynamicCurrencies.map((c) => {
                      const isActive = selectedCurrency === c.code;
                      const rate = exchangeRatesMap[c.code]?.fjdRate;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSelectedCurrency(c.code)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                            isActive
                              ? "bg-[#E00000] text-white border-[#E00000] shadow-sm font-black"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          <span>{c.code}</span>
                          <span className="opacity-75">({c.symbol})</span>
                          {rate && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {rate.toFixed(2)}
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
                      <h2 className="text-base font-black text-gray-900">
                        {selectedCurrency} Banknotes &amp; Coins
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Showing live stock available at <span className="font-bold text-gray-600">{fromBranch}</span>
                      </p>
                    </div>
                    {totalPieces > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Reset Counts
                      </button>
                    )}
                  </div>

                  {denomLoading ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={22} className="animate-spin text-[#E00000]" />
                      <span className="text-xs font-semibold text-gray-400">
                        Loading branch denomination stock...
                      </span>
                    </div>
                  ) : allItemsList.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <Banknote size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-semibold">
                        No denomination items found for {selectedCountryObj.country} in ERPNext.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {/* Banknotes */}
                      {notesList.length > 0 && (
                        <div>
                          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3 flex items-center gap-1.5">
                            <Banknote size={14} className="text-[#E00000]" />
                            <span>Banknotes</span>
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
                                      </div>
                                      <div>
                                        <div className="font-black text-sm text-gray-900">
                                          {item.value} {selectedCurrency}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                          Stock in branch:{" "}
                                          <span
                                            className={`font-bold ${
                                              maxAvail > 0 ? "text-emerald-700" : "text-gray-400"
                                            }`}
                                          >
                                            {maxAvail} pcs
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {count > 0 && (
                                      <div className="text-right">
                                        <div className="text-xs font-black text-[#E00000]">
                                          {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                                          {selectedCurrency}
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
                            <span>Coins</span>
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
                                        {selectedCountryObj.symbol}
                                      </div>
                                      <div>
                                        <div className="font-black text-sm text-gray-900">
                                          {item.value} {selectedCurrency}
                                        </div>
                                        <div className="text-[11px] text-gray-400">
                                          Stock in branch:{" "}
                                          <span
                                            className={`font-bold ${
                                              maxAvail > 0 ? "text-emerald-700" : "text-gray-400"
                                            }`}
                                          >
                                            {maxAvail} pcs
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {count > 0 && (
                                      <div className="text-right">
                                        <div className="text-xs font-black text-[#E00000]">
                                          {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                                          {selectedCurrency}
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

              {/* Right Column: Transfer Summary, Pipeline Preview, and Submit */}
              <div className="lg:col-span-4 sticky top-24 flex flex-col gap-6">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5">
                  <h3 className="text-sm font-bold text-gray-800 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <span>Transfer Summary</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-red-50 text-[#E00000]">
                      Branch Dispatched
                    </span>
                  </h3>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Origin Branch (From)</span>
                      <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                        {fromBranch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Target Branch (To)</span>
                      <span className="font-bold text-gray-800 text-right truncate max-w-[170px]">
                        {targetBranch}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Exchange Rate</span>
                      <span className="font-bold font-mono text-gray-900">
                        1 {selectedCurrency} = {currentExchangeRate.toFixed(4)} FJD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Total Counted Pieces</span>
                      <span className="font-bold text-gray-900">{totalPieces} pcs</span>
                    </div>
                  </div>

                  {/* Total Amounts Box */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                        Total Foreign Amount
                      </span>
                      <div className="text-2xl font-black text-[#E00000]">
                        {totalForeignAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-sm font-bold text-gray-600">{selectedCurrency}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200/80 pt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Local Equivalent Value:</span>
                      <span className="font-mono font-black text-gray-900">
                        ${totalLocalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                        <span className="text-[10px] text-gray-500">FJD</span>
                      </span>
                    </div>
                  </div>

                  {/* Accounting Pipeline Breakdown */}
                  <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200 text-xs">
                    <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                      <Layers size={13} className="text-[#E00000]" />
                      <span>Automated Pipeline Flow</span>
                    </span>
                    <ul className="space-y-1.5 text-[11px] text-gray-600">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">1.</span>
                        <span>
                          <strong>Purchase Invoice:</strong> Supplier = {fromBranch}, Warehouse = {targetBranch}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">2.</span>
                        <span>
                          <strong>Material Receipt (Local):</strong> Received at {fromBranch} with cash account mapping
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">3.</span>
                        <span>
                          <strong>Sales Invoice:</strong> Customer = {targetBranch}, Currency = FJD
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">4.</span>
                        <span>
                          <strong>Material Receipt (Foreign):</strong> Received at {targetBranch}
                        </span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">5.</span>
                        <span>
                          <strong>Material Issue (Foreign):</strong> Deducted from {fromBranch}
                        </span>
                      </li>
                    </ul>
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
                      placeholder="e.g. Courier pouch reference or branch transfer note..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#E00000]/20 focus:border-[#E00000]"
                    />
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleSubmitTransfer}
                    disabled={isSubmitting || totalPieces <= 0 || !fromBranch || !targetBranch}
                    className="w-full py-4 px-6 rounded-2xl bg-[#E00000] hover:bg-[#b70000] text-white font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Executing Multi-Leg Transfer...</span>
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
      </main>
    </div>
  );
}
