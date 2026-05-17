import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loginUser = useUser();

  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          "/api/resource/Customer?fields=[\"name\",\"customer_name\",\"customer_group\",\"territory\"]&limit_page_length=500",
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
          throw new Error("Failed to fetch customers");
        }

        const data = await response.json();

        setCustomers(data.data || []);
      } catch (err) {
        console.error("[useERPNextCustomers]", err);
        setError(err.message ?? "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  return { customers, loading, error };
}