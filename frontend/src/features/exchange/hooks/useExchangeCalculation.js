import { useMemo, useState, useEffect, useRef } from 'react';

// FJD smallest circulating coin is 5 cents — round to nearest 0.05
export const roundTo5Cents = (amount) =>
  Math.round(Math.round(amount * 100) / 5) * 0.05;

export const useExchangeCalculation = ({
  availableCurrencies,
  externalSendAmount,
  noDataForToday,
  onSummaryChange,
  exchangeType,
  initialCurrencyCode,
  initialManualRate,
  initialUseManualRate,
}) => {

  const [toCurrency, setToCurrency] = useState(null);
  const [manualRate, setManualRate] = useState(initialManualRate ? String(initialManualRate) : '');
  const [useManualRate, setUseManualRate] = useState(Boolean(initialUseManualRate || noDataForToday));
  const [sendAmount, setSendAmount] = useState(externalSendAmount ?? '');
  const [sendAmountError, setSendAmountError] = useState('');
  const lastAppliedCurrencyCodeRef = useRef(null);

  // Customer Request handoff / state restoration: select the requested foreign currency once or when code changes
  useEffect(() => {
    if (!initialCurrencyCode || !availableCurrencies?.length) return;
    const requestedCode = String(initialCurrencyCode).trim().toUpperCase().split(/\s|-/)[0];
    if (lastAppliedCurrencyCodeRef.current === requestedCode) return;

    const requestedCurrency = availableCurrencies.find(
      (currency) => String(currency.code || '').toUpperCase() === requestedCode
    );
    if (requestedCurrency) {
      setToCurrency(requestedCurrency);
      lastAppliedCurrencyCodeRef.current = requestedCode;
    }
  }, [initialCurrencyCode, availableCurrencies]);

  const lastAppliedManualRateRef = useRef(null);
  useEffect(() => {
    if (initialManualRate && lastAppliedManualRateRef.current !== initialManualRate) {
      setManualRate(String(initialManualRate));
      lastAppliedManualRateRef.current = initialManualRate;
    }
  }, [initialManualRate]);

  const lastAppliedSendAmountRef = useRef(null);
  useEffect(() => {
    if (externalSendAmount !== undefined && externalSendAmount !== '' && lastAppliedSendAmountRef.current !== externalSendAmount) {
      setSendAmount(externalSendAmount);
      lastAppliedSendAmountRef.current = externalSendAmount;
    }
  }, [externalSendAmount]);

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
