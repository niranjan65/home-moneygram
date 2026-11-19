import React from 'react';
import { useExchange } from '../../context/ExchangeContext';

export const Summary = ({ transferPayload, isDealer = false, hideSecurityBadge = false }) => {
  const contextExchange = useExchange();

  const exchangeType = transferPayload?.exchangeType || contextExchange?.exchangeType || 'BUY';
  const exchangeRate = transferPayload?.exchangeRate ?? contextExchange?.exchangeRate ?? 2.2410;
  const foreignCurrency = transferPayload?.foreignCurrency || transferPayload?.receiverCurrency || transferPayload?.currency || 'USD';
  
  const foreignAmount = Number(
    transferPayload?.foreignAmount ??
    transferPayload?.sendAmount ??
    contextExchange?.sendAmount ??
    0
  );
  const fjdAmount = Number(
    transferPayload?.fjdAmount ??
    transferPayload?.receiverGets ??
    contextExchange?.receiverGets ??
    (exchangeRate ? foreignAmount / exchangeRate : 0)
  );

  const foreignAmountFormatted = `${foreignCurrency} ${foreignAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fjdAmountFormatted = `FJD ${fjdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="card" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <strong className="text-h3 font-bold text-ink">Summary</strong>
        <span className="chip text-caption font-semibold">
          {isDealer
            ? (exchangeType === 'BUY' ? 'Dealer Buy' : 'Dealer Sell')
            : (exchangeType === 'BUY' ? 'Buy forex' : 'Sell forex')}
        </span>
      </div>

      <div className="row text-body">
        <span>
          {isDealer
            ? (exchangeType === 'BUY' ? 'MH Receives (Forex)' : 'MH Pays (Forex)')
            : (exchangeType === 'BUY' ? 'Customer pays' : 'Customer receives')}
        </span>
        <strong className="text-body-value font-medium tnum">{foreignAmountFormatted}</strong>
      </div>

      <div className="row text-body">
        <span>{isDealer ? 'Agreed Rate' : 'Rate'}</span>
        <strong className="text-body-value font-medium tnum">{Number(exchangeRate || 0).toFixed(4)}</strong>
      </div>

      <div style={{ borderTop: "1px solid #E3E6EB", marginTop: "8px", paddingTop: "16px" }}>
        <span className="lbl text-label font-semibold text-ink">
          {isDealer
            ? (exchangeType === 'BUY' ? 'MH Pays (FJD)' : 'MH Receives (FJD)')
            : (exchangeType === 'BUY' ? 'Customer receives' : 'Customer pays')}
        </span>
        <div className="text-display font-bold text-brand-600 tnum">
          {fjdAmountFormatted}
        </div>
      </div>
    </div>
  );
};

export default Summary;