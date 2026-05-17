// import { useState, useEffect } from "react";

// export function useDenomination(country) {
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!country) return;

//     async function fetchDenomination() {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await fetch(
//           "/api/method/moneygram.moneygram.api.get_denomination.get_denomination",
//           {
//             method: "POST", 
//             headers: {
//               "Content-Type": "application/json",
//               "Authorization": "token 661457e17b8612a:5a5fb35fb41cc58"
//             },
//             credentials: "include",
//             body: JSON.stringify({ country }),
//           }
//         );

//         if (!response.ok) {
//           throw new Error("Failed to fetch denomination");
//         }

//         const result = await response.json();

//         const countryData = result?.message?.[country];

//         if (!countryData) {
//           setData(null);
//           return;
//         }

//         // 🔥 Transform API response to match your UI format
//         const transformDenomination = (arr = []) =>
//           arr.map((item) => {
//             if (item.includes("c")) {
//               return parseFloat(item.replace("c", "")) / 100;
//             }
//             return parseFloat(item.replace("$", ""));
//           }).sort((a, b) => b - a);

//         setData({
//           currency: countryData.currency,
//           symbol: countryData.symbol,
//           flag: countryData.flag || "",
//           notes: transformDenomination(countryData.notes),
//           coins: transformDenomination(countryData.coins),
//           notes_name: countryData.notes_name,
//           coins_name: countryData.coins_name,
//           pickupNote: countryData.pickupNote,
//         });

//       } catch (err) {
//         console.error("[useDenomination]", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchDenomination();
//   }, [country]);

//   return { data, loading, error };
// }


import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
// import React from "react";






const transformValues = (arr = []) =>
  arr
    .map((item) => parseFloat(item.value))
    .filter((v) => !isNaN(v))
    .sort((a, b) => b - a);

// Extract the "name" strings in the same order as the sorted values
const extractNames = (arr = []) =>
  [...arr]
    .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
    .map((item) => item.name);

// Shared fetcher
async function fetchCountryDenomination(country, loginUser) {
  
  const API_URL =
    "/api/method/moneygram.moneygram.api.get_denomination.get_denomination";

  const HEADERS = {
    "Content-Type": "application/json",
    Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: HEADERS,
    credentials: "include",
    body: JSON.stringify({ country }),
  });

  if (!response.ok) throw new Error("Failed to fetch denomination");

  const result = await response.json();
  const countryData = result?.message?.[country];
  if (!countryData) return null;

  return {
    currency: countryData.currency,
    symbol: countryData.symbol,
    flag: countryData.flag || "",
    notes: transformValues(countryData.notes || []),
    coins: transformValues(countryData.coins || []),
    notes_name: extractNames(countryData.notes || []),
    coins_name: extractNames(countryData.coins || []),
    pickupNote: countryData.pickupNote,
  };
}

// ── Foreign country denomination ─────────────────────────────────────────────
export function useDenomination(country) {
  const loginUser = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!country) return;

    setLoading(true);
    setError(null);

    fetchCountryDenomination(country, loginUser)
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[useDenomination]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [country]);

  return { data, loading, error };
}

// ── Base currency (Fiji / FJD) ────────────────────────────────────────────────
export function useBaseCurrency() {
  const loginUser = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCountryDenomination("Fiji", loginUser)
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[useBaseCurrency]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []); // runs once on mount

  return { data, loading, error };
}