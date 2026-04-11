import React from "react";
import { useFormContext } from "react-hook-form";
import { useExchangeCalculator } from "../../../hooks/useExchangeCalculator";


export const ExchangeSection = ({
  currencies,
  loading,
}) => {
  const { watch, setValue } = useFormContext();

  const sendAmount = watch("sendAmount");
  const currency = watch("currency");
  const type = watch("exchangeType");
  const rate = watch("rate");

  const result = useExchangeCalculator({
    sendAmount,
    rate,
    type,
  });

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">

      {/* Currency */}
      <div>
        <label className="text-xs text-gray-500">Currency</label>
        <select
          value={currency}
          onChange={(e) =>
            setValue("currency", e.target.value)
          }
          className="input mt-1"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs text-gray-500">
          Amount
        </label>
        <input
          type="number"
          value={sendAmount || ""}
          onChange={(e) =>
            setValue("sendAmount", Number(e.target.value))
          }
          className="input mt-1"
        />
      </div>

      {/* Rate */}
      <div>
        <label className="text-xs text-gray-500">
          Rate
        </label>
        <input
          type="number"
          value={rate || ""}
          onChange={(e) =>
            setValue("rate", Number(e.target.value))
          }
          className="input mt-1"
        />
      </div>

      {/* Result */}
      <div className="bg-gray-50 border rounded-lg p-3">
        <p className="text-xs text-gray-400">
          Converted Amount
        </p>

        <p className="text-lg font-semibold text-[#E00000]">
          {result ? result.formatted : "—"}
        </p>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">
          Loading rates...
        </p>
      )}
    </div>
  );
};