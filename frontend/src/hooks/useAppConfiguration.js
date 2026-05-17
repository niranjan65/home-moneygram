import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

export function useAppConfiguration() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [potOptions, setPotOptions] = useState([]);
  const loginUser = useUser();

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/method/moneygram.moneygram.api.app_configuration.get_app_configuration",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch App Configuration");
        }

        const data = await response.json();

        // Filter options to ensure only POT doctype items with valid oet_code are mapped
        const options = (data?.message || [])
          .filter(item => item.doctype === 'POT' && item.oet_code)
          .map(item => ({
            code: item.oet_code,
            label: `${item.oet_code} - ${item.purpose_of_travel}`,
            description: item.description,
            purpose: item.purpose_of_travel
          }))
          .sort((a, b) => parseInt(a.code) - parseInt(b.code));

        setPotOptions(options);

      } catch (err) {
        console.error("[useAppConfiguration]", err);
        setError(err.message ?? "Failed to load App Configuration");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { loading, error, potOptions };
}
