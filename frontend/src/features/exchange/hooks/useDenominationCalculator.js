import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export function buildRows(amount, denoms, availabilityByDenomination) {
  const rows = [];
  if (!amount || !denoms?.length) return rows;
  let remaining = Math.round(parseFloat(amount) * 100);
  const sortedDenoms = [...denoms].map(d => Math.round(d * 100)).sort((a, b) => b - a);
  for (let i = 0; i < sortedDenoms.length; i++) {
    const dc    = sortedDenoms[i];
    const requestedCount = Math.floor(remaining / dc);
    const available = availabilityByDenomination?.[String(dc / 100)];
    const count = available === undefined ? requestedCount : Math.min(requestedCount, Math.max(0, Number(available) || 0));
    rows.push({ id: `${dc}-${i}`, denom: dc / 100, count: count > 0 ? count : 0 });
    remaining -= count * dc;
  }
  return rows;
}

export const useDenominationCalculator = ({ currency, targetAmount, notes, coins, onRowsChange, availabilityByDenomination, initialRows }) => {
  const [rows, setRows] = useState([]);
  const [customDenom, setCustomDenom] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const prevKey = useRef('');
  const availabilityKey = JSON.stringify(availabilityByDenomination || {});

  useEffect(() => {
    const key = `${currency}:${targetAmount}:${(notes||[]).length}:${(coins||[]).length}:${availabilityKey}`;
    if (prevKey.current !== key) {
      prevKey.current = key;
      if (initialRows && Array.isArray(initialRows) && initialRows.length > 0) {
        const total = initialRows.reduce((s, r) => s + (Number(r.denom ?? r.denomination_value ?? 0)) * (Number(r.count ?? r.qty ?? 0)), 0);
        if (Math.abs(total - (targetAmount || 0)) < 0.01) {
          const formatted = initialRows.map((r, i) => ({
            id: r.id || `${r.denom ?? r.denomination_value}-${i}`,
            denom: Number(r.denom ?? r.denomination_value),
            count: Number(r.count ?? r.qty ?? 0),
          }));
          setRows(formatted);
          return;
        }
      }
      setRows(buildRows(targetAmount, [...(notes||[]), ...(coins||[])], availabilityByDenomination));
    }
  }, [currency, targetAmount, notes, coins, availabilityKey, initialRows]);

  useEffect(() => { onRowsChange?.(rows); }, [rows, onRowsChange]);

  const totalDispensed = useMemo(() => rows.reduce((s,r) => s + r.denom*r.count, 0), [rows]);
  const difference     = totalDispensed - (targetAmount || 0);
  const isBalanced     = Math.abs(difference) < 0.01;
  const isOver         = difference > 0.01;

  const updateCount = useCallback((id,val) =>
    setRows(p => p.map(r => r.id===id ? {...r, count:Math.max(0,parseInt(val)||0)} : r)), []);
  
  const step = useCallback((id,d) =>
    setRows(p => p.map(r => r.id===id ? {...r, count:Math.max(0,r.count+d)} : r)), []);
  
  const removeRow = useCallback((id) => setRows(p => p.filter(r => r.id!==id)), []);
  
  const reset = useCallback(() => setRows(buildRows(targetAmount, [...(notes||[]), ...(coins||[])], availabilityByDenomination)), [targetAmount, notes, coins, availabilityKey]);

  const activeDenomSet = new Set(rows.map(r => r.denom));
  const addablePresets = [...(notes||[]), ...(coins||[])].filter(d => !activeDenomSet.has(d));
  
  const addPreset = useCallback((d) => setRows(p => [...p, { id:d, denom:d, count:0 }]), []);
  
  const addCustom = useCallback(() => {
    const v = parseFloat(customDenom);
    if (!v || v <= 0) return;
    setRows(p => [...p, { id:Date.now(), denom:v, count:0 }]);
    setCustomDenom(''); 
    setShowCustom(false);
  }, [customDenom]);

  return {
    rows,
    totalDispensed,
    difference,
    isBalanced,
    isOver,
    updateCount,
    step,
    removeRow,
    reset,
    addablePresets,
    addPreset,
    addCustom,
    customDenom,
    setCustomDenom,
    showCustom,
    setShowCustom
  };
};
