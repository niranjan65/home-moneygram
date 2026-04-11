
// RatesSection.jsx
import { useEffect, useState, useRef } from "react";
import { getExchangeRates } from "../../services/exchangeRateService";
import { useSettings } from "../../context/SettingsContext";

export default function RatesSection() {
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedWarehouse }   = useSettings();

  const intervalRef = useRef(null);

  const fetchRates = async () => {
    try {
      const data = await getExchangeRates(selectedWarehouse);
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
    item.currency_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="bg-background-light dark:bg-background-dark py-16 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold">
            Exchange Rates
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Official buying & selling rates
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border w-full md:w-64"
          />
        </div>

        {loading && (
          <p className="text-center text-gray-500">
            Loading rates...
          </p>
        )}

        {/* Table */}
{!loading && (
  <div className="overflow-x-auto bg-white dark:bg-background-dark rounded-2xl shadow-md border border-gray-200 dark:border-white/10">

    <table className="w-full text-sm text-gray-700 dark:text-gray-300">
      <thead className="bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-200">
        <tr>
          <th className="px-6 py-4 text-center">Currency</th>
          <th className="px-6 py-4 text-left">Country</th>
          <th className="px-6 py-4 text-center">Buying</th>
          <th className="px-6 py-4 text-center">Selling</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200 dark:divide-white/5">
        {filteredCurrencies.map((item) => {
          return (
            <tr
              key={item.name}
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              {/* Currency with Flag */}
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <img
                    src={`https://flagcdn.com/w40/${item.currency_name
                      .slice(0, 2)
                      .toLowerCase()}.png`}
                    alt={item.currency_name}
                    className="w-6 h-4 object-cover rounded-sm shadow-sm"
                  />
                  <span className="font-semibold tracking-wide">
                    {item.currency_name}
                  </span>
                </div>
              </td>

              {/* Country */}
              <td className="px-6 py-4">
                {item.country}
              </td>

              {/* Buying */}
              <td className="px-6 py-4 text-center text-red-500 font-medium">
                {Number(item.buying_price)}
              </td>

              {/* Selling */}
              <td className="px-6 py-4 text-center text-green-600 font-medium">
                {Number(item.selling_price)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
)}

        {!loading && lastUpdated && (
          <p className="text-xs text-gray-500 mt-6 text-center">
            Last updated at {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </section>
  );
}