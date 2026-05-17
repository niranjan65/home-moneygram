import React, { useState, useCallback, useEffect } from 'react';
import { Stepper } from '../components/Stepper';
import { Summary } from '../components/Summary';
import { SenderCard } from '../components/SenderCard';
import { DealerForm } from '../features/exchange/components/DealerForm';
import { ReviewStep } from '../components/ReviewStep';
import Navbar from '../components/layout/Navbar';
import { TransferSuccess } from '../components/TransferSuccess';
import { ExchangeProvider } from '../context/ExchangeContext';
import { useERPNextRates } from '../hooks/useERPNextRates';
import { useUser } from '../context/UserContext';
import { useSettings } from '../context/SettingsContext';
import { useERPFileUpload } from '../hooks/useERPFileUpload';

const Step = {
  ESTIMATE: 1,
  DETAILS: 2,
  REVIEW: 3,
  PAYMENT: 4,
};

const TRANSFER_FEE = 4.99;

const DealerExchange = () => {
  const { uploadFile } = useERPFileUpload();
  const ratesData = useERPNextRates();
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

  const [receiverInfo, setReceiverInfo] = useState(() => {
    const saved = sessionStorage.getItem('dealerReceiverInfo');
    return saved ? JSON.parse(saved) : {
      firstName: '',
      lastName: '',
      middleName: '',
      fullName: '',
      dateOfBirth: '',
      senderCurrency: 'USD',
      receiverCurrency: 'EUR',
    };
  });

  const [summary, setSummary] = useState(() => {
    const saved = sessionStorage.getItem('dealerSummary');
    return saved ? JSON.parse(saved) : {
      sendAmount: null,
      currency: 'USD',
      fee: TRANSFER_FEE,
      exchangeRate: 1.0,
      receiverGets: 0,
      receiverCurrency: 'EUR',
      exchangeType: 'BUY',
    };
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


  useEffect(() => { sessionStorage.setItem('dealerCurrentStep', JSON.stringify(currentStep)); }, [currentStep]);
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

  const handleContinue = useCallback((data) => {
    setReceiverInfo(data);
    setTransferPayload(data);

    setSummary(prev => ({
      ...prev,
      sendAmount: data.sendAmount,
      currency: data.exchangeType === 'BUY' ? data.foreignCurrency : data.localCurrency,
      exchangeRate: data.exchangeRate,
      receiverGets: data.receiverGets,
      receiverCurrency: data.exchangeType === 'BUY' ? data.localCurrency : data.foreignCurrency,
    }));

    setCurrentStep(Step.REVIEW);
  }, []);

  const handleCancel = useCallback(() => {
    setReceiverInfo({
      firstName: '',
      lastName: '',
      middleName: '',
      fullName: '',
      dateOfBirth: '',
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

    sessionStorage.removeItem('dealerCurrentStep');
    sessionStorage.removeItem('dealerReceiverInfo');
    sessionStorage.removeItem('dealerSummary');
    sessionStorage.removeItem('dealerTransferPayload');
    sessionStorage.removeItem('dealerTransactionId');
    sessionStorage.removeItem('dealerApiResponseDoc');
    setFormKey(prev => prev + 1);
  }, []);

  const handleEditFromReview = useCallback(() => {
    setCurrentStep(Step.DETAILS);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!transferPayload) return;

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
      const localAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.sendAmount : transferPayload.receiverGets;
      const foreignAmount = transferPayload.exchangeType === 'BUY' ? transferPayload.receiverGets : transferPayload.sendAmount;

      const apiPayload = {
        data: {
          first_name: transferPayload.firstName,
          last_name: transferPayload.lastName,
          full_name: transferPayload.fullName,
          date_of_birth: transferPayload.dateOfBirth,
          customer_name_and_dob: `${transferPayload.fullName.toLowerCase()}_${transferPayload.dateOfBirth}`,
          oet_code: transferPayload.oet_code,

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
          total_amount: transferPayload.sendAmount ,

          warehouse: selectedWarehouse?.warehouse,

          denomination: denominationData,

          receiver_gets: receiverData,
        },
      };


      console.log("api payload", apiPayload)

      // Just navigating to SUCCESS directly to avoid blocking if API fails or is not implemented for Dealer yet
      const txId = `#DLR-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionId(txId);

      const response = await fetch(
        "/api/method/moneygram.moneygram.api.create_dealer_exchange.create_dealer_exchange",
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
      setCurrentStep(Step.PAYMENT);

    } catch (error) {
      console.error("API Error:", error);
      alert("Something went wrong while creating dealer exchange");
    }
  }, [transferPayload, summary, selectedWarehouse]);

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
        <TransferSuccess
          data={transferPayload}
          apiDoc={apiResponseDoc}
          transactionId={transactionId}
          estimatedArrival="Processed immediately"
          onDashboard={handleDashboard}
          onDownloadReceipt={handleDownloadReceipt}
        />
      );
    }

    return (
      <>
        <SenderCard sender={{ ...senderInfo, name: 'Dealer Exchange Terminal' }} />

        <DealerForm
          key={`form-refresh-key-${formKey}`}
          initialData={receiverInfo}
          sendAmount={summary.sendAmount}
          onContinue={handleContinue}
          onClear={handleCancel}
          onSummaryChange={handleSummaryChange}
          ratesData={ratesData}
        />

        <div className="text-gray-400 text-xs font-semibold max-w-2xl px-2 leading-relaxed">
          By clicking continue, you agree to Dealer Exchange procedures.
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

              <div className={`${currentStep === Step.PAYMENT ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-10`}>
                {currentStep === Step.DETAILS && (
                  <div className="flex flex-col gap-3">
                    <h1 className="text-gray-900 text-3xl sm:text-5xl font-black tracking-tight leading-none">
                      Dealer Exchange <span className="text-[#E00000] italic">Portal</span>
                    </h1>
                  </div>
                )}

                {renderStepContent()}
              </div>

              {currentStep !== Step.PAYMENT && (
                <div className="lg:col-span-4 relative">
                  <Summary transferPayload={summaryChange} isDealer={true} />
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

export default DealerExchange;

