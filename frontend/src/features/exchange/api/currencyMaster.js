import { buildApiUrl, getFetchOptions } from "../config/erpConfig";

export const getCurrencyMaster = async (loginUser) => {
  try {
    const res = await fetch(
      buildApiUrl("api/resource/Currency Master Data/vj7mf5sure"),
      getFetchOptions({
        method: "GET",
      })
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