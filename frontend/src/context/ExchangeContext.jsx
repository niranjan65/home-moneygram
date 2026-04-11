import React, { createContext, useContext, useMemo } from "react";

const ExchangeContext = createContext(null);

export const ExchangeProvider = ({
  children,
  summary,
  config = {
    serviceRate: 0.02,
    gstRate: 0.15,
  },
}) => {

  console.log('ExchangeProvider render', { summary, config });
  const calculations = useMemo(() => {
    const receiverGets = Number(summary?.receiverGets || 0);
    const sendAmount   = Number(summary?.sendAmount || 0);
    const exchangeType = summary?.exchangeType || "BUY";

    const { serviceRate, gstRate } = config;

    const serviceFee = receiverGets * serviceRate;
    const gstAmount  = serviceFee * gstRate;

    const total =
      exchangeType === "BUY"
        ? receiverGets + serviceFee + gstAmount
        : receiverGets - serviceFee - gstAmount;

    return {
      receiverGets,
      sendAmount,
      exchangeType,
      serviceRate,
      gstRate,
      serviceFee,
      gstAmount,
      total,
    };
  }, [summary, config]);

  return (
    <ExchangeContext.Provider value={calculations}>
      {children}
    </ExchangeContext.Provider>
  );
};

export const useExchange = () => {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error("useExchange must be used inside ExchangeProvider");
  }
  return context;
};