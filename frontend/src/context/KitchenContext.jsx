import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getKitchenRecipe } from "../api/chat.js";
import { useAuth } from "./AuthContext.jsx";
import { useInventory } from "./InventoryContext.jsx";

const KitchenContext = createContext();

export function KitchenProvider({ children }) {
  const { token } = useAuth();
  const { items, lastUpdated } = useInventory();
  
  const [recipes, setRecipes] = useState([]);
  const [cookedHistory, setCookedHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markRecipeCooked = (recipe) => {
    setCookedHistory(prev => [...prev, recipe]);
    setRecipes(prev => prev.filter(r => r.title !== recipe.title));
  };
  
  // Track the previous state to avoid unnecessary fetches
  const prevItemsHash = useRef("");

  useEffect(() => {
    if (!token) {
      setRecipes([]);
      return;
    }

    // Filter active items (not consumed, not expired)
    const activeItems = items.filter(i => i.status !== "consumed" && i.status !== "expired");
    
    // Create a simple hash to check if active items actually changed
    // We only care about name, quantity, unit for kitchen recipes
    const currentHash = activeItems
      .map(i => `${i.id}-${i.quantity}-${i.unit}`)
      .sort()
      .join("|");

    if (currentHash === prevItemsHash.current) {
      return; // No meaningful change to active items
    }
    
    prevItemsHash.current = currentHash;

    const fetchRecipes = async (force = false) => {
      try {
        setLoading(true);
        setError(null);
        const res = await getKitchenRecipe(force);
        const data = res.data;
        if (data.recipes && Array.isArray(data.recipes)) {
          setRecipes(data.recipes);
        } else {
          setRecipes([]);
        }
      } catch (err) {
        console.error(err);
        const apiErrMsg = err.response?.data?.error || err.response?.data?.details || err.message;
        setError(apiErrMsg ? `Unable to get recipes: ${apiErrMsg}` : "Unable to get recipes at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes(false);
  }, [items, lastUpdated, token]);

  const refreshRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getKitchenRecipe(true);
      const data = res.data;
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      } else {
        setRecipes([]);
      }
    } catch (err) {
      console.error(err);
      const apiErrMsg = err.response?.data?.error || err.response?.data?.details || err.message;
      setError(apiErrMsg ? `Unable to get recipes: ${apiErrMsg}` : "Unable to get recipes at this time. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KitchenContext.Provider value={{ recipes, cookedHistory, loading, error, refreshRecipes, markRecipeCooked }}>
      {children}
    </KitchenContext.Provider>
  );
}

export const useKitchen = () => useContext(KitchenContext);
