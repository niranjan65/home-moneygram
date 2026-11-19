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
  initialSenderRows,
  initialReceiverRows,
  onSenderStatusChange,
  onReceiverStatusChange,
}) => {
  return (
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
            initialRows={initialSenderRows}
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
            <p className="font-medium text-gray-400 text-body">FJD denomination data not found</p>
            <p className="text-caption text-gray-400">Add Fiji to DENOMINATION_DATA</p>
          </div>
        )}

        {denomLoading ? (
          <div className="rounded-xl border border-gray-200 flex flex-col items-center justify-center p-8 gap-2 bg-gray-50">
            <RefreshCw size={18} className="animate-spin text-[#E00000]/80" />
            <p className="font-medium text-muted text-body">Loading denomination data…</p>
          </div>
        ) : denomError ? (
          <div className="rounded-xl border border-[#E00000]/20 bg-[#E00000]/5 flex items-center justify-center p-7">
            <p className="font-medium text-danger text-label text-center">{denomError}</p>
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
            initialRows={initialReceiverRows}
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
            <p className="font-medium text-muted text-body">No denomination configured</p>
            <p className="text-caption text-muted">Select a supported destination country</p>
          </div>
        )}
      </div>
  );
};
