import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/layout/Navbar";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";
import { useAppConfiguration } from "../hooks/useAppConfiguration";
import { ChevronDown } from "lucide-react";

// // ── Stock tab constants ─────────────────────────────────────────────────────
// const CURRENCY_CODE = {
//   Australia:     "AUD",
//   Fiji:          "FJD",
//   Malaysia:      "MYR",
//   "New Zealand": "NZD",
//   Singapore:     "SGD",
//   Thailand:      "THB",
// };
// const FLAG = {
//   Australia:     "🇦🇺",
//   Fiji:          "🇫🇯",
//   Malaysia:      "🇲🇾",
//   "New Zealand": "🇳🇿",
//   Singapore:     "🇸🇬",
//   Thailand:      "🇹🇭",
// };


// ── Stock tab constants ─────────────────────────────────────────────────────
const CURRENCY_CODE = {
  Australia:         "AUD",
  Canada:            "CAD",
  China:             "CNY",
  Euro:              "EUR",
  Fiji:              "FJD",
  "French Pacific":  "XPF",
  HongKong:          "HKD",
  Japan:             "JPY",
  Korea:             "KRW",
  Malaysia:          "MYR",
  "New Zealand":     "NZD",
  "Papua New Guinea":"PGK",
  Philippines:       "PHP",
  Samoa:             "WST",
  Singapore:         "SGD",
  Switzerland:       "CHF",
  Thailand:          "THB",
  Tonga:             "TOP",
  UK:                "GBP",
  USA:               "USD",
  Vanuatu:           "VUV",
};

const FLAG = {
  Australia:          "🇦🇺",
  Canada:             "🇨🇦",
  China:              "🇨🇳",
  Euro:               "🇪🇺",
  Fiji:               "🇫🇯",
  "French Pacific":   "🇵🇫",
  HongKong:           "🇭🇰",
  Japan:              "🇯🇵",
  Korea:              "🇰🇷",
  Malaysia:           "🇲🇾",
  "New Zealand":      "🇳🇿",
  "Papua New Guinea": "🇵🇬",
  Philippines:        "🇵🇭",
  Samoa:              "🇼🇸",
  Singapore:          "🇸🇬",
  Switzerland:        "🇨🇭",
  Thailand:           "🇹🇭",
  Tonga:              "🇹🇴",
  UK:                 "🇬🇧",
  USA:                "🇺🇸",
  Vanuatu:            "🇻🇺",
};

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Paid:        "bg-green-50 text-green-700 border-green-200",
    Unpaid:      "bg-yellow-50 text-yellow-700 border-yellow-200",
    Overdue:     "bg-red-50 text-red-500 border-red-200",
    "Part Paid": "bg-blue-50 text-blue-600 border-blue-200",
    Cancelled:   "bg-gray-100 text-gray-400 border-gray-200",
    Draft:       "bg-gray-50 text-gray-500 border-gray-200",
    Return:      "bg-purple-50 text-purple-600 border-purple-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-400 border-gray-200";
  return (
    <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
      {status ?? "—"}
    </span>
  );
}

// ── Amount Cell ────────────────────────────────────────────────────────────
function AmtCell({ value, currency }) {
  if (value == null || value === "") return <span className="text-gray-300">—</span>;
  const num = parseFloat(value);
  const colored = num < 0 ? "text-red-500" : num === 0 ? "text-gray-400" : "text-gray-800";
  return (
    <span className={`tabular-nums font-semibold ${colored}`}>
      {num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {currency ? <span className="ml-1 text-[10px] font-bold text-gray-400">{currency}</span> : null}
    </span>
  );
}

// ── Text Cell ──────────────────────────────────────────────────────────────
function TextCell({ value, mono = false, muted = false }) {
  if (!value) return <span className="text-gray-300">—</span>;
  return (
    <span className={`${mono ? "font-mono text-xs" : "text-sm"} ${muted ? "text-gray-400" : "text-gray-700"}`}>
      {value}
    </span>
  );
}

// ── Day End Row ────────────────────────────────────────────────────────────
function DayEndRow({ label, value, sub, highlight = false }) {
  return (
    <tr className={`border-b border-gray-100 ${highlight ? "bg-red-50/40" : "hover:bg-gray-50"} transition-colors`}>
      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700">{label}</td>
      <td className="px-5 py-3.5 text-right">
        <span className={`tabular-nums font-black text-base ${highlight ? "text-[#E00000]" : "text-gray-900"}`}>
          {value ?? "—"}
        </span>
      </td>
      {sub !== undefined && (
        <td className="px-5 py-3.5 text-right text-xs text-gray-400">{sub}</td>
      )}
    </tr>
  );
}

// ── Tab Button ─────────────────────────────────────────────────────────────
function TabButton({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000]
        ${active
          ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/20"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
        }`}
    >
      {label}
      {count != null && (
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-black tabular-nums
          ${active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Transactions Tab ───────────────────────────────────────────────────────
function TransactionsTab({ warehouse, loginUser }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState("");

  const fetchData = useCallback(async () => {
    if (!loginUser?.user) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/method/moneygram.moneygram.api.get_transactions.get_all_transactions",
        { 
            //  from_date: "2026-04-01",
//   to_date: "2026-04-08",
  warehouse: warehouse?.warehouse,
//   party: "ABC Pvt Ltd",
  limit_start: 0,
  limit_page_length: 20
         },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
          },
        }
      );
      setRows(res.data?.message.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [warehouse, loginUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rows.filter((r) =>
    !search ||
    [r.name, r.customer, r.status, r.currency, r.company, r.owner]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalGrand       = filtered.reduce((s, r) => s + (parseFloat(r.grand_total) || 0), 0);
  const totalPaid        = filtered.reduce((s, r) => s + (parseFloat(r.paid_amount) || 0), 0);
  const totalOutstanding = filtered.reduce((s, r) => s + (parseFloat(r.outstanding_amount) || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, customer, status…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#E00000]/30 focus:border-[#E00000]/50 placeholder-gray-400"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        <span className="text-xs text-gray-400 font-medium">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <svg className="w-5 h-5 animate-spin text-[#E00000]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading transactions…
          </div>
        ) : (
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["#", "Name", "Date", "OET Code", "Customer", "Grand Total", "Outstanding", "Currency", "Status", "Company", "Warehouse", "Owner"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-5 py-12 text-center text-gray-400 text-sm">No transactions found.</td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr
                    key={row.name}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                  >
                    <td className="px-4 py-3.5 text-xs text-gray-300 tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50 text-gray-700 truncate inline-block">
                        {row.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{row.posting_date}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50 text-gray-700 truncate inline-block">
                        {row.oet_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-800 whitespace-nowrap">{row.party ?? "—"}</td>
                    <td className="px-4 py-3.5 text-right"><AmtCell value={row.grand_total} /></td>
                    {/* <td className="px-4 py-3.5 text-right"><AmtCell value={row.paid_amount} /></td> */}
                    <td className="px-4 py-3.5 text-right"><AmtCell value={row.outstanding_amount} /></td>
                    <td className="px-4 py-3.5 text-xs font-bold text-gray-500">{row.currency ?? "—"}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={row.status} /></td>
                    <td className="px-4 py-3.5 truncate inline-block"><TextCell value={row.company} muted /></td>
                    <td className="px-4 py-3.5"><TextCell value={row.set_warehouse} muted /></td>
                    <td className="px-4 py-3.5"><TextCell value={row.owner} muted /></td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={4} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-[#E00000]">
                    Totals
                  </td>
                  <td className="px-4 py-3 text-right font-black text-gray-900 tabular-nums text-sm">
                    {totalGrand.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  
                  <td className="px-4 py-3 text-right font-black text-red-500 tabular-nums text-sm">
                    {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={5} />
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  );
}

// ── Day End Closing Report Tab ─────────────────────────────────────────────
function DayEndClosingTab({ warehouse, loginUser }) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate]       = useState(() => new Date().toISOString().slice(0, 10));
  const [oetCode, setOetCode] = useState("")
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();

  const fetchReport = useCallback(async () => {
    
    if (!loginUser?.user) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "/api/method/frappe.desk.query_report.run",
        { report_name: "MH Day End Report",
          filters: {"company":"MH Money Express","from_date":date,"to_date":date, "oet_code": oetCode}

         },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
          },
        }
      );
      setReport(res.data?.message ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [warehouse, loginUser, date, oetCode]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  return (
    <div className="flex flex-col gap-5">
      {/* Date picker + refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchReport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Generate
        </button>

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all cursor-pointer">
          <label htmlFor="oet-code" >
            OET Code
          </label>

          <select onChange={(e) => setOetCode(e.target.value)} name="oet-code" id="oet-code">
            <option value="">--SELECT--</option>
            {potOptions.map(pot => (
              <option
                key={pot.code} value={pot.code}>
                {pot.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
          <svg className="w-5 h-5 animate-spin text-[#E00000]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generating report…
        </div>
      ) : !report ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No report data available for the selected date.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Summary Table */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden md:col-span-2">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#E00000]">Day End Summary · {date}</p>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {
                    report?.columns?.map((col) => (
                      <th key={col.fieldname} className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        {col.label}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                
                {
                  report?.result?.map((row, idx) => (
                    <tr key={idx} className={`border-b border-gray-100 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                      {report.columns.map((col) => (
                        <td key={col.fieldname} className="px-5 py-3 text-right text-sm">
                          {row[col.fieldname] ?? "-"}
                        </td>
                      ))}
                    </tr>
                  ))

                }
              </tbody>
            </table>
          </div>

          
        </div>
      )}
    </div>
  );
}

// ── Stock Tab ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, type = "default" }) {
  const styles = {
    default: { card: "bg-white border-gray-200",     label: "text-gray-500",  val: "text-gray-900",  sub: "text-gray-400"  },
    green:   { card: "bg-green-50 border-green-200", label: "text-green-600", val: "text-green-700", sub: "text-green-400" },
    red:     { card: "bg-red-50 border-red-200",     label: "text-red-500",   val: "text-red-600",   sub: "text-red-400"   },
    muted:   { card: "bg-gray-50 border-gray-100",   label: "text-gray-400",  val: "text-gray-400",  sub: "text-gray-300"  },
  };
  const s = styles[type];
  return (
    <div className={`flex-1 min-w-[140px] rounded-2xl border px-5 py-4 flex flex-col gap-1 ${s?.card}`}>
      <p className={`text-[11px] font-bold uppercase tracking-widest ${s?.label}`}>{label}</p>
      <p className={`text-[28px] font-black tabular-nums leading-tight ${s?.val}`}>{value}</p>
      {sub && <p className={`text-xs ${s.sub}`}>{sub}</p>}
    </div>
  );
}

function QtyBadge({ qty }) {
  if (qty < 0)
    return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-red-50 text-red-500 border border-red-200">{qty}</span>;
  if (qty === 0)
    return <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">—</span>;
  return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-green-50 text-green-700 border border-green-200">{qty.toLocaleString()}</span>;
}

function totalQty(items)   { return items?.reduce((s, i) => s + i.stock_qty, 0); }
function inStockQty(items) { return items?.filter(i => i.stock_qty > 0).reduce((s, i) => s + i.stock_qty, 0); }
function totalValue(items) { return items?.reduce((sum, i) => sum + (i.stock_value || 0), 0); }

function StockTab({ warehouse, loginUser }) {
  const [data, setData]   = useState({});
  const [active, setActive] = useState(null);

  const countries = Object.keys(data).filter((c) => data[c]?.length > 0);

  const fetchStock = useCallback(async () => {
    if (!loginUser?.user || !warehouse) return;
    try {
      const res = await axios.request({
        method: "POST",
        url: "/api/method/moneygram.moneygram.api.get_denomination.get_all_countries_stock",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
        },
        data: { warehouse: warehouse?.warehouse },
      });
      setData(res.data.message ?? {});
    } catch (err) {
      console.error(err);
    }
  }, [warehouse, loginUser]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  useEffect(() => {
    if (countries.length > 0 && !active) setActive(countries[0]);
  }, [data]);

  const items         = data[active];
  const total         = totalQty(items);
  const positive      = inStockQty(items);
  const inStockCount  = items?.filter(i => i.stock_qty > 0).length ?? 0;
  const totalValueAmt = totalValue(items);

  return (
    <div className="flex flex-col gap-5">
      {/* Currency tabs */}
      <div className="flex flex-wrap gap-2">
        {countries.map((c) => {
          const tot = totalValue(data[c]);
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E00000]
                ${isActive
                  ? "bg-[#E00000] text-white border-[#E00000] shadow-md shadow-[#E00000]/25"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50"
                }`}
            >
              <span className="text-base leading-none">{FLAG[c]}</span>
              <span>{c}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black tabular-nums
                ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                {tot?.toLocaleString()}
              </span>
            </button>
          );
        })}
        <button
          onClick={fetchStock}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600 hover:border-[#E00000]/40 hover:text-[#E00000] hover:bg-red-50 transition-all ml-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {countries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400 text-sm">
          No stock data available for this warehouse.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Qty"    value={total?.toLocaleString()}    sub={`${CURRENCY_CODE[active]} · all denominations`} type="default" />
            <StatCard label="In Stock"     value={positive?.toLocaleString()} sub={`${inStockCount} denomination${inStockCount !== 1 ? "s" : ""}`} type="green" />
            <StatCard label="Total Value"  value={totalValueAmt?.toLocaleString()} sub={`${CURRENCY_CODE[active]} · total worth`} type="default" />
          </div>

          <div className="border-t border-gray-100" />

          {/* Active currency label */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Denominations</p>
            <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              {FLAG[active]}&nbsp;
              <span className="font-bold text-gray-900">{active}</span>
              <span className="text-gray-400">·</span>
              <span>{CURRENCY_CODE[active]}</span>
              <span className="text-gray-400">·</span>
              <span>{items?.length} items</span>
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["#", "Item Code", "Denomination", "Warehouse", "Rate", "Item Value", "Stock Qty"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items?.map((row, idx) => (
                  <tr key={row.item_code} className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}>
                    <td className="px-5 py-3.5 text-xs text-gray-300 tabular-nums">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium tracking-wide text-gray-700 bg-gray-50 font-mono">{row.item_code}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">{row.item_name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{row.warehouse}</td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.valuation_rate} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_value} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_qty} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={4} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-[#E00000]">Total</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{total?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{totalValueAmt?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">{total?.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Reports() {
  const [tab, setTab]         = useState("transactions");
  const loginUser             = useUser();
  const { selectedWarehouse } = useSettings();

  const sectionLabel = {
    transactions: "Transaction Records",
    dayend:       "Day End Closing Report",
    stock:        "Currency Stock",
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 font-sans">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-6">

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col gap-7">

            {/* Section label */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Reports</p>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              <TabButton
                label="Transactions"
                active={tab === "transactions"}
                onClick={() => setTab("transactions")}
              />
              <TabButton
                label="Day End Closing Report"
                active={tab === "dayend"}
                onClick={() => setTab("dayend")}
              />
              <TabButton
                label="Stock"
                active={tab === "stock"}
                onClick={() => setTab("stock")}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Section label */}
            <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">
              {sectionLabel[tab]}
            </p>

            {/* Tab Content */}
            {tab === "transactions" && (
              <TransactionsTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}
            {tab === "dayend" && (
              <DayEndClosingTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}
            {tab === "stock" && (
              <StockTab warehouse={selectedWarehouse} loginUser={loginUser} />
            )}

          </div>

          <p className="text-center text-xs text-gray-400 pb-2">MH Money Express · Reports · Stores - MME</p>
        </div>
      </div>
    </div>
  );
}