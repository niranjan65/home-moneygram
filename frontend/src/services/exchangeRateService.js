import { sessionFetch as fetch } from "../api/sessionClient.js";
// services/exchangeRateService.js

export const getExchangeRates = async (selectedWarehouse) => {
  try {
    const location = selectedWarehouse?.warehouse || (typeof selectedWarehouse === "string" ? selectedWarehouse : null);
    if (!location) {
      return [];
    }

    const response = await fetch(
      "/api/method/moneygram.api.get_currency_exchange_rate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          today_date: new Date().toISOString().split("T")[0],
          location
        }),
      }
    );

    const result = await response.json();

    console.log("ERP Response:", result);

    return result?.message?.table_luxr || [];

  } catch (error) {
    console.error("Exchange Rate API Error:", error);
    throw error;
  }
};