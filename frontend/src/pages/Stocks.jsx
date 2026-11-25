import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import { sessionAxios as axios } from "../api/sessionClient.js";
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
function StatCard({ label, value, sub, type = "default", suffix }) {
  const styles = {
    default: { card: "bg-surface border-line text-ink", label: "text-muted", val: "text-ink", sub: "text-muted" },
    green: { card: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500", label: "text-emerald-500", val: "text-emerald-500", sub: "text-emerald-500/70" },
    red: { card: "bg-red-500/10 border-red-500/30 text-red-500", label: "text-red-500", val: "text-red-500", sub: "text-red-500/70" },
    muted: { card: "bg-surface-alt border-line text-muted", label: "text-muted", val: "text-muted", sub: "text-muted" },
  };
  const s = styles[type];
  return (
    <div className={`flex-1 min-w-[140px] rounded-2xl border px-5 py-4 flex flex-col gap-1 ${s?.card}`}>
      <p className={`text-overline font-semibold uppercase tracking-wider ${s?.label}`}>{label}</p>
      <div className="flex items-baseline gap-2 flex-wrap">
        <p className={`text-h1 font-bold tnum leading-tight ${s?.val}`}>{value}</p>
        {suffix && (
          <span className="text-body font-semibold text-muted tracking-wide">
            {suffix}
          </span>
        )}
      </div>
      {sub && <p className={`text-caption ${s.sub}`}>{sub}</p>}
    </div>
  );
}

// ── Qty Badge ─────────────────────────────────────────────────────────────
function QtyBadge({ qty }) {
  if (qty < 0)
    return <span className="inline-block text-caption font-semibold px-3 py-1 rounded-full tnum bg-red-500/10 text-red-500 border border-red-500/30">{qty}</span>;
  if (qty === 0)
    return <span className="inline-block text-caption font-semibold px-3 py-1 rounded-full bg-surface-alt text-muted border border-line">—</span>;
  return <span className="inline-block text-caption font-semibold px-3 py-1 rounded-full tnum bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">{qty.toLocaleString()}</span>;
}

// ── Report Loader ──────────────────────────────────────────────────────────
function ReportLoader({ label = "Loading stock records…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-500/20 animate-ping absolute" />
        <div className="w-10 h-10 rounded-full border-3 border-line border-t-brand-600 animate-spin" />
      </div>
      <p className="mt-4 text-body font-semibold text-ink animate-pulse">{label}</p>
      <p className="text-caption text-muted mt-1">Please wait while stock data is being fetched…</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Stocks() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const { selectedWarehouse } = useSettings();
  const loginUser = useUser();
  const [vaultInfo, setVaultInfo] = useState(null);
  const [locationMode, setLocationMode] = useState("counter"); // "counter" | "vault"

  const activeBranch = selectedWarehouse?.warehouse;

  useEffect(() => {
    if (!activeBranch) return;

    if (selectedWarehouse?.vault_warehouse) {
      setVaultInfo({
        branch_warehouse: activeBranch,
        vault_warehouse: selectedWarehouse.vault_warehouse,
        is_vault: false,
        company: "MMEL"
      });
    }

    const headers = {};

    axios
      .get("/api/method/moneygram.moneygram.api.vault_transfer.get_vault_info", {
        params: { warehouse: activeBranch },
        headers,
        withCredentials: true,
      })
      .then((res) => {
        if (res.data?.message) {
          setVaultInfo(res.data.message);
        }
      })
      .catch((err) => console.error("Error loading vault info in stocks:", err));
  }, [activeBranch, selectedWarehouse?.vault_warehouse, loginUser?.user?.email]);

  const queryWarehouse =
    locationMode === "vault"
      ? vaultInfo?.vault_warehouse || activeBranch
      : vaultInfo?.branch_warehouse || activeBranch;

  const countries = Object.keys(data).filter(
    (country) => data[country]?.length > 0
  );
  const [active, setActive] = useState(countries[0]);

  const currencyStock = async () => {
    if (!queryWarehouse || !loginUser?.user?.email) return;
    setLoading(true);
    try {
      const options = {
        method: "POST",
        url: "/api/method/moneygram.moneygram.api.get_denomination.get_all_countries_stock",
        headers: {
          "Content-Type": "application/json",
        },
        data: { warehouse: queryWarehouse },
      };

      const res = await axios.request(options);
      setData(res.data?.message || {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
        <div className="min-h-screen bg-page text-ink font-sans transition-colors">
      <div className="max-w-[80%] mx-auto px-4 py-10 flex flex-col gap-6">


        {/* ── Main card ───────────────── */}
        <div className="bg-surface rounded-3xl border border-line shadow-xl p-6 md:p-8 flex flex-col gap-7 text-ink">

          {/* Location View Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-alt border border-line">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-overline font-semibold uppercase tracking-wider text-muted">Stock Location:</span>
              <div className="inline-flex p-1 rounded-xl bg-surface border border-line shadow-xs">
                <button
                  type="button"
                  onClick={() => setLocationMode("counter")}
                  className={`px-3.5 py-1.5 rounded-lg text-label font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    locationMode === "counter"
                      ? "bg-chip text-ink shadow-xs font-bold border border-line"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-brand-600" />
                  <span>Cash Counter</span>
                  <span className="text-caption opacity-75 font-normal">
                    ({vaultInfo?.branch_warehouse || activeBranch})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMode("vault")}
                  disabled={!vaultInfo?.vault_warehouse}
                  className={`px-3.5 py-1.5 rounded-lg text-label font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    locationMode === "vault"
                      ? "bg-chip text-ink shadow-xs font-bold border border-line"
                      : "text-muted hover:text-ink"
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Vault</span>
                  <span className="text-caption opacity-75 font-normal">
                    ({vaultInfo?.vault_warehouse || "No Vault"})
                  </span>
                </button>
              </div>
            </div>

            <div className="text-caption text-muted flex items-center gap-1.5">
              <span>Viewing:</span>
              <strong className="text-ink font-semibold bg-surface px-2.5 py-1 rounded-md border border-line">
                {queryWarehouse}
              </strong>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-line bg-surface shadow-xs">
              <ReportLoader label="Loading currency stock records…" />
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500 text-body">
              No stock data available for this branch location.
            </div>
          ) : (
            <>
              {/* Section label */}
              <p className="text-overline font-semibold tracking-wider uppercase text-[#E00000]">Select Currency</p>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2">
            {countries.map((c) => {
              const tot = totalValue(data[c]);
              const isActive = c === active;
              return (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-label font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600
                    ${isActive
                      ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25"
                      : "bg-surface-alt text-muted border-line hover:border-brand-600/40 hover:text-brand-600 hover:bg-brand-500/10"
                    }`}
                >
                  <span>{c}</span>
                  {CURRENCY_CODE[c] && (
                    <span className={`text-overline font-semibold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-200/80 text-gray-600"
                    }`}>
                      {CURRENCY_CODE[c]}
                    </span>
                  )}
                  <span className={`text-caption px-2 py-0.5 rounded-full font-semibold tnum
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
          <p className="text-overline font-semibold tracking-wider uppercase text-[#E00000]">Summary</p>

          {/* Stat cards */}
          <div className="flex flex-wrap gap-3">
            <StatCard label="Total Qty"  value={total?.toLocaleString()}    sub={`${CURRENCY_CODE[active]} · all denominations`} type="default" />
            <StatCard label="In Stock"   value={positive?.toLocaleString()} sub={`${inStockCount} denomination${inStockCount !== 1 ? "s" : ""}`} type="green" />
              <StatCard
                label="Total Value"
                value={totalValuecount?.toLocaleString()}
                suffix={CURRENCY_CODE[active] ? `(${CURRENCY_CODE[active]})` : ""}
                sub="total worth"
                type="default"
              />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Section label + active indicator */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-overline font-semibold tracking-wider uppercase text-[#E00000]">Denominations</p>
            <span className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-caption text-gray-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="font-semibold text-gray-900">{active}</span>
              {CURRENCY_CODE[active] && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="font-semibold text-gray-800">{CURRENCY_CODE[active]}</span>
                </>
              )}
              <span className="text-gray-400">·</span>
              <span>{items?.length} items</span>
            </span>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-line overflow-hidden bg-surface">
            <table className="w-full text-body border-collapse">
              <thead>
                <tr className="bg-surface-alt border-b border-line">
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted w-10">#</th>
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted">Item Code</th>
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted">Denomination</th>
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted hidden sm:table-cell">Warehouse</th>
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted">Rate</th>
                  <th className="px-5 py-3 text-left text-overline font-semibold uppercase tracking-wider text-muted">Item Value</th>
                  <th className="px-5 py-3 text-right text-overline font-semibold uppercase tracking-wider text-muted">Stock Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items?.map((row, idx) => {
                  const isVault = locationMode === "vault";
                  const qty = parseFloat(row.stock_qty) || 0;
                  const valRate = (isVault && qty <= 0) ? 0 : (row.valuation_rate || 0);
                  const stVal = (isVault && qty <= 0) ? 0 : (row.stock_value || 0);
                  return (
                    <tr
                      key={row.item_code}
                      className={`border-b border-line transition-colors hover:bg-surface-alt/60 text-ink ${idx % 2 === 1 ? "bg-surface-alt/30" : "bg-surface"}`}
                    >
                      <td className="px-5 py-3.5 text-caption text-muted tnum">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block border border-line rounded-xl px-3 py-1.5 text-caption font-medium tracking-wide text-ink bg-surface-alt font-mono">
                          {row.item_code}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-ink">{row.item_name}</td>
                      <td className="px-5 py-3.5 text-caption text-muted hidden sm:table-cell">{row.warehouse}</td>
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={valRate} /></td>
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={stVal} /></td>
                      <td className="px-5 py-3.5 text-right"><QtyBadge qty={row.stock_qty} /></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-surface-alt border-t-2 border-brand-500/20 text-ink">
                  <td colSpan={4} className="px-5 py-3 text-overline font-semibold uppercase tracking-wider text-brand-600">
                    Total
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-ink tnum">
                    {total?.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-ink tnum">
                    {totalValuecount?.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-ink tnum">
                    {total?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
            </>
          )}

        </div>

        <p className="text-center text-caption text-gray-400 pb-2">MH Money Express · Currency Stock · Stores - MME</p>
      </div>
    </div>
    </div>
  );
}