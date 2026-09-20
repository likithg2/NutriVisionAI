import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search as SearchIcon, ChevronRight, Plus, Loader2, ArrowLeft, Sparkles, Clock, Utensils, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios.js";
import Markdown from "react-markdown";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  const navigate = useNavigate();
  const { dark } = useTheme();
  const { user } = useAuth();

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      setError("");
      
      // USDA Search
      api.get(`/api/usda/search?query=${encodeURIComponent(query)}`)
        .then(res => setResults(res.data.foods || []))
        .catch(err => setError(err.response?.data?.error || "Failed to fetch foods"))
        .finally(() => setLoading(false));

      // AI Search
      setAiLoading(true);
      setAiResponse(null);
      api.post('/api/chat', { userId: user?.id, message: query, history: [] })
        .then(res => setAiResponse(res.data?.reply || res.data?.structured?.summary || String(res.data)))
        .catch(err => console.error("AI Search Error:", err))
        .finally(() => setAiLoading(false));

    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelectFood = async (fdcId) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/api/usda/food/${fdcId}`);
      setSelectedFood(res.data.food);
    } catch (err) {
      setError("Failed to fetch food details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAdd = () => {
    if (selectedFood) {
      navigate(`/calories?addFood=${selectedFood.fdcId}`);
    }
  };

  const resetSelection = () => {
    setSelectedFood(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>Smart Search</h1>
          <p className="text-sm mt-1" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Search your inventory, get recipes, ask about expiry, or find nutritional info.</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass p-6 sm:p-8 rounded-3xl min-h-[60vh] flex flex-col relative overflow-hidden">
        
        {!selectedFood ? (
          <>
            <div className="relative mb-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                autoFocus
                placeholder="Ask anything — 'What's expiring?', 'What can I make?', or search foods..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full glass border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-[#FF6B4A] transition-colors text-base shadow-sm"
                style={{ color: dark ? '#FDF6F0' : '#1A1210', background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
              />
              {loading && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-[#FF6B4A]" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              
              {/* Premium Empty State */}
              {query.trim().length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 sm:py-10 h-full w-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-sky-400/20 to-indigo-500/20 mb-4 shadow-[0_0_40px_rgba(56,189,248,0.2)] ring-1 ring-white/20">
                      <Sparkles className="w-8 h-8 text-sky-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>
                      Unlock Your Kitchen's Potential
                    </h2>
                    <p className="text-sm max-w-md mx-auto leading-relaxed px-4" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
                      Ask me anything about your inventory, get personalized recipes, or search for nutritional data of any food on earth.
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-2">
                    {[
                      { icon: Clock, title: "Expiring Soon", desc: "What should I eat first?", q: "What's expiring soon?", color: "text-amber-500", bg: "bg-amber-500/10" },
                      { icon: Utensils, title: "Recipe Magic", desc: "What can I cook?", q: "What can I cook with my inventory?", color: "text-sky-500", bg: "bg-sky-500/10" },
                      { icon: Info, title: "Nutritional Info", desc: "Calories in an Apple", q: "Apple", color: "text-mint-500", bg: "bg-mint-500/10" },
                      { icon: AlertTriangle, title: "Safety Check", desc: "Are my eggs still good?", q: "Are my eggs still good?", color: "text-rose-500", bg: "bg-rose-500/10" }
                    ].map((s, i) => (
                      <motion.button 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.05) }}
                        onClick={() => setQuery(s.q)}
                        className="p-4 sm:p-5 rounded-3xl glass group hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-4 text-left border border-white/20 dark:border-white/5 overflow-hidden relative shadow-sm"
                        style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.5)" }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                        <div className={`p-3 rounded-2xl shrink-0 ${s.bg}`}>
                          <s.icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-0.5" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{s.title}</p>
                          <p className="text-xs" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>{s.desc}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 ml-auto text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
              {/* AI Insights Section */}
              {(query.trim().length >= 2) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>AI Insights</h3>
                  {aiLoading ? (
                    <div className="flex items-center gap-3 p-4 glass rounded-2xl" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)" }}>
                      <Loader2 className="w-5 h-5 animate-spin text-[#FF6B4A]" />
                      <span className="text-sm" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Thinking...</span>
                    </div>
                  ) : aiResponse ? (
                    <div className="p-5 glass rounded-2xl shadow-sm border border-transparent text-sm leading-relaxed 
                                    prose prose-sm dark:prose-invert max-w-none
                                    prose-headings:text-[#FF6B4A] prose-headings:font-bold
                                    prose-a:text-[#FF6B4A] hover:prose-a:text-[#E55540]
                                    prose-li:marker:text-[#FF6B4A]" 
                         style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)", color: dark ? '#E5D5C5' : '#4A4542' }}>
                      <Markdown>{aiResponse}</Markdown>
                    </div>
                  ) : null}
                </div>
              )}

              {/* USDA Database Results */}
              {(results.length > 0 || (loading && query.length >= 2)) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Database Results</h3>
                  
                  {error && <p className="text-red-500 text-sm text-center py-4">{error}</p>}
                  
                  <div className="space-y-3">
                    {results.map((food) => (
                      <button
                        key={food.fdcId}
                        onClick={() => handleSelectFood(food.fdcId)}
                        className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:border-[#FF6B4A]/50 transition-colors text-left group shadow-sm border border-transparent"
                        style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)" }}
                      >
                        <div>
                          <p className="font-semibold text-base line-clamp-1" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{food.name}</p>
                          <p className="text-sm mt-1 flex gap-2" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>
                            {food.brand && <span>{food.brand} • </span>}
                            <span>{Math.round(food.calories)} kcal</span>
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#FF6B4A] transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6">
              {detailsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF6B4A]" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={resetSelection} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{selectedFood.name}</h3>
                      {selectedFood.brand && <p className="text-sm mt-1" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>{selectedFood.brand}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.8)" }}>
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Calories</p>
                      <p className="text-3xl font-bold mt-2 text-[#FF6B4A]">{Math.round(selectedFood.calories)} <span className="text-sm font-normal" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>kcal</span></p>
                    </div>
                    <div className="p-5 rounded-2xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.8)" }}>
                      <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Serving Size</p>
                      <p className="text-xl font-medium mt-3" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{selectedFood.servingSize}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shadow-sm" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.8)" }}>
                    <div className="px-5 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50" style={{ background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                      <h4 className="text-sm font-semibold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>Macros</h4>
                    </div>
                    <div className="p-5 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{Math.round(selectedFood.protein)}g</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Protein</p>
                      </div>
                      <div className="border-x border-zinc-100 dark:border-zinc-800">
                        <p className="text-2xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{Math.round(selectedFood.carbohydrates)}g</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Carbs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{Math.round(selectedFood.fat)}g</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>Fat</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <button
                onClick={handleAdd}
                disabled={detailsLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold disabled:opacity-50 transition-colors shadow-lg"
                style={{ background: "linear-gradient(135deg, #FF6B4A, #E55540)" }}
              >
                <Plus className="w-5 h-5" />
                Add to Tracker
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
