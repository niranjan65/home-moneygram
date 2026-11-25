import { sessionFetch as fetch } from '../api/sessionClient.js';
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Summary } from '../components/exchange-new/Summary';
import { DealerForm } from '../features/exchange/components/DealerForm';
import { ReviewStep } from '../components/exchange-new/ReviewStep';
import Navbar from '../components/layout/Navbar';
import TransactionTabBar from '../components/common/TransactionTabBar';
import BoardRatesBar from '../components/common/BoardRatesBar';
import { TransferSuccessNew } from '../components/exchange-new/TransferSuccessNew';
import { ExchangeProvider } from '../context/ExchangeContext';
import { useERPNextRates } from '../hooks/useERPNextRates';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useERPFileUpload } from '../hooks/useERPFileUpload';
import { useDispatch } from 'react-redux';
import { setIsDealer } from '../store/exchangeSlice';
import { createCustomer, fetchNewCustomerId } from '../features/exchange/api/customer';
import { ShieldCheck } from 'lucide-react';

const Step = {
  ESTIMATE: 1,
  DETAILS: 2,
  REVIEW: 3,
  PAYMENT: 4,
};

const TRANSFER_FEE = 4.99;

const DealerExchange = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setIsDealer(true));
  }, [dispatch]);

  const { uploadFile } = useERPFileUpload();
  const ratesData = useERPNextRates();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [progressInfo, setProgressInfo] = useState({
    completedCount: 0,
    totalCount: 4,
    amountDone: false,
    dealerVerified: false,
    docsDone: false,
    cashDone: false,
  });

  const handleProgressChange = useCallback((info) => {
    setProgressInfo(prev => ({ ...prev, ...info }));
  }, []);

  const scrollToSection = useCallback((type) => {
    let target = null;
    if (type === 'amount') target = document.getElementById('section-exchange-details');
    else if (type === 'dealer') target = document.getElementById('section-customer-info');
    else if (type === 'documents') target = document.getElementById('dealer-documents');
    else if (type === 'cash') target = document.getElementById('section-cash-denominations');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const loginUser = useUser();
  const { selectedWarehouse } = useSettings();
  const [summaryChange, setHandleSumamryChange] = useState();

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('dealerCurrentStep');
    return saved ? JSON.parse(saved) : Step.DETAILS;
  });

  const [formKey, setFormKey] = useState(0);

  const [senderInfo] = useState({
    name: 'Dealer Agent',
    email: 'dealer@anantdv.com',
    phone: '+91 1234567890',
  });

  const location = useLocation();
  const navigate = useNavigate();
  const requestedExchangeType = new URLSearchParams(location.search).get('type')?.toUpperCase();
  const currentExchangeType = ['BUY', 'SELL'].includes(requestedExchangeType) ? requestedExchangeType : 'BUY';

  const [receiverInfo, setReceiverInfo] = useState(() => {
    const saved = sessionStorage.getItem('dealerReceiverInfo');
    return saved ? JSON.parse(saved) : {
      customer_id: '',
      firstName: '',
      lastName: '',
      middleName: '',
      fullName: '',
      dateOfBirth: '',
      foreignCurrency: '',
      receiverCurrency: '',
      exchangeType: currentExchangeType,
    };
  });

  const [summary, setSummary] = useState(() => {
    const saved = sessionStorage.getItem('dealerSummary');
    const initial = saved ? JSON.parse(saved) : {
      sendAmount: null,
      currency: 'FJD',
      fee: TRANSFER_FEE,
      exchangeRate: 1.0,
      receiverGets: 0,
      receiverCurrency: '',
      exchangeType: 'BUY',
    };
    return { ...initial, exchangeType: currentExchangeType };
  });


  const [transferPayload, setTransferPayload] = useState(() => {
    const saved = sessionStorage.getItem('dealerTransferPayload');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactionId, setTransactionId] = useState(() => {
    const saved = sessionStorage.getItem('dealerTransactionId');
    return saved ? JSON.parse(saved) : null;
  });

  const [apiResponseDoc, setApiResponseDoc] = useState(() => {
    const saved = sessionStorage.getItem('dealerApiResponseDoc');
    return saved ? JSON.parse(saved) : null;
  });

  const saveToSession = useCallback((key, value) => {
    const timeout = setTimeout(() => {
      sessionStorage.setItem(key, JSON.stringify(value));
    }, 300);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    console.log("transfer payload", transferPayload)
  }, [transferPayload])


  useEffect(() => {
    sessionStorage.setItem('dealerCurrentStep', JSON.stringify(currentStep));
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentStep]);
  useEffect(() => { sessionStorage.setItem('dealerReceiverInfo', JSON.stringify(receiverInfo)); }, [receiverInfo]);
  //   useEffect(() => { sessionStorage.setItem('dealerSummary', JSON.stringify(summary)); }, [summary]);
  useEffect(() => saveToSession('dealerSummary', summary), [summary]);
  useEffect(() => { sessionStorage.setItem('dealerTransferPayload', JSON.stringify(transferPayload)); }, [transferPayload]);
  useEffect(() => { if (transactionId) sessionStorage.setItem('dealerTransactionId', JSON.stringify(transactionId)); }, [transactionId]);
  useEffect(() => { if (apiResponseDoc) sessionStorage.setItem('dealerApiResponseDoc', JSON.stringify(apiResponseDoc)); }, [apiResponseDoc]);

  const handleSummaryChange = useCallback((incoming) => {
    setSummary(prev => ({
      ...prev,
      sendAmount: incoming.sendAmount,
      currency: incoming.currency,
      exchangeRate: incoming.exchangeRate,
      receiverGets: incoming.receiverGets,
      fee: incoming.receiverGets * 0.02,
      receiverCurrency: incoming.receiverCurrency,
      exchangeType: incoming.exchangeType,
    }));
    setHandleSumamryChange(incoming)
  }, []);

  const handleContinue = useCallback(async (data) => {
    if (!selectedWarehouse?.warehouse) {
      setShowLocationModal(true);
      return;
    }
    let uploadedFileUrl = data.docFile;
    try {
      if (data.docFile instanceof File) {
        uploadedFileUrl = await uploadFile(data.docFile, { isPrivate: 0, doctype: 'Customer' });
      }

      const rawFullName = (data.fullName || '').trim();
      const rawDob = data.dateOfBirth;
      const formattedDob = rawDob
        ? (typeof rawDob === 'string' ? rawDob.split('T')[0] : new Date(rawDob).toISOString().split('T')[0])
        : '';

      let dealerKey = (data.customer_id || '').trim();
      if (!dealerKey) {
        try {
          dealerKey = await fetchNewCustomerId(loginUser);
        } catch (e) {
          console.error('Failed to fetch new dealer ID in handleContinue:', e);
        }
      }
      if (!dealerKey) {
        dealerKey = 'ME0001';
      }

      let finalCustomerId = (data.customer_id || '').trim();

      // If new dealer, create Customer with customer_group: 'Dealer'
      if (!finalCustomerId && dealerKey) {
        const created = await createCustomer(
          {
            ...data,
            customer_id: dealerKey,
            customer_group: 'Dealer',
            dateOfBirth: formattedDob,
            docFile: uploadedFileUrl,
          },
          uploadedFileUrl,
          loginUser,
          uploadedFileUrl
        );
        finalCustomerId = created?.name || created?.custom_customer_id || dealerKey;
      }

      const resolvedName = rawFullName || data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ');
      const enrichedData = {
        ...data,
        fullName: resolvedName,
        full_name: resolvedName,
        custom_customer_full_name: resolvedName,
        customer_full_name: resolvedName,
        customer_name: resolvedName,
        customer_id: finalCustomerId || dealerKey,
        custom_customer_id: finalCustomerId || dealerKey,
        docFile: uploadedFileUrl,
        dateOfBirth: formattedDob,
      };

      setReceiverInfo(enrichedData);
      setTransferPayload(enrichedData);

      setSummary(prev => ({
        ...prev,
        sendAmount: data.sendAmount,
        currency: data.exchangeType === 'BUY' ? data.foreignCurrency : data.localCurrency,
        exchangeRate: data.exchangeRate,
        receiverGets: data.receiverGets,
        receiverCurrency: data.exchangeType === 'BUY' ? data.localCurrency : data.foreignCurrency,
      }));

      setCurrentStep(Step.REVIEW);
    } catch (err) {
      console.error('Error during dealer submission to review:', err);
      const resolvedName = rawFullName || data?.fullName || [data?.firstName, data?.lastName].filter(Boolean).join(' ');
      const fallbackData = {
        ...data,
        fullName: resolvedName,
        full_name: resolvedName,
        custom_customer_full_name: resolvedName,
        customer_full_name: resolvedName,
        customer_name: resolvedName,
        customer_id: dealerKey || data?.customer_id,
        custom_customer_id: dealerKey || data?.customer_id,
        docFile: uploadedFileUrl,
      };
      setReceiverInfo(fallbackData);
      setTransferPayload(fallbackData);
      setCurrentStep(Step.REVIEW);
    }
  }, [uploadFile, loginUser, selectedWarehouse]);

  const clearDealerForm = useCallback((targetType) => {
    const exchangeType = targetType || currentExchangeType || 'BUY';
    setReceiverInfo({
      customer_id: '',
      firstName: '',
      lastName: '',
      middleName: '',
      fullName: '',
      dateOfBirth: '',
      localCurrency: 'FJD',
      foreignCurrency: '',
      exchangeType: exchangeType,
    });
    setSummary({
      sendAmount: 0,
      currency: 'FJD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 0,
      receiverCurrency: '',
      exchangeType: exchangeType,
    });
    setTransferPayload(null);
    setTransactionId(null);
    setApiResponseDoc(null);
    setCurrentStep(Step.DETAILS);

    sessionStorage.removeItem('dealerCurrentStep');
    sessionStorage.removeItem('dealerReceiverInfo');
    sessionStorage.removeItem('dealerSummary');
    sessionStorage.removeItem('dealerTransferPayload');
    sessionStorage.removeItem('dealerTransactionId');
    sessionStorage.removeItem('dealerApiResponseDoc');
    setFormKey(prev => prev + 1);
  }, [currentExchangeType]);

  const handleCancel = useCallback(() => {
    clearDealerForm(currentExchangeType);
  }, [clearDealerForm, currentExchangeType]);

  const prevExchangeTypeRef = useRef(currentExchangeType);
  useEffect(() => {
    if (prevExchangeTypeRef.current !== currentExchangeType) {
      prevExchangeTypeRef.current = currentExchangeType;
      clearDealerForm(currentExchangeType);
    }
  }, [currentExchangeType, clearDealerForm]);

  const handleEditFromReview = useCallback(() => {
    setCurrentStep(Step.DETAILS);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!transferPayload) return;
    if (!selectedWarehouse?.warehouse) {
      setShowLocationModal(true);
      return;
    }

    let denominationData = [];

    let receiverData = []

    if (transferPayload.exchangeType === "BUY") {

      denominationData =
        transferPayload.receiverDenominationRows?.map(row => {
          const { denomination_value, denomination_type } = row;
          let itemName = denomination_value;

          if (
            denomination_type === "Note" &&
            transferPayload.notes &&
            transferPayload.notes_name
          ) {
            const index = transferPayload.notes.findIndex(
              n => n === denomination_value
            );
            if (index !== -1) itemName = transferPayload.notes_name[index];
          }

          if (
            denomination_type === "Coin" &&
            transferPayload.coins &&
            transferPayload.coins_name
          ) {
            const index = transferPayload.coins.findIndex(
              c => c === denomination_value
            );
            if (index !== -1) itemName = transferPayload.coins_name[index];
          }

          return {
            denomination: itemName,
            qty: row.count,
            amount: row.subtotal
          };
        }) || [];

      receiverData =
        transferPayload.senderDenominationRows?.map(row => {
          const { denomination_value, denomination_type } = row;
          let itemName = denomination_value;

          if (
            denomination_type === "Note" &&
            transferPayload.sender_notes &&
            transferPayload.sender_notes_name
          ) {
            const index = transferPayload.sender_notes.findIndex(
              n => n === denomination_value
            );
            if (index !== -1) itemName = transferPayload.sender_notes_name[index];
          }

          if (
            denomination_type === "Coin" &&
            transferPayload.sender_coins &&
            transferPayload.sender_coins_name
          ) {
            const index = transferPayload.sender_coins.findIndex(
              c => c === denomination_value
            );
            if (index !== -1) itemName = transferPayload.sender_coins_name[index];
          }

          return {
            denomination: itemName,
            qty: row.count,
            amount: row.subtotal
          };
        }) || [];

    } else {

      denominationData =
        transferPayload.senderDenominationRows?.map(row => {
          const { denomination_value, denomination_type } = row;
          let itemName = denomination_value;

          if (
            denomination_type === "Note" &&
            transferPayload.sender_notes &&
            transferPayload.sender_notes_name
          ) {
            const index = transferPayload.sender_notes.findIndex(
              n => n === denomination_value
            );
            if (index !== -1) itemName = transferPayload.sender_notes_name[index];
          }

          if (
            denomination_type === "Coin" &&
            transferPayload.sender_coins &&
            transferPayload.sender_coins_name
          ) {
            const index = transferPayload.sender_coins.findIndex(
              c => c === denomination_value
            );
            if (index !== -1) itemName = transferPayload.sender_coins_name[index];
          }

          return {
            denomination: itemName,
            qty: row.count,
            amount: row.subtotal
          };
        }) || [];

      receiverData =
        transferPayload.receiverDenominationRows?.map(row => {
          const { denomination_value, denomination_type } = row;
          let itemName = denomination_value;

          if (
            denomination_type === "Note" &&
            transferPayload.notes &&
            transferPayload.notes_name
          ) {
            const index = transferPayload.notes.findIndex(
              n => n === denomination_value
            );
            if (index !== -1) itemName = transferPayload.notes_name[index];
          }

          if (
            denomination_type === "Coin" &&
            transferPayload.coins &&
            transferPayload.coins_name
          ) {
            const index = transferPayload.coins.findIndex(
              c => c === denomination_value
            );
            if (index !== -1) itemName = transferPayload.coins_name[index];
          }

          return {
            denomination: itemName,
            qty: row.count,
            amount: row.subtotal
          };
        }) || [];
    }
    try {
      let uploadedFileUrl = null;
      if (transferPayload.docFile) {
        if (typeof transferPayload.docFile === 'string') {
          uploadedFileUrl = transferPayload.docFile;
        } else if (transferPayload.docFile instanceof File || transferPayload.docFile instanceof Blob) {
          uploadedFileUrl = await uploadFile(transferPayload.docFile, {
            isPrivate: 0,
            doctype: "Currency Exchange For Dealer",
          });
        }
      }

      const localAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.sendAmount : transferPayload.receiverGets;
      const foreignAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.receiverGets : transferPayload.sendAmount;

      let formattedDob = transferPayload.dateOfBirth || '';
      if (transferPayload.dateOfBirth instanceof Date) {
        const d = transferPayload.dateOfBirth;
        formattedDob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (typeof transferPayload.dateOfBirth === 'string') {
        formattedDob = transferPayload.dateOfBirth.split('T')[0];
      }

      const rawFullName = (transferPayload.fullName || '').trim();
      const nameParts = rawFullName.split(/\s+/).filter(Boolean);
      const computedFirst = transferPayload.firstName || nameParts[0] || '';
      const computedLast = transferPayload.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : computedFirst);

      let dealerKey = (transferPayload.customer_id || '').trim();
      if (!dealerKey) {
        try {
          dealerKey = await fetchNewCustomerId(loginUser);
        } catch (e) {
          console.error('Failed to fetch new dealer ID:', e);
        }
      }
      if (!dealerKey) {
        dealerKey = 'ME0001';
      }

      const apiPayload = {
        data: {
          customer_id: dealerKey,
          first_name: computedFirst,
          last_name: computedLast,
          full_name: rawFullName,
          date_of_birth: formattedDob,
          customer_name_and_dob: dealerKey,
          oet_code: transferPayload.oet_code,
          passport_photo__scan: uploadedFileUrl,
          passport_photo: uploadedFileUrl,

          local_amount: localAmount,
          local_currency_type: transferPayload.localCurrency,

          foreign_amount: foreignAmount,
          foreign_currency_type: transferPayload.foreignCurrency,

          expected: localAmount,
          counted: localAmount,
          balanced: 0,

          exchange_rate: transferPayload.exchangeRate,
          exchangeType: transferPayload.exchangeType,
          transfer_fee: summary.fee,
          send_amount: transferPayload.sendAmount,
          total_amount: transferPayload.sendAmount,

          warehouse: selectedWarehouse?.warehouse,

          denomination: denominationData,

          receiver_gets: receiverData,
        },
      };


      console.log("api payload", apiPayload)

      const response = await fetch(
        "/api/method/moneygram.moneygram.api.create_dealer_exchange.create_dealer_exchange",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(apiPayload),
        }
      );

      const result = await response.json().catch(() => null);

      console.log("API Response:", result);

      if (!response.ok || !result || result?.message?.status === "error" || result?.status === "error") {
        let errorMsg = "Something went wrong while creating dealer exchange";
        if (result?.message?.message) {
          errorMsg = result.message.message;
        } else if (result?.message && typeof result.message === "string") {
          errorMsg = result.message;
        } else if (result?.error) {
          errorMsg = result.error;
        } else if (result?.exc) {
          errorMsg = "Server processing error. Please verify input data.";
        }
        alert(errorMsg);
        return;
      }

      sessionStorage.removeItem('exchangeInvoiceData');
      const apiResultData = result?.message?.data || result?.data || result || {};
      const resolvedName = rawFullName || transferPayload?.fullName || transferPayload?.full_name || [computedFirst, computedLast].filter(Boolean).join(' ');
      const createdDoc = {
        ...(transferPayload || {}),
        ...apiResultData,
        full_name: resolvedName,
        fullName: resolvedName,
        customer_full_name: resolvedName,
        custom_customer_full_name: resolvedName,
        customer_name: resolvedName,
        customer_id: dealerKey || transferPayload?.customer_id,
        custom_customer_id: dealerKey || transferPayload?.customer_id,
      };
      setApiResponseDoc(createdDoc);
      const txId = createdDoc?.name || `#DLR-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionId(txId);
      setCurrentStep(Step.PAYMENT);

    } catch (error) {
      console.error("API Error:", error);
      alert("Something went wrong while creating dealer exchange");
    }
  }, [transferPayload, summary, selectedWarehouse, loginUser]);

  const handleDashboard = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  const handleDownloadReceipt = useCallback(() => {
    console.log('Download receipt for:', transactionId);
  }, [transactionId]);

  const renderStepContent = () => {
    if (currentStep === Step.REVIEW) {
      return (
        <ReviewStep
          data={transferPayload}
          senderName={senderInfo.name}
          paymentLabel="Dealer Processing"
          fee={TRANSFER_FEE}
          onEdit={handleEditFromReview}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          isDealer={true}
        />
      );
    }

    if (currentStep === Step.PAYMENT) {
      return (
        <TransferSuccessNew
          data={transferPayload}
          apiDoc={apiResponseDoc}
          transactionId={transactionId}
          estimatedArrival="Processed immediately"
          onDashboard={handleDashboard}
          onDownloadReceipt={handleDownloadReceipt}
          isDealer={true}
          isExchange={true}
        />
      );
    }

    return (
      <DealerForm
        key={`form-refresh-key-${formKey}`}
        initialData={{ ...receiverInfo, exchangeType: currentExchangeType }}
        sendAmount={summary.sendAmount}
        onContinue={handleContinue}
        onClear={handleCancel}
        onSummaryChange={handleSummaryChange}
        ratesData={ratesData}
        onProgressChange={handleProgressChange}
      />
    );
  };

  return (
    <div className="money-exchange-new dealer-exchange min-h-screen flex flex-col bg-page text-ink transition-colors">
      <style>{`
        .money-exchange-new,
        .dealer-exchange {
          background-color: var(--color-page);
          min-height: 100vh;
          font-family: var(--font-sans);
          color: var(--color-ink);
        }
        .money-exchange-new .card,
        .dealer-exchange .card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-line);
          border-radius: var(--radius-card);
        }
        .money-exchange-new .lbl,
        .dealer-exchange .lbl {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: var(--color-muted);
          margin-bottom: 6px;
        }
        .money-exchange-new .inp,
        .dealer-exchange .inp {
          width: 100%;
          height: 48px;
          border: 1px solid var(--color-line-strong);
          border-radius: var(--radius-input);
          padding: 0 14px;
          font: 500 15px var(--font-sans);
          color: var(--color-ink);
          background-color: var(--color-surface);
          box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .money-exchange-new .inp:focus,
        .dealer-exchange .inp:focus {
          outline: none;
          border-color: var(--color-brand-600);
          box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.15);
        }
        .money-exchange-new .sec,
        .dealer-exchange .sec {
          padding: 28px;
          border-bottom: 1px solid var(--color-line);
        }
        .money-exchange-new .h,
        .dealer-exchange .h {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-ink);
        }
        .money-exchange-new .n,
        .dealer-exchange .n {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--color-ink);
          color: var(--color-surface);
          font-size: 13px;
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .money-exchange-new .g2,
        .dealer-exchange .g2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .money-exchange-new .g3,
        .dealer-exchange .g3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 840px) {
          .money-exchange-new .g2,
          .money-exchange-new .g3,
          .dealer-exchange .g2,
          .dealer-exchange .g3 {
            grid-template-columns: 1fr;
          }
        }
        .money-exchange-new .chip,
        .dealer-exchange .chip {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-weight: 600;
          background-color: var(--color-chip);
          color: var(--color-ink-soft);
        }
        .money-exchange-new .ok,
        .dealer-exchange .ok {
          background-color: var(--color-success-bg);
          color: var(--color-success-fg);
        }
        .money-exchange-new .warn,
        .dealer-exchange .warn {
          background-color: var(--color-warning-bg);
          color: var(--color-warning-fg);
        }
        .money-exchange-new .opt,
        .dealer-exchange .opt {
          border: 1.5px solid var(--color-line-strong);
          border-radius: 12px;
          padding: 16px;
          background-color: var(--color-surface);
          cursor: pointer;
          transition: all .15s;
        }
        .money-exchange-new .opt:hover,
        .dealer-exchange .opt:hover {
          border-color: var(--color-brand-600);
        }
        .money-exchange-new .opt.sel,
        .dealer-exchange .opt.sel {
          border-color: var(--color-brand-600);
          background-color: var(--color-brand-50);
        }
        .money-exchange-new .row,
        .dealer-exchange .row {
          display: flex;
          justify-content: space-between;
          font-size: 15px;
          padding: 8px 0;
          border-bottom: 1px solid var(--color-line-subtle);
        }
        .money-exchange-new .row span:first-child,
        .dealer-exchange .row span:first-child {
          color: var(--color-muted);
        }
        .money-exchange-new .row span:last-child,
        .dealer-exchange .row span:last-child {
          color: var(--color-ink);
        }
        .money-exchange-new .btn,
        .dealer-exchange .btn {
          height: 52px;
          padding: 0 28px;
          border-radius: 12px;
          border: 0;
          background-color: var(--color-brand-600);
          color: #fff;
          font: 600 16px var(--font-sans);
          cursor: pointer;
          transition: all .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .money-exchange-new .btn:hover:not(:disabled),
        .dealer-exchange .btn:hover:not(:disabled) {
          background-color: var(--color-brand-700);
        }
        .money-exchange-new .btn:disabled,
        .dealer-exchange .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .money-exchange-new .ghost,
        .dealer-exchange .ghost {
          background-color: var(--color-surface);
          color: var(--color-ink);
          border: 1px solid var(--color-line-strong);
        }
        .money-exchange-new .ghost:hover:not(:disabled),
        .dealer-exchange .ghost:hover:not(:disabled) {
          background-color: var(--color-surface-alt);
        }
        .money-exchange-new .tab,
        .dealer-exchange .tab {
          height: 50px;
          padding: 0 28px;
          border: 0;
          background: transparent;
          font: 600 16px var(--font-sans);
          color: var(--color-muted);
          border-radius: 12px;
          cursor: pointer;
          transition: all .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }
        .money-exchange-new .tab.on,
        .dealer-exchange .tab.on {
          background: var(--color-brand-600, #C8102E);
          color: #fff;
        }
        .money-exchange-new .chk,
        .dealer-exchange .chk {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          padding: 6px 0;
          color: var(--color-ink);
        }
        .money-exchange-new .dot,
        .dealer-exchange .dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-success, #0B7A44);
          flex: none;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 11px;
        }
        .money-exchange-new .dot.o,
        .dealer-exchange .dot.o {
          background: var(--color-surface, #fff);
          border: 2px solid var(--color-line-strong, #BFC5CE);
        }
        @media (max-width: 1024px) {
          .money-exchange-new .main-layout,
          .dealer-exchange .main-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      <ExchangeProvider summary={summary}>
        <main className="grow py-6 px-4 sm:px-6 w-full pb-20">
          <div className="max-w-[80%] mx-auto">

            {/* Top Board Rates Bar with Scrolling Marquee */}
            <BoardRatesBar exchangeType={currentExchangeType || summary.exchangeType || 'BUY'} />

            {/* Service Mode Navigation Tabs */}
            <TransactionTabBar
              activeTab="DEALER"
              dealerType={currentExchangeType}
              onTabChange={(target) => {
                if (target === "BUY" || target === "SELL") {
                  clearDealerForm(target);
                }
              }}
            />

            {/* Main 2-Column Grid */}
            <div
              className="main-layout"
              style={{
                display: "grid",
                gridTemplateColumns: currentStep === Step.PAYMENT ? "1fr" : "1fr 380px",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Left Column */}
              <div>
                {!selectedWarehouse?.warehouse && (
                  <div style={{ padding: "16px 28px", background: "var(--color-warning-bg, #FFF3D6)", color: "var(--color-warning-fg, #7A4B00)", border: "1px solid var(--color-warning-border, #E3E6EB)", borderRadius: "16px", fontSize: "14px", marginBottom: "20px" }}>
                    <strong>Branch location required:</strong> Please select a branch location in Settings before processing transactions.
                  </div>
                )}

                {renderStepContent()}
              </div>

              {/* Right Sidebar */}
              {currentStep !== Step.PAYMENT && (
                <aside className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "24px", position: "sticky", top: "24px", maxHeight: "calc(100vh - 48px)", overflowY: "auto", paddingRight: "4px" }}>
                  <Summary transferPayload={summaryChange} isDealer={true} />

                  {/* Ready to submit checklist card */}
                  {currentStep === Step.DETAILS && <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
                      <strong style={{ color: "var(--color-ink)" }}>Ready to submit</strong>
                      <span style={{ color: "var(--color-muted)" }}>
                        {progressInfo.completedCount || 0} of {progressInfo.totalCount || 4}
                      </span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "8px", background: "var(--color-surface-alt, #E3E6EB)", marginBottom: "12px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(((progressInfo.completedCount || 0) / (progressInfo.totalCount || 4)) * 100))}%`,
                          height: "8px",
                          borderRadius: "8px",
                          background: "var(--color-success, #0B7A44)",
                          transition: "width .3s ease",
                        }}
                      />
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-surface-alt p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('amount')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('amount')}
                      title="Jump to Exchange details"
                    >
                      <span className={`dot ${progressInfo.amountDone ? "" : "o"}`}>
                        {progressInfo.amountDone ? "✓" : ""}
                      </span>
                      <span className="text-ink group-hover:text-success transition-colors font-medium">Exchange details</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-surface-alt p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('dealer')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('dealer')}
                      title="Jump to Dealer information"
                    >
                      <span className={`dot ${progressInfo.dealerVerified ? "" : "o"}`}>
                        {progressInfo.dealerVerified ? "✓" : ""}
                      </span>
                      <span className="text-ink group-hover:text-success transition-colors font-medium">Dealer information</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-surface-alt p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('documents')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('documents')}
                      title="Jump to Supporting documents"
                    >
                      <span className={`dot ${progressInfo.docsDone ? "" : "o"}`}>
                        {progressInfo.docsDone ? "✓" : ""}
                      </span>
                      <span className="text-ink group-hover:text-success transition-colors font-medium">Supporting documents</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-surface-alt p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('cash')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('cash')}
                      title="Jump to Cash denomination"
                    >
                      <span className={`dot ${progressInfo.cashDone ? "" : "o"}`}>
                        {progressInfo.cashDone ? "✓" : ""}
                      </span>
                      <span className="text-ink group-hover:text-success transition-colors font-medium">Cash denomination</span>
                    </div>
                  </div>}

                  {/* Security badge at bottom of right sidebar */}
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-alt border border-line">
                    <ShieldCheck size={13} className="text-brand-600" strokeWidth={2} />
                    <span className="text-xs font-medium text-muted uppercase tracking-wider">
                      Encrypted &amp; Secure Transaction
                    </span>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </ExchangeProvider>

      {/* Location required modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-line rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-danger-bg text-brand-600 flex items-center justify-center">
              <svg className="w-7 h-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-ink text-xl font-bold mb-2">No Location Selected</h2>
              <p className="text-muted text-sm leading-relaxed">
                Please select a <span className="font-semibold text-ink">Location</span> before confirming the transaction. You can change it from the settings.
              </p>
            </div>
            <button
              onClick={() => setShowLocationModal(false)}
              className="w-full py-3 rounded-xl bg-[#E00000] text-white font-bold text-sm tracking-wide hover:bg-red-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerExchange;

