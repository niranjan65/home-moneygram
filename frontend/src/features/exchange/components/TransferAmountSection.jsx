import React, { useEffect, useState } from "react";
import { getCurrencyMaster } from "../api/currencyMaster";
import { useUser } from "../../../context/UserContext";

const TransferAmountSection = ({ form, handleChange }) => {
  const { user } = useUser();

  const [currencies, setCurrencies] = useState([]);
  const [selectedRate, setSelectedRate] = useState(0);

  const inputStyle =
    "w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:bg-white transition-all duration-200";

  const labelStyle =
    "text-xs font-semibold text-gray-500 mb-1.5 block tracking-wide";

  // ✅ Fetch currency master
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await getCurrencyMaster(user);

        const table = res?.table_luxr || [];
        setCurrencies(table);

        console.log("Currencies Table:", table);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrencies();
  }, [user]);

  // ✅ Handle currency selection
  const handleCurrencyChange = (currencyName) => {
    const selected = currencies.find(
      (c) => c.currency_name === currencyName
    );

    if (!selected) return;

    const rate = selected.buying_price || 0;

    setSelectedRate(rate);

    handleChange("receiving_currency", currencyName);
    handleChange("exchange_rate", rate);

    // auto calculate
    if (form.sending_amount) {
      const receiving = form.sending_amount * rate;
      handleChange("receiving_amount", receiving.toFixed(2));
    }
  };

  // ✅ Auto recalc when sending amount changes
  useEffect(() => {
    if (form.sending_amount && selectedRate) {
      const receiving = form.sending_amount * selectedRate;
      handleChange("receiving_amount", receiving.toFixed(2));
    }
  }, [form.sending_amount, selectedRate]);

  // ✅ Total = sending + fee
  useEffect(() => {
    const total =
      Number(form.sending_amount || 0) +
      Number(form.transfer_fee || 0);

    handleChange("total_amount", total.toFixed(2));
  }, [form.sending_amount, form.transfer_fee]);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8">
      
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">
          Currency & Amount
        </h3>
        <p className="text-xs text-gray-400">
          Live conversion based on selected currency
        </p>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* SENDING */}
        <div className="space-y-5 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">
            You Send (FJD)
          </h4>

          <input
            type="number"
            className={inputStyle}
            value={form.sending_amount || ""}
            onChange={(e) =>
              handleChange("sending_amount", e.target.value)
            }
            placeholder="Enter amount"
          />
        </div>

        {/* RECEIVING */}
        <div className="space-y-5 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">
            Recipient Gets
          </h4>

          {/* Currency Dropdown */}
          <select
            className={inputStyle}
            value={form.receiving_currency || ""}
            onChange={(e) =>
              handleCurrencyChange(e.target.value)
            }
          >
            <option value="">Select Currency</option>
            {currencies.map((c) => (
              <option key={c.name} value={c.currency_name}>
                {c.currency_name} ({c.country})
              </option>
            ))}
          </select>

          {/* Receiving Amount */}
          <input
            className={`${inputStyle} bg-gray-100`}
            value={form.receiving_amount || ""}
            disabled
            placeholder="Auto calculated"
          />
        </div>
      </div>

      {/* EXTRA INFO */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">

        {/* Exchange Rate */}
        <div>
          <label className={labelStyle}>Exchange Rate</label>
          <input
            className={`${inputStyle} bg-gray-100`}
            value={form.exchange_rate || ""}
            disabled
          />
        </div>

        {/* Fee */}
        {/* <div>
          <label className={labelStyle}>Transfer Fee</label>
          <input
            type="number"
            className={inputStyle}
            value={form.transfer_fee || ""}
            onChange={(e) =>
              handleChange("transfer_fee", e.target.value)
            }
          />
        </div> */}

        {/* Total */}
        <div>
          <label className={labelStyle}>Total Payable (FJD)</label>
          <input
            className={`${inputStyle} bg-gray-100`}
            value={form.total_amount || ""}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default TransferAmountSection;