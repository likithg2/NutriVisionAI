import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getItems } from "../api/items.js";
import { useAuth } from "./AuthContext.jsx";

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const refreshInventory = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const r = await getItems({ limit: 100 });
      setItems(r.data?.items || r.data || []);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshInventory();
    } else {
      setItems([]);
    }
  }, [token, refreshInventory]);

  return (
    <InventoryContext.Provider value={{ items, loading, refreshInventory, lastUpdated }}>
      {children}
    </InventoryContext.Provider>
  );
}

export const useInventory = () => useContext(InventoryContext);
