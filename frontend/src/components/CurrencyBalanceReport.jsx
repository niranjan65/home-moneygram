import React, { useState, useCallback, useEffect } from 'react';
import { useUser } from "../context/UserContext";

// ─── Brand colors (extend tailwind.config.js to replace style= props) ────────
const B = {
  bgPage:  '#3a0e0e',
  bgDeep:  '#421010',
  card:    '#602020',
  accent:  '#b5f000',
  danger:  '#E00000',
  border:  'rgba(224,0,0,0.3)',
  borderAccent: 'rgba(181,240,0,0.3)',
};


// ─── API Config ───────────────────────────────────────────────────────────────
const API_BASE = 'https://mhmoneyexpress.anantdv.com';

const REPORT_URL = `${API_BASE}/api/method/frappe.desk.query_report.run`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 transition-transform duration-200">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
  </svg>
);
const PrintIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
  </svg>
);
const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
  </svg>
);
const CollapseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/>
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtCurrency = (val) => {
  if (!val && val !== 0) return '—';
  if (val === 0) return '—';
  return Number(val).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const INDENT_PX = [0, 16, 32, 48, 64];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FilterInput = ({ label, value, onChange, type = 'text', children }) => (
  <div className="flex flex-col gap-1.5 min-w-[120px]">
    <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: B.accent }}>
      {label}
    </label>
    {children ?? (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-white text-[13px] rounded-[10px] px-3 py-2 outline-none w-full"
        style={{ background: B.bgDeep, border: `1px solid ${B.border}`, colorScheme: 'dark' }}
      />
    )}
  </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
  <FilterInput label={label}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-white text-[13px] rounded-[10px] px-3 py-2 outline-none cursor-pointer appearance-none"
      style={{ background: B.bgDeep, border: `1px solid ${B.border}` }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </FilterInput>
);

const AmountCell = ({ dr, cr, align = 'right' }) => {
  const val = dr > 0 ? dr : cr > 0 ? cr : 0;
  const label = dr > 0 ? 'Dr' : cr > 0 ? 'Cr' : null;
  const color = dr > 0 ? '#4ade80' : cr > 0 ? '#f87171' : 'rgba(255,255,255,0.25)';
  return (
    <td className={`px-3 py-2.5 text-[13px] text-right whitespace-nowrap`}>
      {val > 0 ? (
        <span style={{ color }} className="font-medium tabular-nums">
          {fmtCurrency(val)}{' '}
          <span className="text-[10px] font-bold opacity-70">{label}</span>
        </span>
      ) : (
        <span className="text-white/20">—</span>
      )}
    </td>
  );
};

// ─── Row Component (recursive-like via flat render with indent) ───────────────
const TrialRow = ({ row, isExpanded, hasChildren, onToggle, isTotal }) => {
  const indent = INDENT_PX[Math.min(row.indent ?? 0, 4)] ?? 0;
  const isParent = row.indent < 3;

  if (isTotal) {
    return (
      <tr style={{ background: B.bgDeep, borderTop: `2px solid ${B.borderAccent}` }}>
        <td className="px-3 py-3 text-[13px] font-black" style={{ color: B.accent }}>
          Total
        </td>
        <AmountCell dr={row.opening_debit}  cr={row.opening_credit}  />
        <AmountCell dr={row.opening_debit}  cr={row.opening_credit}  />
        <AmountCell dr={row.debit}          cr={0}                   />
        <AmountCell dr={0}                  cr={row.credit}          />
        <AmountCell dr={row.closing_debit}  cr={row.closing_credit}  />
        <AmountCell dr={row.closing_debit}  cr={row.closing_credit}  />
      </tr>
    );
  }

  return (
    <tr
      className="transition-colors hover:bg-white/[0.03] group"
      style={{ borderBottom: '1px solid rgba(224,0,0,0.12)' }}
    >
      {/* Account name cell */}
      <td className="px-3 py-2.5" style={{ paddingLeft: `${indent + 12}px` }}>
        <div className="flex items-center gap-1.5">
          {hasChildren ? (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-4 h-4 rounded flex-shrink-0 transition-colors"
              style={{ color: B.accent }}
            >
              <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}>
                <ChevronRightIcon />
              </span>
            </button>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}
          <span
            className={`text-[13px] leading-snug ${isParent ? 'font-bold text-white' : 'text-white/80 font-medium'}`}
          >
            {row.account_name}
          </span>
        </div>
      </td>

      {/* Opening Dr */}
      <AmountCell dr={row.opening_debit} cr={0} />
      {/* Opening Cr */}
      <AmountCell dr={0} cr={row.opening_credit} />
      {/* Debit */}
      <AmountCell dr={row.debit} cr={0} />
      {/* Credit */}
      <AmountCell dr={0} cr={row.credit} />
      {/* Closing Dr */}
      <AmountCell dr={row.closing_debit} cr={0} />
      {/* Closing Cr */}
      <AmountCell dr={0} cr={row.closing_credit} />
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TrialBalanceReport = () => {

  const loginUser = useUser();

  // ── Filter state ─────────────────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const [company,     setCompany]     = useState('MH Money Express');
  const [companies, setCompanies] = useState([]);
  const [fiscalYear,  setFiscalYear]  = useState(String(currentYear));
  const [fiscalYears, setFiscalYears] = useState([])
  const [fromDate,    setFromDate]    = useState(`${currentYear}-01-01`);
  const [toDate,      setToDate]      = useState(`${currentYear}-12-31`);
  const [currency,    setCurrency]    = useState('FJD');
  const [showNetVal,  setShowNetVal]  = useState(true);

  // ── Data state ────────────────────────────────────────────────────────────
  const [rows,        setRows]        = useState([]);
  const [totalRow,    setTotalRow]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // ── Tree expand/collapse state ────────────────────────────────────────────
  const [collapsed, setCollapsed]     = useState(new Set());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        company,
        fiscal_year:                              fiscalYear,
        from_date:                                fromDate,
        to_date:                                  toDate,
        presentation_currency:                    currency,
        with_period_closing_entry_for_opening:    1,
        with_period_closing_entry_for_current_period: 1,
        include_default_book_entries:             1,
        show_net_values:                          showNetVal ? 1 : 0,
      };

      const body = new URLSearchParams({
        report_name:              'Trial Balance',
        filters:                  JSON.stringify(filters),
        ignore_prepared_report:   'false',
        is_tree:                  'true',
        parent_field:             'parent_account',
        are_default_filters:      'false',
      });
      const HEADERS = {
      "Content-Type": "application/json",
      Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
      };
      const res = await fetch(REPORT_URL, {
        method:  'POST',
        headers: HEADERS,
        body,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const json = await res.json();
      const result = json?.message?.result ?? [];

      // Separate total row from regular rows, and skip empty objects
      const dataRows  = result.filter(r => r.account && r.account !== "'Total'");
      const totRow    = result.find(r => r.account === "'Total'");

      setRows(dataRows);
      setTotalRow(totRow ?? null);
      setCollapsed(new Set()); // reset tree on fresh fetch
      setLastFetched(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [company, fiscalYear, fromDate, toDate, currency, showNetVal]);

  const fetchCompanies = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/resource/Company`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
      }
    });

    const json = await res.json();
    const list = json.data.map(c => ({
      label: c.name,
      value: c.name
    }));

    setCompanies(list);

    // set default company
    if (list.length > 0) {
      setCompany(list[0].value);
    }

  } catch (err) {
    console.error("Company fetch error", err);
  }
};

const fetchFiscalYears = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/resource/Fiscal Year`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
      }
    });

    const json = await res.json();

    const list = json.data.map(fy => ({
      label: fy.name,
      value: fy.name
    }));

    setFiscalYears(list);

    if (list.length > 0) {
      setFiscalYear(list[0].value);
    }

  } catch (err) {
    console.error("Fiscal year fetch error", err);
  }
};

useEffect(() => {
  fetchCompanies();
  fetchFiscalYears()
}, []);

  // ── Tree helpers ──────────────────────────────────────────────────────────
  const toggleCollapse = (account) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(account) ? next.delete(account) : next.add(account);
      return next;
    });
  };

  const expandAll  = () => setCollapsed(new Set());
  const collapseAll = () => {
    const parentAccounts = new Set(
      rows.filter(r => rows.some(c => c.parent_account === r.account)).map(r => r.account)
    );
    setCollapsed(parentAccounts);
  };

  // Build visible rows based on collapse state
  const visibleRows = (() => {
    const result = [];
    const isHidden = (row) => {
      let current = row.parent_account;
      while (current) {
        if (collapsed.has(current)) return true;
        const parent = rows.find(r => r.account === current);
        current = parent?.parent_account ?? null;
      }
      return false;
    };
    for (const row of rows) {
      if (!isHidden(row)) result.push(row);
    }
    return result;
  })();

  const hasChildren = (account) => rows.some(r => r.parent_account === account);

  // ── Summary stats from total row ──────────────────────────────────────────
  const stats = totalRow ? [
    { label: 'Total Debit',          value: fmtCurrency(totalRow.debit),         color: '#4ade80' },
    { label: 'Total Credit',         value: fmtCurrency(totalRow.credit),        color: '#f87171' },
    { label: 'Closing (Dr)',         value: fmtCurrency(totalRow.closing_debit), color: B.accent  },
    { label: 'Closing (Cr)',         value: fmtCurrency(totalRow.closing_credit),color: B.accent  },
  ] : [];

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans px-4 py-6" style={{ background: B.bgPage }}>
      <div className="max-w-7xl mx-auto flex flex-col gap-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-[26px] font-black text-white tracking-tight leading-tight">
            Trial Balance
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {company} · {fromDate} to {toDate} · {currency}
            {lastFetched && <span className="ml-2">· Fetched at {lastFetched}</span>}
          </p>
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div
          className="rounded-[20px] px-6 py-5"
          style={{ background: B.card, border: `1px solid ${B.border}` }}
        >
          <div className="flex items-center gap-2 mb-4 text-[13px] font-bold" style={{ color: B.accent }}>
            <FilterIcon /> Filters
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            {/* Company */}
            {/* <FilterInput label="Company" value={company} onChange={setCompany} /> */}
            <FilterSelect
  label="Company"
  value={company}
  onChange={setCompany}
  options={companies}
/>

            {/* Fiscal Year */}
            {/* <FilterInput label="Fiscal Year" value={fiscalYear} onChange={setFiscalYear} /> */}
            <FilterSelect
              label="Fiscal Year"
              value={fiscalYear}
              onChange={setFiscalYear}
              options={fiscalYears}
             />

            {/* From Date */}
            <FilterInput label="From Date" value={fromDate} onChange={setFromDate} type="date" />

            {/* To Date */}
            <FilterInput label="To Date" value={toDate} onChange={setToDate} type="date" />

            {/* Currency */}
            <FilterSelect
              label="Currency"
              value={currency}
              onChange={setCurrency}
              options={['FJD','USD','AUD','EUR','GBP','NZD','SGD'].map(c => ({ value: c, label: c }))}
            />

            {/* Show Net Values toggle */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: B.accent }}>
                Net Values
              </label>
              <button
                onClick={() => setShowNetVal(v => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-colors"
                style={{
                  background: showNetVal ? 'rgba(181,240,0,0.15)' : B.bgDeep,
                  border: `1px solid ${showNetVal ? B.borderAccent : B.border}`,
                  color: showNetVal ? B.accent : 'rgba(255,255,255,0.5)',
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-sm flex-shrink-0 border"
                  style={{
                    background:   showNetVal ? B.accent : 'transparent',
                    borderColor:  showNetVal ? B.accent : 'rgba(255,255,255,0.3)',
                  }}
                />
                Show Net
              </button>
            </div>

            {/* Run button */}
            <div className="flex items-end ml-auto">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-[10px] text-[13px] font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: B.danger }}
              >
                {loading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <RefreshIcon />
                )}
                {loading ? 'Loading…' : 'Run Report'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div
            className="rounded-xl px-5 py-4 text-sm font-medium text-red-300"
            style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)' }}
          >
            ⚠ {error}
          </div>
        )}

        {/* ── Summary Stats ─────────────────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {stats.map(s => (
              <div
                key={s.label}
                className="flex-1 min-w-[130px] rounded-2xl px-5 py-4"
                style={{ background: B.card, border: `1px solid ${B.border}` }}
              >
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: B.accent }}>
                  {s.label}
                </p>
                <p className="text-lg font-black tabular-nums" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs text-white/30 mt-0.5">{currency}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Table ─────────────────────────────────────────────────────── */}
        {rows.length > 0 && (
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ background: B.card, border: `1px solid ${B.border}` }}
          >
            {/* Toolbar */}
            <div
              className="flex justify-between items-center px-6 py-4"
              style={{ borderBottom: `1px solid ${B.border}` }}
            >
              <div>
                <p className="text-[15px] font-extrabold text-white">Account Ledger</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {visibleRows.length} of {rows.length} accounts visible
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  title="Expand all"
                >
                  <ExpandIcon /> Expand
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  title="Collapse all"
                >
                  <CollapseIcon /> Collapse
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-bold text-white/60 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <PrintIcon /> Print
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: 820 }}>
                <thead>
                  <tr style={{ background: B.bgDeep }}>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-white/50" style={{ minWidth: 260 }}>
                      Account
                    </th>
                    {[
                      'Opening (Dr)', 'Opening (Cr)',
                      'Debit',        'Credit',
                      'Closing (Dr)', 'Closing (Cr)',
                    ].map(col => (
                      <th
                        key={col}
                        className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-white/50 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visibleRows.map(row => (
                    <TrialRow
                      key={row.account}
                      row={row}
                      isExpanded={!collapsed.has(row.account)}
                      hasChildren={hasChildren(row.account)}
                      onToggle={() => toggleCollapse(row.account)}
                    />
                  ))}

                  {/* Total row */}
                  {totalRow && <TrialRow row={totalRow} isTotal />}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loading && rows.length === 0 && !error && (
          <div
            className="rounded-[20px] px-6 py-16 flex flex-col items-center gap-3"
            style={{ background: B.card, border: `1px solid ${B.border}` }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(181,240,0,0.1)' }}>
              <FilterIcon />
            </div>
            <p className="text-white/50 text-sm font-medium">Set your filters and click <span className="font-bold" style={{ color: B.accent }}>Run Report</span> to load data</p>
          </div>
        )}

        {/* Footer */}
        {rows.length > 0 && (
          <p className="text-center text-xs text-white/25 pb-4">
            MH Money Express · Trial Balance · {fromDate} to {toDate} · {currency}
          </p>
        )}
      </div>
    </div>
  );
};

export default TrialBalanceReport;