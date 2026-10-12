import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useState, useEffect } from 'react';
import { useUser } from "../context/UserContext";
import { useSettings } from '../context/SettingsContext';

export function useERPNextRates() {
  const [rates, setRates] = useState({});
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateDate, setRateDate] = useState(null);
  const [noDataForToday, setNoDataForToday] = useState(false);
   const [showUploadModal, setShowUploadModal] = useState(false);
   const { selectedWarehouse }   = useSettings();

   const loginUser = useUser();

  useEffect(() => {
    async function fetchRates() {
      const locationName = selectedWarehouse?.warehouse || (typeof selectedWarehouse === "string" ? selectedWarehouse : null);

      if (!locationName) {
        setRates({});
        setAvailableCurrencies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setNoDataForToday(false);
        
        const today = new Date().toISOString().split("T")[0];

        const headers = {
          "Content-Type": "application/json",
        };

        const response = await fetch(
          "/api/method/moneygram.api.get_currency_exchange_rate",
          {
            method: "POST", 
            headers,
            credentials: "include", 
            body: JSON.stringify({
              today_date: today,
              location: locationName
            }),
          }
        );

       

         if (response.status === 404 ) {
          setShowUploadModal(true);
          return;
        }

        if (!response.ok) {
          console.log("response error..", response)
          throw new Error("Failed to fetch exchange rates");
        }

        const data = await response.json();

        
        const result = data.message;

        

        if (!result || !result.name) {
          setNoDataForToday(true);
          setShowUploadModal(true)
          setRates({});
          setAvailableCurrencies([]);
          return;
        }

        setRateDate(result.date);

        const rows = result.table_luxr ?? [];

        const ratesMap = {};
        const currencyList = [];

        

        for (const row of rows) {
          const code = row.currency_name;
          const sellingRate = parseFloat(row.selling_price);
          const buyingRate = parseFloat(row.buying_price);

          if (code && !isNaN(sellingRate) && sellingRate >= 0) {
            ratesMap[code] = sellingRate;
            currencyList.push({
              code,
              sellingRate,
              buyingRate: !isNaN(buyingRate) ? buyingRate : null,
              country: row?.country
            });

            
          }
        }

        setRates(ratesMap);
        setAvailableCurrencies(
          currencyList.sort((a, b) => a.code.localeCompare(b.code))
        );
      } catch (err) {
        console.error("[useERPNextRates]", err);
        setError(err.message ?? "Failed to load exchange rates");
      } finally {
        setLoading(false);
      }
    }

    fetchRates();
  }, [selectedWarehouse?.warehouse, loginUser?.user?.email]);

  return {
    rates,
    availableCurrencies,
    loading,
    error,
    rateDate,
    noDataForToday,
    showUploadModal,
    setShowUploadModal,
  };
}