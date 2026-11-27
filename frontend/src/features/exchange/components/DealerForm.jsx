import React, { useRef, useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { User, UserPlus, ArrowRight, AlertCircle, ArrowLeftRight, Banknote, CheckCircle2 } from 'lucide-react';
import { useExchange } from '../../../context/ExchangeContext';
import { useUser } from '../../../context/UserContext';
import { useSettings } from '../../../context/SettingsContext';
import { useBaseCurrency, useDenomination } from '../../../hooks/useDenomination';
import { useExchangeCalculation } from '../hooks/useExchangeCalculation';
import { validateStockAvailability, validateWarehouseCashAccount } from '../../../hooks/useStockValidation';

import { DealerPersonalInfoSection } from './sections/DealerPersonalInfoSection';
import { DealerExchangeSection } from './sections/DealerExchangeSection';
import { DenominationSection } from './sections/DenominationSection';
import DocumentUploadTable from '../../../components/DocumentUploadTable';

export const DealerForm = ({
  initialData,
  sendAmount: externalSendAmount,
  onContinue,
  onClear,
  onSummaryChange,
  ratesData,
  onProgressChange,
}) => {
  const methods = useForm({
    defaultValues: {
      customer_id: initialData?.customer_id || '',
      firstName: initialData?.firstName || '',
      middleName: initialData?.middleName || '',
      lastName: initialData?.lastName || '',
      fullName: initialData?.fullName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      exchangeType: initialData?.exchangeType || 'BUY',
      docFile: initialData?.docFile || null,
      documents: initialData?.documents || [],
    },
  });

  const { handleSubmit, setFocus, watch } = methods;
  const exchangeType = watch('exchangeType');

  useEffect(() => {
    if (initialData?.exchangeType && initialData.exchangeType !== methods.getValues('exchangeType')) {
      methods.setValue('exchangeType', initialData.exchangeType, { shouldValidate: true });
    }
  }, [initialData?.exchangeType, methods]);

  const [documentRows, setDocumentRows] = useState(() => {
    if (initialData?.documents && Array.isArray(initialData.documents)) {
      return initialData.documents;
    }
    if (initialData?.docFile) {
      return [
        {
          document_type: 'Passport',
          issue_date: initialData.id_issue_date || '',
          expiry_date: initialData.id_expiry_date || '',
          attachment: initialData.docFile,
          file_name: typeof initialData.docFile === 'string' ? initialData.docFile.split('/').pop() : initialData.docFile?.name || '',
          notes: '',
        },
      ];
    }
    return [];
  });

  const changeDocuments = (rows) => {
    setDocumentRows(rows);
    methods.setValue('documents', rows, { shouldDirty: true });
    const firstWithFile = rows.find(r => r.attachment);
    methods.setValue('docFile', firstWithFile?.attachment || null, { shouldValidate: true, shouldDirty: true });
    if (firstWithFile) {
      if (firstWithFile.issue_date) methods.setValue('id_issue_date', firstWithFile.issue_date, { shouldDirty: true });
      if (firstWithFile.expiry_date) methods.setValue('id_expiry_date', firstWithFile.expiry_date, { shouldDirty: true });
      if (firstWithFile.document_number) methods.setValue('idNumber', firstWithFile.document_number, { shouldDirty: true });
    }
    methods.clearErrors('documents');
  };

  const watchedDocFile = watch('docFile');
  useEffect(() => {
    if (watchedDocFile && !documentRows.some(r => r.attachment === watchedDocFile)) {
      setDocumentRows(prev => {
        if (prev.length > 0 && !prev[0].attachment) {
          return prev.map((r, i) => i === 0 ? {
            ...r,
            attachment: watchedDocFile,
            file_name: typeof watchedDocFile === 'string' ? watchedDocFile.split('/').pop() : watchedDocFile?.name || 'Document'
          } : r);
        }
        if (prev.some(r => r.attachment === watchedDocFile)) return prev;
        return [
          ...prev,
          {
            document_type: 'Passport',
            issue_date: '',
            expiry_date: '',
            attachment: watchedDocFile,
            file_name: typeof watchedDocFile === 'string' ? watchedDocFile.split('/').pop() : watchedDocFile?.name || 'Document',
            notes: '',
          }
        ];
      });
    }
  }, [watchedDocFile]);

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
    externalSendAmount: initialData?.sendAmount || externalSendAmount,
    noDataForToday: false, // For Dealer, we always use manual
    onSummaryChange,
    exchangeType,
    initialCurrencyCode: initialData?.foreignCurrency || initialData?.currency || '',
    initialManualRate: initialData?.exchangeRate || initialData?.manualRate || '',
    initialUseManualRate: true,
  });

  // Force manual rate usage for Dealer Form
  useEffect(() => {
    setUseManualRate(true);
  }, [setUseManualRate]);

  const { data: baseCurrencyInfo } = useBaseCurrency();
  const selectedDenomCountry = toCurrency?.country ?? null;
  const { data: foreignCurrencyInfo, loading: denomLoading, error: denomLoadError } = useDenomination(selectedDenomCountry);

  // In BUY FOREX: Currency In = Forex, Currency Out = FJD
  // In SELL FOREX: Currency In = FJD, Currency Out = Forex
  const senderInfo = exchangeType === 'BUY' ? foreignCurrencyInfo : baseCurrencyInfo;
  const receiverInfo = exchangeType === 'BUY' ? baseCurrencyInfo : foreignCurrencyInfo;

  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();
  const [stockError, setStockError] = useState('');
  const [stockLoading, setStockLoading] = useState(false);
  const [cashAccountError, setCashAccountError] = useState('');
  const stockErrorRef = useRef(null);

  // Clear errors when currency or warehouse changes
  useEffect(() => {
    setStockError('');
    setCashAccountError('');
  }, [toCurrency?.code, selectedWarehouse?.warehouse]);

  const runStockCheck = async (si = senderInfo, ri = receiverInfo) => {
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

    // Stock check validates the currency being disbursed to the customer (receiverInfo)
    const selectedItems = getSelectedItems(ri, receiverDenomRowsRef.current);
    if (!warehouseName || selectedItems.length === 0) return true; // nothing to check
    setStockLoading(true);
    try {
      const { outOfStock } = await validateStockAvailability(selectedItems, warehouseName, loginUser);
      if (outOfStock.length > 0) {
        setStockError(
          `Sufficient stock for ${ri?.currency} not available at ${warehouseName} for the denominations you've entered. (Check: ${outOfStock.join(', ')}) Please adjust the counts or contact admin.`
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
  };

  const senderDenomRowsRef = useRef([]);
  const receiverDenomRowsRef = useRef([]);
  const senderDenomStatusRef = useRef({ total: 0, target: 0 });
  const receiverDenomStatusRef = useRef({ total: 0, target: 0 });

  const [senderAvailability, setSenderAvailability] = useState({});
  const [receiverAvailability, setReceiverAvailability] = useState({});

  useEffect(() => {
    const warehouseName = selectedWarehouse?.warehouse;
    if (!warehouseName) {
      setSenderAvailability({});
      setReceiverAvailability({});
      return;
    }

    const senderItems = [
      ...(senderInfo?.notes_name || []).map(code => ({ item_code: code, requested_qty: 0 })),
      ...(senderInfo?.coins_name || []).map(code => ({ item_code: code, requested_qty: 0 })),
    ].filter(i => Boolean(i.item_code));

    const receiverItems = [
      ...(receiverInfo?.notes_name || []).map(code => ({ item_code: code, requested_qty: 0 })),
      ...(receiverInfo?.coins_name || []).map(code => ({ item_code: code, requested_qty: 0 })),
    ].filter(i => Boolean(i.item_code));

    const allItems = [...senderItems, ...receiverItems];
    if (allItems.length === 0) {
      setSenderAvailability({});
      setReceiverAvailability({});
      return;
    }

    let active = true;
    validateStockAvailability(allItems, warehouseName, loginUser)
      .then(res => {
        if (!active || !res?.qtyMap) return;

        if (senderInfo) {
          const sAvail = {};
          (senderInfo.notes || []).forEach((denom, i) => {
            const code = senderInfo.notes_name?.[i];
            if (code) {
              sAvail[String(Number(denom))] = Math.max(0, Number(res.qtyMap[code] ?? 0));
            }
          });
          (senderInfo.coins || []).forEach((denom, i) => {
            const code = senderInfo.coins_name?.[i];
            if (code) {
              sAvail[String(Number(denom))] = Math.max(0, Number(res.qtyMap[code] ?? 0));
            }
          });
          // console.log("sAvail", sAvail)
          // console.log("senderInfo", senderInfo)
          setSenderAvailability(sAvail);
        } else {
          setSenderAvailability({});
        }

        if (receiverInfo) {
          const rAvail = {};
          (receiverInfo.notes || []).forEach((denom, i) => {
            const code = receiverInfo.notes_name?.[i];
            if (code) {
              rAvail[String(Number(denom))] = Math.max(0, Number(res.qtyMap[code] ?? 0));
            }
          });
          (receiverInfo.coins || []).forEach((denom, i) => {
            const code = receiverInfo.coins_name?.[i];
            if (code) {
              rAvail[String(Number(denom))] = Math.max(0, Number(res.qtyMap[code] ?? 0));
            }
          });
          setReceiverAvailability(rAvail);
        } else {
          setReceiverAvailability({});
        }
      })
      .catch(err => {
        console.error('[DealerForm Stock Availability Fetch Error]', err);
      });

    return () => { active = false; };
  }, [senderInfo, receiverInfo, selectedWarehouse?.warehouse, loginUser]);

  const [denomBalanceError, setDenomBalanceError] = useState('');
  const denomErrorRef = useRef(null);

  const [currentDealer, setCurrentDealer] = useState(() => {
    if (initialData?.selectedDealer) return initialData.selectedDealer;
    if (initialData?.customer_id || initialData?.fullName) {
      return {
        name: initialData.customer_id,
        custom_customer_id: initialData.customer_id,
        customer_id: initialData.customer_id,
        custom_full_name: initialData.fullName || initialData.full_name,
        customer_name: initialData.fullName || initialData.full_name,
        custom_first_name: initialData.firstName,
        custom_middle_name: initialData.middleName,
        custom_last_name: initialData.lastName,
        custom_date_of_birth: initialData.dateOfBirth,
        custom_government_document: initialData.docFile,
        image: initialData.docFile,
      };
    }
    return null;
  });

  const handleResetAllFields = React.useCallback(() => {
    setCurrentDealer(null);
    // Do not clear the amount section when resetting dealer fields

    // 2. Reset denomination counts & status
    if (senderDenomRowsRef.current) senderDenomRowsRef.current = [];
    if (receiverDenomRowsRef.current) receiverDenomRowsRef.current = [];
    senderDenomStatusRef.current = { total: 0, target: 0 };
    receiverDenomStatusRef.current = { total: 0, target: 0 };
    setDenomBalanceError('');

    // 3. Reset error messages
    setStockError('');
    setCashAccountError('');

    // 4. Reset document rows
    setDocumentRows([]);

    // 5. Reset form fields (preserving exchangeType)
    methods.reset({
      customer_id: '',
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: '',
      dateOfBirth: '',
      exchangeType: methods.getValues('exchangeType') || 'BUY',
      docFile: null,
      documents: [],
      oet_code: '18',
      idNumber: '',
      id_issue_date: null,
      id_expiry_date: null,
    });
    methods.clearErrors();
  }, [methods]);

  const watchedValues = watch();

  const requiredFieldsInfo = React.useMemo(() => {
    const hasDoc = Boolean(
      (documentRows && documentRows.some(r => r.document_type?.trim() && (r.attachment instanceof File || (typeof r.attachment === 'string' && r.attachment.trim())))) ||
      (watchedValues.docFile instanceof File || (typeof watchedValues.docFile === 'string' && watchedValues.docFile.trim()))
    );

    const fields = [
      { fieldname: 'fullName', label: 'Dealer Full Name', isFilled: Boolean(watchedValues.fullName?.trim?.()) },
      { fieldname: 'firstName', label: 'First Name', isFilled: Boolean(watchedValues.firstName?.trim?.()) },
      { fieldname: 'lastName', label: 'Last Name', isFilled: Boolean(watchedValues.lastName?.trim?.()) },
      { fieldname: 'dateOfBirth', label: 'Date of Birth', isFilled: Boolean(watchedValues.dateOfBirth) },
      { fieldname: 'oet_code', label: 'OET Code', isFilled: Boolean(watchedValues.oet_code?.trim?.()) },
      { fieldname: 'documents', label: 'Identity Document', isFilled: hasDoc },
      { fieldname: 'toCurrency', label: 'Currency', isFilled: Boolean(toCurrency?.code) },
      { fieldname: 'manualRate', label: 'Agreed Rate', isFilled: Boolean(manualRate && Number(manualRate) > 0) },
      { fieldname: 'sendAmount', label: 'Forex Amount', isFilled: Boolean(sendAmount && Number(sendAmount) > 0) },
    ];

    const totalCount = fields.length;
    const completedCount = fields.filter(f => f.isFilled).length;
    const missingFields = fields.filter(f => !f.isFilled);
    const isAllComplete = completedCount === totalCount;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      fields,
      totalCount,
      completedCount,
      missingFields,
      isAllComplete,
      percent,
    };
  }, [watchedValues, toCurrency, manualRate, sendAmount, documentRows]);

  const scrollToErrorField = (fieldname) => {
    let el = null;
    if (fieldname === 'fullName') el = document.getElementById('field-fullName');
    else if (fieldname === 'firstName') el = document.getElementById('field-firstName');
    else if (fieldname === 'middleName') el = document.getElementById('field-middleName');
    else if (fieldname === 'lastName') el = document.getElementById('field-lastName');
    else if (fieldname === 'dateOfBirth') el = document.getElementById('field-dateOfBirth');
    else if (fieldname === 'oet_code') el = document.getElementById('field-oetCode');
    else if (fieldname === 'customer_id') el = document.getElementById('field-customerId');
    else if (fieldname === 'documents' || fieldname === 'docFile') el = document.getElementById('dealer-documents') || document.getElementById('field-docFile');
    else if (fieldname === 'toCurrency') el = document.getElementById('field-toCurrency');
    else if (fieldname === 'manualRate') el = document.getElementById('field-manualRate');
    else if (fieldname === 'sendAmount') el = document.getElementById('field-sendAmount');

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, select');
      if (input) input.focus();
    }
  };

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
    const hasDoc = Boolean(
      (documentRows && documentRows.some(r => r.document_type?.trim() && (r.attachment instanceof File || (typeof r.attachment === 'string' && r.attachment.trim())))) ||
      (data.docFile instanceof File || (typeof data.docFile === 'string' && data.docFile.trim()))
    );
    if (!hasDoc) {
      methods.setError('documents', { type: 'manual', message: 'An identity document is required to proceed with this exchange transaction.' });
      document.getElementById('dealer-documents')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

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

    // ── Warehouse Cash Account check ───────────────────────────────
    const warehouseName = selectedWarehouse?.warehouse;
    setStockLoading(true);
    try {
      const cashCheck = await validateWarehouseCashAccount(warehouseName);
      if (!cashCheck.ok) {
        setCashAccountError(cashCheck.error);
        setTimeout(() => stockErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
        return;
      }
      setCashAccountError('');
    } finally {
      setStockLoading(false);
    }

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
      documents: documentRows,
      docFile: documentRows.find(r => r.attachment)?.attachment || data.docFile || null,
      id_issue_date: documentRows[0]?.issue_date || null,
      id_expiry_date: documentRows[0]?.expiry_date || null,
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
      selectedDealer: currentDealer,
      manualRate: effectiveRate,
      rawSenderDenomRows: senderDenomRowsRef.current,
      rawReceiverDenomRows: receiverDenomRowsRef.current,
    });
  };

  const FIELD_ORDER = ['fullName', 'firstName', 'middleName', 'lastName', 'dateOfBirth', 'oet_code', 'docFile'];
  const FILE_FIELDS = new Set(['docFile']);

  const onError = (errors) => {
    const firstErrorField = FIELD_ORDER.find(f => errors[f]);
    if (!firstErrorField) return;
    if (FILE_FIELDS.has(firstErrorField)) {
      const el = document.getElementById(`field-${firstErrorField}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      try { setFocus(firstErrorField); } catch (_) { }
      const el = document.getElementById(`field-${firstErrorField}`) || document.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const updateProgress = React.useCallback(() => {
    if (!onProgressChange) return;
    const hasDoc = Boolean(
      (documentRows && documentRows.some(r => r.document_type?.trim() && (r.attachment instanceof File || (typeof r.attachment === 'string' && r.attachment.trim())))) ||
      (methods.getValues('docFile') instanceof File || (typeof methods.getValues('docFile') === 'string' && methods.getValues('docFile')?.trim()))
    );
    const v = methods.getValues();
    const amountDone = Boolean(toCurrency?.code && manualRate && Number(manualRate) > 0 && sendAmount && Number(sendAmount) > 0);
    const dealerVerified = Boolean(v.fullName?.trim() && v.firstName?.trim() && v.lastName?.trim() && v.dateOfBirth && v.oet_code?.trim());
    const docsDone = hasDoc;
    const senderTotal = senderDenomStatusRef.current?.total || 0;
    const senderTarget = senderDenomStatusRef.current?.target || 0;
    const receiverTotal = receiverDenomStatusRef.current?.total || 0;
    const receiverTarget = receiverDenomStatusRef.current?.target || 0;
    const cashDone = senderTotal > 0 && Math.abs(senderTotal - senderTarget) < 0.01 && receiverTotal > 0 && Math.abs(receiverTotal - receiverTarget) < 0.01;

    const completedCount = (amountDone ? 1 : 0) + (dealerVerified ? 1 : 0) + (docsDone ? 1 : 0) + (cashDone ? 1 : 0);
    onProgressChange({
      completedCount,
      totalCount: 4,
      amountDone,
      dealerVerified,
      docsDone,
      cashDone,
    });
  }, [onProgressChange, documentRows, methods, toCurrency?.code, manualRate, sendAmount]);

  React.useEffect(() => {
    updateProgress();
  }, [updateProgress, watchedValues, documentRows, toCurrency, manualRate, sendAmount]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onError)} autoComplete="off" className="flex flex-col gap-6 w-full min-w-0" noValidate>

        {/* Unified Form Card matching /exchange-new */}
        <div className="card" style={{ overflow: "hidden" }}>

          {/* SECTION 1: EXCHANGE DETAILS */}
          <div className="sec" id="section-exchange-details">
            <h2 className="h"><span className="n">1</span>Exchange details</h2>
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
          </div>

          {/* SECTION 2: DEALER INFORMATION & IDENTIFICATION */}
          <div className="sec" id="section-customer-info">
            <h2 className="h"><span className="n">2</span>Dealer information</h2>

            {/* Sub-Section: Dealer Details */}
            <DealerPersonalInfoSection
              hideCardWrapper={true}
              hideDocFile={true}
              onResetAllFields={handleResetAllFields}
              onDealerChange={setCurrentDealer}
              selectedDealer={currentDealer}
            />

            {/* Divider */}
            <div className="my-6 border-t border-gray-100" />

            {/* Sub-Section: Identification Documents Table */}
            <div id="dealer-documents">
              <DocumentUploadTable
                rows={documentRows}
                onChange={changeDocuments}
                disabled={stockLoading}
                title="Identification Documents"
                subtitle="Passport, government ID & supporting identity documents"
              />
              {methods.formState.errors.documents && (
                <p role="alert" className="mt-2 text-sm text-[#E00000]">{methods.formState.errors.documents.message}</p>
              )}
              {methods.formState.errors.docFile && !documentRows.some(r => r.attachment) && (
                <p role="alert" className="mt-2 text-sm text-[#E00000]">{methods.formState.errors.docFile.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 3: CASH DENOMINATION COUNTS */}
          <div className="sec" id="section-cash-denominations">
            <h2 className="h"><span className="n">3</span>Cash count</h2>
            {denomBalanceError && (
              <div ref={denomErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-800">Denomination Imbalance</p>
                  <p className="text-xs text-[#E00000] mt-0.5">{denomBalanceError}</p>
                </div>
              </div>
            )}
            {stockError && (
              <div ref={stockErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-800">Out of Stock</p>
                  <p className="text-xs text-[#E00000] mt-0.5">{stockError}</p>
                </div>
              </div>
            )}
            {cashAccountError && (
              <div ref={stockErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-red-800">Warehouse Cash Account Not Mapped</p>
                  <p className="text-xs text-[#E00000] mt-0.5">{cashAccountError}</p>
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
              initialSenderRows={initialData?.rawSenderDenomRows || initialData?.senderDenominationRows}
              initialReceiverRows={initialData?.rawReceiverDenomRows || initialData?.receiverDenominationRows}
              onSenderStatusChange={s => {
                senderDenomStatusRef.current = s;
                updateProgress();
              }}
              onReceiverStatusChange={s => {
                receiverDenomStatusRef.current = s;
                updateProgress();
              }}
              senderAvailabilityByDenomination={senderAvailability}
              receiverAvailabilityByDenomination={receiverAvailability}
            />
          </div>

          {/* CARD FOOTER ACTIONS BAR (matching /exchange-new) */}
          <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface-alt)", borderTop: "1px solid var(--color-line)", flexWrap: "wrap", gap: "12px", marginTop: "20px" }}>
            <button
              type="button"
              onClick={onClear}
              className="btn ghost"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={stockLoading || !requiredFieldsInfo.isAllComplete}
              className="btn"
              style={{ padding: "0 40px" }}
            >
              {stockLoading
                ? 'Checking stock…'
                : !requiredFieldsInfo.isAllComplete
                  ? `Continue (${requiredFieldsInfo.completedCount}/${requiredFieldsInfo.totalCount})`
                  : `Continue to review · FJD ${Number(exchangeType === 'BUY' ? fjdSendAmount || 0 : exchangePreview?.rawAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
            </button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};
