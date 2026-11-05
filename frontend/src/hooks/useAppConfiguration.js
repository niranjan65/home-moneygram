import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useState, useEffect } from 'react';

export function useAppConfiguration() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [potOptions, setPotOptions] = useState([]);

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const potRes = await fetch("/api/method/moneygram.moneygram.api.app_configuration.get_app_configuration");

        if (potRes.ok) {
          const data = await potRes.json();
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
        }
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

