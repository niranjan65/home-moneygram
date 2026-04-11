// src/__tests__/unit/useDenominationCalculator.test.js
/**
 * UNIT TESTS — useDenominationCalculator hook + buildRows helper
 *
 * Covers:
 *  - buildRows greedy decomposition
 *  - Row initialisation on targetAmount / currency change
 *  - totalDispensed, difference, isBalanced, isOver flags
 *  - updateCount, step, removeRow, reset mutations
 *  - addPreset / addCustom denomination addition
 *  - onRowsChange callback invocation
 */
import { renderHook, act } from '@testing-library/react';
import {
  buildRows,
  useDenominationCalculator,
} from '../../features/exchange/hooks/useDenominationCalculator';
import {
  MOCK_FJD_DENOM_INFO,
  MOCK_AUD_DENOM_INFO,
} from '../fixtures/dealerFixtures';

// ─────────────────────────────────────────────────────────────────────────────
// 1. buildRows — pure function
// ─────────────────────────────────────────────────────────────────────────────
describe('buildRows()', () => {
  const { notes, coins } = MOCK_FJD_DENOM_INFO;
  const denoms = [...notes, ...coins];

  test('returns empty array when amount is 0 or falsy', () => {
    expect(buildRows(0,   denoms)).toEqual([]);
    expect(buildRows(null, denoms)).toEqual([]);
    expect(buildRows(undefined, denoms)).toEqual([]);
  });

  test('returns empty array when denoms is empty or null', () => {
    expect(buildRows(100, [])).toEqual([]);
    expect(buildRows(100, null)).toEqual([]);
  });

  test('decomposes 100 FJD correctly (greedy from largest)', () => {
    const rows = buildRows(100, denoms);
    const total = rows.reduce((s, r) => s + r.denom * r.count, 0);
    expect(total).toBeCloseTo(100, 5);
    // The 100-note row should have count 1
    const hundredRow = rows.find(r => r.denom === 100);
    expect(hundredRow?.count).toBe(1);
  });

  test('decomposes 25.05 FJD into correct notes+coins', () => {
    const rows = buildRows(25.05, denoms);
    const total = rows.reduce((s, r) => s + r.denom * r.count, 0);
    expect(total).toBeCloseTo(25.05, 5);
  });

  test('all row denoms round-trip correctly (denom stored as number)', () => {
    const rows = buildRows(50, denoms);
    rows.forEach(r => {
      expect(typeof r.denom).toBe('number');
      expect(typeof r.count).toBe('number');
      expect(r.count).toBeGreaterThanOrEqual(0);
    });
  });

  test('small amounts — coins only', () => {
    const rows = buildRows(0.05, MOCK_FJD_DENOM_INFO.coins);
    const total = rows.reduce((s, r) => s + r.denom * r.count, 0);
    expect(total).toBeCloseTo(0.05, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Hook initialisation
// ─────────────────────────────────────────────────────────────────────────────
function makeHook(targetAmount = 0, notes = [], coins = [], currency = 'FJD') {
  return renderHook(() =>
    useDenominationCalculator({
      currency,
      targetAmount,
      notes,
      coins,
      onRowsChange: jest.fn(),
    })
  );
}

describe('useDenominationCalculator — init', () => {
  test('starts with empty rows when targetAmount=0', () => {
    const { result } = makeHook(0, MOCK_FJD_DENOM_INFO.notes);
    // amount 0 → buildRows returns empty rows (guard on falsy amount)
    expect(result.current.rows).toHaveLength(0);
    expect(result.current.totalDispensed).toBe(0);
    expect(result.current.isBalanced).toBe(true);
  });

  test('populates rows from targetAmount + denominations', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes, MOCK_FJD_DENOM_INFO.coins);
    expect(result.current.rows.length).toBeGreaterThan(0);
    expect(result.current.totalDispensed).toBeCloseTo(100, 5);
    expect(result.current.isBalanced).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. balance / difference / isOver flags
// ─────────────────────────────────────────────────────────────────────────────
describe('balance states', () => {
  test('isBalanced=true when totalDispensed matches target within 0.01', () => {
    const { result } = makeHook(25.05, MOCK_FJD_DENOM_INFO.notes, MOCK_FJD_DENOM_INFO.coins);
    expect(result.current.isBalanced).toBe(true);
    expect(result.current.isOver).toBe(false);
  });

  test('isOver=true when counted > target by more than 0.01', () => {
    const { result } = makeHook(
      25.05,
      MOCK_FJD_DENOM_INFO.notes,
      MOCK_FJD_DENOM_INFO.coins
    );

    // Add an extra note via step() to push over
    const firstRow = result.current.rows[0];
    act(() => { result.current.step(firstRow.id, 1); });

    expect(result.current.isOver).toBe(true);
    expect(result.current.isBalanced).toBe(false);
    expect(result.current.difference).toBeGreaterThan(0.01);
  });

  test('shortfall when counted < target by more than 0.01', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes, MOCK_FJD_DENOM_INFO.coins);
    const firstRow = result.current.rows[0];

    // Set the 100-note count to 0 to create a shortfall
    act(() => { result.current.updateCount(firstRow.id, '0'); });

    expect(result.current.isBalanced).toBe(false);
    expect(result.current.isOver).toBe(false);
    expect(result.current.difference).toBeLessThan(-0.01);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mutations — updateCount, step, removeRow, reset
// ─────────────────────────────────────────────────────────────────────────────
describe('row mutations', () => {
  test('updateCount sets count of a specific row', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes);
    const id = result.current.rows[0].id;

    act(() => { result.current.updateCount(id, '3'); });
    expect(result.current.rows.find(r => r.id === id)?.count).toBe(3);
  });

  test('updateCount ignores negative values (floor at 0)', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes);
    const id = result.current.rows[0].id;

    act(() => { result.current.updateCount(id, '-5'); });
    expect(result.current.rows.find(r => r.id === id)?.count).toBe(0);
  });

  test('step(+1) increments count', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes);
    const id = result.current.rows[0].id;
    const before = result.current.rows[0].count;

    act(() => { result.current.step(id, 1); });
    expect(result.current.rows.find(r => r.id === id)?.count).toBe(before + 1);
  });

  test('step(-1) decrements count, never below 0', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes);
    const id = result.current.rows[0].id;

    act(() => { result.current.updateCount(id, '0'); });
    act(() => { result.current.step(id, -1); });
    expect(result.current.rows.find(r => r.id === id)?.count).toBe(0);
  });

  test('removeRow removes the row by id', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes);
    const before = result.current.rows.length;
    const id = result.current.rows[0].id;

    act(() => { result.current.removeRow(id); });
    expect(result.current.rows).toHaveLength(before - 1);
    expect(result.current.rows.find(r => r.id === id)).toBeUndefined();
  });

  test('reset restores original buildRows state', () => {
    const { result } = makeHook(100, MOCK_FJD_DENOM_INFO.notes, MOCK_FJD_DENOM_INFO.coins);
    const id = result.current.rows[0].id;

    act(() => { result.current.updateCount(id, '99'); });
    expect(result.current.isBalanced).toBe(false);

    act(() => { result.current.reset(); });
    expect(result.current.isBalanced).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. addPreset / addCustom
// ─────────────────────────────────────────────────────────────────────────────
describe('adding denominations', () => {
  test('addPreset appends a new row with count 0', () => {
    // Start with only notes, then add a coin preset
    const { result } = makeHook(0, MOCK_FJD_DENOM_INFO.notes, []);
    const before = result.current.rows.length;

    act(() => { result.current.addPreset(0.5); });
    expect(result.current.rows).toHaveLength(before + 1);
    const newRow = result.current.rows.at(-1);
    expect(newRow.denom).toBe(0.5);
    expect(newRow.count).toBe(0);
  });

  test('addCustom with valid value appends and clears input', () => {
    const { result } = makeHook(0, MOCK_FJD_DENOM_INFO.notes);
    const before = result.current.rows.length;

    act(() => { result.current.setCustomDenom('7.50'); });
    act(() => { result.current.addCustom(); });

    expect(result.current.rows).toHaveLength(before + 1);
    expect(result.current.rows.at(-1).denom).toBe(7.5);
    expect(result.current.customDenom).toBe('');
    expect(result.current.showCustom).toBe(false);
  });

  test('addCustom does nothing for invalid/negative values', () => {
    const { result } = makeHook(0, MOCK_FJD_DENOM_INFO.notes);
    const before = result.current.rows.length;

    for (const bad of ['', '-1', 'abc', '0']) {
      act(() => { result.current.setCustomDenom(bad); });
      act(() => { result.current.addCustom(); });
    }
    expect(result.current.rows).toHaveLength(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. onRowsChange callback
// ─────────────────────────────────────────────────────────────────────────────
describe('onRowsChange callback', () => {
  test('fires when rows change', () => {
    const onRowsChange = jest.fn();
    const { result } = renderHook(() =>
      useDenominationCalculator({
        currency:     'FJD',
        targetAmount: 50,
        notes:        MOCK_FJD_DENOM_INFO.notes,
        coins:        MOCK_FJD_DENOM_INFO.coins,
        onRowsChange,
      })
    );
    // Called at least once on init
    expect(onRowsChange).toHaveBeenCalled();

    const callsBefore = onRowsChange.mock.calls.length;
    const id = result.current.rows[0]?.id;
    act(() => { result.current.step(id, 1); });
    expect(onRowsChange.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
