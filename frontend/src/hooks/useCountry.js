import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loginUser = useUser();
  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "https://mhmoneyexpress.anantdv.com/api/resource/Country?fields=[\"name\",\"country_name\",\"code\"]&limit_page_length=300",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch countries");
        }

        const data = await response.json();

        setCountries(data.data || []);
      } catch (err) {
        console.error("[useERPNextCountries]", err);
        setError(err.message ?? "Failed to load countries");
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, []);

  return { countries, loading, error };
}