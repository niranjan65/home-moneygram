import { sessionFetch as fetch } from "../api/sessionClient.js";
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import TransactionTabBar from '../components/common/TransactionTabBar';
import { Summary } from '../components/exchange-new/Summary';
import { SenderCard } from '../components/exchange-new/SenderCard';
import { ReceiverForm } from '../components/exchange-new/ReceiverForm';
import { ReviewStep } from '../components/exchange-new/ReviewStep';
import Navbar from '../components/layout/Navbar';
import { TransferSuccessNew } from '../components/exchange-new/TransferSuccessNew';
import { useERPFileUpload } from '../hooks/useERPFileUpload';
import { ExchangeProvider } from '../context/ExchangeContext';
import { useSettings } from '../context/SettingsContext';
import { useERPNextRates } from '../hooks/useERPNextRates';
import { CheckCircle2, ChevronDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useDispatch } from 'react-redux';
import { setIsDealer } from '../store/exchangeSlice';
import { CustomerPhotoCard } from '../components/exchange-new/CustomerPhotoCard';
import { updateCustomerRiskLevel } from '../features/exchange/api/customer';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const Step = {
  ESTIMATE: 1,
  DETAILS: 2,
  REVIEW: 3,
  PAYMENT: 4,
};

const TRANSFER_FEE = 4.99;



const MoneyExchangeNew = () => {
  const location = useLocation();
  const requestedExchangeType = new URLSearchParams(location.search).get('type')?.toUpperCase();
  const startNewExchange = new URLSearchParams(location.search).get('new') === '1';
  const launchExchangeType = ['BUY', 'SELL'].includes(requestedExchangeType) ? requestedExchangeType : null;
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const [receiverInfo, setReceiverInfo] = useState(() => {
    const saved = sessionStorage.getItem('exchangeReceiverInfo');
    const initial = !startNewExchange && saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      phone_number: '',
      email: '',
      country: '',
      city: '',
      deliveryMethod: 'BANK_DEPOSIT',
      bankName: '',
      accountNumber: '',
      senderCurrency: 'USD',
      receiverCurrency: 'EUR',
    };
    return launchExchangeType ? { ...initial, exchangeType: launchExchangeType } : initial;
  });

  const [summary, setSummary] = useState(() => {
    const saved = sessionStorage.getItem('exchangeSummary');
    const initial = !startNewExchange && saved ? JSON.parse(saved) : {
      sendAmount: null,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 920.00,
      receiverCurrency: 'EUR',
      exchangeType: 'BUY',
    };
    return launchExchangeType ? { ...initial, exchangeType: launchExchangeType } : initial;
  });

  useEffect(() => {
    dispatch(setIsDealer(false));
  }, [dispatch]);



  const { uploadFile } = useERPFileUpload();
  const ratesData = useERPNextRates();

  const boardCurrencies = useMemo(() => {
    if (ratesData?.availableCurrencies && ratesData.availableCurrencies.length > 0) {
      return ratesData.availableCurrencies.map(c => {
        const rate = summary.exchangeType === 'SELL'
          ? (c.sellingRate ?? c.buyingRate)
          : (c.buyingRate ?? c.sellingRate);
        return {
          code: c.code,
          rate: rate ? Number(rate).toFixed(4) : '—',
        };
      });
    }
    return [
      { code: 'USD', rate: '2.2410' },
      { code: 'AUD', rate: '1.4590' },
      { code: 'NZD', rate: '1.3320' },
      { code: 'EUR', rate: '2.4350' },
      { code: 'GBP', rate: '2.8240' },
      { code: 'CAD', rate: '1.6210' },
      { code: 'JPY', rate: '0.0148' },
      { code: 'SGD', rate: '1.6820' },
      { code: 'CNY', rate: '0.3120' },
    ];
  }, [ratesData?.availableCurrencies, summary.exchangeType]);

  const [summaryChange, setHandleSumamryChange] = useState();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [customerMode, setCustomerMode] = useState('new'); // 'new' or 'existing'

  // Holds raw Files between DETAILS → REVIEW steps.
  const ticketFileRef = React.useRef(null);
  const customerImageFileRef = React.useRef(null);

  const [customerImageFile, setCustomerImageFile] = useState(null);
  const [customerImageUrl, setCustomerImageUrl] = useState(() => {
    return sessionStorage.getItem('exchangeCustomerImageUrl') || '';
  });
  const [customerFound, setCustomerFound] = useState(false);

  useEffect(() => {
    if (customerImageUrl) {
      sessionStorage.setItem('exchangeCustomerImageUrl', customerImageUrl);
    } else {
      sessionStorage.removeItem('exchangeCustomerImageUrl');
    }
  }, [customerImageUrl]);

  const handleCustomerChange = useCallback((custState) => {
    if (custState.customerFound !== undefined) setCustomerFound(custState.customerFound);
    if (custState.imageUrl !== undefined) {
      setCustomerImageUrl(custState.imageUrl);
      setCustomerImageFile(null);
      customerImageFileRef.current = null;
    }
  }, []);

  const [progressInfo, setProgressInfo] = useState({
    completedCount: 0,
    totalCount: 10,
    customerVerified: false,
    amountDone: false,
    complianceDone: false,
    docsDone: false,
    fjdTotal: 0,
  });

  const scrollToSection = useCallback((type) => {
    let target = null;
    let focusInput = null;

    if (type === 'amount') {
      target = document.getElementById('field-sendAmount') || document.getElementById('section-currency-amount');
      focusInput = target?.querySelector('input[type="number"]') || target?.querySelector('input');
    } else if (type === 'customer') {
      target = document.getElementById('field-idName') || document.getElementById('section-id-verification') || document.getElementById('section-customer');
      focusInput = target?.querySelector('input');
    } else if (type === 'compliance') {
      target = document.getElementById('rbf-compliance-section') || document.getElementById('section-rbf-compliance');
      focusInput = target?.querySelector('select, input, textarea');
    } else if (type === 'documents') {
      target = document.getElementById('exchange-documents') || document.getElementById('field-docFile');
      focusInput = target?.querySelector('input[type="file"], button');
    } else if (type === 'photo') {
      target = document.getElementById('customer-photo-section');
      focusInput = target?.querySelector('button');
    }

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-[#0B7A44]', 'rounded-xl', 'transition-all');
      setTimeout(() => {
        target.classList.remove('ring-2', 'ring-[#0B7A44]');
      }, 1500);
      if (focusInput && typeof focusInput.focus === 'function') {
        setTimeout(() => focusInput.focus(), 350);
      }
    }
  }, []);

  const handleProgressChange = useCallback((info) => {
    setProgressInfo(prev => {
      const newCompleted = info?.completedCount ?? info?.requiredFieldsInfo?.completedCount ?? prev.completedCount;
      const newTotal = info?.totalCount ?? info?.requiredFieldsInfo?.totalCount ?? prev.totalCount;
      if (
        prev.completedCount === newCompleted &&
        prev.totalCount === newTotal &&
        prev.customerVerified === info.customerVerified &&
        prev.amountDone === info.amountDone &&
        prev.complianceDone === info.complianceDone &&
        prev.docsDone === info.docsDone &&
        prev.fjdTotal === info.fjdTotal
      ) {
        return prev;
      }
      return {
        ...prev,
        ...info,
        completedCount: newCompleted,
        totalCount: newTotal,
      };
    });
  }, []);

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('exchangeCurrentStep');
    return !startNewExchange && saved ? JSON.parse(saved) : Step.DETAILS;
  });

  const [formKey, setFormKey] = useState(0);

  const loginUser = useUser();

  const [senderInfo] = useState({
    name: 'Niranjan Singh',
    email: 'niranjan.ks@anantdv.com',
    phone: '+91 1234567890',
  });

  const { selectedWarehouse } = useSettings();

  // Full transfer payload saved when ReceiverForm submits — used by ReviewStep
  const [transferPayload, setTransferPayload] = useState(() => {
    const saved = sessionStorage.getItem('exchangeTransferPayload');
    return !startNewExchange && saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    sessionStorage.setItem('exchangeCurrentStep', JSON.stringify(currentStep));
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [currentStep]);
  useEffect(() => { sessionStorage.setItem('exchangeReceiverInfo', JSON.stringify(receiverInfo)); }, [receiverInfo]);
  useEffect(() => { sessionStorage.setItem('exchangeSummary', JSON.stringify(summary)); }, [summary]);
  useEffect(() => { sessionStorage.setItem('exchangeTransferPayload', JSON.stringify(transferPayload)); }, [transferPayload]);

  const [transactionId, setTransactionId] = useState(() => {
    const saved = sessionStorage.getItem('exchangeTransactionId');
    return saved ? JSON.parse(saved) : null;
  });

  // Stores the created Currency Exchange For Customer doc from ERPNext API
  const [apiResponseDoc, setApiResponseDoc] = useState(() => {
    const saved = sessionStorage.getItem('exchangeApiResponseDoc');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (transactionId) sessionStorage.setItem('exchangeTransactionId', JSON.stringify(transactionId));
  }, [transactionId]);

  useEffect(() => {
    if (apiResponseDoc) sessionStorage.setItem('exchangeApiResponseDoc', JSON.stringify(apiResponseDoc));
  }, [apiResponseDoc]);

  const handleSummaryChange = useCallback((incoming) => {
    setSummary(prev => {
      const resolvedType = requestedExchangeType || incoming.exchangeType || prev.exchangeType || 'BUY';
      if (
        prev.sendAmount === incoming.sendAmount &&
        prev.currency === incoming.currency &&
        prev.exchangeRate === incoming.exchangeRate &&
        prev.receiverGets === incoming.receiverGets &&
        prev.receiverCurrency === incoming.receiverCurrency &&
        prev.exchangeType === resolvedType
      ) {
        return prev;
      }
      return {
        ...prev,
        sendAmount: incoming.sendAmount,
        currency: incoming.currency,
        exchangeRate: incoming.exchangeRate,
        receiverGets: incoming.receiverGets,
        fee: incoming.receiverGets * 0.02,
        receiverCurrency: incoming.receiverCurrency,
        exchangeType: resolvedType,
      };
    });

    setHandleSumamryChange(prev => {
      if (
        prev?.sendAmount === incoming?.sendAmount &&
        prev?.currency === incoming?.currency &&
        prev?.exchangeRate === incoming?.exchangeRate &&
        prev?.receiverGets === incoming?.receiverGets &&
        prev?.receiverCurrency === incoming?.receiverCurrency &&
        prev?.exchangeType === incoming?.exchangeType
      ) {
        return prev;
      }
      return incoming;
    });
  }, []);

  // Called when ReceiverForm hits Continue — save full payload and go to REVIEW
  const handleContinue = useCallback((data) => {
    // Keep the raw File object in a ref — sessionStorage can't hold Files.
    // GovernmentIdSection stores a File directly via setValue (not a FileList).
    if (data.ticket instanceof File) {
      ticketFileRef.current = data.ticket;
    } else {
      ticketFileRef.current = null;
    }

    const payloadWithPhoto = {
      ...data,
      customerImageFile: customerImageFileRef.current,
      customerImageUrl,
    };

    setReceiverInfo(data);
    setTransferPayload(payloadWithPhoto);
    console.log('Transfer payload:', payloadWithPhoto);

    setSummary(prev => ({
      ...prev,
      sendAmount: data.sendAmount,
      currency: data.exchangeType === 'BUY' ? data.foreignCurrency : data.localCurrency,
      exchangeRate: data.exchangeRate,
      receiverGets: data.receiverGets,
      receiverCurrency: data.exchangeType === 'BUY' ? data.localCurrency : data.foreignCurrency,
    }));

    // Go to REVIEW (step 4) instead of PAYMENT
    setCurrentStep(Step.REVIEW);
  }, [customerImageUrl]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(Step.ESTIMATE, prev - 1));
  }, []);

  const clearExchangeForm = useCallback((newType) => {
    const targetType = newType || 'BUY';
    ticketFileRef.current = null;
    customerImageFileRef.current = null;
    setCustomerImageFile(null);
    setCustomerImageUrl('');
    setCustomerMode('new');
    setCustomerFound(false);
    sessionStorage.removeItem('exchangeCustomerImageUrl');
    sessionStorage.removeItem('exchangeCurrentStep');
    sessionStorage.removeItem('exchangeReceiverInfo');
    sessionStorage.removeItem('exchangeSummary');
    sessionStorage.removeItem('exchangeTransferPayload');
    sessionStorage.removeItem('exchangeTransactionId');
    sessionStorage.removeItem('exchangeApiResponseDoc');
    sessionStorage.removeItem('exchangeInvoiceData');

    setReceiverInfo({
      firstName: '',
      lastName: '',
      phone_number: '',
      email: '',
      country: '',
      city: '',
      deliveryMethod: 'BANK_DEPOSIT',
      bankName: '',
      accountNumber: '',
      senderCurrency: 'USD',
      receiverCurrency: 'EUR',
      exchangeType: targetType,
    });
    setSummary({
      sendAmount: null,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 0,
      receiverCurrency: 'EUR',
      exchangeType: targetType,
    });
    setTransferPayload(null);
    setTransactionId(null);
    setApiResponseDoc(null);
    setCurrentStep(Step.DETAILS);
    setFormKey(prev => prev + 1);
  }, []);

  const prevExchangeTypeRef = React.useRef(requestedExchangeType || 'BUY');
  useEffect(() => {
    if (requestedExchangeType && ['BUY', 'SELL'].includes(requestedExchangeType)) {
      if (prevExchangeTypeRef.current !== requestedExchangeType) {
        prevExchangeTypeRef.current = requestedExchangeType;
        clearExchangeForm(requestedExchangeType);
      }
    }
  }, [requestedExchangeType, clearExchangeForm]);

  // Called from ReviewStep → Cancel → reset everything and go back to DETAILS
  const handleCancel = useCallback(() => {
    clearExchangeForm(summary.exchangeType || 'BUY');
  }, [clearExchangeForm, summary.exchangeType]);

  // Called from ReviewStep → Edit buttons → go back to DETAILS
  const handleEditFromReview = useCallback(() => {
    setCurrentStep(Step.DETAILS);
  }, []);

  // Called from ReviewStep → Confirm & Send → go to PAYMENT
  // const handleConfirm = useCallback(() => {
  //   const txId = `#TRX-${Math.floor(100000 + Math.random() * 900000)}`;
  //   setTransactionId(txId);
  //   setCurrentStep(Step.PAYMENT);
  //   // TODO: trigger your actual payment / API call here
  //   console.log('Confirmed! Proceeding to payment with:', transferPayload);
  // }, [transferPayload]);




  const handleConfirm = useCallback(async () => {
    if (!transferPayload) return;

    if (!selectedWarehouse?.warehouse) {
      setShowLocationModal(true);
      return;
    }

    try {
      const uploadedDocuments = [];
      for (const row of transferPayload.documents || []) {
        const attachment = row.attachment instanceof File
          ? await uploadFile(row.attachment, { isPrivate: 1 })
          : row.attachment;
        if (typeof attachment !== 'string' || !attachment.trim()) throw new Error(`Please go back and reselect the attachment for ${row.document_type}. The selected file was lost after a page refresh.`);
        uploadedDocuments.push({ document_type: row.document_type.trim(), attachment, notes: row.notes || '' });
      }
      const documentUrl = type => uploadedDocuments.find(row => row.document_type === type)?.attachment || null;
      const uploadedFileUrl = documentUrl(transferPayload.government_id || (transferPayload.idType === 'PASSPORT' ? 'Passport' : 'Government ID')) || uploadedDocuments[0]?.attachment || null;
      const ticketDocUrl = documentUrl('Ticket');

      let customerPhotoUrl = null;
      const custPhoto = customerImageFileRef.current || (transferPayload.customerImageFile instanceof File ? transferPayload.customerImageFile : null);
      if (custPhoto instanceof File) {
        customerPhotoUrl = await uploadFile(custPhoto, {
          isPrivate: 0,
          doctype: "Customer",
        });
      } else if (typeof customerImageUrl === "string" && customerImageUrl) {
        customerPhotoUrl = customerImageUrl;
      } else if (typeof transferPayload.customerImageUrl === "string" && transferPayload.customerImageUrl) {
        customerPhotoUrl = transferPayload.customerImageUrl;
      }
      // Decide which field to use
      let idDocumentField = {};

      if (uploadedFileUrl) {
        if (transferPayload.idType === "PASSPORT") {
          idDocumentField.passport_photo__scan = uploadedFileUrl;
        }

        if (transferPayload.idType === "GOVERNMENT_ID") {
          idDocumentField.government_id_photo__scan = uploadedFileUrl;
        }
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


      const localAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.sendAmount : transferPayload.receiverGets;
      const foreignAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.receiverGets : transferPayload.sendAmount;

      const apiPayload = {
        data: {
          verification_id_type: transferPayload.idType,
          documents: uploadedDocuments,
          passport_number: transferPayload.idNumber,
          first_name: transferPayload.firstName,
          last_name: transferPayload.lastName,
          phone_number: transferPayload.phone_number || transferPayload.phoneNumber || transferPayload.phone || null,
          receiver_mailid: transferPayload.email || senderInfo.email,
          destination_country: transferPayload.country,
          city__province: transferPayload.city,
          id_number: transferPayload.idNumber,
          government_id: transferPayload.government_id,
          customer_id: transferPayload.customer_id,
          customer_name_and_dob: `${transferPayload.idName}_${transferPayload.dateOfBirth}`,
          full_name: transferPayload.idName,
          date_of_birth: transferPayload.dateOfBirth,
          id_issue_date: transferPayload.id_issue_date || null,
          id_expiry_date: transferPayload.id_expiry_date || null,
          occupation: transferPayload.occupation,
          second_last_name_family_name: transferPayload.secondLastName,
          id_issue_stateprovince: transferPayload.idIssueState,
          id_issue_country: transferPayload.idIssueCountry,
          customer_image: customerPhotoUrl,
          image: customerPhotoUrl,
          ticket: transferPayload.ticket,
          oet_code: transferPayload.oet_code,
          ...idDocumentField,


          local_amount: localAmount,
          fjd_equivalent: localAmount,
          local_currency: "FJD",
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
          total_amount: transferPayload.sendAmount + summary.fee,

          customer_request_reference: transferPayload.request_reference || null,
          rbf_purpose: transferPayload.rbf_purpose || null,
          rbf_documents: transferPayload.rbf_documents || [],
          nationality: transferPayload.nationality || null,
          nationality_type: transferPayload.nationality_type || null,
          other_nationality: transferPayload.other_nationality || null,
          residency_status: transferPayload.residency_status || null,
          source_of_funds: transferPayload.source_of_funds || null,
          rbf_approval: transferPayload.rbf_approval || null,
          rbf_beneficiary_reference: transferPayload.rbf_beneficiary_reference || null,
          rbf_student_reference: transferPayload.rbf_student_reference || null,
          rbf_family_reference: transferPayload.rbf_family_reference || null,
          rbf_invoice_reference: transferPayload.rbf_invoice_reference || null,
          imported_funds_available_fjd: transferPayload.imported_funds_available_fjd || null,
          passport_endorsement_completed: transferPayload.passport_endorsement_completed ? 1 : 0,
          tf_form_reference: transferPayload.tf_form_reference || null,
          sanctions_acknowledged_references: transferPayload.sanctions_acknowledged_references || "",
          tin_number: transferPayload.tinNumber || null,
          risk_level: transferPayload.risk_level || 'Low',
          remarks: transferPayload.remarks || '',

          purposeOfTransaction: transferPayload.purposeOfTransaction,
          travelDate: transferPayload.travelDate,
          destination: transferPayload.destination,
          pnrNumber: transferPayload.pnrNumber,
          airwaysName: transferPayload.airwaysName,
          flightNumber: transferPayload.flightNumber,
          ticket: ticketDocUrl || (typeof transferPayload.ticket === "string" ? transferPayload.ticket : null),

          denomination: denominationData,

          receiver__gets: receiverData,

          warehouse: selectedWarehouse?.warehouse

        },
      };


      const response = await fetch(
        "/api/method/moneygram.moneygram.api.create_currency_exchange.create_currency_exchange",
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
        let errorMsg = "Something went wrong while creating exchange";
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

      const createdDoc = result?.message?.data || result?.data || result;
      setApiResponseDoc(createdDoc);

      const targetCustId = createdDoc?.customer_id || transferPayload?.customer_id || transferPayload?.full_name;
      if (targetCustId && transferPayload?.risk_level) {
        updateCustomerRiskLevel(targetCustId, transferPayload.risk_level, loginUser).catch(() => { });
      }

      const txId = createdDoc?.name || `#TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionId(txId);

      setCurrentStep(Step.PAYMENT);

    } catch (error) {
      console.error("API Error:", error);
      alert("Something went wrong while creating exchange: " + (error?.message || error));
    }
  }, [transferPayload, senderInfo.email, summary, transferPayload?.receiverDenominationRows, loginUser]);



  const handleDashboard = useCallback(() => {
    ticketFileRef.current = null;
    customerImageFileRef.current = null;
    setCustomerImageFile(null);
    setCustomerImageUrl('');
    setCustomerMode('new');
    setCustomerFound(false);
    sessionStorage.removeItem('exchangeCustomerImageUrl');
    // Reset receiver info
    setReceiverInfo({
      firstName: '',
      lastName: '',
      country: '',
      city: '',
      deliveryMethod: 'BANK_DEPOSIT',
      bankName: '',
      accountNumber: '',
      senderCurrency: 'USD',
      receiverCurrency: 'EUR',
    });

    // Reset summary
    setSummary({
      sendAmount: 0,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 920.00,
      receiverCurrency: 'EUR',
      exchangeType: 'BUY',
    });

    // Clear transfer data
    setTransferPayload(null);
    setTransactionId(null);
    setApiResponseDoc(null);

    // Go back to form step
    setCurrentStep(Step.DETAILS);

    sessionStorage.removeItem('exchangeCurrentStep');
    sessionStorage.removeItem('exchangeReceiverInfo');
    sessionStorage.removeItem('exchangeSummary');
    sessionStorage.removeItem('exchangeTransferPayload');
    sessionStorage.removeItem('exchangeTransactionId');
    sessionStorage.removeItem('exchangeApiResponseDoc');
    sessionStorage.removeItem('exchangeInvoiceData');
    setFormKey(prev => prev + 1);

  }, []);

  const handleDownloadReceipt = useCallback(() => {
    // TODO: generate PDF receipt
    console.log('Download receipt for:', transactionId);
  }, [transactionId]);

  // ── Step content ─────────────────────────────────────────────────────────────
  const renderStepContent = () => {
    if (currentStep === Step.REVIEW) {
      return (
        <ReviewStep
          data={transferPayload}
          senderName={senderInfo.name}
          paymentLabel="Visa •••• 4242"
          fee={TRANSFER_FEE}
          onEdit={handleEditFromReview}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      );
    }

    if (currentStep === Step.PAYMENT) {

      return (
        <TransferSuccessNew
          data={transferPayload}
          apiDoc={apiResponseDoc}
          transactionId={transactionId}
          estimatedArrival="Today by 5:00 PM"
          onDashboard={handleDashboard}
          onDownloadReceipt={handleDownloadReceipt}
          isExchange={true}
        />
      );
    }


    return (
      <ReceiverForm
        key={`form-refresh-key-${formKey}`}
        initialData={receiverInfo}
        sendAmount={summary.sendAmount}
        onContinue={handleContinue}
        onClear={handleCancel}
        onSummaryChange={handleSummaryChange}
        ratesData={ratesData}
        onCustomerChange={handleCustomerChange}
        onProgressChange={handleProgressChange}
      />
    );
  };


  return (
    <div className="money-exchange-new min-h-screen flex flex-col bg-[#F4F5F7] text-[#14171F]">
      <style>{`
        .money-exchange-new {
          background: #F4F5F7;
          min-height: 100vh;
          font-family: Inter, system-ui, -apple-system, sans-serif;
          color: #14171F;
        }
        .money-exchange-new .card {
          background: #fff;
          border: 1px solid #E3E6EB;
          border-radius: 16px;
        }
        .money-exchange-new .lbl {
          display: block;
          font-size: var(--text-label);
          line-height: var(--text-label--line-height);
          font-weight: var(--text-label--font-weight);
          letter-spacing: .02em;
          color: #14171F;
          margin-bottom: 6px;
        }
        .money-exchange-new .inp {
          width: 100%;
          height: 48px;
          border: 1px solid #BFC5CE;
          border-radius: 10px;
          padding: 0 14px;
          font-size: var(--text-body-value);
          line-height: var(--text-body-value--line-height);
          font-weight: var(--text-body-value--font-weight);
          font-family: var(--font-sans);
          color: #14171F;
          background: #fff;
          box-sizing: border-box;
          transition: border-color .15s, box-shadow .15s;
        }
        .money-exchange-new .inp:focus {
          outline: none;
          border-color: #C8102E;
          box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.12);
        }
        .money-exchange-new .sec {
          padding: 28px;
          border-bottom: 1px solid #E3E6EB;
        }
        .money-exchange-new .h {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 20px;
          font-size: var(--text-h3);
          line-height: var(--text-h3--line-height);
          font-weight: var(--text-h3--font-weight);
          color: #14171F;
        }
        .money-exchange-new .n {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #14171F;
          color: #fff;
          font-size: var(--text-caption);
          font-weight: 700;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .money-exchange-new .g2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .money-exchange-new .g3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 840px) {
          .money-exchange-new .g2,
          .money-exchange-new .g3 {
            grid-template-columns: 1fr;
          }
        }
        .money-exchange-new .chip {
          display: inline-flex;
          align-items: center;
          height: 32px;
          padding: 0 12px;
          border-radius: 999px;
          font-size: var(--text-caption);
          line-height: var(--text-caption--line-height);
          font-weight: 600;
          background: #EEF0F3;
          color: #2C323D;
        }
        .money-exchange-new .ok {
          background: #E3F3EA;
          color: #0B5A33;
        }
        .money-exchange-new .warn {
          background: #FFF3D6;
          color: #7A4B00;
        }
        .money-exchange-new .opt {
          border: 1.5px solid #CDD2DA;
          border-radius: 12px;
          padding: 16px;
          background: #fff;
          cursor: pointer;
          transition: all .15s;
        }
        .money-exchange-new .opt:hover {
          border-color: #BFC5CE;
        }
        .money-exchange-new .opt.sel {
          border-color: #C8102E;
          background: #FDF1F3;
        }
        .money-exchange-new .row {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-body);
          line-height: var(--text-body--line-height);
          font-weight: var(--text-body--font-weight);
          padding: 8px 0;
        }
        .money-exchange-new .row span:first-child {
          color: #4A5160;
        }
        .money-exchange-new .btn {
          height: 52px;
          padding: 0 28px;
          border-radius: 12px;
          border: 0;
          background: #C8102E;
          color: #fff;
          font-size: var(--text-btn-lg);
          line-height: var(--text-btn-lg--line-height);
          font-weight: var(--text-btn-lg--font-weight);
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .money-exchange-new .btn:hover:not(:disabled) {
          background: #a60d26;
        }
        .money-exchange-new .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .money-exchange-new .ghost {
          background: #fff;
          color: #14171F;
          border: 1px solid #BFC5CE;
        }
        .money-exchange-new .ghost:hover:not(:disabled) {
          background: #F4F5F7;
        }
        .money-exchange-new .tab {
          height: 50px;
          padding: 0 28px;
          border: 0;
          background: transparent;
          font-size: var(--text-btn-lg);
          line-height: var(--text-btn-lg--line-height);
          font-weight: var(--text-btn-lg--font-weight);
          font-family: var(--font-sans);
          color: #4A5160;
          border-radius: 12px;
          cursor: pointer;
          transition: all .15s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
        }
        .money-exchange-new .tab.on {
          background: #C8102E;
          color: #fff;
        }
        .money-exchange-new .chk {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: var(--text-label);
          line-height: var(--text-label--line-height);
          font-weight: var(--text-label--font-weight);
          padding: 6px 0;
          color: #14171F;
        }
        .money-exchange-new .dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #0B7A44;
          flex: none;
          display: grid;
          place-items: center;
          color: #fff;
          font-size: var(--text-overline);
        }
        .money-exchange-new .dot.o {
          background: #fff;
          border: 2px solid #BFC5CE;
        }
        @keyframes boardRateMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .money-exchange-new .marquee-container {
          overflow: hidden;
          position: relative;
          width: 100%;
          min-width: 0;
          mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent);
        }
        .money-exchange-new .marquee-track {
          display: flex;
          align-items: center;
          gap: 12px;
          width: max-content;
          animation: boardRateMarquee 40s linear infinite;
        }
        .money-exchange-new .marquee-track:hover {
          animation-play-state: paused;
        }
        @media (max-width: 1024px) {
          .money-exchange-new .main-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <Navbar />

      <ExchangeProvider summary={summary}>
        <main className="grow py-6 px-4 sm:px-6 w-full pb-20">
          <div className="max-w-[80%] mx-auto">

            {/* Top Board Rates Bar with Scrolling Marquee */}
            <div
              className="card"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "12px 20px 24px 20px",
                fontSize: "var(--text-label)",
                overflow: "hidden",
                marginBottom: "0px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  paddingRight: "14px",
                  borderRight: "1.5px solid #E3E6EB",
                }}
              >
                <strong style={{ fontSize: "var(--text-label)", color: "#14171F" }}>
                  Board rates · 1 unit in FJD
                </strong>
              </div>

              <div className="marquee-container">
                <div className="marquee-track">
                  {boardCurrencies.map((c, idx) => (
                    <span
                      key={`curr-1-${c.code}-${idx}`}
                      className="chip"
                      style={{ flexShrink: 0, whiteSpace: "nowrap", gap: "6px" }}
                    >
                      <strong style={{ color: "#14171F" }}>{c.code}</strong>
                      <span style={{ color: "#4A5160" }}>{c.rate}</span>
                    </span>
                  ))}
                  {boardCurrencies.map((c, idx) => (
                    <span
                      key={`curr-2-${c.code}-${idx}`}
                      className="chip"
                      style={{ flexShrink: 0, whiteSpace: "nowrap", gap: "6px" }}
                    >
                      <strong style={{ color: "#14171F" }}>{c.code}</strong>
                      <span style={{ color: "#4A5160" }}>{c.rate}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Mode Navigation Tabs */}
            <TransactionTabBar
              activeTab={launchExchangeType || summary.exchangeType || 'BUY'}
              onTabChange={(target) => {
                if (target === 'BUY' || target === 'SELL') {
                  clearExchangeForm(target);
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
                  <div style={{ padding: "16px 28px", background: "#FFF3D6", color: "#7A4B00", border: "1px solid #E3E6EB", borderRadius: "16px", fontSize: "var(--text-label)", marginBottom: "20px" }}>
                    <strong>Branch location required:</strong> Please select a branch location in Settings before processing transactions.
                  </div>
                )}

                {renderStepContent()}
              </div>

              {/* Right Sidebar */}
              {currentStep !== Step.PAYMENT && (
                <aside className="custom-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "24px", position: "sticky", top: "24px", maxHeight: "calc(100vh - 48px)", overflowY: "auto", paddingRight: "4px" }}>
                  <Summary transferPayload={summaryChange} />

                  {/* Customer Photo Card */}
                  <div id="customer-photo-section">
                    <CustomerPhotoCard
                      customerImageUrl={customerImageUrl}
                      customerImageFile={customerImageFile}
                      onImageChange={(file, previewUrl) => {
                        setCustomerImageFile(file);
                        customerImageFileRef.current = file;
                        setCustomerImageUrl(previewUrl);
                      }}
                      onImageRemove={() => {
                        setCustomerImageFile(null);
                        customerImageFileRef.current = null;
                        setCustomerImageUrl('');
                      }}
                      disabled={currentStep === Step.REVIEW}
                      customerFound={customerFound}
                    />
                  </div>

                  {/* Ready to submit checklist card */}
                  <div className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-label)", marginBottom: "8px" }}>
                      <strong>Ready to submit</strong>
                      <span style={{ color: "#4A5160" }}>
                        {progressInfo.completedCount || 0} of {progressInfo.totalCount || 10}
                      </span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "8px", background: "#E3E6EB", marginBottom: "12px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round(((progressInfo.completedCount || 0) / (progressInfo.totalCount || 10)) * 100))}%`,
                          height: "8px",
                          borderRadius: "8px",
                          background: "#0B7A44",
                          transition: "width .3s ease",
                        }}
                      />
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('amount')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('amount')}
                      title="Jump to Amount and rate"
                    >
                      <span className={`dot ${progressInfo.amountDone ? "" : "o"}`}>
                        {progressInfo.amountDone ? "✓" : ""}
                      </span>
                      <span className="group-hover:text-[#0B7A44] transition-colors font-medium">Amount and rate</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('customer')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('customer')}
                      title="Jump to Customer verification"
                    >
                      <span className={`dot ${progressInfo.customerVerified ? "" : "o"}`}>
                        {progressInfo.customerVerified ? "✓" : ""}
                      </span>
                      <span className="group-hover:text-[#0B7A44] transition-colors font-medium">Customer verified</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('compliance')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('compliance')}
                      title="Jump to Purpose and source of funds"
                    >
                      <span className={`dot ${progressInfo.complianceDone ? "" : "o"}`}>
                        {progressInfo.complianceDone ? "✓" : ""}
                      </span>
                      <span className="group-hover:text-[#0B7A44] transition-colors font-medium">Purpose and source of funds</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('documents')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('documents')}
                      title="Jump to Supporting documents"
                    >
                      <span className={`dot ${progressInfo.docsDone ? "" : "o"}`}>
                        {progressInfo.docsDone ? "✓" : ""}
                      </span>
                      <span className="group-hover:text-[#0B7A44] transition-colors font-medium">Supporting document</span>
                    </div>
                    <div
                      className="chk cursor-pointer select-none transition-all hover:bg-gray-50 p-1.5 -mx-1.5 rounded-lg flex items-center gap-2 group"
                      role="button"
                      tabIndex={0}
                      onClick={() => scrollToSection('photo')}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && scrollToSection('photo')}
                      title="Jump to Customer photo"
                    >
                      <span className={`dot ${customerImageUrl || customerImageFile ? "" : "o"}`}>
                        {customerImageUrl || customerImageFile ? "✓" : ""}
                      </span>
                      <span className="group-hover:text-[#0B7A44] transition-colors font-medium">Customer photo</span>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </ExchangeProvider>

      {/* Location required modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#E00000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-gray-900 text-xl font-bold mb-2">No Location Selected</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Please select a <span className="font-semibold text-gray-700">Location</span> before confirming the transaction. You can change it from the settings.
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

export default MoneyExchangeNew;
