import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Clock, Flame, ArrowLeft, Globe, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../context/ThemeContext.jsx";
import { useKitchen } from "../context/KitchenContext.jsx";

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
  const { dark } = useTheme();
  const t = tokens(dark);

  const { recipes, loading, error, refreshRecipes } = useKitchen();
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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
    </div>
  );
}
