import { useEffect, useState, useRef } from "react";
import { getExchangeRates } from "../services/exchangeRateService";

export default function SoldiRatesSection() {
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  const intervalRef = useRef(null);

  const fetchRates = async () => {
    try {
      const data = await getExchangeRates();
      setCurrencies(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRates();
    intervalRef.current = setInterval(fetchRates, 60000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const filteredCurrencies = currencies.filter((item) =>
    item.currency_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <span className="inline-block bg-white/90 border border-red-200 shadow-xs rounded-full px-4 py-1 text-xs font-bold tracking-widest uppercase text-[#E00000] mb-2">
            Live Master Forex Rates
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight m-0">
            Official Buying &amp; Selling{" "}
            <span className="text-[#E00000] relative inline-block">
              Daily Rates
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
                <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#E00000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Base: 1 FJD (Fijian Dollar) · Auto-updated every 60s from ERPNext
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search currency or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/95 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#E00000] focus:border-transparent transition-all w-full md:w-64 shadow-xs"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-white/80 rounded-3xl p-12 text-center shadow-lg border border-red-100">
          <p className="text-sm font-bold text-gray-600">Loading real-time currency rates from vault master...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto bg-white/95 rounded-3xl shadow-2xl border border-red-100 custom-scrollbar">
          <table className="w-full text-sm text-gray-800">
            <thead className="bg-gradient-to-r from-red-50/80 via-white to-red-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-black text-gray-900 tracking-wide text-xs uppercase">Currency</th>
                <th className="px-6 py-4 text-left font-black text-gray-900 tracking-wide text-xs uppercase">Country</th>
                <th className="px-6 py-4 text-center font-black text-gray-900 tracking-wide text-xs uppercase">
                  MH Buys At <span className="block text-[10px] text-gray-500 font-normal">Customer Sells Forex</span>
                </th>
                <th className="px-6 py-4 text-center font-black text-gray-900 tracking-wide text-xs uppercase">
                  MH Sells At <span className="block text-[10px] text-gray-500 font-normal">Customer Buys Forex</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredCurrencies.map((item, index) => (
                <tr
                  key={item.name || index}
                  className="hover:bg-red-50/40 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-3">
                      {item.currency_name && (
                        <img
                          src={`https://flagcdn.com/w40/${item.currency_name
                            .slice(0, 2)
                            .toLowerCase()}.png`}
                          alt={item.currency_name}
                          className="w-7 h-5 object-cover rounded shadow-xs border border-gray-200 shrink-0"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <span className="font-extrabold text-gray-900 tracking-wide">
                        {item.currency_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-left text-gray-700 font-medium">
                    {item.country || "—"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.buying_price ? Number(item.buying_price).toFixed(4) : "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {item.selling_price ? Number(item.selling_price).toFixed(4) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && lastUpdated && (
        <p className="text-xs text-gray-500 mt-4 text-center font-medium">
          Master rates last synchronized at {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
