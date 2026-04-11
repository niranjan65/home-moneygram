import React, { useRef, useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { UserPlus, ArrowRight, AlertCircle } from 'lucide-react';
import { useExchange } from '../../../context/ExchangeContext';
import { useUser } from '../../../context/UserContext';
import { useSettings } from '../../../context/SettingsContext';
import { useBaseCurrency, useDenomination } from '../../../hooks/useDenomination';
import { useExchangeCalculation } from '../hooks/useExchangeCalculation';
import { validateStockAvailability } from '../../../hooks/useStockValidation';

import { DealerPersonalInfoSection } from './sections/DealerPersonalInfoSection';
import { DealerExchangeSection } from './sections/DealerExchangeSection';
import { DenominationSection } from './sections/DenominationSection';
import { SectionDivider } from './ui/FormUtilities';

export const DealerForm = ({
  initialData,
  sendAmount: externalSendAmount,
  onContinue,
  onClear,
  onSummaryChange,
  ratesData,
}) => {
  const methods = useForm({
    defaultValues: {
      firstName: initialData?.firstName || '',
      middleName: initialData?.middleName || '',
      lastName: initialData?.lastName || '',
      fullName: initialData?.fullName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      exchangeType: initialData?.exchangeType || 'BUY',
    },
  });

  const { handleSubmit, setFocus, watch } = methods;
  const exchangeType = watch('exchangeType');

  const {
    availableCurrencies,
    loading: ratesLoading,
    error: rateError,
  } = ratesData || {};

  const {
    toCurrency,
    setToCurrency,
    manualRate,
    useManualRate,
    setUseManualRate,
    setManualRate,
    sendAmount,
    setSendAmount,
    sendAmountError,
    setSendAmountError,
    effectiveRate,
    exchangePreview,
    fjdSendAmount,
  } = useExchangeCalculation({
    availableCurrencies,
    externalSendAmount,
    noDataForToday: false, // For Dealer, we always use manual
    onSummaryChange,
    exchangeType,
  });

  // Force manual rate usage for Dealer Form
  useEffect(() => {
    setUseManualRate(true);
  }, [setUseManualRate]);

  const { data: baseCurrencyInfo } = useBaseCurrency();
  const selectedDenomCountry = toCurrency?.country ?? null;
  const { data: foreignCurrencyInfo, loading: denomLoading, error: denomLoadError } = useDenomination(selectedDenomCountry);

  const senderInfo = exchangeType === 'BUY' ? baseCurrencyInfo : foreignCurrencyInfo;
  const receiverInfo = exchangeType === 'BUY' ? foreignCurrencyInfo : baseCurrencyInfo;

  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();
  const [stockError, setStockError] = useState('');
  const [stockLoading, setStockLoading] = useState(false);
  const stockErrorRef = useRef(null);

  // Clear stock error when currency changes
  useEffect(() => { setStockError(''); }, [toCurrency?.code]);

  const runStockCheck = async (si = senderInfo, ri = receiverInfo) => {
    // Stock check only applies when selling (customer brings foreign currency)
    if (exchangeType === 'BUY') return true;

    const warehouseName = selectedWarehouse?.warehouse;
    const allItemNames = [
      ...(si?.notes_name ?? []),
      ...(si?.coins_name ?? []),
      ...(ri?.notes_name ?? []),
      ...(ri?.coins_name ?? []),
    ];
    if (!warehouseName || allItemNames.length === 0) return true;
    setStockLoading(true);
    try {
      const { outOfStock } = await validateStockAvailability(allItemNames, warehouseName, loginUser);
      if (outOfStock.length > 0) {
        setStockError(
          // `The following denominations are out of stock at ${warehouseName}: ${outOfStock.join(', ')}`
          `Sufficient stock not available at ${warehouseName} for the denominations you've entered. Please adjust the counts or contact admin.`
        );
        setTimeout(() => stockErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        return false;
      }
      setStockError('');
      return true;
    } catch (err) {
      console.error('[Stock Check]', err);
      setStockError('');
      return true;
    } finally {
      setStockLoading(false);
    }
  };

  const senderDenomRowsRef = useRef([]);
  const receiverDenomRowsRef = useRef([]);
  const senderDenomStatusRef = useRef({ total: 0, target: 0 });
  const receiverDenomStatusRef = useRef({ total: 0, target: 0 });
  
  const [denomBalanceError, setDenomBalanceError] = useState('');
  const denomErrorRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const onSubmit = async (data) => {
    if (!sendAmount || sendAmount <= 0) {
      setSendAmountError('Please enter a valid send amount');
      return;
    }
    if (!effectiveRate || effectiveRate <= 0) {
      setSendAmountError('Please enter a valid manual rate and select a currency.');
      return;
    }
    setSendAmountError('');

    // Denomination balance check
    const senderTarget = senderDenomStatusRef.current.target;
    const senderTotal = senderDenomStatusRef.current.total;
    const receiverTarget = receiverDenomStatusRef.current.target;
    const receiverTotal = receiverDenomStatusRef.current.total;

    const senderDiff = senderTotal - senderTarget;
    const receiverDiff = receiverTotal - receiverTarget;
    const senderOk = Math.abs(senderDiff) < 0.01;
    const receiverOk = Math.abs(receiverDiff) < 0.01;

    if (!senderOk || !receiverOk) {
      const lines = [];
      if (!senderOk) {
        const label = senderDiff > 0 ? 'overage' : 'shortfall';
        lines.push(`Currency In has a ${label} of ${senderDiff > 0 ? '+' : ''}${senderDiff.toFixed(2)} (counted ${senderTotal.toFixed(2)}, expected ${senderTarget.toFixed(2)})`);
      }
      if (!receiverOk) {
        const label = receiverDiff > 0 ? 'overage' : 'shortfall';
        lines.push(`Currency Out has a ${label} of ${receiverDiff > 0 ? '+' : ''}${receiverDiff.toFixed(2)} (counted ${receiverTotal.toFixed(2)}, expected ${receiverTarget.toFixed(2)})`);
      }
      setDenomBalanceError(lines.join(' · '));
      setTimeout(() => denomErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    setDenomBalanceError('');

    // ── Stock availability check ───────────────────────────────────
    const ok = await runStockCheck();
    if (!ok) return;

    const getDenomType = (denom, notesArr = [], coinsArr = []) => {
      if (notesArr?.includes(denom)) return 'Note';
      if (coinsArr?.includes(denom)) return 'Coin';
      return denom >= 1 ? 'Note' : 'Coin';
    };

    onContinue?.({
      ...data,
      dateOfBirth: data.dateOfBirth ? formatDate(data.dateOfBirth) : null,
      sender_notes: senderInfo?.notes ?? [],
      sender_notes_name: senderInfo?.notes_name ?? [],
      sender_coins: senderInfo?.coins ?? [],
      sender_coins_name: senderInfo?.coins_name ?? [],
      notes: receiverInfo?.notes ?? [],
      notes_name: receiverInfo?.notes_name ?? [],
      coins: receiverInfo?.coins ?? [],
      coins_name: receiverInfo?.coins_name ?? [],
      sendAmount,
      localCurrency: baseCurrencyInfo?.currency ?? 'FJD',
      foreignCurrency: toCurrency?.code ?? '',
      exchangeRate: exchangePreview?.rate ?? 0,
      receiverGets: exchangePreview?.rawAmount ?? 0,
      totalAmount: exchangePreview?.rawAmount ?? 0,
      rateSource: 'manual',
      rateDate: null, // manual rate has no specific rateDate from ERP
      
      senderDenominationRows: senderDenomRowsRef.current.filter(r => r.count > 0).map(r => ({
        denomination_value: r.denom,
        denomination_type: getDenomType(r.denom, senderInfo?.notes, senderInfo?.coins),
        count: r.count,
        subtotal: r.denom * r.count,
      })),
      receiverDenominationRows: receiverDenomRowsRef.current.filter(r => r.count > 0).map(r => ({
        denomination_value: r.denom,
        denomination_type: getDenomType(r.denom, receiverInfo?.notes, receiverInfo?.coins),
        count: r.count,
        subtotal: r.denom * r.count,
      })),
    });
  };

  const FIELD_ORDER = ['firstName', 'middleName', 'lastName', 'fullName', 'dateOfBirth'];

  const onError = (errors) => {
    const firstErrorField = FIELD_ORDER.find(f => errors[f]);
    if (!firstErrorField) return;
    try { setFocus(firstErrorField); } catch (_) {}
    const el = document.getElementById(`field-${firstErrorField}`) || document.querySelector(`[name="${firstErrorField}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const FJD = { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-[#B70000] px-6 sm:px-10 py-7">
          <div className="max-w-5xl mx-auto flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <UserPlus size={18} className="text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-white font-semibold text-xl">Dealer Details</h1>
                <p className="text-[#b5f000] text-sm mt-0.5">Dealer Exchange Transaction</p>
              </div>
            </div>

            {toCurrency && effectiveRate && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-lg">
                  <span className="text-[#b5f000] text-xs">Rate</span>
                  <span className="text-white text-sm font-semibold">
                    1 {toCurrency.code} = {FJD.symbol}{effectiveRate} {FJD.code}
                  </span>
                </div>
                <span className="text-xs font-medium bg-white/10 border border-white/20 text-yellow-200 px-2.5 py-1.5 rounded-lg uppercase tracking-wide">
                  {exchangeType === 'BUY' ? '🟢 Buying' : '🔴 Selling'}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="px-4 sm:px-8 lg:px-12 py-8 flex flex-col gap-5 max-w-5xl mx-auto" noValidate>
          
          <DealerPersonalInfoSection />

          <SectionDivider label="Exchange Details" />
          <DealerExchangeSection
            exchangeType={exchangeType}
            availableCurrencies={availableCurrencies}
            ratesLoading={ratesLoading}
            rateError={rateError}
            toCurrency={toCurrency}
            setToCurrency={setToCurrency}
            manualRate={manualRate}
            setManualRate={setManualRate}
            sendAmount={sendAmount}
            setSendAmount={setSendAmount}
            sendAmountError={sendAmountError}
            setSendAmountError={setSendAmountError}
            effectiveRate={effectiveRate}
            exchangePreview={exchangePreview}
            onAmountBlur={runStockCheck}
          />

          <SectionDivider label="Cash Denomination Counts" />
          {denomBalanceError && (
            <div ref={denomErrorRef} className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
              <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-800">Denomination Imbalance</p>
                <p className="text-xs text-[#E00000] mt-0.5">{denomBalanceError}</p>
              </div>
            </div>
          )}
          {stockError && (
            <div ref={stockErrorRef} className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
              <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-800">Out of Stock</p>
                <p className="text-xs text-[#E00000] mt-0.5">{stockError}</p>
              </div>
            </div>
          )}
          <DenominationSection
            senderInfo={senderInfo}
            receiverInfo={receiverInfo}
            exchangeType={exchangeType}
            sendAmount={fjdSendAmount}
            receiverGets={exchangePreview?.rawAmount ?? 0}
            denomLoading={denomLoading}
            denomError={denomLoadError}
            selectedDenomCountry={selectedDenomCountry}
            senderDenomRowsRef={senderDenomRowsRef}
            receiverDenomRowsRef={receiverDenomRowsRef}
            onSenderStatusChange={s => { senderDenomStatusRef.current = s; }}
            onReceiverStatusChange={s => { receiverDenomStatusRef.current = s; }}
          />

          <div className="flex items-center justify-between pt-2 pb-8">
            <button type="button" onClick={onClear}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-red-500 transition-colors px-4 py-2.5 rounded-lg hover:bg-red-50">
              Clear
            </button>

            <button type="submit"
              disabled={stockLoading}
              className="flex items-center gap-2 bg-[#E00000] hover:bg-[#B70000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold h-11 px-8 rounded-xl transition-colors group">
              {stockLoading ? 'Checking stock…' : 'Continue'}
              {!stockLoading && <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
