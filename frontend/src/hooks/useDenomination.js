import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useState, useEffect } from "react";
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
async function fetchCountryDenomination(country) {
  
  const API_URL =
    "/api/method/moneygram.moneygram.api.get_denomination.get_denomination";

  // Read-only endpoint: authenticate with Frappe's sid cookie.
  const query = new URLSearchParams({ country });
  const response = await fetch(`${API_URL}?${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!country) return;

    setLoading(true);
    setError(null);

    fetchCountryDenomination(country)
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCountryDenomination("Fiji")
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[useBaseCurrency]", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []); // runs once on mount

  return { data, loading, error };
}