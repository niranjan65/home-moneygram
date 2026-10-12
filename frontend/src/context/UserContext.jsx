import { sessionFetch as fetch } from "../api/sessionClient.js";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => {
    try {
      const stored = localStorage.getItem("erpnext_session");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUser = useCallback((userData) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem("erpnext_session", JSON.stringify(userData));
    } else {
      localStorage.removeItem("erpnext_session");
    }
  }, []);

  // Synchronize session with Frappe / ERPNext backend
  const verifyServerSession = useCallback(async () => {
    try {
      const res = await fetch("/api/method/moneygram.moneygram.api.allow_login.get_current_session", {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      const session = data?.message;

      if (session && session.logged_in) {
        const stored = localStorage.getItem("erpnext_session");
        const currentLocal = stored ? JSON.parse(stored) : null;

        const syncedData = {
          user: session.full_name || session.username || session.email,
          email: session.email,
          loginTime: session.login_time || currentLocal?.loginTime || new Date().toISOString(),
          creation: session.creation || "",
          sessionActive: true,
          user_type: session.user_type,
          warehouse: session.warehouse,
          warehouses: session.warehouses || [],
          has_branch_assigned: session.has_branch_assigned,
          branch_warning: session.branch_warning,
          ...session,
        };

        // If local session was missing, email changed, or warehouse data needs sync
        if (
          !currentLocal ||
          "api_key" in currentLocal ||
          "api_secret" in currentLocal ||
          currentLocal.email !== session.email ||
          JSON.stringify(currentLocal.warehouses || []) !== JSON.stringify(session.warehouses || [])
        ) {
          setUser(syncedData);

          const storedWh = localStorage.getItem("selected_warehouse");
          let parsedWh = null;
          try { parsedWh = storedWh ? JSON.parse(storedWh) : null; } catch {}

          const whNames = (session.warehouses || []).map(w => w.warehouse);
          if (parsedWh?.warehouse && whNames.includes(parsedWh.warehouse)) {
            // Keep user's valid selection
          } else if (session.warehouse) {
            localStorage.setItem("selected_warehouse", JSON.stringify({ warehouse: session.warehouse }));
          } else {
            localStorage.removeItem("selected_warehouse");
          }
        }
      } else if (session && session.logged_in === false) {
        // Server session expired or logged out from ERPNext /app
        const stored = localStorage.getItem("erpnext_session");
        if (stored) {
          console.warn("[SessionSync] ERPNext server session expired or invalid. Clearing local session.");
          localStorage.removeItem("erpnext_session");
          localStorage.removeItem("selected_warehouse");
          setUserState(null);

          const path = window.location.pathname;
          if (
            path.includes("/money-transfer") ||
            path.includes("/exchange") ||
            path.includes("/dealer-exchange") ||
            path.includes("/report") ||
            path.includes("/vault-transfer") ||
            path.includes("/settings") ||
            path.includes("/stocks")
          ) {
            window.location.href = "/home/login";
          }
        }
      }
    } catch (err) {
      console.warn("[SessionSync] Error checking server session:", err);
    }
  }, [setUser]);

  useEffect(() => {
    verifyServerSession();

    // Also re-verify when the user returns to the tab
    const handleFocus = () => verifyServerSession();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [verifyServerSession]);

  return (
    <UserContext.Provider value={{ user, setUser, verifyServerSession }}>
      {children}
    </UserContext.Provider>
  );
};

export function useUser()  {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
