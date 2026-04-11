// services/exchangeRateService.js

export const getExchangeRates = async (selectedWarehouse) => {
  try {
    const response = await fetch(
      "https://mhmoneyexpress.anantdv.com/api/method/moneygram.api.get_currency_exchange_rate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          today_date: new Date().toISOString().split("T")[0],
          location: selectedWarehouse
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