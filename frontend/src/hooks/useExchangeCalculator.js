import { useMemo } from "react";

export const useExchangeCalculator = ({
  sendAmount,
  rate,
  type,
}) => {
  return useMemo(() => {
    if (!rate || rate <= 0) return null;
    if (!sendAmount || sendAmount <= 0) return null;

    let result = 0;

    if (type === "BUY") {
      result = sendAmount / rate;
    }

    if (type === "SELL") {
      result = sendAmount / rate;
    }

    result = Math.round((result + Number.EPSILON) * 100) / 100;

    return {
      raw: result,
      formatted: result.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [sendAmount, rate, type]);
};