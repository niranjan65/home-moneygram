import { sessionFetch as fetch } from "../api/sessionClient.js";
import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "./UserContext";

const SettingsContext = createContext(null);



export function SettingsProvider({ children }) {
  const loginUser = useUser();

  const [user, setUser] = useState(() => {
    const u = loginUser?.user || {};
    return {
      name: u.full_name || u.user || "Current User",
      email: u.email || "",
      role: "User",
      avatar: (u.full_name || u.user || "U").substring(0, 2).toUpperCase(),
      phone: u.phone || "",
      joined: u.loginTime ? new Date(u.loginTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
    };
  });
  const [warehouses, setWarehouses] = useState(() => {
    return loginUser?.user?.warehouses || [];
  });

  const [selectedWarehouse, setSelectedWarehouseState] = useState(() => {
    try {
      const stored = localStorage.getItem("selected_warehouse");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSelectedWarehouse = (wh) => {
    setSelectedWarehouseState(wh);
    if (wh) {
      localStorage.setItem("selected_warehouse", JSON.stringify(wh));
    } else {
      localStorage.removeItem("selected_warehouse");
    }
  };
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    if (loginUser?.user) {
      const u = loginUser.user;
      setUser({
        name: u.full_name || u.user || "Current User",
        email: u.email || "",
        role: u.user_type || "User",
        avatar: (u.full_name || u.user || "U").substring(0, 2).toUpperCase(),
        phone: u.phone || "",
        joined: u.loginTime ? new Date(u.loginTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
      });

      const userWhs = u.warehouses || [];
      setWarehouses(userWhs);

      if (userWhs.length > 0) {
        const stored = localStorage.getItem("selected_warehouse");
        let parsed = null;
        try { parsed = stored ? JSON.parse(stored) : null; } catch {}

        const isValidStored = parsed?.warehouse && userWhs.some(w => w.warehouse === parsed.warehouse);
        if (isValidStored) {
          setSelectedWarehouseState(parsed);
        } else {
          setSelectedWarehouse(userWhs[0]);
        }
      } else {
        setSelectedWarehouse(null);
      }
    } else {
      setUser({
        name: "Current User",
        email: "",
        role: "User",
        avatar: "U",
        phone: "",
        joined: "",
      });
      setWarehouses([]);
      setSelectedWarehouse(null);
    }
  }, [loginUser?.user]);

  const updateUser = (fields) => setUser((prev) => ({ ...prev, ...fields }));

  const getWarehouseForUser = async () => {
    try {
      const userIdentifier = loginUser?.user?.email || loginUser?.user?.user;
      if (!userIdentifier) return [];

      const headers = { "Content-Type": "application/json" };

      const warehouseRes = await fetch(
        "/api/method/moneygram.api.get_user_warehouse",
        {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ user: userIdentifier }),
        }
      );

      const warehouseData = await warehouseRes.json();
      return warehouseData?.message || [];
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!loginUser?.user) return;
    // If warehouses were not populated from session, fetch fresh
    if (!loginUser?.user?.warehouses || loginUser.user.warehouses.length === 0) {
      getWarehouseForUser().then(r => {
        if (Array.isArray(r) && r.length > 0) {
          setWarehouses(r);
          const stored = localStorage.getItem("selected_warehouse");
          let parsed = null;
          try { parsed = stored ? JSON.parse(stored) : null; } catch {}
          if (!parsed || !r.some(w => w.warehouse === parsed.warehouse)) {
            setSelectedWarehouse(r[0]);
          }
        }
      });
    }
  }, [loginUser?.user?.email]);


  return (
    <SettingsContext.Provider
      value={{
        user,
        updateUser,
        selectedWarehouse,
        setSelectedWarehouse,
        warehouses,
        theme,
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}