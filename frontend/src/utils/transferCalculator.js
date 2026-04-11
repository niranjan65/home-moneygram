// //transferCalculator.js
export const calculateTransfer = ({
  sendAmount,
  toCurrency,
  erpRates,
  gstPercent,
}) => {
  const amount = parseFloat(sendAmount);

  if (!amount) {
    return {
      serviceFee: 0,
      subTotal: 0,
      gst: 0,
      totalToPay: 0,
      receiveAmount: 0,
    };
  }

  const toCurrencyObj = erpRates.find(
    (c) => c.currency_name === toCurrency
  );

  if (!toCurrencyObj) {
    return {
      serviceFee: 0,
      subTotal: 0,
      gst: 0,
      totalToPay: 0,
      receiveAmount: 0,
    };
  }

  const buyingRate = Number(toCurrencyObj.buying_price);

  // ✅ FJD base logic
  const receiveAmount = amount * buyingRate;

  const serviceFee = receiveAmount * 0.02;
  const gst = serviceFee * (gstPercent / 100);
  const subTotal = amount + serviceFee;
  const totalToPay = amount + serviceFee + gst;

  return {
    serviceFee: serviceFee.toFixed(4),
    subTotal: subTotal.toFixed(4),
    gst: gst.toFixed(4),
    totalToPay: totalToPay.toFixed(2),
    receiveAmount: receiveAmount.toFixed(2),
  };
};