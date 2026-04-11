//Hero.jsx
import { useState, useEffect } from "react";
import CurrencyDropdown from "./CurrencyDropdown";
import { currencies } from "../../data/currencies";

export default function Hero() {
  const [amount, setAmount] = useState(1);
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(false);

  const [fromCurrency, setFromCurrency] = useState(currencies[0]);
  const [toCurrency, setToCurrency] = useState(currencies[1]);

  // Fetch exchange rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://open.er-api.com/v6/latest/${fromCurrency.code}`
        );
        const data = await response.json();

        if (data.result === "success") {
          setRate(data.rates[toCurrency.code]);
        }

      } catch (error) {
        console.error("Error fetching rate:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, [fromCurrency, toCurrency]);

  const convertedAmount =
    rate && amount ? (parseFloat(amount) * rate).toFixed(2) : "";

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <section className="bg-gray-50 pt-5 pb-20 px-6">
      
      {/* Hero Content */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Global Currency Exchange Made Simple
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Convert currencies at real-time market rates with complete transparency and secure data.
        </p>
      </div>

      {/* Converter Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-5">

        <div className="grid md:grid-cols-3 gap-6 items-end">

          {/* From Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              From
            </label>

            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            />

            <CurrencyDropdown
              selected={fromCurrency}
              onSelect={setFromCurrency}
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition shadow-md"
            >
              ⇄
            </button>
          </div>

          {/* To Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              To
            </label>

            <input
              type="text"
              value={loading ? "Loading..." : convertedAmount}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-lg bg-gray-100 text-gray-700"
            />

            <CurrencyDropdown
              selected={toCurrency}
              onSelect={setToCurrency}
            />
          </div>
        </div>

        {/* Exchange Rate Info */}
        {rate && !loading && (
          <div className="mt-10 text-center border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              1.00 {fromCurrency.code} = {rate.toFixed(6)} {toCurrency.code}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Mid-market rate • Updated in real-time
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
