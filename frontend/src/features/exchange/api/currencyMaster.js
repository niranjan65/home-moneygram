import { getBaseURL, getHeaders, ERP_ENV } from "../config/erpConfig";

// you can use same env as money transfer
const ENV = ERP_ENV.DEMO;

export const getCurrencyMaster = async (loginUser) => {
  try {
    const baseURL = getBaseURL(ENV);
    const headers = getHeaders(loginUser, ENV);

    const res = await fetch(
      `${baseURL}/api/resource/Currency Master Data/vj7mf5sure`,
      {
        method: "GET",
        headers,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Currency Master fetch failed:", data);
      throw new Error(data?.message || "Failed to fetch currency master");
    }

    console.log("✅ Currency Master Response:", data.data);

    return data.data;
  } catch (err) {
    console.error("❌ Currency Master Error:", err);
    throw err;
  }
};