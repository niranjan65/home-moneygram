import { sessionFetch as fetch } from "../api/sessionClient.js";
import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

export function useAppConfiguration() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [potOptions, setPotOptions] = useState([]);
  const [limits, setLimits] = useState(null);
  const [limitsError, setLimitsError] = useState(null);
  const loginUser = useUser();

  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const [potRes, limitRes] = await Promise.all([
          fetch("/api/method/moneygram.moneygram.api.app_configuration.get_app_configuration"),
          fetch("/api/method/moneygram.moneygram.api.app_configuration.get_annual_compliance_limit"),
        ]);

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

        if (limitRes.ok) {
          const limitData = await limitRes.json();
          const msg = limitData?.message;
          const fxLimit = (msg?.annual_fx_limit != null && msg?.annual_fx_limit !== '') ? parseFloat(msg.annual_fx_limit) : null;
          const fxMgLimit = (msg?.annual_fx_and_moneygram_limit != null && msg?.annual_fx_and_moneygram_limit !== '') ? parseFloat(msg.annual_fx_and_moneygram_limit) : null;
          const compLimit = (msg?.annual_compliance_limit != null && msg?.annual_compliance_limit !== '') ? parseFloat(msg.annual_compliance_limit) : null;

          if (fxLimit === null && fxMgLimit === null && compLimit === null) {
            setLimitsError("No limit found in App Configuration");
          } else {
            setLimitsError(null);
          }

          setLimits({
            annual_fx_limit: fxLimit,
            annual_fx_and_moneygram_limit: fxMgLimit,
            annual_compliance_limit: compLimit,
          });
        } else {
          setLimitsError("No limit found in App Configuration");
          setLimits(null);
        }
      } catch (err) {
        console.error("[useAppConfiguration]", err);
        setError(err.message ?? "Failed to load App Configuration");
        setLimitsError("No limit found in App Configuration");
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { loading, error, potOptions, limits, limitsError };
}

