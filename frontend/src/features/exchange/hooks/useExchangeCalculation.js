import { useMemo, useState, useEffect } from 'react';

// FJD smallest circulating coin is 5 cents — round to nearest 0.05
export const roundTo5Cents = (amount) =>
  Math.round(Math.round(amount * 100) / 5) * 0.05;

export const useExchangeCalculation = ({
  availableCurrencies,
  externalSendAmount,
  noDataForToday,
  onSummaryChange,
  exchangeType,
}) => {

  const [toCurrency, setToCurrency] = useState(null);
  const [manualRate, setManualRate] = useState('');
  const [useManualRate, setUseManualRate] = useState(false);
  const [sendAmount, setSendAmount] = useState(externalSendAmount ?? '');
  const [sendAmountError, setSendAmountError] = useState('');

  // No auto-select — user must pick a currency from the dropdown

  // Handle fallback if no data for today
  useEffect(() => {
    if (noDataForToday) setUseManualRate(true);
  }, [noDataForToday]);

  // Determine the effective rate
  const effectiveRate = useMemo(() => {
    if (!toCurrency) return null;
    if (useManualRate) {
      const m = parseFloat(manualRate);
      return !isNaN(m) && m > 0 ? m : null;
    }
    if (exchangeType === 'SELL') return toCurrency.sellingRate ?? null;
    if (exchangeType === 'BUY') return toCurrency.buyingRate ?? null;
    return null;
  }, [toCurrency, exchangeType, useManualRate, manualRate]);

  // Calculate the preview exchange result
  const exchangePreview = useMemo(() => {
    if (!effectiveRate || effectiveRate <= 0) return null;
    if (!sendAmount || sendAmount <= 0) return null;

    let receiverAmount = 0;
    if (exchangeType === 'BUY') {
      // BUY: customer pays FJD (sendAmount), MH gives foreign currency
      // Foreign amount — no FJD rounding needed here
      receiverAmount = roundTo5Cents(sendAmount / effectiveRate);
    }
    if (exchangeType === 'SELL') {
      // SELL: customer pays foreign (sendAmount), MH gives FJD
      // Result IS FJD — round to nearest 5 cents
      receiverAmount = roundTo5Cents(sendAmount / effectiveRate);
    }

    return {
      rate: effectiveRate,
      rawAmount: receiverAmount,
      formatted: receiverAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    };
  }, [effectiveRate, sendAmount, exchangeType]);

  // For BUY: the FJD sendAmount is entered by the user — round it to 5 cents
  // for use as the denomination panel target.
  const fjdSendAmount = useMemo(() => {
    if (!sendAmount || sendAmount <= 0) return 0;
    return exchangeType === 'BUY' ? roundTo5Cents(parseFloat(sendAmount)) : parseFloat(sendAmount);
  }, [sendAmount, exchangeType]);

  // Trigger onSummaryChange whenever inputs change
  useEffect(() => {
    if (!onSummaryChange) return;
    onSummaryChange({
      sendAmount,
      currency: 'FJD',
      exchangeRate: exchangePreview?.rate ?? 0,
      receiverGets: exchangePreview?.rawAmount ?? 0,
      receiverCurrency: toCurrency?.code ?? '',
      exchangeType,
    });
  }, [sendAmount, toCurrency, exchangePreview, exchangeType, onSummaryChange]);

  return {
    toCurrency,
    setToCurrency,
    manualRate,
    setManualRate,
    useManualRate,
    setUseManualRate,
    sendAmount,
    setSendAmount,
    sendAmountError,
    setSendAmountError,
    effectiveRate,
    exchangePreview,
    fjdSendAmount,
  };
};
