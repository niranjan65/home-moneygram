export const fetchExchangeRates = async (base = "USD") => {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();

    if (data.result === "success") {
      return data.rates;
    }

    return {};
  } catch (error) {
    console.error("Exchange rate error:", error);
    return {};
  }
};

export const fetchAllCurrencies = async (base = "USD") => {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();

    if (data.result === "success") {
      const codes = Object.keys(data.rates);

      return codes.map((code) => ({
        code,
        name: code,
        flag: `https://flagcdn.com/${code
          .slice(0, 2)
          .toLowerCase()}.svg`,
      }));
    }

    return [];
  } catch (error) {
    console.error("Currency fetch error:", error);
    return [];
  }
};
