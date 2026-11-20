import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useSettings } from "../context/SettingsContext";
import { sessionAxios as axios } from "../api/sessionClient.js";
import { customPos } from "../api/customPos";
import { clearCashCounterFlag, markCashCounterOpen, syncCashCounterFlag } from "../api/cashCounterSession";
import { Banknote, CheckCircle2, ChevronDown, CircleAlert, ClipboardCheck, Clock3, Minus, Plus, RefreshCw, ShieldCheck, UserRound, XCircle } from "lucide-react";

const money = (value, currency) => `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const openStatuses = new Set(["open", "open_with_warning", "open_with_incident"]);
const registerLabel = value => String(value || "").toLowerCase() === "opening" ? "Open Register" : String(value || "").toLowerCase() === "closing" ? "Close Register" : String(value || "Register");
const currencyCountry = {
  AUD: "Australia", CAD: "Canada", CHF: "Switzerland", EUR: "Euro", FJD: "Fiji", GBP: "UK", HKD: "HongKong", JPY: "Japan", KRW: "Korea", NZD: "New Zealand", PGK: "Papua New Guinea", SGD: "Singapore", TOP: "Tonga", USD: "USA", VUV: "Vanuatu", WST: "Samoa", XPF: "French Pacific",
};
const statusLabel = (status) => ({
  needs_opening: "Open Register required",
  pending_approval: "Waiting for approval",
  hard_stop: "Recount required",
  open: "Open",
  overdue: "Close Register required",
  closing: "Close Register in progress",
}[status] || String(status || "").replaceAll("_", " "));

function StatusBadge({ status }) {
  const label = statusLabel(status || "needs_opening");
  const color = openStatuses.has(status) ? "bg-emerald-50 text-emerald-700" : status === "disabled" ? "bg-gray-100 text-gray-600" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${color}`}>{label}</span>;
}

function CashCounterLoader({ label = "Loading Cash Counter…" }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-4 py-16 text-center"><div className="relative flex items-center justify-center"><div className="absolute h-12 w-12 animate-ping rounded-full border-4 border-[#E00000]/20" /><div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#E00000]" /></div><p className="mt-4 animate-pulse text-sm font-semibold text-gray-700">{label}</p><p className="mt-1 text-xs text-gray-400">Please wait while the count data is being loaded…</p></div>;
}

function CountForm({ mode, data, warehouse, onSaved }) {
  const [counts, setCounts] = useState({});
  const [selectedCurrency, setSelectedCurrency] = useState(() => data?.currencies?.[0]?.currency || "");
  const [remarks, setRemarks] = useState("");
  const [transferToVault, setTransferToVault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const currencies = useMemo(() => data?.currencies || [], [data]);
  const allRows = currencies.flatMap(currency => currency.denominations || []);

  const summaries = useMemo(() => currencies.map(currency => {
    const rows = currency.denominations || [];
    const physical = rows.reduce((total, row) => total + Number(counts[row.item_code] || 0) * Number(row.denomination ?? row.face_value ?? row.value ?? row.rate ?? 0), 0);
    const complete = rows.every(row => counts[row.item_code] !== undefined && counts[row.item_code] !== "");
    return { currency, physical, complete, entered: rows.filter(row => counts[row.item_code] !== undefined && counts[row.item_code] !== "").length, totalRows: rows.length };
  }), [currencies, counts]);

  const submit = async event => {
    event.preventDefault();
    setError("");
    if (allRows.some(row => counts[row.item_code] !== undefined && counts[row.item_code] !== "" && (!Number.isInteger(Number(counts[row.item_code])) || Number(counts[row.item_code]) < 0))) {
      setError("Each denomination quantity must be a whole number of notes or coins.");
      return;
    }
    // A blank field means no physical notes or coins were counted for that
    // denomination. Send it explicitly as zero so the server can reconcile it.
    const payload = allRows.map(row => ({ item_code: row.item_code, quantity: Number(counts[row.item_code] || 0) }));
    setBusy(true);
    try {
      const saved = mode === "opening"
        ? await customPos.submitOpening(warehouse, payload, remarks.trim())
        : await customPos.submitClosing(data.session?.name || data.session, payload, remarks.trim(), transferToVault);
      if (mode === "opening") syncCashCounterFlag(warehouse, saved?.status);
      else clearCashCounterFlag(warehouse);
      setResult(saved);
      onSaved?.(saved, mode);
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const updateCount = (itemCode, value) => {
    if (value === "") {
      setCounts(current => ({ ...current, [itemCode]: "" }));
      return;
    }
    setCounts(current => ({ ...current, [itemCode]: Math.max(0, Math.floor(Number(value) || 0)) }));
  };
  const stepCount = (itemCode, delta) => updateCount(itemCode, Number(counts[itemCode] || 0) + delta);
  const resetCurrency = currency => setCounts(current => {
    const next = { ...current };
    (currency.denominations || []).forEach(row => {
      delete next[row.item_code];
    });
    return next;
  });

  return <form onSubmit={submit} className="space-y-5">
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-[#E00000]"><Banknote size={21} /></span>
            <div><p className="text-[11px] font-black uppercase tracking-widest text-[#E00000]">{mode === "opening" ? "Start counter session" : "End counter session"}</p><h2 className="mt-0.5 text-xl font-black text-gray-900">{registerLabel(mode)}</h2><p className="mt-1 text-sm text-gray-500">Physical cash count for <b className="text-gray-700">{warehouse}</b></p></div>
          </div>
        </div>
      </div>
    </div>

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-5 py-4"><h3 className="font-black text-gray-900">Select currency</h3></div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-y border-slate-200 bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-700"><span>Country / currency</span><span>Counted total</span><span>Details</span></div>
        <div className="divide-y divide-gray-100">{summaries.map(summary => {
          const currency = summary.currency;
          const active = selectedCurrency === currency.currency;
          return <div key={currency.currency}>
            <button type="button" aria-expanded={active} onClick={() => setSelectedCurrency(active ? "" : currency.currency)} className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 border-l-4 px-5 py-3.5 text-left text-sm transition-all ${active ? "border-l-[#E00000] bg-gradient-to-r from-red-50 via-rose-50 to-white shadow-inner" : "border-l-transparent bg-white hover:bg-slate-50"}`}>
              <span><b className="text-slate-950">{currency.country || currencyCountry[currency.currency] || currency.currency}</b><span className={`ml-2 rounded-md px-2 py-1 text-xs font-black ${active ? "bg-[#E00000] text-white" : "bg-slate-200 text-slate-700"}`}>{currency.currency}</span></span>
              <span className="font-black tabular-nums text-slate-950">{money(summary.physical, currency.currency)}</span><span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${active ? "bg-[#E00000] text-white" : "bg-slate-100 text-slate-600"}`}><ChevronDown size={17} className={`transition-transform ${active ? "rotate-180" : ""}`} /></span>
            </button>
            {active && <div className="border-y border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="mb-2 flex justify-end"><button type="button" onClick={() => resetCurrency(currency)} className="text-xs font-bold text-gray-500">Reset quantities</button></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[460px] text-sm">
                <thead className="bg-slate-200/70 text-left text-xs font-black uppercase tracking-wider text-slate-700"><tr><th className="px-3 py-3">Denomination</th>{mode === "closing" && <th className="px-3 py-3 text-right">Expected qty</th>}<th className="px-3 py-3 text-right">Counted qty</th></tr></thead>
                <tbody className="divide-y divide-gray-200">{(currency.denominations || []).map(row => {
                  const face = Number(row.denomination ?? row.face_value ?? row.value ?? row.rate ?? 0);
                  return <tr key={row.item_code} className="even:bg-white/70"><td className="px-3 py-2.5 font-black text-slate-900">{money(face, currency.currency)}</td>
                    {mode === "closing" && <td className="px-3 py-2.5 text-right font-bold tabular-nums text-blue-800">{Number(row.expected_qty || 0).toLocaleString()}</td>}
                    <td className="px-3 py-2 text-right"><input aria-label={currency.currency + " " + face + " counted quantity"} type="number" min="0" step="1" inputMode="numeric" value={counts[row.item_code] ?? ""} onChange={event => updateCount(row.item_code, event.target.value)} placeholder="—" className="h-11 w-40 rounded-lg border border-gray-300 bg-white px-3 text-right text-lg font-bold tabular-nums outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" /></td></tr>;
                })}</tbody>
              </table></div>
            </div>}
          </div>;
        })}</div>
        {!currencies.length && <p className="p-5 text-sm text-gray-500">No currency is configured. You can submit a zero count.</p>}
      </section>
      <aside className="xl:sticky xl:top-24">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="pos-remarks" className="block text-sm font-black text-gray-800">Count remarks <span className="font-medium text-gray-400">(optional)</span></label>
          <textarea id="pos-remarks" value={remarks} onChange={event => setRemarks(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#E00000] focus:ring-2 focus:ring-red-100" rows="3" placeholder="Add a note for the manager, if needed" />
          {mode === "closing" && <label className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={transferToVault} onChange={event => setTransferToVault(event.target.checked)} className="h-4 w-4 accent-[#E00000]" /> Transfer the counted cash to this location’s vault after closing</label>}
          {!allRows.length && <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900"><ClipboardCheck size={17} className="shrink-0 text-blue-700" /><span>No currency is configured. Submit to record a zero-count session.</span></div>}
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          {result && <ReconciliationResult result={result} />}
          <button type="submit" disabled={busy || Boolean(result)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E00000] px-5 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-[#B70000] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <RefreshCw size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}{busy ? "Submitting…" : `Submit ${registerLabel(mode)}`}</button>
        </div>
      </aside>
    </div>
  </form>;
}

function ReconciliationResult({ result }) {
  const rows = result.denomination_variances || [];
  return <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><p className="font-bold">Count submitted: {statusLabel(result.status || "open")}</p><p className="mt-1">{result.approval_required ? "Waiting for manager review." : "Reconciliation is complete."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(result.variance_summary || []).map(summary => <div key={summary.currency} className="rounded-lg border border-emerald-200 bg-white p-3"><b>{summary.currency}</b><span className="block text-xs text-gray-600">Difference: {money(summary.variance, summary.currency)}</span><span className="block text-xs text-gray-600">Result: {statusLabel(summary.band)}</span></div>)}</div>{rows.some(row => Number(row.counted_qty) !== Number(row.expected_qty)) && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-left text-xs uppercase text-gray-600"><tr><th className="p-2">Currency / denomination</th><th className="p-2 text-right">Counted</th><th className="p-2 text-right">Expected</th><th className="p-2 text-right">Qty difference</th><th className="p-2 text-right">Value difference</th></tr></thead><tbody>{rows.filter(row => Number(row.counted_qty) !== Number(row.expected_qty)).map((row, index) => { const difference = Number(row.counted_qty) - Number(row.expected_qty); return <tr key={`${row.item_code}-${index}`} className="border-t border-emerald-200"><td className="p-2 font-medium">{row.currency} {money(row.denomination, row.currency)}</td><td className="p-2 text-right">{row.counted_qty}</td><td className="p-2 text-right">{row.expected_qty}</td><td className={`p-2 text-right font-bold ${difference < 0 ? "text-red-700" : "text-emerald-700"}`}>{difference > 0 ? `+${difference}` : difference}</td><td className="p-2 text-right font-bold">{money(row.variance_amount, row.currency)}</td></tr>; })}</tbody></table></div>}</div>;
}

function LegacyCurrencyCountReport({ record }) {
  const [expanded, setExpanded] = useState({});
  const summaries = record?.currency_summary || [];
  const countRows = record?.counts || record?.lines || record?.denominations || record?.denomination_variances || [];
  return <div className="min-w-0 overflow-x-auto"><div className="min-w-[620px]">{summaries.length > 0 ? <div className="overflow-hidden rounded-xl border border-gray-200"><div className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_auto] gap-3 bg-gray-50 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500"><span>Country / currency</span><span className="text-right">Counted total</span><span className="text-right">Variance</span><span>Detail</span></div><div className="divide-y divide-gray-100">{summaries.map(summary => { const currency = summary.currency; const country = summary.country || currencyCountry[currency] || currency; const rows = countRows.filter(row => row.currency === currency); const isExpanded = Boolean(expanded[currency]); const variance = Number(summary.variance || 0); return <div key={currency}><button type="button" onClick={() => setExpanded(current => ({ ...current, [currency]: !current[currency] }))} aria-expanded={isExpanded} className="grid w-full grid-cols-[minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_auto] items-center gap-3 bg-white px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50"><span><b className="text-gray-900">{country}</b><span className="ml-2 rounded-md bg-gray-100 px-2 py-1 text-xs font-black text-gray-700">{currency}</span></span><span className="text-right font-black tabular-nums text-gray-900">{money(summary.counted_total, currency)}</span><span className={`text-right font-black tabular-nums ${variance < 0 ? "text-red-700" : variance > 0 ? "text-emerald-700" : "text-gray-500"}`}>{variance > 0 ? "+" : ""}{money(variance, currency)}</span><ChevronDown size={16} className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>{isExpanded && <div className="border-t border-gray-100 bg-gray-50 px-4 py-3"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="text-left text-[10px] font-black uppercase tracking-wider text-gray-500"><tr><th className="px-3 py-2">Country</th><th className="px-3 py-2">Currency</th><th className="px-3 py-2">Denomination</th><th className="px-3 py-2 text-right">Expected qty</th><th className="px-3 py-2 text-right">Counted qty</th><th className="px-3 py-2 text-right">Difference</th></tr></thead><tbody className="divide-y divide-gray-200">{rows.map((row, index) => { const expected = Number(row.expected_qty || 0); const counted = Number(row.counted_qty ?? row.physical_qty ?? row.quantity ?? 0); const difference = Number(row.variance_qty ?? row.difference_qty ?? counted - expected); return <tr key={row.item_code || index}><td className="px-3 py-2.5 text-gray-700">{country}</td><td className="px-3 py-2.5 font-black text-gray-900">{currency}</td><td className="px-3 py-2.5 font-black text-gray-900">{currency} {row.denomination ?? row.value ?? row.item_code}</td><td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{expected}</td><td className="px-3 py-2.5 text-right tabular-nums text-gray-900">{counted}</td><td className={`px-3 py-2.5 text-right font-black tabular-nums ${difference < 0 ? "text-red-700" : difference > 0 ? "text-emerald-700" : "text-gray-500"}`}>{difference > 0 ? `+${difference}` : difference}</td></tr>; })}</tbody></table></div>{!rows.length && <p className="py-2 text-sm text-gray-500">No denomination details are available for this currency.</p>}</div>}</div>; })}</div></div> : <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-500">No currency denominations were recorded for this count.</div>}</div></div>;
}

function CurrencyCountReport({ record }) {
  const [expanded, setExpanded] = useState({});
  const summaries = record?.currency_summary || [];
  const countRows = record?.counts || record?.lines || record?.denominations || record?.denomination_variances || [];

  if (!summaries.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-medium text-slate-600">No currency denominations were recorded for this count.</div>;

  return <div className="min-w-0 overflow-x-auto"><div className="min-w-[680px] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
    <div className="grid grid-cols-[minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_auto] gap-3 border-b border-slate-300 bg-slate-100 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-700"><span>Country / currency</span><span className="text-right">Counted total</span><span className="text-right">Variance</span><span>Details</span></div>
    <div className="divide-y divide-slate-200">{summaries.map(summary => {
      const currency = summary.currency;
      const country = summary.country || currencyCountry[currency] || currency;
      const rows = countRows.filter(row => row.currency === currency);
      const isExpanded = Boolean(expanded[currency]);
      const variance = Number(summary.variance || 0);
      return <div key={currency}>
        <button type="button" onClick={() => setExpanded(current => ({ ...current, [currency]: !current[currency] }))} aria-expanded={isExpanded} className={`grid w-full grid-cols-[minmax(12rem,1.5fr)_minmax(8rem,1fr)_minmax(7rem,1fr)_auto] items-center gap-3 border-l-4 px-4 py-3.5 text-left text-sm transition-all ${isExpanded ? "border-l-[#E00000] bg-gradient-to-r from-red-50 via-rose-50 to-white shadow-inner" : "border-l-transparent bg-white hover:bg-slate-50"}`}>
          <span><b className="text-slate-950">{country}</b><span className={`ml-2 rounded-md px-2 py-1 text-xs font-black ${isExpanded ? "bg-[#E00000] text-white" : "bg-slate-200 text-slate-700"}`}>{currency}</span></span>
          <span className="text-right font-black tabular-nums text-slate-950">{money(summary.counted_total, currency)}</span>
          <span className={`text-right font-black tabular-nums ${variance < 0 ? "text-red-700" : variance > 0 ? "text-emerald-700" : "text-slate-600"}`}>{variance > 0 ? "+" : ""}{money(variance, currency)}</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isExpanded ? "bg-[#E00000] text-white" : "bg-slate-100 text-slate-600"}`}><ChevronDown size={17} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} /></span>
        </button>
        {isExpanded && <div className="border-y border-slate-200 bg-slate-50 p-3 sm:p-4"><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm">
          <thead className="bg-slate-200/70 text-left text-[10px] font-black uppercase tracking-wider text-slate-700"><tr><th className="px-3 py-2.5">Country</th><th className="px-3 py-2.5">Currency</th><th className="px-3 py-2.5">Denomination</th><th className="px-3 py-2.5 text-right">Expected qty</th><th className="px-3 py-2.5 text-right">Counted qty</th><th className="px-3 py-2.5 text-right">Difference</th></tr></thead>
          <tbody className="divide-y divide-slate-200">{rows.map((row, index) => {
            const expected = Number(row.expected_qty || 0);
            const counted = Number(row.counted_qty ?? row.physical_qty ?? row.quantity ?? 0);
            const difference = Number(row.variance_qty ?? row.difference_qty ?? counted - expected);
            return <tr key={row.item_code || index} className="even:bg-white/70"><td className="px-3 py-2.5 font-medium text-slate-700">{country}</td><td className="px-3 py-2.5 font-black text-slate-900">{currency}</td><td className="px-3 py-2.5 font-black text-slate-900">{currency} {row.denomination ?? row.value ?? row.item_code}</td><td className="px-3 py-2.5 text-right font-bold tabular-nums text-blue-800">{expected}</td><td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{counted}</td><td className={`px-3 py-2.5 text-right font-black tabular-nums ${difference < 0 ? "text-red-700" : difference > 0 ? "text-emerald-700" : "text-slate-600"}`}>{difference > 0 ? `+${difference}` : difference}</td></tr>;
          })}</tbody>
        </table></div>{!rows.length && <p className="py-2 text-sm font-medium text-slate-600">No denomination details are available for this currency.</p>}</div>}
      </div>;
    })}</div>
  </div></div>;
}

function CountRecord({ entry, fallbackType }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  useEffect(() => {
    if (!entry) return;
    let live = true;
    customPos.getEntry(entry).then(value => { if (live) { setRecord(value); setError(""); } }).catch(cause => { if (live) setError(cause.message); });
    return () => { live = false; };
  }, [entry]);
  if (!entry) return null;
  const summaries = record?.currency_summary || [];
  const countRows = record?.counts || record?.lines || record?.denominations || record?.denomination_variances || [];
  const entryType = record?.entry_type || fallbackType || "Opening";
  const submittedAt = record?.submitted_at ? String(record.submitted_at).replace("T", " · ") : null;
  return <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-7">
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={22} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">{registerLabel(entryType)} record</p><h2 className="mt-1 text-xl font-black text-gray-900">Register recorded successfully</h2><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-500"><span className="inline-flex items-center gap-1.5"><ClipboardCheck size={13} /> {entry}</span>{submittedAt && <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {submittedAt}</span>}</div></div></div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-800"><CheckCircle2 size={13} /> Recorded</span>
    </div>
    {error && <p className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
    {!record && !error && <CashCounterLoader label="Loading count record…" />}
    {record && <div className="p-5 sm:p-7"><div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-base font-black text-gray-900">Counted cash report</h3><p className="mt-1 text-sm text-gray-500">Expand a currency row to view the entered denominations.</p></div><span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-600">{summaries.length} currencies</span></div><CurrencyCountReport record={record} /></div>}
  </section>;
}

function ManagerDashboardSummary({ warehouse, refreshKey = 0 }) {
  const [report, setReport] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!warehouse) return;
    let live = true;
    setLoading(true);
    customPos.getReportEntries(warehouse, { start: 0, page_length: 10 })
      .then(value => {
        if (!live) return;
        setReport(value || { entries: [], summary: {} });
        setSelectedEntry(current => {
          const rows = value?.entries || [];
          return rows.some(row => row.name === current) ? current : (rows[0]?.name || "");
        });
        setError("");
      })
      .catch(cause => { if (live) setError(cause.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [warehouse, refreshKey]);

  const rows = report?.entries || [];
  const summary = report?.summary || {};
  const selected = rows.find(row => row.name === selectedEntry) || rows[0] || null;
  const cards = [
    ["All records", summary.all || 0, "bg-gray-50 text-gray-900"],
    ["Opening counts", summary.opening || 0, "bg-blue-50 text-blue-900"],
    ["Closing counts", summary.closing || 0, "bg-violet-50 text-violet-900"],
    ["Pending approval", summary.pending || 0, "bg-amber-50 text-amber-900"],
  ];

  return <section className="mb-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E00000]">Manager dashboard</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-black text-gray-900">Cash Counter overview</h2><span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700">{warehouse}</span></div>
    </div>
    {loading ? <CashCounterLoader label="Loading manager dashboard…" /> : error ? <p className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : <div className="space-y-6 p-5 sm:p-7">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, tone]) => <div key={label} className={`rounded-xl border border-gray-100 px-4 py-3 ${tone}`}><p className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</p><p className="mt-1 text-2xl font-black tabular-nums">{value}</p></div>)}</div>
      {rows.length > 0 ? <>
        <div><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-base font-black text-gray-900">Recent opening and closing records</h3><p className="mt-1 text-sm text-gray-500">Select a record to review its currency totals and denominations.</p></div><span className="text-xs font-semibold text-gray-400">Latest {rows.length} records</span></div><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="w-full min-w-[720px] text-sm"><thead className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-gray-500"><tr><th className="px-4 py-3">Record</th><th className="px-4 py-3">Count type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Teller</th><th className="px-4 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.map(row => <tr key={row.name} onClick={() => setSelectedEntry(row.name)} className={`cursor-pointer transition-colors ${selected?.name === row.name ? "bg-red-50" : "hover:bg-gray-50"}`}><td className="px-4 py-3 font-black text-gray-900">{row.name}</td><td className="px-4 py-3">{row.entry_type} Count</td><td className="px-4 py-3"><span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold">{row.manager_decision === "Approve With Incident" ? "Approved with Incident" : row.status}</span></td><td className="px-4 py-3 text-gray-600">{row.submitted_by}</td><td className="px-4 py-3 text-gray-500">{String(row.submitted_at || "—")}</td></tr>)}</tbody></table></div></div>
        <div><div className="mb-3"><h3 className="text-base font-black text-gray-900">Currency-wise count report</h3><p className="mt-1 text-sm text-gray-500">{selected?.name} · expand a currency to see denomination differences.</p></div><CurrencyCountReport key={selected?.name} record={selected} /></div>
      </> : <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">No opening or closing records are available for this location.</div>}
    </div>}
  </section>;
}

function ManagerReviews({ warehouse, onReviewed }) {
  const [reviews, setReviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [remarks, setRemarks] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    try { const data = await customPos.getReviews(warehouse); setReviews(Array.isArray(data) ? data : data?.reviews || []); setError(""); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }, [warehouse]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setDetail(null);
    if (!selected) return;
    let live = true;
    customPos.getEntry(selected.name || selected.entry).then(data => { if (live) setDetail(data); }).catch(cause => { if (live) setError(cause.message); });
    return () => { live = false; };
  }, [selected]);
  const decide = async decision => {
    if (!selected || !remarks.trim()) { setError("Select a review and enter manager remarks."); return; }
    setBusy(true);
    try { await customPos.reviewEntry(selected.name || selected.entry, decision, remarks.trim()); setSelected(null); setRemarks(""); setError(""); await load(); onReviewed?.(); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  return <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-7"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-[#E00000]"><ShieldCheck size={22} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#E00000]">Manager workspace</p><h2 className="mt-1 text-xl font-black text-gray-900">Count approvals</h2><p className="mt-1 text-sm text-gray-500">Review opening and closing exceptions for {warehouse}.</p></div></div><button onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-gray-700 disabled:opacity-50"><RefreshCw size={15} className={busy ? "animate-spin" : ""} /> Refresh</button></div>{error && <p role="alert" className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 sm:mx-7">{error}</p>}{busy && <CashCounterLoader label="Loading manager reviews…" />}{!busy && <div className="grid items-start xl:grid-cols-[22rem_minmax(0,1fr)]"><div className="border-b border-gray-100 p-5 xl:min-h-[34rem] xl:border-b-0 xl:border-r sm:p-7"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black text-gray-900">Approval queue</h3><span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-black text-[#E00000]">{reviews.length} waiting</span></div>{reviews.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center"><CheckCircle2 size={22} className="mx-auto text-emerald-600" /><p className="mt-2 text-sm font-bold text-gray-800">Nothing to review</p></div> : <div className="space-y-2">{reviews.map(item => { const active = (selected?.name || selected?.entry) === (item.name || item.entry); return <button key={item.name || item.entry} onClick={() => setSelected(item)} className={`w-full rounded-xl border p-3.5 text-left ${active ? "border-red-200 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}><div className="flex items-start justify-between gap-2"><span className="text-sm font-black text-gray-900">{item.entry_type || item.kind || "Count"} count</span><CircleAlert size={16} className={active ? "text-[#E00000]" : "text-amber-500"} /></div><p className="mt-1 truncate text-xs font-bold text-gray-600">{item.name || item.entry}</p><div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500"><UserRound size={13} /><span className="truncate">{item.teller || item.owner || "Teller"}</span></div></button>; })}</div>}</div><div className="min-w-0 p-5 sm:p-7">{selected ? <div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">Selected count</p><h3 className="mt-1 text-lg font-black text-gray-900">{selected.name || selected.entry}</h3><p className="mt-1 text-sm text-gray-500">Check the denomination differences, then record your decision and reason.</p></div><span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">Pending approval</span></div>{detail ? <div className="mt-5"><CurrencyCountReport key={selected.name || selected.entry} record={detail} /></div> : <CashCounterLoader label="Loading count detail…" />}<div className="mt-5"><label className="text-sm font-black text-gray-800">Manager remarks <span className="text-[#E00000]">*</span><textarea value={remarks} onChange={event => setRemarks(event.target.value)} rows="3" placeholder="Explain the approval or recount decision" className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-medium outline-none transition-colors focus:border-[#E00000] focus:ring-2 focus:ring-red-100" /></label></div><div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5"><button disabled={busy} onClick={() => decide("approve")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><CheckCircle2 size={16} /> Approve</button><button disabled={busy} onClick={() => decide("reject")} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 disabled:opacity-50"><XCircle size={16} /> Recount required</button></div></div> : <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center"><ShieldCheck size={28} className="text-gray-400" /><h3 className="mt-3 text-base font-black text-gray-800">Select a count to review</h3><p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">Choose an item from the approval queue to view the denomination difference and make a decision.</p></div>}</div></div>}</section>;
}

export default function CustomPos() {
  const { selectedWarehouse, warehouses } = useSettings();
  const warehouse = selectedWarehouse?.warehouse;
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const assignedManagerLocations = useMemo(
    () => (warehouses || []).filter(row => row?.warehouse && row.warehouse_type !== "Vault"),
    [warehouses]
  );
  const [allBranchLocations, setAllBranchLocations] = useState([]);
  const managerLocations = allBranchLocations.length ? allBranchLocations : assignedManagerLocations;
  const [reviewWarehouse, setReviewWarehouse] = useState(warehouse || "");

  useEffect(() => {
    let live = true;
    axios.get("/api/method/moneygram.moneygram.api.get_transactions.get_warehouses_list")
      .then(response => {
        if (!live) return;
        const rows = response.data?.message || [];
        const normalized = rows
          .filter(row => !row?.is_group && !row?.custom_is_vault && row?.warehouse_type !== "Vault")
          .map(row => ({ ...row, warehouse: row.warehouse || row.name || row.warehouse_name }))
          .filter(row => row.warehouse);
        setAllBranchLocations(normalized);
      })
      .catch(() => { if (live) setAllBranchLocations([]); });
    return () => { live = false; };
  }, []);
  const reload = () => setRefresh(value => value + 1);

  useEffect(() => {
    if (!reviewWarehouse || (reviewWarehouse !== "All Locations" && !assignedManagerLocations.some(row => row.warehouse === reviewWarehouse))) {
      setReviewWarehouse(warehouse || managerLocations[0]?.warehouse || "");
    }
  }, [warehouse, assignedManagerLocations, managerLocations, reviewWarehouse]);

  const startClosing = async () => {
    setActionBusy(true); setError("");
    try { await customPos.startClosing(warehouse); clearCashCounterFlag(warehouse); reload(); }
    catch (cause) { setError(cause.message); }
    finally { setActionBusy(false); }
  };
  const cancelClosing = async () => {
    setActionBusy(true); setError("");
    try { await customPos.cancelClosing(data.session?.name || data.session); markCashCounterOpen(warehouse); reload(); navigate("/pos"); }
    catch (cause) { setError(cause.message); }
    finally { setActionBusy(false); }
  };

  useEffect(() => {
    if (!warehouse) { setData(null); setLoading(false); return; }
    let live = true;
    setLoading(true);
    customPos.getStatus(warehouse).then(result => { if (live) { setData(result); setError(""); setLoading(false); } }).catch(cause => { if (live) { setError(cause.message); setLoading(false); } });
    return () => { live = false; };
  }, [warehouse, refresh]);

  const status = String(data?.status || "needs_opening").toLowerCase();
  const submittedEntry = new URLSearchParams(location.search).get("entry");
  const afterLogin = new URLSearchParams(location.search).has("after_login");
  useEffect(() => {
    if (loading || !data || !afterLogin) return;
    if (data.enabled === false || openStatuses.has(status)) navigate("/money-transfer", { replace: true });
    else navigate("/pos/open", { replace: true });
  }, [afterLogin, data, loading, navigate, status]);

  if (!loading && data?.enabled === false) return <Navigate to="/money-transfer" replace />;
  const isClosing = location.pathname.endsWith("/close");
  const isReviewing = location.pathname.endsWith("/approvals");
  const canClose = openStatuses.has(status) || status === "overdue" || status === "closing";
  const closingRecount = status === "hard_stop" && data?.session?.status === "Closing Hard Stop";
  const canOpen = status === "needs_opening" || (status === "hard_stop" && !closingRecount);
  const countSaved = (saved) => {
    reload();
    navigate(`/pos?entry=${encodeURIComponent(saved.entry)}`, { replace: true });
  };

  return <div className="min-h-screen bg-[#f7f8fa]"><Navbar /><main className="mx-auto max-w-[80%] px-4 py-7 sm:px-6"><div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-3xl font-bold text-gray-900">Cash counter session</h1><p className="mt-1 text-sm text-gray-600">Active location: <b>{warehouse || "None selected"}</b></p></div><div className="flex items-center gap-2">{data && <StatusBadge status={status} />}<button onClick={reload} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold">Refresh</button></div></div>
    {!warehouse && <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800">Select an assigned active location in <Link className="font-bold underline" to="/settings">Settings</Link> before opening the cash counter.</div>}
    {loading && <CashCounterLoader label="Checking your cash counter and location…" />}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</div>}
    {!loading && data && warehouse && <>
      {!canOpen && !isClosing && !isReviewing && data.manager && <div className="mb-5 flex flex-wrap gap-2"><Link to="/pos/approvals" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Manager reviews</Link></div>}
      {isReviewing ? data.manager ? <><div className="mb-4 flex justify-end"><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Filter by location<select value={reviewWarehouse || warehouse || ""} onChange={event => setReviewWarehouse(event.target.value)} className="mt-1 block min-w-72 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-800 outline-none focus:border-[#E00000]"><option value="All Locations">All Locations</option>{assignedManagerLocations.map(row => <option key={row.warehouse} value={row.warehouse}>{row.warehouse}</option>)}</select></label></div><ManagerReviews key={`reviews-${reviewWarehouse || warehouse}`} warehouse={reviewWarehouse || warehouse} onReviewed={reload} /></> : <div className="rounded-xl bg-white p-6">Only an assigned manager can review exceptions.</div>
        : (isClosing || closingRecount) ? (status === "closing" || closingRecount) ? <><div className="mb-4 flex justify-end">{!closingRecount && <button disabled={actionBusy} onClick={cancelClosing} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50">Cancel closing and resume session</button>}{closingRecount && <p className="text-sm font-bold text-amber-700">Closing recount required. Enter the physical quantities again.</p>}</div><CountForm key={`close-${warehouse}-${data.session?.name || data.session}`} mode="closing" data={data} warehouse={warehouse} onSaved={countSaved} /></>
          : canClose ? <div className="rounded-2xl border bg-white p-6"><h2 className="text-xl font-bold">Close Register</h2><p className="mt-2 text-sm text-gray-600">Start the Close Register process for this location. Transactions pause while it is in progress.</p><button disabled={actionBusy} onClick={startClosing} className="mt-4 rounded-lg bg-[#E00000] px-5 py-2.5 font-bold text-white disabled:opacity-50">{actionBusy ? "Starting…" : "Start Close Register"}</button></div>
            : <div className="rounded-xl bg-white p-6">There is no open cash counter session to close at this location.</div>
          : submittedEntry ? <section className="space-y-4"><CountRecord entry={submittedEntry} />{canOpen && <Link to="/pos/open" className="inline-flex rounded-xl bg-[#E00000] px-5 py-3 text-sm font-black text-white">Start Open Register</Link>}</section>
            : canOpen ? <CountForm key={`open-${warehouse}`} mode="opening" data={data} warehouse={warehouse} onSaved={countSaved} />
              : <section className="space-y-4"><CountRecord entry={data.opening_entry} fallbackType="Opening" /><div className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">{statusLabel(status)}</h2><p className="mt-2 text-sm text-gray-600">Session: <b>{data.session?.name || data.session || "—"}</b></p>{status === "pending_approval" && <p className="mt-2 text-sm text-orange-700">The register is waiting for manager review. Transactions are paused until a decision is made.</p>}{status === "overdue" && <p className="mt-2 text-sm text-red-700">Close this register before starting another transaction.</p>}<div className="mt-4 flex flex-wrap gap-2">{openStatuses.has(status) && <Link to="/money-transfer" className="rounded-lg bg-[#E00000] px-4 py-2 text-sm font-bold text-white">Start transaction</Link>}{canClose && <Link to="/pos/close" className="rounded-lg border border-[#E00000] px-4 py-2 text-sm font-bold text-[#E00000]">Close Register</Link>}</div></div></section>}
    </>}
  </main></div>;
}
