import React from 'react';
import { Banknote, RefreshCw, Globe } from 'lucide-react';
import { DenominationPanel } from './DenominationPanel';

export const DenominationSection = ({
  senderInfo,
  receiverInfo,
  exchangeType,
  sendAmount,
  receiverGets,
  denomLoading,
  denomError,
  selectedDenomCountry,
  senderDenomRowsRef,
  receiverDenomRowsRef,
  onSenderStatusChange,
  onReceiverStatusChange,
}) => {
    console.log("senderInfo", senderInfo)
  return (
    <div className="flex flex-col gap-3 mt-5">
      <div className="flex items-center gap-2.5 px-1">
        <Banknote size={16} className="text-[#E00000] flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Cash Denomination Counts</p>
          <p className="text-xs text-gray-400">Counter staff: count and confirm notes for both sides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {senderInfo ? (
          <DenominationPanel
            title="Currency Out" 
            subtitle="Cash received from customer"
            flag={senderInfo.flag} 
            symbol={senderInfo.symbol} 
            currency={senderInfo.currency}
            notes={senderInfo.notes} 
            coins={senderInfo.coins}
            targetAmount={exchangeType === 'BUY' ? receiverGets : sendAmount}
            onRowsChange={rows => {
              senderDenomRowsRef.current = rows;
              const total = rows.reduce((s, r) => s + r.denom * r.count, 0);
              const target = exchangeType === 'BUY' ? receiverGets : sendAmount;
              onSenderStatusChange?.({ total, target });
            }}
            accentColor="#f97316"
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/40 flex flex-col items-center justify-center p-8 gap-2 text-center">
            <Banknote size={18} className="text-orange-300" />
            <p className="font-medium text-gray-400 text-sm">FJD denomination data not found</p>
            <p className="text-xs text-gray-300">Add Fiji to DENOMINATION_DATA</p>
          </div>
        )}

        {denomLoading ? (
          <div className="rounded-xl border border-gray-200 flex flex-col items-center justify-center p-8 gap-2 bg-gray-50">
            <RefreshCw size={18} className="animate-spin text-[#E00000]/80" />
            <p className="font-medium text-gray-400 text-sm">Loading denomination data…</p>
          </div>
        ) : denomError ? (
          <div className="rounded-xl border border-[#E00000]/20 bg-[#E00000]/5 flex items-center justify-center p-7">
            <p className="font-medium text-[#E00000] text-sm text-center">{denomError}</p>
          </div>
        ) : receiverInfo ? (
          <DenominationPanel
            title=" Currency In"
            subtitle={`Cash to disburse to customer`}
            flag={receiverInfo.flag} 
            symbol={receiverInfo.symbol} 
            currency={receiverInfo.currency}
            notes={receiverInfo.notes} 
            coins={receiverInfo.coins}
            targetAmount={exchangeType === 'BUY' ? sendAmount : receiverGets}
            onRowsChange={rows => {
              receiverDenomRowsRef.current = rows;
              const total = rows.reduce((s, r) => s + r.denom * r.count, 0);
              const target = exchangeType === 'BUY' ? sendAmount : receiverGets;
              onReceiverStatusChange?.({ total, target });
            }}
            accentColor="#dc2626"
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-8 gap-2 text-center">
            <Globe size={18} className="text-gray-300" />
            <p className="font-medium text-gray-400 text-sm">No denomination configured</p>
            <p className="text-xs text-gray-300">Select a supported destination country</p>
          </div>
        )}
      </div>
    </div>
  );
};
