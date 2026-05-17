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
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouseState] = useState(() => {
    try {
      const stored = localStorage.getItem("selected_warehouse");
      return stored ? JSON.parse(stored) : undefined;
    } catch {
      return undefined;
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
        role: "User",
        avatar: (u.full_name || u.user || "U").substring(0, 2).toUpperCase(),
        phone: u.phone || "",
        joined: u.loginTime ? new Date(u.loginTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "",
      });
    } else {
      setUser({
        name: "Current User",
        email: "",
        role: "User",
        avatar: "U",
        phone: "",
        joined: "",
      });
    }
  }, [loginUser?.user]);

  const updateUser = (fields) => setUser((prev) => ({ ...prev, ...fields }));

  const getWarehouseForUser = async () => {
    try {
      const userRes = await fetch(
        "/api/method/frappe.auth.get_logged_user",
        {
          headers: {
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
        }
      );

      const userData = await userRes.json();

      console.log("userData", userData)

      const warehouseRes = await fetch(
        "/api/method/moneygram.api.get_user_warehouse",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `token ${loginUser?.user?.api_key}:${loginUser?.user?.api_secret}`,
          },
          credentials: "include",
          body: JSON.stringify({ user: userData.message.email }),
        }
      );

      const warehouseData = await warehouseRes.json();

      return warehouseData?.message; 
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!loginUser?.user?.api_key) return;
    getWarehouseForUser().then(r => {
      if (r && r.length > 0) {
        setWarehouses(r);
        // Only overwrite the persisted warehouse if none is saved yet
        const stored = localStorage.getItem("selected_warehouse");
        if (!stored) {
          setSelectedWarehouse(r[0]);
        }
      }
    });
  }, [loginUser?.user?.api_key]);


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