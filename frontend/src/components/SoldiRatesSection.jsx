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
    <div className="w-full max-w-[80%] mx-auto px-6 md:px-12 py-16">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <div>
          <span className="inline-block bg-surface border border-line shadow-xs rounded-full px-4 py-1 text-overline font-semibold tracking-wider uppercase text-brand-600 mb-2">
            Live Master Forex Rates
          </span>
          <h2 className="text-h1 font-bold text-ink leading-tight tracking-tight m-0">
            Official Buying &amp; Selling{" "}
            <span className="text-brand-600 relative inline-block">
              Daily Rates
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
                <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h2>
          <p className="text-caption text-muted dark:text-[#D1D5DB] mt-1 font-normal flex items-center gap-1.5">
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
            className="px-4 py-2.5 rounded-xl border border-line bg-surface text-ink placeholder-muted text-body font-normal focus:outline-none focus:border-brand-600 transition-all w-full md:w-64 shadow-xs"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-surface rounded-3xl p-12 text-center shadow-lg border border-line">
          <p className="text-body font-semibold text-muted dark:text-[#D1D5DB]">Loading real-time currency rates from vault master...</p>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto bg-surface rounded-3xl shadow-2xl border border-line custom-scrollbar">
          <table className="w-full text-body text-ink">
            <thead className="bg-surface-alt border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-overline font-semibold text-ink tracking-wider uppercase">Currency</th>
                <th className="px-6 py-4 text-left text-overline font-semibold text-ink tracking-wider uppercase">Country</th>
                <th className="px-6 py-4 text-center text-overline font-semibold text-ink tracking-wider uppercase">
                  MH Buys At <span className="block text-overline text-muted dark:text-[#9CA3AF] font-normal">Customer Sells Forex</span>
                </th>
                <th className="px-6 py-4 text-center text-overline font-semibold text-ink tracking-wider uppercase">
                  MH Sells At <span className="block text-overline text-muted dark:text-[#9CA3AF] font-normal">Customer Buys Forex</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {filteredCurrencies.map((item, index) => (
                <tr
                  key={item.name || index}
                  className="hover:bg-surface-alt/60 transition-colors duration-150"
                >
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-3">
                      {item.currency_name && (
                        <img
                          src={`https://flagcdn.com/w40/${item.currency_name
                            .slice(0, 2)
                            .toLowerCase()}.png`}
                          alt={item.currency_name}
                          className="w-7 h-5 object-cover rounded shadow-xs border border-line shrink-0"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <span className="font-bold text-ink tracking-wide text-body">
                        {item.currency_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-left text-ink-soft dark:text-[#D1D5DB] font-normal">
                    {item.country || "—"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 tnum">
                      {item.buying_price ? Number(item.buying_price).toFixed(4) : "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 tnum">
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
        <p className="text-caption text-muted dark:text-[#9CA3AF] mt-4 text-center font-normal">
          Master rates last synchronized at {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
