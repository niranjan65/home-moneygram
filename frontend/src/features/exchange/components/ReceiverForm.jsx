import React, { useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { UserPlus, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useExchange } from '../../../context/ExchangeContext';
import { useUser } from '../../../context/UserContext';
import { useSettings } from '../../../context/SettingsContext';

import { useBaseCurrency, useDenomination } from '../../../hooks/useDenomination';
import { useERPFileUpload } from '../../../hooks/useERPFileUpload';
import { useExchangeCalculation } from '../hooks/useExchangeCalculation';
import { validateStockAvailability } from '../../../hooks/useStockValidation';

import { GovernmentIdSection } from './sections/GovernmentIdSection';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { ExchangeSection } from './sections/ExchangeSection';
import { DenominationSection } from './sections/DenominationSection';
import { SectionDivider } from './ui/FormUtilities';
import CreditLimit from './sections/CreditLimit';

export const ReceiverForm = ({
  initialData,
  sendAmount: externalSendAmount,
  onContinue,
  onClear,
  onSummaryChange,
  ratesData,
}) => {
  const methods = useForm({
    defaultValues: {
      rbfNumber: initialData?.rbfNumber || '',
      rbfDocument: initialData?.rbfDocument || null,
      country: initialData?.country || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      city: initialData?.city || '',
      idType: initialData?.idType || 'PASSPORT',
      idNumber: initialData?.idNumber || '',
      docFile: initialData?.docFile || null,
      travelDate: initialData?.travelDate || '',
      destination: initialData?.destination || '',
      airwaysName: initialData?.airwaysName || '',
      flightNumber: initialData?.flightNumber || '',
      pnrNumber: initialData?.pnrNumber || '',
      pastReceiver: initialData?.pastReceiver || 'New Receiver',
      exchangeType: initialData?.exchangeType || 'BUY',
      government_id: initialData?.government_id || 'Passport',
      idName: initialData?.idName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      idIssueCountry: initialData?.idIssueCountry || '',
      idIssueState: initialData?.idIssueState || '',
      occupation: initialData?.occupation || 'Accountant / Auditor',
      secondLastName: initialData?.secondLastName || '',
    },
  });

  const { handleSubmit, setFocus } = methods;
  const { receiverGets } = useExchange();
  const { uploadFile, loading: uploadLoading } = useERPFileUpload();
  const [isCreditExceeded, setIsCreditExceeded] = useState(false);
  const [stockError, setStockError] = useState('');
  const [stockLoading, setStockLoading] = useState(false);
  const stockErrorRef = useRef(null);

  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();


  const {
    availableCurrencies,
    loading: ratesLoading,
    error: rateError,
    rateDate,
    noDataForToday,
    showUploadModal,
    setShowUploadModal,
  } = ratesData || {};

  const exchangeType = methods.watch('exchangeType');

  const {
    toCurrency,
    setToCurrency,
    manualRate,
    useManualRate,
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
    noDataForToday,
    onSummaryChange,
    exchangeType,
  });

  const { data: baseCurrencyInfo } = useBaseCurrency();
  const selectedDenomCountry = toCurrency?.country ?? null;
  const { data: foreignCurrencyInfo, loading: denomLoading, error: denomLoadError } = useDenomination(selectedDenomCountry);

  const senderInfo = exchangeType === 'BUY' ? baseCurrencyInfo : foreignCurrencyInfo;
  const receiverInfo = exchangeType === 'BUY' ? foreignCurrencyInfo : baseCurrencyInfo;

  // ── Shared stock check (called on blur + on submit) ────────────────────────────
  const runStockCheck = async (si = senderInfo, ri = receiverInfo) => {


    // Stock check only applies when selling (customer brings foreign currency)


    const warehouseName = selectedWarehouse?.warehouse;


    const getSelectedItems = (info, rows) => {
      if (!info || !rows) return [];
      return rows.filter(r => r.count > 0).map(r => {
        const nIdx = info.notes?.indexOf(r.denom) ?? -1;
        if (nIdx !== -1 && info.notes_name?.[nIdx]) return { item_code: info.notes_name[nIdx], requested_qty: r.count };
        const cIdx = info.coins?.indexOf(r.denom) ?? -1;
        if (cIdx !== -1 && info.coins_name?.[cIdx]) return { item_code: info.coins_name[cIdx], requested_qty: r.count };
        return null;
      }).filter(Boolean);
    };

    if (exchangeType === 'BUY') {
      const selectedItems = getSelectedItems(si, senderDenomRowsRef.current);
      if (!warehouseName || selectedItems.length === 0) return true; // nothing to check
      setStockLoading(true);
      try {
        const { outOfStock } = await validateStockAvailability(selectedItems, warehouseName, loginUser);
        if (outOfStock.length > 0) {
          setStockError(
            `Sufficient stock for ${si?.currency} not available at ${warehouseName} for the denominations you've entered. (Check: ${outOfStock.join(', ')}) Please adjust the counts or contact admin.`
          );
          setTimeout(() => stockErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          return false;
        }
        setStockError('');
        return true;
      } catch (err) {
        console.error('[Stock Check]', err);
        setStockError('');
        return true; // non-blocking on API error
      } finally {
        setStockLoading(false);
      }
    } else if (exchangeType === 'SELL') {
      const selectedItems = getSelectedItems(si, senderDenomRowsRef.current);
      if (!warehouseName || selectedItems.length === 0) return true; // nothing to check
      setStockLoading(true);
      try {
        const { outOfStock } = await validateStockAvailability(selectedItems, warehouseName, loginUser);
        if (outOfStock.length > 0) {
          setStockError(
            `Sufficient stock for ${si?.currency} not available at ${warehouseName} for the denominations you've entered. (Check: ${outOfStock.join(', ')}) Please adjust the counts or contact admin.`
          );
          setTimeout(() => stockErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
          return false;
        }
        setStockError('');
        return true;
      } catch (err) {
        console.error('[Stock Check]', err);
        setStockError('');
        return true; // non-blocking on API error
      } finally {
        setStockLoading(false);
      }
    }



  };

  // Clear stock error when currency changes — old error no longer applies
  React.useEffect(() => { setStockError(''); }, [toCurrency?.code]);

  const senderDenomRowsRef = useRef([]);
  const receiverDenomRowsRef = useRef([]);
  // { total, target } for each panel — updated on every row change
  const senderDenomStatusRef = useRef({ total: 0, target: 0 });
  const receiverDenomStatusRef = useRef({ total: 0, target: 0 });
  const [denomBalanceError, setDenomBalanceError] = useState('');
  const denomErrorRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return null;

    const d = new Date(date); // ✅ convert
    if (isNaN(d)) return null; // safety check

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
      setSendAmountError('Please select a currency and rate before continuing.');
      return;
    }
    if (useManualRate && (!manualRate || parseFloat(manualRate) <= 0)) return;
    setSendAmountError('');

    // ── Denomination balance check ──────────────────────────────────────────
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

    // ── Stock availability check ─────────────────────────────────────────────
    const ok = await runStockCheck();
    if (!ok) return;

    const getDenomType = (denom, notesArr = [], coinsArr = []) => {
      if (notesArr.includes(denom)) return 'Note';
      if (coinsArr.includes(denom)) return 'Coin';
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
      rateSource: useManualRate ? 'manual' : 'erpnext',
      rateDate: useManualRate ? null : rateDate,
      travelDate: data.travelDate,
      destination: data.destination,
      airwaysName: data.airwaysName,
      flightNumber: data.flightNumber,
      pnrNumber: data.pnrNumber,
      rbfNumber: data.rbfNumber || null,
      rbfDocument: data.rbfDocument || null,
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

  // Ordered list of fields: text-focusable ones use setFocus, file ones use element id scroll
  const FIELD_ORDER = [
    'idName', 'dateOfBirth', 'government_id', 'idNumber',
    'idIssueCountry', 'idIssueState', 'docFile', 'travelDate', 'destination', 'airwaysName', 'flightNumber', 'pnrNumber',
    'rbfNumber', 'rbfDocument',
    'firstName', 'lastName', 'city', 'country', 'exchangeType',
  ];
  const FILE_FIELDS = new Set(['docFile', 'rbfDocument']);


  const onError = (errors) => {
    const firstErrorField = FIELD_ORDER.find(f => errors[f]);
    if (!firstErrorField) return;
    if (FILE_FIELDS.has(firstErrorField)) {
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      try { setFocus(firstErrorField); } catch (_) { }
      const el = document.getElementById(`field-${firstErrorField}`) ||
        document.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const FJD = { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50">
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-7 max-w-sm w-full mx-4 text-center">
              <div className="text-4xl mb-4">📂</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Exchange Rates Found</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Please contact admin to update the rates.
              </p>
              <button type="button" onClick={() => setShowUploadModal(false)}
                className="w-full bg-[#E00000] hover:bg-[#B70000] text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                OK, Got it
              </button>
            </div>
          </div>
        )}



        <div className="bg-[#B70000] px-6 sm:px-10 py-7">
          <div className="max-w-5xl mx-auto flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <UserPlus size={18} className="text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-white font-semibold text-xl">Customer Details</h1>
                <p className="text-[#b5f000] text-sm mt-0.5">Currency Exchange Transaction</p>
              </div>
            </div>

            {toCurrency && effectiveRate && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-2 rounded-lg">
                  <span className="text-[#b5f000] text-xs">Live Rate</span>
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
          {!ratesLoading && availableCurrencies?.length === 0 && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/20 bg-[#E00000]/5">
              <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-red-800">Exchange Rates Unavailable</p>
                <p className="text-xs text-[#E00000] mt-0.5">
                  No rates found for today. Please contact admin to update the rates.
                </p>
              </div>
            </div>
          )}
          {/* 
          {effectiveRate > 0 && !ratesLoading && !noDataForToday && rateDate && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3.5 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-sm">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              Today's exchange rate is available (Date: {rateDate}).
            </div>
          )} */}

          {/* <CreditLimit sendAmount={sendAmount} onLimitCheck={setIsCreditExceeded} /> */}
          <GovernmentIdSection exchangeType={exchangeType} isCreditExceeded={isCreditExceeded} />

          <SectionDivider label="Personal Information" />
          <PersonalInfoSection />

          <SectionDivider label="Exchange Details" />
          <ExchangeSection
            exchangeType={exchangeType}
            availableCurrencies={availableCurrencies}
            ratesLoading={ratesLoading}
            rateError={rateError}
            toCurrency={toCurrency}
            setToCurrency={setToCurrency}
            useManualRate={useManualRate}
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
              disabled={ratesLoading || uploadLoading || stockLoading || (!ratesLoading && availableCurrencies?.length === 0)}
              className="flex items-center gap-2 bg-[#E00000] hover:bg-[#B70000] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold h-11 px-8 rounded-xl transition-colors group">
              {stockLoading ? 'Checking stock…' : uploadLoading ? 'Uploading...' : 'Continue'}
              {!uploadLoading && !stockLoading && <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
};
