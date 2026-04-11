import React from 'react';
import { Banknote, RefreshCw, CheckCircle2, AlertCircle, MinusCircle, PlusCircle, X } from 'lucide-react';
import { useDenominationCalculator } from '../../hooks/useDenominationCalculator';

export const DenominationPanel = ({
  title, subtitle, flag, symbol, currency, notes, coins,
  targetAmount, onRowsChange, accentColor = '#dc2626',
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
  } = useDenominationCalculator({ currency, targetAmount, notes, coins, onRowsChange });

  const statusLabel = isBalanced
    ? 'Balanced'
    : isOver
      ? `Over ${symbol}${Math.abs(difference).toFixed(2)}`
      : `Short ${symbol}${Math.abs(difference).toFixed(2)}`;

  const statusColor = isBalanced ? accentColor : isOver ? '#d97706' : '#dc2626';

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{flag}</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        {targetAmount > 0 && (
          <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
            {symbol}{targetAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})} {currency}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50/50">
        {[
          { label:'Expected', val: targetAmount||0, color:'#6b7280' },
          { label:'Counted',  val: totalDispensed,  color: accentColor },
          { label: isBalanced ? 'Balanced' : isOver ? 'Overage' : 'Shortfall',
            val: Math.abs(difference), color: statusColor,
            prefix: isBalanced ? '' : isOver ? '+' : '-' },
        ].map(({ label, val, color, prefix='' }) => (
          <div key={label} className="flex flex-col items-center py-2.5 px-2">
            <span className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</span>
            <span className="text-sm font-semibold" style={{ color }}>
              {prefix}{symbol}{val.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColor }}>
          {isBalanced
            ? <CheckCircle2 size={12} strokeWidth={2.5} />
            : <AlertCircle size={12} strokeWidth={2.5} />}
          {statusLabel}
        </div>
        <button onClick={reset} type="button"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#E00000] transition-colors">
          <RefreshCw size={11} strokeWidth={2} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-12 gap-2 px-4 py-1.5 border-b border-gray-100 bg-gray-50/30">
        {[['col-span-3','Denomination'],['col-span-5','Count'],['col-span-3 text-right','Subtotal'],['col-span-1','']].map(([cls,h]) => (
          <div key={h} className={`${cls} text-[9px] font-semibold text-gray-400 uppercase tracking-wider`}>{h}</div>
        ))}
      </div>

      <div className="divide-y divide-gray-50">
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center">
            <Banknote size={20} className="mx-auto mb-2 text-gray-200" />
            <p className="text-gray-400 text-sm">No denominations yet.</p>
          </div>
        )}
        {rows.map(row => {
          const subtotal = row.denom * row.count;
          const active   = row.count > 0;
          return (
            <div key={row.id}
              className="grid grid-cols-12 gap-2 items-center px-4 py-2 transition-colors group hover:bg-gray-50/50"
              style={active ? { background: `${accentColor}06` } : {}}>
              <div className="col-span-3">
                <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md border text-xs font-semibold transition-colors"
                  style={active
                    ? { background:`${accentColor}10`, borderColor:`${accentColor}30`, color:accentColor }
                    : { borderColor:'#e5e7eb', color:'#374151' }}>
                  <span className="opacity-50 text-[10px]">{symbol}</span>
                  {row.denom < 1 ? row.denom.toFixed(2) : row.denom.toLocaleString()}
                </span>
              </div>
              <div className="col-span-5 flex items-center gap-1">
                <button type="button" onClick={() => step(row.id,-1)}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-gray-300 hover:text-[#E00000] hover:border-[#E00000]/20 transition-colors">
                  <MinusCircle size={14} strokeWidth={1.5} />
                </button>
                <input type="number" min="0" value={row.count}
                  onChange={e => updateCount(row.id, e.target.value)}
                  className="w-14 h-7 rounded border text-center text-sm font-semibold focus:outline-none transition-colors"
                  style={active
                    ? { borderColor:`${accentColor}50`, background:`${accentColor}06` }
                    : { borderColor:'#e5e7eb' }} />
                <button type="button" onClick={() => step(row.id,1)}
                  className="w-7 h-7 rounded border flex items-center justify-center transition-colors"
                  style={active
                    ? { color:accentColor, borderColor:`${accentColor}40`, background:`${accentColor}08` }
                    : { color:'#d1d5db', borderColor:'#e5e7eb' }}>
                  <PlusCircle size={14} strokeWidth={1.5} />
                </button>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-semibold transition-colors"
                  style={{ color: active ? accentColor : '#e5e7eb' }}>
                  {symbol}{subtotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={() => removeRow(row.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-gray-200 hover:text-[#E00000] transition-colors opacity-0 group-hover:opacity-100">
                  <X size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          {rows.filter(r=>r.count>0).length} denominations · {rows.reduce((s,r)=>s+r.count,0)} notes
        </div>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: accentColor }}>
            {symbol}{totalDispensed.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4})}
          </span>
          <span className="text-xs text-gray-400 ml-1.5">{currency}</span>
        </div>
      </div>
    </div>
  );
};
