import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import axios from "axios";
// import React from "react";
import { useUser } from "../context/UserContext";
import { useSettings } from "../context/SettingsContext";

const CURRENCY_CODE = {
  Australia:     "AUD",
  Fiji:          "FJD",
  Malaysia:      "MYR",
  "New Zealand": "NZD",
  Singapore:     "SGD",
  Thailand:      "THB",
};

const FLAG = {
  Australia:     "🇦🇺",
  Fiji:          "🇫🇯",
  Malaysia:      "🇲🇾",
  "New Zealand": "🇳🇿",
  Singapore:     "🇸🇬",
  Thailand:      "🇹🇭",
};



function totalQty(items)   { return items?.reduce((s, i) => s + i.stock_qty, 0); }
function inStockQty(items) { return items?.filter(i => i.stock_qty > 0).reduce((s, i) => s + i.stock_qty, 0); }


// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, type = "default" }) {
  const styles = {
    default: { card: "bg-white border-gray-200",         label: "text-gray-500",  val: "text-gray-900",  sub: "text-gray-400"  },
    green:   { card: "bg-green-50 border-green-200",     label: "text-green-600", val: "text-green-700", sub: "text-green-400" },
    red:     { card: "bg-red-50 border-red-200",         label: "text-red-500",   val: "text-red-600",   sub: "text-red-400"   },
    muted:   { card: "bg-gray-50 border-gray-100",       label: "text-gray-400",  val: "text-gray-400",  sub: "text-gray-300"  },
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

// ── Qty Badge ─────────────────────────────────────────────────────────────
function QtyBadge({ qty }) {
  if (qty < 0)
    return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-red-50 text-red-500 border border-red-200">{qty}</span>;
  if (qty === 0)
    return <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">—</span>;
  return <span className="inline-block text-xs font-bold px-3 py-1 rounded-full tabular-nums bg-green-50 text-green-700 border border-green-200">{qty.toLocaleString()}</span>;
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Stocks() {
  const [data, setData] = useState({});
  const { selectedWarehouse } = useSettings();
  const loginUser = useUser();
  const [vaultInfo, setVaultInfo] = useState(null);
  const [locationMode, setLocationMode] = useState("counter"); // "counter" | "vault"

  const activeBranch = selectedWarehouse?.warehouse;

  useEffect(() => {
    if (!activeBranch || !loginUser?.user?.api_key) return;
    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info", {
        params: { warehouse: activeBranch },
        headers: {
          Authorization: `token ${loginUser.user.api_key}:${loginUser.user.api_secret}`,
        },
      })
      .then((res) => {
        if (res.data?.message) {
          setVaultInfo(res.data.message);
        }
      })
      .catch((err) => console.error("Error loading vault info in stocks:", err));
  }, [activeBranch, loginUser?.user?.api_key, loginUser?.user?.api_secret]);

  const queryWarehouse =
    locationMode === "vault"
      ? vaultInfo?.vault_warehouse || activeBranch
      : vaultInfo?.branch_warehouse || activeBranch;

  const countries = Object.keys(data).filter(
    (country) => data[country]?.length > 0
  );
  const [active, setActive] = useState(countries[0]);

  const currencyStock = async () => {
    if (!queryWarehouse || !loginUser?.user?.api_key) return;
    try {
      const options = {
        method: "POST",
        url: "/api/method/moneygram.moneygram.api.get_denomination.get_all_countries_stock",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
        },
        data: { warehouse: queryWarehouse },
      };

      const res = await axios.request(options);
      setData(res.data?.message || {});
    } catch (error) {
      console.error(error);
    }
  };

  function totalValue(items) {
    return items?.reduce((sum, i) => sum + (i.stock_value || 0), 0);
  }

  useEffect(() => {
    if (countries.length > 0 && !active) {
      setActive(countries[0]);
    }
  }, [data]);

  useEffect(() => {
    currencyStock();
  }, [queryWarehouse, loginUser]);
  

  const items        = data[active];
  const total        = totalQty(items);
  const positive     = inStockQty(items);
  const negCount     = items?.filter(i => i.stock_qty < 0).length;
  const zeroCount    = items?.filter(i => i.stock_qty === 0).length;
  const inStockCount = items?.filter(i => i.stock_qty > 0).length;
  const totalValuecount = totalValue(items);

  return (
    <div>
        <Navbar />
        <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-6">


        {/* ── Main white card — matches SettingsPanel ───────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 flex flex-col gap-7">

          {/* Location View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">Stock Location:</span>
              <div className="inline-flex p-1 rounded-xl bg-white border border-gray-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setLocationMode("counter")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    locationMode === "counter"
                      ? "bg-gray-900 text-white shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#E00000]" />
                  <span>Cash Counter</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    ({vaultInfo?.branch_warehouse || activeBranch})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMode("vault")}
                  disabled={!vaultInfo?.vault_warehouse}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    locationMode === "vault"
                      ? "bg-gray-900 text-white shadow-xs font-black"
                      : "text-gray-500 hover:text-gray-800"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Vault</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    ({vaultInfo?.vault_warehouse || "No Vault"})
                  </span>
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>Viewing:</span>
              <strong className="text-gray-900 font-bold bg-white px-2.5 py-1 rounded-md border border-gray-200">
                {queryWarehouse}
              </strong>
            </div>
          </div>

          {/* Section label */}
          <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Select Currency</p>

          {/* Tabs */}
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
                    {tot.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Section label */}
          <p className="text-xs font-bold tracking-widest uppercase text-[#E00000]">Summary</p>

          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Qty"  value={total?.toLocaleString()}    sub={`${CURRENCY_CODE[active]} · all denominations`} type="default" />
            <StatCard label="In Stock"   value={positive?.toLocaleString()} sub={`${inStockCount} denomination${inStockCount !== 1 ? "s" : ""}`} type="green" />
            {/* <StatCard label="Zero Stock" value={zeroCount}                 sub="denominations at 0"                             type="muted"  />
            <StatCard label="Negative"   value={negCount}                  sub="denominations below 0"                         type={negCount > 0 ? "red" : "muted"} /> */}
              <StatCard
                label="Total Value"
                value={totalValuecount?.toLocaleString()}
                sub={`${CURRENCY_CODE[active]} · total worth`}
                type="default"
/>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Section label + active indicator */}
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
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 w-10">#</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Item Code</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Denomination</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Warehouse</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Rate</th>
                  <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-400">Item Value</th>
                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-gray-400">Stock Qty</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((row, idx) => (
                  <tr
                    key={row.item_code}
                    className={`border-b border-gray-100 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/40" : "bg-white"}`}
                  >
                    <td className="px-5 py-3.5 text-xs text-gray-300 tabular-nums">{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium tracking-wide text-gray-700 bg-gray-50 font-mono">
                        {row.item_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800">{row.item_name}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell">{row.warehouse}</td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.valuation_rate} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_value} /></td>
                    <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_qty} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-[#E00000]/15">
                  <td colSpan={4} className="px-5 py-3 text-xs font-black uppercase tracking-widest text-[#E00000]">
                    Total
                  </td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">
                    {total?.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">
                    {totalValuecount?.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-black text-gray-900 tabular-nums">
                    {total?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>

        <p className="text-center text-xs text-gray-400 pb-2">MH Money Express · Currency Stock · Stores - MME</p>
      </div>
    </div>
    </div>
  );
}