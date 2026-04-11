//CurrencyDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { currencies as defaultCurrencies } from "../../data/currencies.js";

export default function CurrencyDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currencies, setCurrencies] = useState(defaultCurrencies);
  const [showAll, setShowAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch all currencies from API
  const fetchAllCurrencies = async () => {
    try {
      setLoadingAll(true);
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();

      if (data.result === "success") {
        const allCodes = Object.keys(data.rates);

        const formatted = allCodes.map((code) => ({
          code,
          name: code, // API doesn't return full names, so fallback to code
          flag: `https://flagcdn.com/${code
            .slice(0, 2)
            .toLowerCase()}.svg`,
        }));

        setCurrencies(formatted);
        setShowAll(true);
      }
    } catch (err) {
      console.error("Error fetching currencies:", err);
    } finally {
      setLoadingAll(false);
    }
  };

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected */}
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-3 border border-gray-300 rounded-lg px-4 py-3 cursor-pointer bg-white hover:border-primary transition"
      >
        <div className="flex items-center gap-3">
          <img
            src={selected?.flag}
            alt={selected?.code}
            className="w-6 h-4 object-cover rounded-sm"
          />
          <span className="text-sm font-medium text-gray-800">
            {selected?.code} - {selected?.name}
          </span>
        </div>
        <span className="text-gray-500 text-sm">
          {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl transition-all duration-200 z-50 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* List */}
        <div className="max-h-60 overflow-y-auto custom-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((currency) => (
              <div
                key={currency.code}
                onClick={() => {
                  onSelect(currency);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer transition"
              >
                <img
                  src={currency.flag}
                  alt={currency.code}
                  className="w-6 h-4 object-cover rounded-sm"
                />
                <span className="text-gray-700">
                  {currency.code} - {currency.name}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              No currency found
            </div>
          )}

          {/* See All Option */}
          {!showAll && (
            <div
              onClick={fetchAllCurrencies}
              className="px-4 py-3 text-sm text-primary font-semibold hover:bg-gray-50 cursor-pointer border-t border-gray-100"
            >
              {loadingAll ? "Loading..." : "See All Currencies"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
