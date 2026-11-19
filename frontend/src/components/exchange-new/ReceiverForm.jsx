import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DocumentUploadTable from './DocumentUploadTable';
import { useForm, FormProvider } from 'react-hook-form';
import { UserPlus, ArrowRight, AlertCircle, CheckCircle2, User, ArrowLeftRight, Banknote, ShieldCheck, FileText, ShieldAlert, MessageSquare, ChevronDown } from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { useUser } from '../../context/UserContext';
import { useSettings } from '../../context/SettingsContext';

import { useBaseCurrency, useDenomination } from '../../hooks/useDenomination';
import { useERPFileUpload } from '../../hooks/useERPFileUpload';
import { useExchangeCalculation } from '../../features/exchange/hooks/useExchangeCalculation';
import { validateStockAvailability, validateWarehouseCashAccount } from '../../hooks/useStockValidation';
import { useAppConfiguration } from '../../hooks/useAppConfiguration';

import { GovernmentIdSection } from './GovernmentIdSection';
import { PersonalInfoSection } from './PersonalInfoSection';
import { ExchangeSection } from './ExchangeSection';
import { DenominationSection } from './DenominationSection';
import { SectionCard, getIdExpiryStatus, FieldLabel, ErrorMsg, fieldCls, selectCls } from './FormUtilities';
import { RbfComplianceSection } from './RbfComplianceSection';
import { fetchCustomerLastTransaction, extractExchangePrefill } from '../../features/exchange/api/lastTransaction';

export const ReceiverForm = ({
  initialData,
  sendAmount: externalSendAmount,
  onContinue,
  onClear,
  onSummaryChange,
  ratesData,
  onCustomerChange,
  onProgressChange,
}) => {
  const methods = useForm({
    defaultValues: {
      documents: initialData?.documents,
      country: initialData?.country || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      customer_id: initialData?.customer_id || '',
      email: initialData?.email || '',
      city: initialData?.city || '',
      idType: initialData?.idType || 'PASSPORT',
      idNumber: initialData?.idNumber || '',
      docFile: initialData?.docFile || null,
      travelDate: initialData?.travelDate || '',
      destination: initialData?.destination || '',
      airwaysName: initialData?.airwaysName || '',
      flightNumber: initialData?.flightNumber || '',
      pnrNumber: initialData?.pnrNumber || '',
      ticket: initialData?.ticket || null,
      phone_number: initialData?.phone_number || initialData?.phoneNumber || '',
      pastReceiver: initialData?.pastReceiver || 'New Receiver',
      exchangeType: initialData?.exchangeType || 'BUY',
      government_id: initialData?.government_id || '',
      idName: initialData?.idName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      idIssueCountry: initialData?.idIssueCountry || '',
      idIssueState: initialData?.idIssueState || '',
      occupation: initialData?.occupation || '',
      secondLastName: initialData?.secondLastName || '',
      tinNumber: initialData?.tinNumber || '',
      oet_code: initialData?.oet_code || '18',
      risk_level: initialData?.risk_level || '',
      purposeOfTransaction: initialData?.purposeOfTransaction || '',
      remarks: initialData?.remarks || '',
      id_issue_date: initialData?.id_issue_date || null,
      id_expiry_date: initialData?.id_expiry_date || null,
      rbf_purpose: initialData?.rbf_purpose || '',
      rbf_documents: initialData?.rbf_documents || [],
      nationality: initialData?.nationality || '',
      residency_status: initialData?.residency_status || '',
      source_of_funds: initialData?.source_of_funds || '',
      passport_endorsed: initialData?.passport_endorsed || false,
      tf_form_reference: initialData?.tf_form_reference || '',
    },
  });

  const { handleSubmit, setFocus } = methods;
  const { receiverGets } = useExchange();
  const { uploadFile, loading: uploadLoading } = useERPFileUpload();
  const [stockError, setStockError] = useState('');
  const [stockLoading, setStockLoading] = useState(false);
  const [cashAccountError, setCashAccountError] = useState('');
  const stockErrorRef = useRef(null);

  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();
  const { potOptions, loading: potLoading, error: potError } = useAppConfiguration();


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

  useEffect(() => {
    if (initialData?.exchangeType && initialData.exchangeType !== methods.getValues('exchangeType')) {
      methods.setValue('exchangeType', initialData.exchangeType, { shouldValidate: true, shouldDirty: true });
    }
  }, [initialData?.exchangeType, methods]);
  const tableDocuments = methods.watch('documents');
  const selectedId = methods.watch('government_id');
  const idDocument = methods.watch('docFile');
  const ticketDocument = methods.watch('ticket');
  const documentRows = Array.isArray(tableDocuments) ? tableDocuments : [
    ...(idDocument ? [{ document_type: selectedId || 'Government ID', issue_date: methods.watch('id_issue_date') || '', expiry_date: methods.watch('id_expiry_date') || '', attachment: idDocument, notes: '' }] : []),
    ...(ticketDocument ? [{ document_type: 'Ticket', issue_date: '', expiry_date: '', attachment: ticketDocument, notes: '' }] : []),
  ];
  const changeDocuments = rows => {
    const nextRows = Array.isArray(rows) ? rows : [];
    methods.setValue('documents', nextRows, { shouldDirty: true });
    for (const [field, type] of [
      ['docFile', selectedId || 'Government ID'],
      ['ticket', 'Ticket'],
    ]) {
      methods.setValue(field, (nextRows.find(row => row.document_type === type)?.attachment || (field === 'docFile' ? nextRows.find(row => row.attachment)?.attachment : null)) || null, { shouldValidate: true, shouldDirty: true });
    }
    const primaryIdDoc = nextRows.find(r => r.document_type === selectedId) || nextRows[0];
    if (primaryIdDoc) {
      if (primaryIdDoc.issue_date) methods.setValue('id_issue_date', primaryIdDoc.issue_date, { shouldDirty: true });
      if (primaryIdDoc.expiry_date) methods.setValue('id_expiry_date', primaryIdDoc.expiry_date, { shouldDirty: true });
      if (primaryIdDoc.document_type) methods.setValue('government_id', primaryIdDoc.document_type, { shouldDirty: true });
      if (primaryIdDoc.document_number) methods.setValue('idNumber', primaryIdDoc.document_number, { shouldDirty: true });
    } else {
      methods.setValue('docFile', null, { shouldValidate: true, shouldDirty: true });
      methods.setValue('ticket', null, { shouldValidate: true, shouldDirty: true });
      methods.setValue('id_issue_date', '', { shouldDirty: true });
      methods.setValue('id_expiry_date', '', { shouldDirty: true });
      methods.setValue('idNumber', '', { shouldDirty: true });
      methods.setValue('id_number', '', { shouldDirty: true });
    }
    methods.clearErrors('documents');
  };


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
    initialCurrencyCode: initialData?.foreignCurrency || initialData?.currency || '',
    initialManualRate: initialData?.manualRate ?? '',
    initialUseManualRate: initialData?.useManualRate ?? false,
  });

  const { data: baseCurrencyInfo } = useBaseCurrency();
  const selectedDenomCountry = toCurrency?.country ?? null;
  const { data: foreignCurrencyInfo, loading: denomLoading, error: denomLoadError } = useDenomination(selectedDenomCountry);

  const senderInfo = exchangeType === 'BUY' ? baseCurrencyInfo : foreignCurrencyInfo;
  const receiverInfo = exchangeType === 'BUY' ? foreignCurrencyInfo : baseCurrencyInfo;
  const rbfFjdAmount = exchangeType === 'BUY'
    ? Number(sendAmount || 0)
    : Number(exchangePreview?.rawAmount || 0);

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
  React.useEffect(() => { 
    setStockError(''); 
    setCashAccountError('');
  }, [toCurrency?.code, selectedWarehouse?.warehouse]);

  const senderDenomRowsRef = useRef([]);
  const receiverDenomRowsRef = useRef([]);
  // { total, target } for each panel — updated on every row change
  const senderDenomStatusRef = useRef({ total: 0, target: 0 });
  const receiverDenomStatusRef = useRef({ total: 0, target: 0 });
  const [denomBalanceError, setDenomBalanceError] = useState('');
  const denomErrorRef = useRef(null);
  const [complianceAssessment, setComplianceAssessment] = useState(null);
  const missingComplianceDocs = complianceAssessment?.missing_documents || [];
  const hasMissingComplianceDocs = missingComplianceDocs.length > 0;

  const [currentCustomer, setCurrentCustomer] = useState(() => {
    if (initialData?.selectedCustomer) return initialData.selectedCustomer;
    if (initialData?.customer_id || initialData?.idName || initialData?.firstName) {
      const fullName = initialData.idName || [initialData.firstName, initialData.lastName].filter(Boolean).join(' ');
      return {
        name: initialData.customer_id,
        customer_id: initialData.customer_id,
        custom_customer_id: initialData.customer_id,
        customer_name: fullName,
        custom_full_name: fullName,
        phone_number: initialData.phone_number || initialData.phoneNumber,
        mobile_no: initialData.phone_number || initialData.phoneNumber,
      };
    }
    return null;
  });

  const focusAmountField = React.useCallback(() => {
    setTimeout(() => {
      const input = document.getElementById('input-sendAmount') || document.querySelector('#field-sendAmount input');
      input?.focus();
    }, 50);
  }, []);

  const handleResetAllFields = React.useCallback(() => {
    setCurrentCustomer(null);
    focusAmountField();
    // 1. Reset calculation / amounts
    setSendAmount('');
    setSendAmountError('');
    if (useManualRate) setManualRate('');

    // 2. Reset denomination counts & status
    if (senderDenomRowsRef.current) senderDenomRowsRef.current = [];
    if (receiverDenomRowsRef.current) receiverDenomRowsRef.current = [];
    senderDenomStatusRef.current = { total: 0, target: 0 };
    receiverDenomStatusRef.current = { total: 0, target: 0 };
    setDenomBalanceError('');

    // 3. Reset error messages
    setStockError('');
    setCashAccountError('');
    setComplianceAssessment(null);

    // 4. Reset form fields (preserving exchangeType)
    methods.reset({
      documents: [],
      country: '',
      firstName: '',
      lastName: '',
      customer_id: '',
      email: '',
      city: '',
      idType: 'PASSPORT',
      idNumber: '',
      docFile: null,
      travelDate: '',
      destination: '',
      airwaysName: '',
      flightNumber: '',
      pnrNumber: '',
      ticket: null,
      phone_number: '',
      pastReceiver: 'New Receiver',
      exchangeType: methods.getValues('exchangeType') || 'BUY',
      government_id: '',
      idName: '',
      dateOfBirth: '',
      idIssueCountry: '',
      idIssueState: '',
      occupation: '',
      secondLastName: '',
      tinNumber: '',
      oet_code: '18',
      risk_level: '',
      purposeOfTransaction: '',
      remarks: '',
      id_issue_date: null,
      id_expiry_date: null,
      rbf_purpose: '',
      rbf_documents: [],
      nationality: '',
      residency_status: '',
      source_of_funds: '',
      passport_endorsed: false,
      tf_form_reference: '',
    });
    methods.clearErrors();
  }, [methods, setSendAmount, setSendAmountError, useManualRate, setManualRate]);

  const handleCustomerStateChange = React.useCallback(async (custState) => {
    if (custState?.customer) {
      focusAmountField();
      setSendAmount('');
      setCurrentCustomer(custState.customer);
      const cust = custState.customer;
      const doc = cust.custom_government_document || cust.image;
      if (doc) {
        const docUrl = doc.startsWith('http') ? doc : `/${doc.replace(/^\/+/, '')}`;
        methods.setValue('docFile', docUrl, { shouldValidate: true, shouldDirty: true });
        const curDocs = methods.getValues('documents');
        if (!curDocs || curDocs.length === 0) {
          methods.setValue('documents', [{
            document_type: cust.custom_government_id || cust.government_id_type || 'Passport',
            document_number: cust.custom_passport_number || cust.custom_drivers_licence_number || cust.custom_tin_number || cust.custom_voter_id_number || cust.government_id_number || '',
            issue_date: cust.custom_id_issue_date || cust.id_issue_date || '',
            expiry_date: cust.custom_id_expiry_date || cust.id_expiry_date || '',
            issue_country: cust.custom_id_issue_country || cust.id_issue_country || '',
            attachment: docUrl,
            notes: '',
          }], { shouldValidate: true, shouldDirty: true });
        }
      }

      // If last transaction data exists or can be fetched, auto fill form
      try {
        let lastTx = cust.lastTransaction;
        if (!lastTx) {
          const res = await fetchCustomerLastTransaction(cust, 'Currency Exchange');
          if (res?.data) {
            lastTx = res.data;
            cust.lastTransaction = lastTx;
          }
        }
        if (lastTx) {
          const prefill = extractExchangePrefill(lastTx);
          Object.entries(prefill).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              // Never autofill transaction or exchange type (preserve user's active session/tab)
              if (
                k === 'exchangeType' ||
                k === 'exchange_type' ||
                k === 'transfer_type' ||
                k === 'transaction_type'
              ) {
                return;
              }
              if (k === 'documents') {
                const curDocs = methods.getValues('documents');
                if (!curDocs || curDocs.length === 0) {
                  methods.setValue('documents', v, { shouldValidate: true, shouldDirty: true });
                }
              } else if (k === 'docFile') {
                const curDocFile = methods.getValues('docFile');
                if (!curDocFile) {
                  methods.setValue('docFile', v, { shouldValidate: true, shouldDirty: true });
                }
              } else {
                methods.setValue(k, v, { shouldValidate: true, shouldDirty: true });
              }
            }
          });
        }
      } catch (err) {
        console.warn('Error applying last transaction prefill in ReceiverForm:', err);
      }
    } else if (custState?.customerFound === false) {
      setCurrentCustomer(null);
    }
    onCustomerChange?.(custState);
  }, [onCustomerChange, methods, setSendAmount, focusAmountField]);


  const idExpiryVal = methods.watch('id_expiry_date');
  const idExpiryStatus = getIdExpiryStatus(idExpiryVal);
  const hasExpiredId = idExpiryStatus.isExpired;

  const watchedValues = methods.watch();

  const requiredFieldsInfo = React.useMemo(() => {
    const hasIdDoc = Boolean(
      (documentRows && documentRows.some(row => row.document_type?.trim() && (row.attachment instanceof File || (typeof row.attachment === 'string' && row.attachment.trim())))) ||
      (watchedValues.docFile instanceof File || (typeof watchedValues.docFile === 'string' && watchedValues.docFile.trim()))
    );

    const fields = [
      { fieldname: 'customer_id', label: 'Customer ID', isFilled: Boolean(watchedValues.customer_id?.trim?.() && (currentCustomer || watchedValues.firstName?.trim?.() || watchedValues.idName?.trim?.())) },
      { fieldname: 'firstName', label: 'First Name', isFilled: Boolean(watchedValues.firstName?.trim?.()) },
      { fieldname: 'lastName', label: 'Last Name', isFilled: Boolean(watchedValues.lastName?.trim?.()) },
      { fieldname: 'dateOfBirth', label: 'Date of Birth', isFilled: Boolean(watchedValues.dateOfBirth) },
      { fieldname: 'documents', label: 'Identity Document', isFilled: hasIdDoc },
      { fieldname: 'country', label: 'Country', isFilled: Boolean(watchedValues.country?.trim?.()) },
      { fieldname: 'city', label: 'City', isFilled: Boolean(watchedValues.city?.trim?.()) },
      { fieldname: 'oet_code', label: 'OET Code', isFilled: Boolean(watchedValues.oet_code?.trim?.()) },
      { fieldname: 'risk_level', label: 'Risk Level', isFilled: Boolean(watchedValues.risk_level?.trim?.()) },
      { fieldname: 'sendAmount', label: 'Exchange Amount', isFilled: Boolean(Number(sendAmount || 0) > 0) },
    ];

    if (exchangeType === 'SELL') {
      fields.push(
        { fieldname: 'travelDate', label: 'Travel Date', isFilled: Boolean(watchedValues.travelDate) },
        { fieldname: 'destination', label: 'Destination', isFilled: Boolean(watchedValues.destination?.trim?.()) },
        { fieldname: 'airwaysName', label: 'Airways Name', isFilled: Boolean(watchedValues.airwaysName?.trim?.()) },
        { fieldname: 'flightNumber', label: 'Flight Number', isFilled: Boolean(watchedValues.flightNumber?.trim?.()) },
        { fieldname: 'pnrNumber', label: 'PNR Number', isFilled: Boolean(watchedValues.pnrNumber?.trim?.()) }
      );
    }

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
  }, [watchedValues, exchangeType, sendAmount, documentRows]);

  const lastProgressRef = React.useRef('');
  useEffect(() => {
    const payload = {
      completedCount: requiredFieldsInfo.completedCount,
      totalCount: requiredFieldsInfo.totalCount,
      requiredFieldsInfo,
      hasExpiredId,
      hasMissingComplianceDocs,
      customerVerified: Boolean(watchedValues.customer_id && (watchedValues.firstName || currentCustomer)),
      amountDone: Boolean(Number(sendAmount || 0) > 0 && effectiveRate),
      complianceDone: Boolean(watchedValues.rbf_purpose && !hasMissingComplianceDocs),
      docsDone: Boolean(documentRows?.length > 0 && !hasExpiredId),
      fjdTotal: Number(exchangeType === 'BUY' ? fjdSendAmount || 0 : exchangePreview?.rawAmount || 0),
    };

    const key = `${payload.completedCount}|${payload.totalCount}|${payload.hasExpiredId}|${payload.hasMissingComplianceDocs}|${payload.customerVerified}|${payload.amountDone}|${payload.complianceDone}|${payload.docsDone}|${payload.fjdTotal}`;

    if (key !== lastProgressRef.current) {
      lastProgressRef.current = key;
      onProgressChange?.(payload);
    }
  }, [
    requiredFieldsInfo.completedCount,
    requiredFieldsInfo.totalCount,
    hasExpiredId,
    hasMissingComplianceDocs,
    watchedValues.customer_id,
    watchedValues.firstName,
    currentCustomer,
    sendAmount,
    effectiveRate,
    watchedValues.rbf_purpose,
    documentRows?.length,
    exchangeType,
    fjdSendAmount,
    exchangePreview?.rawAmount,
    onProgressChange,
  ]);

  const scrollToErrorField = (fieldname) => {
    let el = null;
    if (fieldname === 'customer_id') el = document.getElementById('field-customerId') || document.getElementById('field-idName');
    else if (fieldname === 'id_expiry_date') el = document.getElementById('field-idExpiryDate');
    else if (fieldname === 'documents' || fieldname === 'docFile') el = document.getElementById('exchange-documents') || document.getElementById('field-documents') || document.getElementById('field-docFile');
    else if (fieldname === 'compliance') el = document.getElementById('section-rbf-compliance') || document.getElementById('rbf-compliance-section');
    else el = document.getElementById(`field-${fieldname}`) || document.querySelector(`[name="${fieldname}"]`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, select, textarea') || el;
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }
  };

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
    if (hasExpiredId) {
      methods.setError('id_expiry_date', { type: 'manual', message: `Cannot proceed: Customer ID expired on ${idExpiryStatus.formattedDate} (${idExpiryStatus.daysExpired} days ago). Expired IDs cannot be accepted.` });
      scrollToErrorField('id_expiry_date');
      return;
    }

    if (hasMissingComplianceDocs) {
      methods.setError('documents', { type: 'manual', message: `Cannot submit exchange: missing required compliance documents (${missingComplianceDocs.join(', ')}). Please attach them in the Compliance / Documents section.` });
      document.getElementById('exchange-documents')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const hasValidIdDoc = Boolean(
      (documentRows && documentRows.some(row => row.document_type?.trim() && (row.attachment instanceof File || (typeof row.attachment === 'string' && row.attachment.trim())))) ||
      (watchedValues.docFile instanceof File || (typeof watchedValues.docFile === 'string' && watchedValues.docFile.trim()))
    );

    if (!hasValidIdDoc) {
      methods.setError('documents', { type: 'manual', message: 'An identity document is required to proceed with this exchange transaction.' });
      document.getElementById('exchange-documents')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (documentRows.some(row => !row.document_type?.trim() || !(row.attachment instanceof File || (typeof row.attachment === 'string' && row.attachment.trim())))) {
      methods.setError('documents', { type: 'manual', message: 'Each document row needs a document type and a valid attachment. Reselect files lost after a page refresh.' });
      document.getElementById('exchange-documents')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }


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

    // ── Warehouse Cash Account check ───────────────────────────────────────
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

    // ── Stock availability check ─────────────────────────────────────────────
    const ok = await runStockCheck();
    if (!ok) return;

    const getDenomType = (denom, notesArr = [], coinsArr = []) => {
      if (notesArr.includes(denom)) return 'Note';
      if (coinsArr.includes(denom)) return 'Coin';
      return denom >= 1 ? 'Note' : 'Coin';
    };



    const uploadedDocuments = [];
    const uploadedRbfDocuments = [];
    try {
      for (const row of documentRows) {
        if (!row.attachment) continue;
        const attachment = row.attachment instanceof File
          ? await uploadFile(row.attachment, { isPrivate: 1 })
          : row.attachment;
        if (!attachment) throw new Error(`Unable to upload ${row.document_type}. Please try again.`);
        uploadedDocuments.push({
          document_category: row.document_category || 'Proof of Identity',
          document_type: (row.document_type || 'Government ID').trim(),
          document_number: row.document_number || '',
          issue_date: row.issue_date || null,
          expiry_date: row.expiry_date || null,
          attachment: attachment.replace(/^\/+(?=(?:private\/)?files\/)/, '/'),
          notes: row.notes || '',
        });
      }
      for (const row of data.rbf_documents || []) {
        if (!row.document_type || !row.attachment) continue;
        const attachment = row.attachment instanceof File ? await uploadFile(row.attachment, { isPrivate: 1 }) : row.attachment;
        if (!attachment) throw new Error(`Unable to upload ${row.document_type}. Please try again.`);
        uploadedRbfDocuments.push({ document_type: row.document_type, attachment, file_url: attachment, verification_status: row.verification_status || 'UPLOADED' });
      }
      changeDocuments(uploadedDocuments);
    } catch (error) {
      methods.setError('documents', { type: 'manual', message: error.message });
      return;
    }

    onContinue?.({
      ...data,
      documents: uploadedDocuments,
      idType: data.government_id === 'Passport' ? 'PASSPORT' : 'GOVERNMENT_ID',
      docFile: uploadedDocuments.find(row => row.document_type === data.government_id)?.attachment || uploadedDocuments[0]?.attachment || null,
      id_issue_date: uploadedDocuments[0]?.issue_date || data.id_issue_date || null,
      id_expiry_date: uploadedDocuments[0]?.expiry_date || data.id_expiry_date || null,
      customer_id: data.customer_id || initialData?.customer_id || '',
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
      ticket: data.ticket || null,
      phone_number: data.phone_number || data.phoneNumber || '',
      rbf_purpose: data.rbf_purpose || null,
      rbf_documents: uploadedRbfDocuments,
      nationality: data.nationality || null,
      residency_status: data.residency_status || null,
      source_of_funds: data.source_of_funds || null,
      passport_endorsement_completed: data.passport_endorsed ? 1 : 0,
      passport_endorsed: data.passport_endorsed ? 1 : 0,
      tf_form_reference: data.tf_form_reference || null,
      tinNumber: data.tinNumber || null,
      risk_level: data.risk_level || 'Low',
      remarks: data.remarks || '',
      id_issue_date: data.id_issue_date ? formatDate(data.id_issue_date) : null,
      id_expiry_date: data.id_expiry_date ? formatDate(data.id_expiry_date) : null,
      selectedCustomer: currentCustomer,
      manualRate: useManualRate ? manualRate : '',
      useManualRate,
      rawSenderDenomRows: senderDenomRowsRef.current,
      rawReceiverDenomRows: receiverDenomRowsRef.current,
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
    'exchangeType', 'oet_code', 'risk_level', 'remarks',
    'idName', 'phone_number', 'dateOfBirth', 'government_id', 'idNumber', 'id_issue_date', 'id_expiry_date',
    'idIssueCountry', 'idIssueState', 'docFile', 'travelDate', 'destination', 'airwaysName', 'flightNumber', 'pnrNumber', 'ticket',
    'tinNumber',
    'firstName', 'lastName', 'city', 'country',
  ];
  const FILE_FIELDS = new Set(['docFile', 'ticket']);


  const onError = (errors) => {
    const firstErrorField = FIELD_ORDER.find(f => errors[f]);
    if (!firstErrorField) return;
    if (FILE_FIELDS.has(firstErrorField)) {
      const el = document.getElementById('exchange-documents');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      try { setFocus(firstErrorField); } catch (_) { }
      const el = document.getElementById(`field-${firstErrorField}`) ||
        document.querySelector(`[name="${firstErrorField}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const [sidebarSlot, setSidebarSlot] = useState(() =>
    typeof document !== 'undefined' ? document.getElementById('exchange-sidebar-progress-slot') : null
  );

  useEffect(() => {
    if (!sidebarSlot && typeof document !== 'undefined') {
      const el = document.getElementById('exchange-sidebar-progress-slot');
      if (el) setSidebarSlot(el);
    }
  }, [sidebarSlot]);

  const progressCard = (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.04)] w-full min-w-0 box-border">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-caption transition-colors shrink-0 ${
              hasExpiredId
                ? 'bg-red-100 text-red-700'
                : hasMissingComplianceDocs
                ? 'bg-amber-100 text-amber-700'
                : requiredFieldsInfo.isAllComplete
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {hasExpiredId ? (
              <span className="text-base font-bold text-red-600">⚠</span>
            ) : hasMissingComplianceDocs ? (
              <span className="text-base font-bold text-amber-600">!</span>
            ) : requiredFieldsInfo.isAllComplete ? (
              <CheckCircle2 size={20} strokeWidth={2.5} />
            ) : (
              `${requiredFieldsInfo.percent}%`
            )}
          </div>
          <div>
            <h3 className="text-label font-bold uppercase tracking-wider text-gray-900">Exchange Progress</h3>
            <p className="text-caption text-gray-700 mt-0.5">
              {hasExpiredId ? (
                <span className="font-bold text-red-600">
                  ⚠️ ID expired ({idExpiryStatus.daysExpired === 1 ? '1 day ago' : `${idExpiryStatus.daysExpired}d ago`})
                </span>
              ) : (
                <>
                  <strong className="text-gray-900 font-bold">
                    {requiredFieldsInfo.completedCount} of {requiredFieldsInfo.totalCount} fields
                  </strong>
                  {hasMissingComplianceDocs ? (
                    <span className="font-bold text-amber-700 ml-1">
                      · ⚠️ {missingComplianceDocs.length} compliance {missingComplianceDocs.length === 1 ? 'issue' : 'issues'}
                    </span>
                  ) : requiredFieldsInfo.isAllComplete ? (
                    <span className="font-bold text-green-700 ml-1">· ✓ Ready!</span>
                  ) : (
                    <span className="text-gray-500 ml-1">
                      ({requiredFieldsInfo.totalCount - requiredFieldsInfo.completedCount} remaining)
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden my-3">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            hasExpiredId
              ? 'bg-red-600'
              : hasMissingComplianceDocs
              ? 'bg-amber-500'
              : requiredFieldsInfo.isAllComplete
              ? 'bg-green-600'
              : 'bg-blue-600'
          }`}
          style={{ width: `${requiredFieldsInfo.percent}%` }}
        />
      </div>

      {/* Missing Required Fields Pills */}
      {!requiredFieldsInfo.isAllComplete && requiredFieldsInfo.missingFields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-700 font-bold shrink-0">Required:</span>
          {requiredFieldsInfo.missingFields.map((field) => (
            <button
              key={field.fieldname}
              type="button"
              onClick={() => scrollToErrorField(field.fieldname)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 text-gray-700 font-medium text-[11px] transition-colors cursor-pointer"
              title={`Click to jump to ${field.label}`}
            >
              • {field.label}
            </button>
          ))}
        </div>
      )}

      {/* Missing Compliance Docs */}
      {hasMissingComplianceDocs && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-amber-800 font-bold shrink-0">Compliance:</span>
          <button
            type="button"
            onClick={() => scrollToErrorField('compliance')}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 font-semibold text-[11px] hover:bg-amber-100 transition-colors cursor-pointer"
            title="Click to jump to Compliance section"
          >
            📄 {missingComplianceDocs.join(', ')}
          </button>
        </div>
      )}
    </div>
  );

  const FJD = { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar' };

  return (
    <FormProvider {...methods}>
      {sidebarSlot && createPortal(progressCard, sidebarSlot)}
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

      <form onSubmit={handleSubmit(onSubmit, onError)} autoComplete="off" className="flex flex-col gap-6 w-full min-w-0" noValidate>

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

          {/* Unified Form Card matching exchange.html */}
          <div className="card" style={{ overflow: "hidden" }}>

            {/* SECTION 1: CURRENCY AND AMOUNT */}
            <div className="sec" id="section-currency-amount">
              <h2 className="h"><span className="n">1</span>Currency and amount</h2>
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
            </div>

            {/* SECTION 2: CUSTOMER */}
            <div className="sec" id="section-customer">
              <h2 className="h"><span className="n">2</span>Customer</h2>
              {/* Merged Sub-Section: ID Verification */}
              <GovernmentIdSection
                hideCardWrapper={true}
                useDocumentTable
                prefillCustomerId={initialData?.request_customer_id || ''}
                exchangeType={exchangeType}
                onCustomerChange={handleCustomerStateChange}
                onResetAllFields={handleResetAllFields}
                selectedCustomer={currentCustomer}
              />

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Merged Sub-Section: Regulatory & Transaction Details */}
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-700 shrink-0">
                  <FileText size={15} strokeWidth={2} className="text-[#E00000]" />
                </div>
                <div>
                  <h4 className="text-overline font-semibold text-ink tracking-wider">
                    Regulatory &amp; Transaction Details
                  </h4>
                  <p className="text-caption text-muted">OET code classification, risk assessment, and remarks</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 ml-3 sm:ml-3.5 border-l-2 border-gray-200/80 pl-4 sm:pl-6">
                {/* Row 1: OET Code & Risk Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div id="field-oetCode">
                    <FieldLabel required icon={FileText}>OET Code</FieldLabel>
                    {potError ? (
                      <p className="text-danger text-label font-medium mt-1">Failed to load OET codes</p>
                    ) : potLoading ? (
                      <div className="h-12 rounded-lg animate-pulse bg-gray-100 mt-1" />
                    ) : (
                      <div className="relative mt-1">
                        <select
                          {...methods.register('oet_code', { required: 'OET Code is required' })}
                          className={selectCls(methods.formState.errors.oet_code)}
                          value={methods.watch('oet_code') || '18'}
                          onChange={(e) => {
                            methods.setValue('oet_code', e.target.value, { shouldValidate: true, shouldDirty: true });
                          }}
                        >
                          <option value="" disabled>Select OET Code</option>
                          {potOptions?.map(pot => (
                            <option key={pot.code} value={pot.code}>{pot.label}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    )}
                    <ErrorMsg message={methods.formState.errors.oet_code?.message} />
                  </div>

                  <div id="field-riskLevel">
                    <FieldLabel required icon={ShieldAlert}>Risk Level</FieldLabel>
                    <div className="relative mt-1">
                      <select
                        {...methods.register('risk_level', { required: 'Risk Level is required' })}
                        value={methods.watch('risk_level') || ''}
                        onChange={(e) => {
                          methods.setValue('risk_level', e.target.value, { shouldValidate: true, shouldDirty: true });
                        }}
                        className={selectCls(methods.formState.errors.risk_level)}
                      >
                        <option value="" disabled>Select Risk Level</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <ChevronDown size={16} />
                      </div>
                    </div>
                    <ErrorMsg message={methods.formState.errors.risk_level?.message} />
                  </div>
                </div>

                {/* Row 2: Full width small textarea for Remarks */}
                <div id="field-remarks" className="w-full">
                  <FieldLabel icon={MessageSquare}>Remarks</FieldLabel>
                  <div className="relative mt-1">
                    <textarea
                      rows={2}
                      placeholder="Enter remarks..."
                      {...methods.register('remarks')}
                      className={`${fieldCls(methods.formState.errors.remarks)} resize-y min-h-[52px]`}
                    />
                  </div>
                  <ErrorMsg message={methods.formState.errors.remarks?.message} />
                </div>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Merged Sub-Section: Address & Personal Details */}
              <div className="flex items-center gap-2.5 pb-3 mb-4 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200/60 flex items-center justify-center text-gray-700 shrink-0">
                  <User size={15} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-overline font-semibold text-ink tracking-wider">
                    Personal Details &amp; Address
                  </h4>
                  <p className="text-caption text-muted">Occupation, country and contact address</p>
                </div>
              </div>
              <div className="ml-3 sm:ml-3.5 border-l-2 border-gray-200/80 pl-4 sm:pl-6">
                <PersonalInfoSection />
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Merged Sub-Section: Identification Documents Table */}
              <div id="exchange-documents" className="ml-3 sm:ml-3.5 border-l-2 border-gray-200/80 pl-4 sm:pl-6">
                <DocumentUploadTable
                  rows={documentRows}
                  onChange={changeDocuments}
                  disabled={uploadLoading || stockLoading}
                  title="Identification Documents"
                  subtitle="Passport, ID or other supporting identity document"
                  defaultDocumentNumber={methods.watch('idNumber') || methods.watch('id_number') || ''}
                />
                {['documents', 'docFile', 'ticket'].map(field => methods.formState.errors[field] && (
                  <p key={field} role="alert" className="mt-2 text-label text-danger">{methods.formState.errors[field].message}</p>
                ))}
              </div>
            </div>

            {/* SECTION 3: COMPLIANCE */}
            <div className="sec">
              <h2 className="h"><span className="n">3</span>Compliance</h2>
              <div id="rbf-compliance-section">
                <RbfComplianceSection
                  fjdAmount={rbfFjdAmount}
                  exchangeType={exchangeType}
                  currency="FJD"
                  rate={exchangePreview?.rate}
                  customerId={methods.watch('customer_id')}
                  onAssessmentChange={setComplianceAssessment}
                  hideCardHeader={true}
                  hideIdentityScreening={true}
                />
              </div>
            </div>

            {/* SECTION 4: DOCUMENTS AND CASH COUNT */}
            <div className="sec">
              <h2 className="h"><span className="n">4</span>Documents and cash count</h2>
              {denomBalanceError && (
                <div ref={denomErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                  <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-label text-red-800">Denomination Imbalance</p>
                    <p className="text-label text-danger mt-0.5">{denomBalanceError}</p>
                  </div>
                </div>
              )}
              {stockError && (
                <div ref={stockErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                  <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-label text-red-800">Out of Stock</p>
                    <p className="text-label text-danger mt-0.5">{stockError}</p>
                  </div>
                </div>
              )}
              {cashAccountError && (
                <div ref={stockErrorRef} className="mb-4 flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[#E00000]/30 bg-[#E00000]/5">
                  <AlertCircle size={15} className="text-[#E00000] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-label text-red-800">Warehouse Cash Account Not Mapped</p>
                    <p className="text-label text-danger mt-0.5">{cashAccountError}</p>
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
                onSenderStatusChange={s => { senderDenomStatusRef.current = s; }}
                onReceiverStatusChange={s => { receiverDenomStatusRef.current = s; }}
              />
            </div>

            {/* Alert banners if blocked */}
            {hasExpiredId && (
              <div style={{ margin: "20px 28px 0" }} className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-red-300 bg-red-50 text-red-950">
                <span className="text-base">🚫</span>
                <div>
                  <p className="font-bold text-label text-red-900">Submission Blocked — Customer ID Expired</p>
                  <p className="text-body text-red-800 mt-0.5">Customer ID expired on <strong>{idExpiryStatus.formattedDate}</strong> ({idExpiryStatus.daysExpired} days ago). An unexpired ID must be provided to proceed.</p>
                </div>
              </div>
            )}

            {hasMissingComplianceDocs && (
              <div style={{ margin: "20px 28px 0" }} className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950">
                <span className="text-base">🚫</span>
                <div>
                  <p className="font-bold text-label text-amber-900">Missing Required Compliance Documents</p>
                  <p className="text-body text-amber-800 mt-0.5">Submission is blocked until required RBF compliance documents are attached: <strong>{missingComplianceDocs.join(', ')}</strong></p>
                </div>
              </div>
            )}

            {/* CARD FOOTER ACTIONS BAR (exchange.html style) */}
            <div style={{ padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAFAFB", borderTop: "1px solid #E3E6EB", flexWrap: "wrap", gap: "12px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={onClear}
                className="btn ghost"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={!requiredFieldsInfo.isAllComplete || ratesLoading || uploadLoading || stockLoading || hasMissingComplianceDocs || hasExpiredId || (!ratesLoading && availableCurrencies?.length === 0)}
                className="btn"
                style={{ padding: "0 40px" }}
              >
                {stockLoading
                  ? 'Checking stock…'
                  : uploadLoading
                  ? 'Uploading...'
                  : hasExpiredId
                  ? 'Expired ID'
                  : hasMissingComplianceDocs
                  ? `Missing Docs (${missingComplianceDocs.length})`
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
