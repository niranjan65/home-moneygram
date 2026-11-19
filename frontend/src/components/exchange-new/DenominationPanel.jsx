import React from 'react';
import { Banknote, RefreshCw, CheckCircle2, AlertCircle, MinusCircle, PlusCircle, X } from 'lucide-react';
import { useDenominationCalculator } from '../../features/exchange/hooks/useDenominationCalculator';
import { CurrencyInput } from '../common/CurrencyInput';

export const DenominationPanel = ({
  title, subtitle, flag, symbol, currency, notes, coins,
  targetAmount, onRowsChange, accentColor = '#dc2626', availabilityByDenomination, initialRows,
}) => {
  const {
    rows,
    totalDispensed,
    difference,
    isBalanced,
    isOver,
    updateCount,
    step,
    removeRow,
    reset
  } = useDenominationCalculator({ currency, targetAmount, notes, coins, onRowsChange, availabilityByDenomination, initialRows });

  const statusLabel = isBalanced
    ? 'Balanced'
    : isOver
      ? `Over ${symbol}${Math.abs(difference).toFixed(2)}`
      : `Short ${symbol}${Math.abs(difference).toFixed(2)}`;

  const statusColor = isBalanced ? accentColor : isOver ? '#d97706' : '#dc2626';

  return (
    <div className="rounded-xl border border-gray-200/70 bg-white overflow-hidden shadow-2xs">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{flag}</span>
          <div>
            <p className="text-label font-semibold text-ink">{title}</p>
            <p className="text-caption text-muted">{subtitle}</p>
          </div>
        </div>
        {targetAmount > 0 && (
          <span className="text-caption font-semibold text-muted bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md tnum">
            {symbol}{targetAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})} {currency}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
        {[
          { label:'Expected', val: targetAmount||0, color:'#374151' },
          { label:'Counted',  val: totalDispensed,  color: accentColor },
          { label: isBalanced ? 'Balanced' : isOver ? 'Overage' : 'Shortfall',
            val: Math.abs(difference), color: statusColor,
            prefix: isBalanced ? '' : isOver ? '+' : '-' },
        ].map(({ label, val, color, prefix='' }) => (
          <div key={label} className="flex flex-col items-center py-2.5 px-2">
            <span className="text-overline text-muted font-semibold uppercase tracking-wider mb-0.5">{label}</span>
            <span className="text-body-value font-bold tnum" style={{ color }}>
              {prefix}{symbol}{val.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-label font-semibold" style={{ color: statusColor }}>
          {isBalanced
            ? <CheckCircle2 size={14} strokeWidth={2.5} />
            : <AlertCircle size={14} strokeWidth={2.5} />}
          {statusLabel}
        </div>
        <button onClick={reset} type="button"
          className="flex items-center gap-1 text-caption text-muted hover:text-[#E00000] font-semibold transition-colors">
          <RefreshCw size={13} strokeWidth={2} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-12 gap-2 px-4 py-1.5 border-b border-gray-100 bg-gray-50/30">
        {[['col-span-4','Denomination'],['col-span-5','Count / Available'],['col-span-2 text-right','Subtotal'],['col-span-1','']].map(([cls,h]) => (
          <div key={h} className={`${cls} text-overline font-semibold text-muted uppercase tracking-wider`}>{h}</div>
        ))}
      </div>

      <div className="divide-y divide-gray-50">
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Banknote size={20} className="mx-auto mb-2 text-gray-200" />
            <p className="text-muted text-body">No denominations yet.</p>
          </div>
        )}
        {rows.map(row => {
          const subtotal = row.denom * row.count;
          const active   = row.count > 0;
          const available = availabilityByDenomination?.[String(Number(row.denom))];
          return (
            <div key={row.id}
              className="grid grid-cols-12 gap-2 items-center px-4 py-2 transition-colors group hover:bg-gray-50/50"
              style={active ? { background: `${accentColor}06` } : {}}>
              <div className="col-span-4 flex min-w-0 items-center">
                <span className="inline-flex shrink-0 items-center gap-0.5 px-2 py-1 rounded-md border text-caption font-semibold transition-colors tnum"
                  style={active
                    ? { background:`${accentColor}10`, borderColor:`${accentColor}30`, color:accentColor }
                    : { borderColor:'#e5e7eb', color:'#374151' }}>
                  <span className="opacity-50 text-overline">{symbol}</span>
                  {row.denom < 1 ? row.denom.toFixed(2) : row.denom.toLocaleString()}
                  <span className="ml-0.5 text-overline opacity-60">{currency}</span>
                </span>
              </div>
              <div className="col-span-5 flex min-w-0 items-center gap-1">
                <button type="button" onClick={() => step(row.id,-1)}
                  className="h-8 w-7 shrink-0 rounded border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#E00000] hover:border-[#E00000]/20 transition-colors">
                  <MinusCircle size={14} strokeWidth={1.5} />
                </button>
                <CurrencyInput
                  allowDecimals={false}
                  max={available}
                  value={row.count}
                  onChange={e => updateCount(row.id, available === undefined ? e.target.value : Math.min(Number(e.target.value || 0), Number(available)))}
                  className="h-8 min-w-0 flex-1 rounded border text-center text-body-value font-semibold focus:outline-none transition-colors tnum"
                  style={active
                    ? { borderColor:`${accentColor}50`, background:`${accentColor}06` }
                    : { borderColor:'#e5e7eb' }}
                  placeholder="0"
                />
                {available !== undefined && <span className="shrink-0 whitespace-nowrap text-caption font-semibold text-muted tnum">/ {Number(available).toLocaleString()}</span>}
                <button type="button" onClick={() => step(row.id,1)} disabled={available !== undefined && row.count >= Number(available)}
                  className="h-8 w-7 shrink-0 rounded border flex items-center justify-center transition-colors"
                  style={active
                    ? { color:accentColor, borderColor:`${accentColor}40`, background:`${accentColor}08` }
                    : { color:'#d1d5db', borderColor:'#e5e7eb' }}>
                  <PlusCircle size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div className="col-span-2 text-right min-w-0">
                <span className="text-body-value font-bold transition-colors tnum"
                  style={{ color: active ? accentColor : '#9ca3af' }}>
                  {symbol}{subtotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={() => removeRow(row.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-300 hover:text-[#E00000] transition-colors opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
        <div className="text-caption text-muted">
          {rows.filter(r=>r.count>0).length} denominations · {rows.reduce((s,r)=>s+r.count,0)} notes
        </div>
        <div className="text-right">
          <span className="text-amount-pair font-bold tnum" style={{ color: accentColor }}>
            {symbol}{totalDispensed.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})}
          </span>
          <span className="text-caption font-semibold text-muted ml-1.5">{currency}</span>
        </div>
      </div>
    </div>
  );
};
