import React, { useState, useCallback, useEffect } from 'react';
import { Stepper } from '../components/Stepper';
import { Summary } from '../components/Summary';
import { SenderCard } from '../components/SenderCard';
import { ReceiverForm } from '../features/exchange/components/ReceiverForm';
import { ReviewStep } from '../components/ReviewStep';
import Navbar from '../components/layout/Navbar';
import { TransferSuccess } from '../components/TransferSuccess';
import { useERPFileUpload } from '../hooks/useERPFileUpload';
import { ExchangeProvider } from '../context/ExchangeContext';
import { useSettings } from '../context/SettingsContext';
import { useERPNextRates } from '../hooks/useERPNextRates';
import { CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';

const Step = {
  ESTIMATE: 1,
  DETAILS: 2,
  REVIEW: 3,
  PAYMENT: 4,
};

const TRANSFER_FEE = 4.99;



const MoneyExchange = () => {
  const { uploadFile } = useERPFileUpload();
  const ratesData = useERPNextRates();

  const [summaryChange, setHandleSumamryChange] = useState();

  // Holds the raw rbfDocument File between DETAILS → REVIEW steps.
  // Can't use sessionStorage because File objects are not serialisable.
  const rbfDocumentFileRef = React.useRef(null);

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem('exchangeCurrentStep');
    return saved ? JSON.parse(saved) : Step.DETAILS;
  });

  const [formKey, setFormKey] = useState(0);

  const loginUser = useUser();

  const [senderInfo] = useState({
    name: 'Niranjan Singh',
    email: 'niranjan.ks@anantdv.com',
    phone: '+91 1234567890',
  });

  const { selectedWarehouse } = useSettings();

  const [receiverInfo, setReceiverInfo] = useState(() => {
    const saved = sessionStorage.getItem('exchangeReceiverInfo');
    return saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      country: '',
      city: '',
      deliveryMethod: 'BANK_DEPOSIT',
      bankName: '',
      accountNumber: '',
      senderCurrency: 'USD',
      receiverCurrency: 'EUR',
    };
  });

  const [summary, setSummary] = useState(() => {
    const saved = sessionStorage.getItem('exchangeSummary');
    return saved ? JSON.parse(saved) : {
      sendAmount: null,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 920.00,
      receiverCurrency: 'EUR',
      exchangeType: 'BUY',
    };
  });

  // Full transfer payload saved when ReceiverForm submits — used by ReviewStep
  const [transferPayload, setTransferPayload] = useState(() => {
    const saved = sessionStorage.getItem('exchangeTransferPayload');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => { sessionStorage.setItem('exchangeCurrentStep', JSON.stringify(currentStep)); }, [currentStep]);
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

    console.log("handle summary change called.........", incoming)
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

  // Called when ReceiverForm hits Continue — save full payload and go to REVIEW
  const handleContinue = useCallback((data) => {
    // Keep the raw File object in a ref — sessionStorage can't hold Files.
    // GovernmentIdSection stores a File directly via setValue (not a FileList).
    if (data.rbfDocument instanceof File) {
      rbfDocumentFileRef.current = data.rbfDocument;
      console.log('[RBF DEBUG] 4. handleContinue - File captured in ref ✅', data.rbfDocument.name);
    } else {
      rbfDocumentFileRef.current = null;
      console.log('[RBF DEBUG] 4. handleContinue - data.rbfDocument is NOT a File ❌', typeof data.rbfDocument, data.rbfDocument);
    }

    setReceiverInfo(data);
    setTransferPayload(data);
    console.log('Transfer payload:', data);

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
  }, []);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(Step.ESTIMATE, prev - 1));
  }, []);

  // Called from ReviewStep → Cancel → reset everything and go back to DETAILS
  const handleCancel = useCallback(() => {
    rbfDocumentFileRef.current = null;
    setReceiverInfo({
      firstName: '',
      lastName: '',
      country: '',
      city: '',
      deliveryMethod: 'BANK_DEPOSIT',
      bankName: '',
      accountNumber: '',
      localCurrency: 'FJD',
      foreignCurrency: 'USD',
    });
    setSummary({
      sendAmount: 0,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 0.02,
      receiverGets: 920.00,
      receiverCurrency: 'EUR',
      exchangeType: 'BUY',
    });
    setTransferPayload(null);
    setTransactionId(null);
    setApiResponseDoc(null);
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

    let uploadedFileUrl = null;

    if (transferPayload.docFile) {
      uploadedFileUrl = await uploadFile(transferPayload.docFile, {
        isPrivate: 0,
        doctype: "Currency Exchange For Customer",
      });
    }

    // Upload the RBF document (PDF) and capture the returned URL.
    // let rbfDocumentUrl = null;
    // const rbfFile = rbfDocumentFileRef.current;
    // console.log('[RBF DEBUG] 5. handleConfirm - rbfDocumentFileRef.current:', rbfFile?.name ?? 'null/undefined ❌');
    // if (rbfFile) {
    //   console.log('[RBF DEBUG] 5a. Calling uploadFile for RBF doc...');
    //   rbfDocumentUrl = await uploadFile(rbfFile, {
    //     isPrivate: 0,
    //     doctype: "Currency Exchange For Customer",
    //   });
    //   console.log('[RBF DEBUG] 6. RBF document upload result URL:', rbfDocumentUrl ?? 'null — upload may have failed ❌');
    // } else {
    //   console.log('[RBF DEBUG] 5b. Skipping RBF upload — no file in ref ❌');
    // }

    // console.log("transfer payload", transferPayload)

    try {
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
          custom_available_currency_transfer_balance: 2000,
          verification_id_type: transferPayload.idType,
          passport_number: transferPayload.idNumber,
          first_name: transferPayload.firstName,
          last_name: transferPayload.lastName,
          receiver_mailid: senderInfo.email,
          destination_country: transferPayload.country,
          city__province: transferPayload.city,
          id_number: transferPayload.idNumber,
          government_id: transferPayload.government_id,
          customer_name_and_dob: `${transferPayload.idName}_${transferPayload.dateOfBirth}`,
          full_name: transferPayload.idName,
          date_of_birth: transferPayload.dateOfBirth,
          occupation: transferPayload.occupation,
          second_last_name_family_name: transferPayload.secondLastName,
          id_issue_stateprovince: transferPayload.idIssueState,
          id_issue_country: transferPayload.idIssueCountry,
          ticket: transferPayload.ticket,
          oet_code: transferPayload.oet_code,
          ...idDocumentField,


          local_amount: localAmount,
          local_currency_type: transferPayload.localCurrency,

          foreign_amount: foreignAmount,
          foreign_currency_type: transferPayload.foreignCurrency,

          expected: localAmount,
          counted: localAmount,
          balanced: 0,

          exchange_rate: transferPayload.exchangeRate,
          exchangeType: transferPayload.exchangeType === 'BUY' ? 'SELL' : 'BUY',
          transfer_fee: summary.fee,
          send_amount: transferPayload.sendAmount,
          total_amount: transferPayload.sendAmount + summary.fee,

          // rbf_number: transferPayload.rbfNumber || null,
          // Use the uploaded file URL, not the raw File object.
          // rbf_document: rbfDocumentUrl || null,

          purposeOfTransaction: transferPayload.purposeOfTransaction,
          travelDate: transferPayload.travelDate,
          destination: transferPayload.destination,
          pnrNumber: transferPayload.pnrNumber,
          airwaysName: transferPayload.airwaysName,
          flightNumber: transferPayload.flightNumber,

          denomination: denominationData,

          receiver__gets: receiverData,

          warehouse: selectedWarehouse?.warehouse

        },
      };


      const response = await fetch(
        "https://mhmoneyexpress.anantdv.com/api/method/moneygram.moneygram.api.create_currency_exchange.create_currency_exchange",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
          credentials: "include",
          body: JSON.stringify(apiPayload),
        }
      );

      const result = await response.json();

      console.log("API Success:", result);


      const createdDoc = result?.message?.data || result?.data || result;
      setApiResponseDoc(createdDoc);


      const txId = createdDoc?.name || `#TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionId(txId);


      setCurrentStep(Step.PAYMENT);

    } catch (error) {
      console.error("API Error:", error);
      alert("Something went wrong while creating exchange");
    }
  }, [transferPayload, senderInfo.email, summary, transferPayload?.receiverDenominationRows, loginUser]);



  const handleDashboard = useCallback(() => {
    rbfDocumentFileRef.current = null;
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
        <TransferSuccess
          data={transferPayload}
          apiDoc={apiResponseDoc}
          transactionId={transactionId}
          estimatedArrival="Today by 5:00 PM"
          onDashboard={handleDashboard}
          onDownloadReceipt={handleDownloadReceipt}
        />
      );
    }


    return (
      <>
        <SenderCard sender={senderInfo} />

        <ReceiverForm
          key={`form-refresh-key-${formKey}`}
          initialData={receiverInfo}
          sendAmount={summary.sendAmount}
          onContinue={handleContinue}
          onClear={handleCancel}
          onSummaryChange={handleSummaryChange}
          ratesData={ratesData}
        />

        <div className="text-gray-400 text-xs font-semibold max-w-2xl px-2 leading-relaxed">
          By clicking continue, you agree to MoneyFlow's Terms of Service and Privacy Policy.
          Funds are usually delivered within minutes, subject to bank processing times and
          holiday schedules in the destination country.
        </div>
      </>
    );
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <ExchangeProvider summary={summary}>
        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-10">

            <Stepper currentStep={currentStep} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

              {/* Main Column — full width on success page */}
              <div className={`${currentStep === Step.PAYMENT ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-10`}>
                {currentStep === Step.DETAILS && (
                  <div className="flex flex-col gap-3">
                    <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
                      How much money are you exchanging{" "}
                      <span className="text-[#E00000] italic">today ?</span>
                    </h1>
                  </div>
                )}

                {renderStepContent()}
              </div>

              {/* Sidebar — hidden on success page */}
              {currentStep !== Step.PAYMENT && (
                <div className="lg:col-span-4 relative">
                  <Summary transferPayload={summaryChange} />
                </div>
              )}

            </div>
          </div>
        </main>
      </ExchangeProvider>

      <footer className="py-8 px-10 border-t border-gray-100 text-center text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
        © 2026 MoneyGram.
      </footer>
    </div>
  );
};

export default MoneyExchange;