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
    item.currency_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-14">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
        <button className="bg-white border border-[#E00000]/30 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase text-[#E00000] hover:border-white/60 transition-colors">
          Live Rates
        </button>

        <h2 className="text-2xl md:text-3xl font-black text-center leading-snug tracking-tight text-white m-0">
          Official Buying &amp;{" "}
          <span className="relative inline-block">
            Selling
            <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 120 6" fill="none">
              <path d="M0 5 Q30 1 60 3 Q90 5 120 2" stroke="#b5f000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </span>
          <br />Rates
        </h2>

        {/* Search */}
        <div className="flex">
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-5 py-2.5 rounded-xl border border-[#E00000]/30 w-full md:w-64 bg-[#602020] text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#b5f000] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {loading && (
        <p className="text-center text-white/70 py-10">
          Loading rates...
        </p>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-x-auto bg-[#602020] rounded-3xl shadow-2xl border border-[#E00000]/30 custom-scrollbar">
          <table className="w-full text-sm text-white/90">
            <thead className="bg-[#421010]/50 text-white border-b border-[#E00000]/30">
              <tr>
                <th className="px-6 py-5 text-center font-bold tracking-wide">Currency</th>
                <th className="px-6 py-5 text-left font-bold tracking-wide">Country</th>
                <th className="px-6 py-5 text-center font-bold tracking-wide">Buying</th>
                <th className="px-6 py-5 text-center font-bold tracking-wide">Selling</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E00000]/20">
              {filteredCurrencies.map((item, index) => (
                <tr
                  key={item.name || index}
                  className="hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {item.currency_name && (
                        <img
                          src={`https://flagcdn.com/w40/${item.currency_name
                            .slice(0, 2)
                            .toLowerCase()}.png`}
                          alt={item.currency_name}
                          className="w-8 h-5 object-cover rounded shadow-md border border-white/20"
                        />
                      )}
                      <span className="font-semibold tracking-wide flex-1 text-left">
                        {item.currency_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium text-white/80">
                    {item.country}
                  </td>

                  <td className="px-6 py-4 text-center text-[#ff6b6b] font-bold">
                    {Number(item.buying_price).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 text-center text-[#b5f000] font-bold">
                    {Number(item.selling_price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && lastUpdated && (
        <p className="text-xs text-white/50 mt-6 text-center font-medium">
          Last updated at {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
