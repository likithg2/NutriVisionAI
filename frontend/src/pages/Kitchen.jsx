import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, Flame, ArrowLeft, Globe, RotateCw, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Modal from "../components/ui/Modal.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useKitchen } from "../context/KitchenContext.jsx";
import api from "../api/axios.js";

const tokens = (dark) => ({
  textPrimary: dark ? "#FDF6F0" : "#1A1210",
  textSecondary: dark ? "#8A7A6E" : "#6B6560",
  cardBg: dark ? "rgba(40,28,24,0.6)" : "rgba(255,255,255,0.85)",
  cardBorder: dark ? "1px solid rgba(255,140,90,0.15)" : "1px solid rgba(255,237,224,0.8)",
  cardShadow: dark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.06)",
  pillBg: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)",
  pillBorder: dark ? "1px solid rgba(255,107,74,0.3)" : "1px solid rgba(255,107,74,0.2)",
});

export default function Kitchen() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const t = tokens(dark);

  const { recipes, cookedHistory, loading, error, refreshRecipes, markRecipeCooked } = useKitchen();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [logStatus, setLogStatus] = useState(null);
  const [showLogConfirm, setShowLogConfirm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryRecipe, setSelectedHistoryRecipe] = useState(null);

  const handleLogRecipe = async () => {
    if (!selectedRecipe) return;
    setShowLogConfirm(false);
    setLogStatus('loading');
    try {
      // Basic extraction from macros string: "450 kcal | 40g Protein" etc.
      const macrosStr = selectedRecipe.macros || "";
      const caloriesMatch = macrosStr.match(/(\d+)\s*(kcal|calories)/i);
      const proteinMatch = macrosStr.match(/(\d+)\s*g\s*protein/i);
      const carbsMatch = macrosStr.match(/(\d+)\s*g\s*carbs/i);
      const fatMatch = macrosStr.match(/(\d+)\s*g\s*fat/i);

      const logData = {
        itemName: selectedRecipe.title,
        quantity: "1 serving",
        calories: caloriesMatch ? parseInt(caloriesMatch[1], 10) : 0,
        protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 0,
        carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 0,
        fat: fatMatch ? parseInt(fatMatch[1], 10) : 0,
        mealType: "lunch", // default
        date: new Date().toISOString().split('T')[0]
      };

      await api.post('/api/calories', logData);
      markRecipeCooked(selectedRecipe);
      setLogStatus('success');
      setTimeout(() => { 
        setLogStatus(null);
        setSelectedRecipe(null); // go back to recipe list — user sees recipe removed
      }, 800);
    } catch (err) {
      console.error("Failed to log recipe", err);
      const errMsg = err.response?.data?.error || err.message;
      setLogStatus(`error: ${errMsg}`);
      setTimeout(() => setLogStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-12 sm:pt-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FF7A45] to-[#FF4D6D] shadow-lg shadow-orange-500/20 text-white">
            <ChefHat size={28} />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" style={{ color: t.textPrimary }}>
                Smart Kitchen
                <button onClick={refreshRecipes} disabled={loading} className={`p-1 transition-colors ${loading ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' : 'text-orange-400 hover:text-orange-500'}`}>
                  <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setShowHistoryModal(true)} className="p-1 transition-colors text-orange-400 hover:text-orange-500 relative ml-2" title="Cooked History">
                  <History className="w-5 h-5" />
                  {cookedHistory.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {cookedHistory.length}
                    </span>
                  )}
                </button>
              </h1>
              <p style={{ color: t.textSecondary }}>Personalized recipes based on your inventory</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl mb-6 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 gap-4"
            >
              <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <p style={{ color: t.textSecondary }} className="font-medium animate-pulse">
                Chef AI is creating recipes in the background...
              </p>
            </motion.div>
          ) : selectedRecipe ? (
            /* DETAIL VIEW */
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <button
                onClick={() => setSelectedRecipe(null)}
                className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors hover:bg-orange-500/10 text-orange-500"
              >
                <ArrowLeft size={18} /> Back to Recipes
              </button>

              <div
                className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl border relative overflow-hidden"
                style={{
                  background: t.cardBg,
                  borderColor: t.cardBorder,
                  boxShadow: t.cardShadow,
                }}
              >
                <h2 className="text-3xl font-bold mb-4" style={{ color: t.textPrimary }}>
                  {selectedRecipe.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                    <Clock size={16} className="text-orange-500" /> {selectedRecipe.time}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                    <Flame size={16} className="text-orange-500" /> {selectedRecipe.macros}
                  </div>
                  {selectedRecipe.globalCuisine && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                      <Globe size={16} className="text-orange-500" /> {selectedRecipe.globalCuisine}
                    </div>
                  )}
                </div>

                <div className="mb-8">
                  <button 
                    onClick={() => setShowLogConfirm(true)}
                    disabled={logStatus === 'loading' || logStatus === 'success'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all"
                    style={{ 
                      background: logStatus === 'success' ? '#10B981' : 'linear-gradient(to right, #FF7A45, #FF4D6D)'
                    }}
                  >
                    {logStatus === 'loading' ? (
                      <RotateCw size={18} className="animate-spin" />
                    ) : logStatus === 'success' ? (
                      <>Cooked & Logged!</>
                    ) : (
                      <>Cooked & Log into Tracker</>
                    )}
                  </button>
                  {logStatus?.startsWith('error') && <p className="text-red-500 mt-2 text-sm">{logStatus.replace('error: ', '')}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {selectedRecipe.ingredients ? (
                    <>
                      <div className="md:col-span-1 prose prose-orange max-w-none dark:prose-invert">
                        <h3 className="text-xl font-bold mb-2">Ingredients</h3>
                        <ReactMarkdown>{selectedRecipe.ingredients}</ReactMarkdown>
                      </div>
                      <div className="md:col-span-2 prose prose-orange max-w-none dark:prose-invert">
                        <h3 className="text-xl font-bold mb-2">Instructions</h3>
                        <ReactMarkdown>{selectedRecipe.instructions}</ReactMarkdown>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-3 prose prose-orange max-w-none dark:prose-invert">
                      <ReactMarkdown>{selectedRecipe.details}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* MASTER LIST VIEW */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6"
            >
              {recipes.length === 0 ? (
                <div className="text-center py-12" style={{ color: t.textSecondary }}>
                  No recipes found. Try adding more items to your inventory!
                </div>
              ) : (
                recipes.map((recipe, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="group cursor-pointer p-6 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      background: t.cardBg,
                      borderColor: t.cardBorder,
                      boxShadow: t.cardShadow,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-xl font-bold" style={{ color: t.textPrimary }}>
                        {recipe.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                          <Clock size={16} className="text-orange-500" /> {recipe.time}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                          <Flame size={16} className="text-orange-500" /> {recipe.macros}
                        </div>
                        {recipe.globalCuisine && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                            <Globe size={16} className="text-orange-500" /> {recipe.globalCuisine}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

      <Modal open={showHistoryModal} onClose={() => { setShowHistoryModal(false); setSelectedHistoryRecipe(null); }} title="Cooking History" size="4xl">
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] pr-1">
          <div className="p-2 space-y-4">
          {selectedHistoryRecipe ? (
            // Detail view inside history modal
            <div>
              <button
                onClick={() => setSelectedHistoryRecipe(null)}
                className="mb-4 flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-600"
              >
                <ArrowLeft size={16} /> Back to History
              </button>
              <div className="p-4 rounded-2xl border" style={{ background: t.cardBg, borderColor: t.cardBorder }}>
                <h2 className="text-xl font-bold mb-3" style={{ color: t.textPrimary }}>{selectedHistoryRecipe.title}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                    <Clock size={12} className="text-orange-500" /> {selectedHistoryRecipe.time}
                  </span>
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}>
                    <Flame size={12} className="text-orange-500" /> {selectedHistoryRecipe.macros}
                  </span>
                </div>
                <div className="prose prose-orange max-w-none dark:prose-invert text-sm">
                  {selectedHistoryRecipe.ingredients ? (
                    <>
                      <h4 className="font-bold mb-1">Ingredients</h4>
                      <ReactMarkdown>{selectedHistoryRecipe.ingredients}</ReactMarkdown>
                      <h4 className="font-bold mt-3 mb-1">Instructions</h4>
                      <ReactMarkdown>{selectedHistoryRecipe.instructions}</ReactMarkdown>
                    </>
                  ) : (
                    <ReactMarkdown>{selectedHistoryRecipe.details}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ) : cookedHistory.length === 0 ? (
            <p style={{ color: t.textSecondary }}>No recipes cooked yet.</p>
          ) : (
            <div className="grid gap-3">
              {cookedHistory.map((recipe, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedHistoryRecipe(recipe)}
                  className="p-3 rounded-xl border cursor-pointer flex flex-col gap-2 transition-all hover:shadow-md"
                  style={{ background: t.cardBg, borderColor: t.cardBorder }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold" style={{ color: t.textPrimary }}>{recipe.title}</h3>
                    <ArrowLeft size={14} className="text-orange-400 rotate-180 shrink-0" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full" style={{ background: t.pillBg, color: t.textSecondary }}>
                      <Clock size={10} className="text-orange-500" /> {recipe.time}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-full" style={{ background: t.pillBg, color: t.textSecondary }}>
                      <Flame size={10} className="text-orange-500" /> {recipe.macros}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </div>
        </div>
      </Modal>

      <Modal open={showLogConfirm} onClose={() => setShowLogConfirm(false)} title="Confirm Meal Log" size="sm">
        <div className="p-4 space-y-4">
          <p style={{ color: t.textSecondary }}>Are you sure you want to log <b>{selectedRecipe?.title}</b> into your Calorie Tracker?</p>
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => setShowLogConfirm(false)}
              className="px-4 py-2 font-medium rounded-xl"
              style={{ color: t.textSecondary, backgroundColor: t.pillBg }}
            >
              Cancel
            </button>
            <button 
              onClick={() => { setShowLogConfirm(false); handleLogRecipe(); }}
              className="px-4 py-2 bg-[#FF6B4A] text-white font-medium rounded-xl shadow-lg hover:opacity-90"
            >
              Yes, Log It!
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
