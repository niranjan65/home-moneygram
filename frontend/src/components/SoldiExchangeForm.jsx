import { useState, useEffect } from "react";
import CurrencyDropdown from "./home/CurrencyDropdown";
import { currencies } from "../data/currencies";

export default function SoldiExchangeForm() {
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
    <div className="w-full max-w-4xl mx-auto bg-[#602020] rounded-3xl p-8 md:p-10 shadow-2xl border border-[#E00000]/30 mt-12 relative z-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white leading-snug tracking-tight">
          Currency Calculator
        </h2>
        <p className="text-white/70 text-sm mt-2">
          Real-time exchange rates
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-end">
        {/* From Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-white/90">
            From
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-[#E00000]/30 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#b5f000] bg-white/10 text-white placeholder-white/50 transition"
          />
          <div className="text-black">
            <CurrencyDropdown
              selected={fromCurrency}
              onSelect={setFromCurrency}
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center pb-1">
          <button
            onClick={handleSwap}
            className="bg-[#E00000] hover:bg-[#b5f000] hover:text-[#421010] text-white w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl group"
          >
            <span className="text-xl group-hover:rotate-180 transition-transform duration-300">⇄</span>
          </button>
        </div>

        {/* To Section */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-white/90">
            To
          </label>
          <input
            type="text"
            value={loading ? "Loading..." : convertedAmount}
            readOnly
            className="w-full border border-[#E00000]/30 rounded-xl px-4 py-3 text-lg bg-white/5 text-white/90 focus:outline-none"
          />
          <div className="text-black">
            <CurrencyDropdown
              selected={toCurrency}
              onSelect={setToCurrency}
            />
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {rate && !loading && (
        <div className="mt-8 text-center border-t border-[#E00000]/30 pt-6">
          <h3 className="text-xl font-bold text-white">
            1.00 {fromCurrency.code} = {rate.toFixed(6)} {toCurrency.code}
          </h3>
          <p className="text-sm text-[#b5f000] mt-1 font-medium">
            Mid-market rate • Updated in real-time
          </p>
        </div>
      )}
    </div>
  );
}
