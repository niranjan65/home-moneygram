import { useState, useEffect } from "react";
import CurrencyDropdown from "./home/CurrencyDropdown";
import { currencies } from "../data/currencies";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";

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
    <div className="w-full max-w-4xl mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-red-100 dark:border-gray-800 mt-6 relative z-20">
      <div className="text-center mb-8">
        <span className="inline-block bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 rounded-full px-4 py-1 text-xs font-bold text-[#E00000] uppercase tracking-wider mb-2">
          Live Currency Calculator
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-snug tracking-tight">
          Calculate Your Exchange in Real-Time
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Accurate mid-market rates powered by MH Money Express daily pricing
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-end">
        {/* From Section */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            You Send
          </label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:border-transparent transition"
          />
          <div className="text-gray-900">
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
            title="Swap Currencies"
            className="bg-[#E00000] hover:bg-[#C50000] text-white w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 group"
          >
            <RefreshCw size={22} className="group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* To Section */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
            Receiver Gets (Estimated)
          </label>
          <input
            type="text"
            value={loading ? "Calculating..." : convertedAmount}
            readOnly
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800/50 focus:outline-none"
          />
          <div className="text-gray-900">
            <CurrencyDropdown
              selected={toCurrency}
              onSelect={setToCurrency}
            />
          </div>
        </div>
      </div>

      {/* Exchange Rate Info & CTAs */}
      {rate && !loading && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              1.00 {fromCurrency.code} = {rate.toFixed(4)} {toCurrency.code}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Mid-Market Exchange Rate · Zero Hidden Margins
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/exchange"
              className="inline-flex items-center gap-2 bg-[#E00000] hover:bg-[#C50000] text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Exchange Cash
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/money-transfer"
              className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-800 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Money Transfer
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
