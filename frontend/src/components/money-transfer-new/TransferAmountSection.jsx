import React, { useEffect, useState } from "react";
import { getCurrencyMaster } from "../../features/exchange/api/currencyMaster";
import { useUser } from "../../context/UserContext";
import { CurrencyInput } from "../common/CurrencyInput";

const TransferAmountSection = ({ form, handleChange }) => {
  const { user } = useUser();

  const [currencies, setCurrencies] = useState([]);
  const [selectedRate, setSelectedRate] = useState(0);

  const inputStyle =
    "w-full bg-surface-alt border border-line rounded-xl px-4 py-3 text-body font-medium tnum focus:outline-none focus:ring-2 focus:ring-brand-600 focus:bg-surface transition-all duration-200 text-ink";

  const labelStyle =
    "text-label font-semibold text-ink mb-1.5 block tracking-normal";

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
    <div className="rounded-3xl border border-line bg-surface shadow-card p-6 sm:p-8">
      
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-h3 font-bold text-ink">
          Currency & Amount
        </h3>
        <p className="text-caption text-muted">
          Live conversion based on selected currency
        </p>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* SENDING */}
        <div className="space-y-5 bg-surface-alt p-5 rounded-2xl border border-line">
          <h4 className="text-body font-semibold text-ink">
            You Send (FJD)
          </h4>

          <CurrencyInput
            className={inputStyle}
            value={form.sending_amount || ""}
            onChange={(e) =>
              handleChange("sending_amount", e.target.value)
            }
            placeholder="Enter amount"
          />
        </div>

        {/* RECEIVING */}
        <div className="space-y-5 bg-surface-alt p-5 rounded-2xl border border-line">
          <h4 className="text-body font-semibold text-ink">
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
            className={`${inputStyle} bg-chip opacity-80 cursor-not-allowed`}
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
            className={`${inputStyle} bg-chip opacity-80 cursor-not-allowed`}
            value={form.exchange_rate || ""}
            disabled
          />
        </div>

        {/* Total */}
        <div>
          <label className={labelStyle}>Total Payable (FJD)</label>
          <input
            className={`${inputStyle} bg-chip opacity-80 cursor-not-allowed`}
            value={form.total_amount || ""}
            disabled
          />
        </div>
      </div>
    </div>
  );
};

export default TransferAmountSection;