// src/__tests__/unit/exchangeContext.test.js
/**
 * UNIT TESTS — ExchangeContext (ExchangeProvider + useExchange)
 *
 * Covers:
 *  - serviceFee / gstAmount / total computation for BUY
 *  - serviceFee / gstAmount / total computation for SELL
 *  - Zero-amount edge cases
 *  - Default values when summary is undefined/null
 *  - Custom config rates override defaults
 *  - useExchange throws outside provider
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import { ExchangeProvider, useExchange } from '../../context/ExchangeContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: wrap hook with ExchangeProvider
// ─────────────────────────────────────────────────────────────────────────────
function wrapWith(summary, config) {
  const Wrapper = ({ children }) => (
    <ExchangeProvider summary={summary} config={config}>
      {children}
    </ExchangeProvider>
  );
  return renderHook(() => useExchange(), { wrapper: Wrapper });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BUY calculations
// ─────────────────────────────────────────────────────────────────────────────
describe('ExchangeProvider — BUY', () => {
  const summary = {
    sendAmount:   100,
    receiverGets: 126,
    exchangeType: 'BUY',
  };
  // Default config: serviceRate=0.02, gstRate=0.15

  test('serviceFee = receiverGets × 0.02', () => {
    const { result } = wrapWith(summary);
    expect(result.current.serviceFee).toBeCloseTo(126 * 0.02, 5);
  });

  test('gstAmount = serviceFee × 0.15', () => {
    const { result } = wrapWith(summary);
    const serviceFee = 126 * 0.02;
    expect(result.current.gstAmount).toBeCloseTo(serviceFee * 0.15, 5);
  });

  test('BUY total = receiverGets + serviceFee + gstAmount', () => {
    const { result } = wrapWith(summary);
    const { receiverGets, serviceFee, gstAmount, total } = result.current;
    expect(total).toBeCloseTo(receiverGets + serviceFee + gstAmount, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SELL calculations
// ─────────────────────────────────────────────────────────────────────────────
describe('ExchangeProvider — SELL', () => {
  const summary = {
    sendAmount:   50,
    receiverGets: 65,
    exchangeType: 'SELL',
  };

  test('SELL total = receiverGets - serviceFee - gstAmount', () => {
    const { result } = wrapWith(summary);
    const { receiverGets, serviceFee, gstAmount, total } = result.current;
    expect(total).toBeCloseTo(receiverGets - serviceFee - gstAmount, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Edge cases
// ─────────────────────────────────────────────────────────────────────────────
describe('ExchangeProvider — edge cases', () => {
  test('summary=undefined → all amounts default to 0, exchangeType to BUY', () => {
    const { result } = wrapWith(undefined);
    expect(result.current.receiverGets).toBe(0);
    expect(result.current.sendAmount).toBe(0);
    expect(result.current.serviceFee).toBe(0);
    expect(result.current.gstAmount).toBe(0);
    expect(result.current.total).toBe(0);
    expect(result.current.exchangeType).toBe('BUY');
  });

  test('custom config overrides default rates', () => {
    const summary = { receiverGets: 100, sendAmount: 80, exchangeType: 'BUY' };
    const config  = { serviceRate: 0.05, gstRate: 0.10 };
    const { result } = wrapWith(summary, config);

    expect(result.current.serviceFee).toBeCloseTo(100 * 0.05, 5);
    expect(result.current.gstAmount).toBeCloseTo(100 * 0.05 * 0.10, 5);
  });

  test('string amounts are coerced to numbers', () => {
    const summary = { receiverGets: '65', sendAmount: '50', exchangeType: 'SELL' };
    const { result } = wrapWith(summary);
    expect(result.current.receiverGets).toBe(65);
    expect(result.current.sendAmount).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. useExchange guard
// ─────────────────────────────────────────────────────────────────────────────
describe('useExchange outside provider', () => {
  test('throws descriptive error', () => {
    // Suppress the React error boundary console output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useExchange());
    }).toThrow('useExchange must be used inside ExchangeProvider');
  });
});
