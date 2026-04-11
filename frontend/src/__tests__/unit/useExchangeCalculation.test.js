// src/__tests__/unit/useExchangeCalculation.test.js
/**
 * UNIT TESTS — useExchangeCalculation hook
 *
 * Covers:
 *  - roundTo5Cents pure function
 *  - effectiveRate derivation (BUY / SELL / manual / fallback)
 *  - exchangePreview computation with 5-cent rounding (BUY & SELL)
 *  - fjdSendAmount denomination panel target
 *  - onSummaryChange side-effect firing
 *  - noDataForToday forces manual rate mode
 */
import { renderHook, act } from '@testing-library/react';
import {
  useExchangeCalculation,
  roundTo5Cents,
} from '../../features/exchange/hooks/useExchangeCalculation';
import { MOCK_AUD_CURRENCY, MOCK_AVAILABLE_CURRENCIES } from '../fixtures/dealerFixtures';

// ─────────────────────────────────────────────────────────────────────────────
// 1. roundTo5Cents — pure function
// ─────────────────────────────────────────────────────────────────────────────
describe('roundTo5Cents()', () => {
  const cases = [
    [0,       0],
    [0.01,    0],      // rounds down to 0
    [0.025,   0.05],   // midpoint rounds up
    [0.03,    0.05],
    [0.04,    0.05],
    [12.37,   12.35],
    [12.38,   12.40],
    [19.890,  19.90],
    [25.0614, 25.05],  // the exact scenario from the user's bug report
    [25.0750, 25.10],  // midpoint
    [100,     100],
    [99.99,   100.00],
  ];

  test.each(cases)(
    'roundTo5Cents(%p) → %p',
    (input, expected) => {
      expect(roundTo5Cents(input)).toBeCloseTo(expected, 10);
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build a hook result with default BUY params
// ─────────────────────────────────────────────────────────────────────────────
function buildHook(overrides = {}) {
  const defaults = {
    availableCurrencies: MOCK_AVAILABLE_CURRENCIES,
    externalSendAmount:  undefined,
    noDataForToday:      false,
    onSummaryChange:     jest.fn(),
    exchangeType:        'BUY',
  };
  return renderHook(() => useExchangeCalculation({ ...defaults, ...overrides }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Initial state
// ─────────────────────────────────────────────────────────────────────────────
describe('useExchangeCalculation — initial state', () => {
  test('starts with null toCurrency, empty rate/amount', () => {
    const { result } = buildHook();

    expect(result.current.toCurrency).toBeNull();
    expect(result.current.effectiveRate).toBeNull();
    expect(result.current.exchangePreview).toBeNull();
    expect(result.current.sendAmount).toBe('');
    expect(result.current.fjdSendAmount).toBe(0);
  });

  test('initialises sendAmount from externalSendAmount prop', () => {
    const { result } = buildHook({ externalSendAmount: 100 });
    expect(result.current.sendAmount).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. effectiveRate — BUY uses buyingRate, SELL uses sellingRate
// ─────────────────────────────────────────────────────────────────────────────
describe('effectiveRate', () => {
  test('BUY: returns toCurrency.buyingRate', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });

    act(() => { result.current.setToCurrency(MOCK_AUD_CURRENCY); });

    expect(result.current.effectiveRate).toBe(MOCK_AUD_CURRENCY.buyingRate); // 1.26
  });

  test('SELL: returns toCurrency.sellingRate', () => {
    const { result } = buildHook({ exchangeType: 'SELL' });

    act(() => { result.current.setToCurrency(MOCK_AUD_CURRENCY); });

    expect(result.current.effectiveRate).toBe(MOCK_AUD_CURRENCY.sellingRate); // 1.30
  });

  test('returns null when no toCurrency is selected', () => {
    const { result } = buildHook();
    expect(result.current.effectiveRate).toBeNull();
  });

  test('manual rate overrides catalogue rate when useManualRate=true', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setUseManualRate(true);
      result.current.setManualRate('1.50');
    });

    expect(result.current.effectiveRate).toBe(1.50);
  });

  test('manual rate returns null for invalid/empty strings', () => {
    const { result } = buildHook();

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setUseManualRate(true);
    });

    for (const bad of ['', 'abc', '-1', '0']) {
      act(() => { result.current.setManualRate(bad); });
      expect(result.current.effectiveRate).toBeNull();
    }
  });

  test('noDataForToday=true forces useManualRate to true', () => {
    const { result } = buildHook({ noDataForToday: true });
    expect(result.current.useManualRate).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. exchangePreview — rounding to 5 cents
// ─────────────────────────────────────────────────────────────────────────────
describe('exchangePreview', () => {
  test('BUY: rounds FJD payout to nearest 5 cents', () => {
    // 19.890 AUD × 1.26 = 25.0614 → round to 25.05
    const { result } = buildHook({ exchangeType: 'BUY' });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setSendAmount(19.890);
    });

    expect(result.current.exchangePreview?.rawAmount).toBeCloseTo(25.05, 5);
    expect(result.current.exchangePreview?.rate).toBe(1.26);
  });

  test('SELL: rounds FJD payout to nearest 5 cents', () => {
    // 50 AUD × 1.30 = 65.00 → already on 5-cent boundary
    const { result } = buildHook({ exchangeType: 'SELL' });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setSendAmount(50);
    });

    expect(result.current.exchangePreview?.rawAmount).toBeCloseTo(65.00, 5);
  });

  test('returns null when no rate is set', () => {
    const { result } = buildHook();
    act(() => { result.current.setSendAmount(100); });
    expect(result.current.exchangePreview).toBeNull();
  });

  test('returns null when sendAmount is zero', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });
    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setSendAmount(0);
    });
    expect(result.current.exchangePreview).toBeNull();
  });

  test('exchangePreview.formatted is a non-empty string', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });
    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setSendAmount(100);
    });
    expect(typeof result.current.exchangePreview?.formatted).toBe('string');
    expect(result.current.exchangePreview?.formatted.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. fjdSendAmount — denomination panel target value
// ─────────────────────────────────────────────────────────────────────────────
describe('fjdSendAmount', () => {
  test('BUY: rounds sendAmount to nearest 5 cents', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });
    act(() => { result.current.setSendAmount(19.890); });
    // 19.890 → 19.90
    expect(result.current.fjdSendAmount).toBeCloseTo(19.90, 5);
  });

  test('SELL: returns raw sendAmount (no rounding)', () => {
    const { result } = buildHook({ exchangeType: 'SELL' });
    act(() => { result.current.setSendAmount(50); });
    expect(result.current.fjdSendAmount).toBe(50);
  });

  test('returns 0 when sendAmount is empty or zero', () => {
    const { result } = buildHook();
    expect(result.current.fjdSendAmount).toBe(0);
    act(() => { result.current.setSendAmount(0); });
    expect(result.current.fjdSendAmount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. onSummaryChange side-effect
// ─────────────────────────────────────────────────────────────────────────────
describe('onSummaryChange side-effect', () => {
  test('fires with correct shape when currency and amount are set', () => {
    const onSummaryChange = jest.fn();
    const { result } = buildHook({ exchangeType: 'BUY', onSummaryChange });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setSendAmount(100);
    });

    const lastCall = onSummaryChange.mock.calls.at(-1)[0];
    expect(lastCall).toMatchObject({
      currency:        'FJD',
      exchangeType:    'BUY',
      exchangeRate:    1.26,
      receiverCurrency:'AUD',
    });
    expect(lastCall.receiverGets).toBeGreaterThan(0);
  });

  test('does not throw when onSummaryChange is undefined', () => {
    const { result } = buildHook({ onSummaryChange: undefined });
    expect(() => {
      act(() => {
        result.current.setToCurrency(MOCK_AUD_CURRENCY);
        result.current.setSendAmount(100);
      });
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. manual rate (Dealer-specific flow)
// ─────────────────────────────────────────────────────────────────────────────
describe('Dealer manual rate flow', () => {
  test('manual rate 1.50 with BUY 100 → rawAmount = roundTo5Cents(150) = 150', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setUseManualRate(true);
      result.current.setManualRate('1.50');
      result.current.setSendAmount(100);
    });

    expect(result.current.exchangePreview?.rawAmount).toBeCloseTo(150, 5);
  });

  test('switching from manual to catalogue rate recalculates correctly', () => {
    const { result } = buildHook({ exchangeType: 'BUY' });

    act(() => {
      result.current.setToCurrency(MOCK_AUD_CURRENCY);
      result.current.setUseManualRate(true);
      result.current.setManualRate('2.00');
      result.current.setSendAmount(100);
    });
    expect(result.current.exchangePreview?.rawAmount).toBeCloseTo(200, 5);

    act(() => { result.current.setUseManualRate(false); });
    // should revert to AUD buyingRate = 1.26 → 100*1.26 = 126
    expect(result.current.exchangePreview?.rawAmount).toBeCloseTo(126, 5);
  });
});
