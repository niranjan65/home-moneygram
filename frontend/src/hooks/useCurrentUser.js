import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";



export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loginUser = useUser();







  async function fetchUser() {
    
    const API_URL =
      "https://mhmoneyexpress.anantdv.com/api/method/frappe.auth.get_logged_user";

    const HEADERS = {
      "Content-Type": "application/json",
      Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
    };
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: HEADERS,
        credentials: "include",
      });

      if (!response.ok) {
        const error = new Error(`HTTP error ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const result = await response.json();

      console.log(`current logged in user ${result}`)
      setUser(result.message || {});
    } catch (err) {
  console.error("Failed to fetch user", err);

  console.log("Status code:", err.status); 

  if(err.status === 401) {
     localStorage.removeItem("erpnext_session");
    window.location.href = "/home";
  }

  setError(err);
} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [loginUser]);

  return { user, loading, error };
}