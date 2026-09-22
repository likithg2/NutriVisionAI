import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getItems, addItem, updateItem, deleteItem } from "../api/items.js";
import { searchUSDA } from "../api/usda.js";
import { getShoppingRecommendations } from "../api/chat.js";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../context/InventoryContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { scanImage, estimateFood } from "../api/scanner.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import {
  Package, Plus, Search, Trash2, Edit2, AlertCircle, ShoppingCart, 
  CalendarDays, Tag, DollarSign, Battery, Activity, Loader2, Sparkles, RefreshCcw, Image as ImageIcon,
  ChevronDown, Maximize2, X, Upload, Check, ChevronRight, CheckCircle2, Info,
  Clock, Flame, MapPin, Smartphone, MoveRight, HelpCircle, RotateCw, ChefHat, Camera, Search as SearchIcon2, Globe
} from "lucide-react";

/* ─── constants ─── */
const STATUS_COLOR = { active: "green", expired: "red", consumed: "zinc", partially_consumed: "amber" };
const CATS = ["grocery","dairy","produce","meat","beverage","supplement","snack","medicine","other"];
const SI_UNITS = ["pcs","g","kg","mg","ml","L","oz","lb","cup","tbsp","tsp","dozen","pack","bottle","can","box","bag","strip","tablet"];
const emptyForm = { name:"", brand:"", category:"grocery", quantity:"", unit:"pcs", location:"pantry", expiryDate:"", estimatedCost:"", calories:"", protein:"", carbs:"", fat:"", fiber:"", notes:"" };

function daysUntil(d) { return d ? Math.ceil((new Date(d) - new Date()) / 86400000) : Infinity; }

/* ─── USDA Autocomplete Hook ─── */
function useUsdaAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await searchUSDA(q);
        const foods = r.data?.foods || r.data || [];
        setResults(foods.slice(0, 8));
        setOpen(foods.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
  }, []);

  return { query, setQuery, results, loading, open, setOpen, search };
}

/* ─── Scanning Animation ─── */
function ScanOverlay() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl">
      <motion.div
        className="absolute left-0 right-0 h-1"
        style={{ background: "linear-gradient(90deg, transparent, #FF6B4A, transparent)", boxShadow: "0 0 20px #FF6B4A" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(255,107,74,0.03)" }} />
    </div>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="fixed top-28 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl backdrop-blur-2xl bg-white/60 dark:bg-[#1A1210]/60 border border-white/20 dark:border-white/10 text-zinc-800 dark:text-zinc-200"
    >
      {type === "success" ? <Check className="w-4 h-4 text-mint-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
      {msg}
    </motion.div>
  );
}

/* ─── Item Card ─── */
function ItemCard({ item, onSelect, delay }) {
  const days = daysUntil(item.expiryDate);
  const urgColor = days <= 3 ? "text-red-500" : days <= 7 ? "text-amber-500" : "text-green-500";
  
  let bg = "rgba(34,197,94,0.1)"; // fresh / green
  if (item.status === "consumed") bg = "rgba(56,189,248,0.15)"; // blue
  else if (item.status === "partially_consumed") bg = "rgba(245,158,11,0.15)"; // amber

  else if (days <= 3) bg = "rgba(239,68,68,0.15)"; // red
  else if (days <= 7) bg = "rgba(245,158,11,0.15)"; // yellow 
  
  return (
    <GlassCard delay={delay} className="group relative cursor-pointer hover:shadow-lg hover:scale-[1.02]" style={{ background: bg }} onClick={() => onSelect(item)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{item.name}</h3>
            <Badge color={STATUS_COLOR[item.status] || "zinc"}>{item.status.replace("_", " ")}</Badge>
          </div>
          {item.brand && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{item.brand}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            {item.calories != null && <span>🔥 {item.calories} kcal</span>}
            {item.protein != null && <span>💪 {item.protein}g</span>}
            {item.quantity && <span>📦 {item.quantity} {item.unit}</span>}
            {days !== Infinity && item.status !== "consumed" && item.status !== "partially_consumed" && <span className={urgColor}>📅 {days <= 0 ? "Expired" : `Expires in ${days}d`}</span>}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── MAIN ─── */
export default function Inventory() {
  const { items, loading, refreshInventory } = useInventory();
  const { dark } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formTab, setFormTab] = useState("manual");
  const [saving, setSaving] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [aiEstimateLoading, setAiEstimateLoading] = useState(false);
  const fileRef = useRef();
  const usda = useUsdaAutocomplete();
  const navigate = useNavigate();

  // Use Item Modal state
  const [useModalOpen, setUseModalOpen] = useState(false);
  const [useItem, setUseItem] = useState(null);
  const [partialAmt, setPartialAmt] = useState("");
  const [useLoading, setUseLoading] = useState(false);

  // Shopping Modal state
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);

  const [toast, setToast] = useState({ msg: "", type: "" });
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  const fetchRecommendations = async (force = false) => {
    setShopLoading(true);
    setRecommendations(null);
    try {
      const r = await getShoppingRecommendations(force);
      setRecommendations(r.data?.reply || "I couldn't generate recommendations right now.");
    } catch (err) {
      console.error(err);
      const apiErrMsg = err.response?.data?.error || err.response?.data?.details || err.message;
      setRecommendations(apiErrMsg ? `Failed to generate: ${apiErrMsg}` : "Failed to fetch recommendations. Make sure the backend is running.");
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => {
    if (shopModalOpen && !recommendations && !shopLoading) {
      fetchRecommendations(false);
    }
  }, [shopModalOpen]);

  const load = () => refreshInventory();

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setFormTab("manual"); usda.setQuery(""); usda.setOpen(false); setScanPreview(null); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditItem(null); setScanPreview(null); };

  const handleCompletelyUsed = async () => {
    setUseLoading(true);
    try {
      await updateItem(detailItem.id || detailItem._id, { status: "consumed" });
      setDetailItem(null);
      refreshInventory();
      showToast(`${detailItem.name} was used completely`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    } finally {
      setUseLoading(false);
    }
  };

  const handlePartiallyUsed = async (e) => {
    e.preventDefault();
    setUseLoading(true);
    try {
      await updateItem(detailItem.id || detailItem._id, { quantity: Number(partialAmt), status: "partially_consumed" });
      setDetailItem(null);
      refreshInventory();
      showToast(`${detailItem.name} quantity updated to ${partialAmt}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update quantity", "error");
    } finally {
      setUseLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      await deleteItem(editItem.id || editItem._id);
      closeModal();
      refreshInventory();
      showToast("Item deleted", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete item", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalForm = { ...form };
      if (!editItem && !finalForm.calories && finalForm.name && finalForm.quantity && finalForm.category !== 'medicine') {
        try {
          const r = await estimateFood(finalForm.name, finalForm.quantity);
          if (r.data) {
            finalForm = { ...finalForm, ...r.data };
          }
        } catch (e) {
          console.error("Auto-analyse failed:", e);
        }
      }

      if (editItem) {
        await updateItem(editItem.id || editItem._id, finalForm);
        showToast("Item updated", "success");
      } else {
        await addItem(finalForm);
        showToast("Item added", "success");
      }
      closeModal();
      refreshInventory();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || "Failed to save item", "error");
    } finally {
      setSaving(false);
    }
  };

  /* USDA autocomplete pick */
  const applyUSDA = food => {
    setForm(f => ({
      ...f,
      name: food.description || food.name || f.name,
      brand: food.brandOwner || food.brand || "",
      calories: food.foodNutrients?.find(n=>n.nutrientName?.includes("Energy"))?.value || food.calories || "",
      protein: food.foodNutrients?.find(n=>n.nutrientName?.includes("Protein"))?.value || food.protein || "",
      carbs: food.foodNutrients?.find(n=>n.nutrientName?.toLowerCase().includes("carbohydrate"))?.value || food.carbs || "",
      fat: food.foodNutrients?.find(n=>n.nutrientName?.toLowerCase().includes("total lipid"))?.value || food.fat || "",
    }));
    usda.setQuery(food.description || food.name || "");
    usda.setOpen(false);

    // Call estimateFood silently to get category and unit if they are default
    estimateFood(food.description || food.name).then(r => {
      if (r.data) {
        setForm(f => ({
          ...f,
          category: f.category !== 'grocery' ? f.category : (r.data.category || 'grocery'),
          unit: f.unit !== 'pcs' ? f.unit : (r.data.unit || 'pcs'),
        }));
      }
    }).catch(() => {});
  };

  const handleAnalyseItem = async () => {
    const queryName = editItem ? form.name : usda.query;
    if (!queryName || queryName.length < 2) return;
    setAiEstimateLoading(true);
    try {
      const r = await estimateFood(queryName);
      const data = r.data;
      if (data) {
        setForm(f => ({
          ...f,
          category: data.category || f.category,
          unit: data.unit || f.unit,
          calories: data.calories || f.calories || "",
          protein: data.protein || f.protein || "",
          carbs: data.carbs || f.carbs || "",
          fat: data.fat || f.fat || "",
          estimatedCost: data.estimatedCost || f.estimatedCost || "",
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiEstimateLoading(false);
    }
  };

  /* AI scan */
  const doScan = async file => {
    if (!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanLoading(true);
    const fd = new FormData(); fd.append("image", file);
    try {
      const r = await scanImage(fd);
      const data = r.data?.result || r.data || {};
      setForm(f => ({ ...f, ...Object.fromEntries(Object.entries(data).filter(([,v]) => v != null && v !== "")) }));
      setFormTab("manual");
      showToast("AI scanned image successfully", "success");
    } catch {
      showToast("Failed to scan image", "error");
    }
    finally { setScanLoading(false); }
  };

  const handleDrop = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) doScan(f); };

  const filtered = items.filter(item => {
    const ms = !search || item.name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || item.status === filter || item.category === filter || (filter === "consumed" && item.status === "partially_consumed");
    return ms && mf;
  });

  const activeFiltered = filtered.filter(i => i.status !== "expired" && i.status !== "consumed" && i.status !== "partially_consumed");
  const consumedFiltered = filtered.filter(i => i.status === "consumed" || i.status === "partially_consumed");
  const expiredFiltered = filtered.filter(i => i.status === "expired");

  return (
    <div className="space-y-5">
      <AnimatePresence><Toast msg={toast.msg} type={toast.type} /></AnimatePresence>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">SmartShelf</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{items.length} items tracked</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => navigate("/kitchen")} className="gap-2 text-[#FF6B4A] hover:bg-orange-500/10">
            <ChefHat className="w-4 h-4" /> Don't know what to cook? Click here
          </Button>
          <Button variant="ghost" onClick={() => setShopModalOpen(true)} className="gap-2">
            <ShoppingCart className="w-4 h-4" /> Shopping
          </Button>
          <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Item</Button>
        </div>
      </div>

      <GlassCard hover={false} className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full glass rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-mint-500/40" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all","active","expired","consumed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filter === f ? "bg-mint-500 text-white" : "glass text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"}`}>{f}</button>
          ))}
        </div>
      </GlassCard>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="space-y-8">
          {/* Active Items */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-200">Active Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>{activeFiltered.map((item, i) => <ItemCard key={item.id} item={item} onSelect={setDetailItem} delay={i * 0.04} />)}</AnimatePresence>
              {!activeFiltered.length && <div className="col-span-full text-center py-10 text-zinc-400">No active items found.</div>}
            </div>
          </div>

          {/* Consumed Items */}
          {consumedFiltered.length > 0 && (
            <div className="pt-6 border-t border-black/5 dark:border-white/5">
              <h2 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-200">Consumed & Partially Consumed Items</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>{consumedFiltered.map((item, i) => <ItemCard key={item.id} item={item} onSelect={setDetailItem} delay={i * 0.04} />)}</AnimatePresence>
              </div>
            </div>
          )}

          {/* Discarded Items (Expired) */}
          {expiredFiltered.length > 0 && (
            <div className="pt-6 border-t border-black/5 dark:border-white/5">
              <h2 className="text-lg font-semibold mb-4 text-zinc-700 dark:text-zinc-200">Discarded / Expired</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>{expiredFiltered.map((item, i) => <ItemCard key={item.id} item={item} onSelect={setDetailItem} delay={i * 0.04} />)}</AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      <Modal open={modalOpen} onClose={closeModal} title={editItem ? "Edit Item" : "Add New Item"} size="lg">
        {!editItem && (
          <div className="flex p-1 mb-6 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[["manual","Manual Entry","📝"],["scan","AI Scan","🤖"]].map(([tKey, label, emoji]) => (
              <button key={tKey} type="button" onClick={() => setFormTab(tKey)}
                className="relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors z-10"
                style={{ color: formTab === tKey ? "inherit" : "rgba(161,161,170,0.6)" }}>
                {formTab === tKey && <motion.span layoutId="form-tab" className="absolute inset-0 rounded-lg glass" transition={{ type:"spring", bounce:0.2, duration:0.4 }} />}
                <span className="relative z-10 flex items-center justify-center gap-2">{emoji} {label}</span>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── AI SCAN TAB ── */}
          {formTab === "scan" && (
            <motion.div key="scan" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !scanLoading && fileRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 py-14 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  dragOver ? "border-mint-400 bg-mint-500/10 scale-[1.01]" : "border-zinc-700 hover:border-zinc-500 hover:bg-white/[0.02]"
                }`}
              >
                {scanLoading && <ScanOverlay />}
                {scanPreview ? (
                  <img src={scanPreview} alt="Preview" className="w-32 h-32 rounded-2xl object-cover ring-2 ring-mint-500/30" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-mint-500/10 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-mint-400" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium">{scanLoading ? "Analyzing with AI..." : "Drop image or click to upload"}</p>
                  <p className="text-xs text-zinc-500 mt-1">JPG, PNG up to 10MB — AI will identify the food</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => doScan(e.target.files?.[0])} />
              </div>
              {scanLoading && <p className="text-center text-xs text-mint-400 mt-3 animate-pulse">✨ Identifying food and estimating nutrition...</p>}
            </motion.div>
          )}

          {/* ── MANUAL ENTRY TAB ── */}
          {formTab === "manual" && (
            <motion.form key="manual" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} transition={{ duration:0.25 }}
              onSubmit={handleSave} className="space-y-5">

              {/* Name with USDA autocomplete */}
              <div className="relative">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block">Item Name *</label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    value={editItem ? form.name : usda.query}
                    onChange={e => { if (!editItem) { usda.search(e.target.value); setForm(f => ({...f, name: e.target.value})); } else setForm(f=>({...f,name:e.target.value})); }}
                    onFocus={() => usda.results.length > 0 && usda.setOpen(true)}
                    placeholder="Start typing to search USDA database..."
                    className="w-full glass rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-500/40"
                    required
                  />
                  {(usda.loading || aiEstimateLoading) && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-mint-500 border-t-transparent animate-spin" />}
                </div>
                {/* Autocomplete dropdown */}
                <AnimatePresence>
                  {usda.open && usda.results.length > 0 && (
                    <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                      className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl glass p-1">
                      {usda.results.map((food, i) => (
                        <button key={i} type="button" onClick={() => applyUSDA(food)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-mint-500/10 transition-colors text-sm flex items-start gap-3">
                          <Sparkles className="w-3.5 h-3.5 text-mint-400 mt-1 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{food.description || food.name}</div>
                            <div className="text-xs text-zinc-500 truncate">{food.brandOwner || food.brand || "Generic"}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Brand" value={form.brand} onChange={e => setForm(f=>({...f,brand:e.target.value}))} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-500/40 bg-transparent">
                    {CATS.map(c => <option key={c} value={c} className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <Input 
                  label="Quantity" 
                  type="number" 
                  value={form.quantity} 
                  onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} 
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Unit</label>
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="glass rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint-500/40 bg-transparent">
                    {SI_UNITS.map(u => <option key={u} value={u} className="bg-white dark:bg-[#1A1210] text-zinc-900 dark:text-zinc-100">{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Expiry Date *" type="date" value={form.expiryDate} onChange={e=>setForm(f=>({...f,expiryDate:e.target.value}))} required icon={CalendarDays} />
                <Input label="Estimated Cost (₹)" type="number" step="0.01" value={form.estimatedCost} onChange={e=>setForm(f=>({...f,estimatedCost:e.target.value}))} />
              </div>

              {form.category !== 'medicine' && (
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Macros (per serving)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Calories (kcal)" type="number" value={form.calories} onChange={e=>setForm(f=>({...f,calories:e.target.value}))} />
                    <Input label="Protein (g)" type="number" value={form.protein} onChange={e=>setForm(f=>({...f,protein:e.target.value}))} />
                    <Input label="Carbs (g)" type="number" value={form.carbs} onChange={e=>setForm(f=>({...f,carbs:e.target.value}))} />
                    <Input label="Fat (g)" type="number" value={form.fat} onChange={e=>setForm(f=>({...f,fat:e.target.value}))} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <Button variant="ghost" type="button" onClick={closeModal}>Cancel</Button>
                <Button type="button" variant="ghost" onClick={handleAnalyseItem} loading={aiEstimateLoading} className="gap-1.5 text-[#FF6B4A] hover:bg-orange-500/10">
                  <Sparkles className="w-4 h-4" /> Analyse
                </Button>
                <Button type="submit" loading={saving}>{editItem ? "Save Changes" : "Add to Inventory"}</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Modal>

      {/* ── SHOPPING RECOMMENDATIONS MODAL ── */}
      <Modal open={shopModalOpen} onClose={() => setShopModalOpen(false)} title={
        <div className="flex justify-between items-center w-full">
          <span>Smart Shopping List</span>
          <button onClick={(e) => { e.stopPropagation(); fetchRecommendations(true); }} disabled={shopLoading} className={`p-1 mr-4 transition-colors ${shopLoading ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' : 'text-sky-400 hover:text-sky-500'}`}>
            <RotateCw className={`w-5 h-5 ${shopLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      } size="5xl" placement="center">
        <div className="flex flex-col items-center justify-center text-center mb-6 space-y-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center relative"
               style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8)", boxShadow: "0 4px 20px rgba(56, 189, 248, 0.4)" }}>
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Get cost-effective grocery recommendations based on your current inventory.
          </p>
        </div>

        <AnimatePresence>
          {recommendations && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 sm:p-6 w-full">
              {Array.isArray(recommendations) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="glass p-4 rounded-2xl flex flex-col justify-between border border-zinc-200 dark:border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-sm" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-8">
                          <h4 className="font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">{rec.item}</h4>
                          <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 uppercase tracking-wider font-bold border border-sky-500/20">{rec.category}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const itemName = rec.item;
                            setForm({ ...emptyForm, name: itemName, category: (rec.category || 'grocery').toLowerCase(), quantity: "", unit: 'pcs' });
                            usda.setQuery(itemName);
                            usda.setOpen(false);
                            setEditItem(null);
                            setFormTab("manual");
                            setShopModalOpen(false);
                            setModalOpen(true);
                          }}
                          className="absolute right-3 top-3 p-2 rounded-full bg-zinc-100 hover:bg-sky-500 hover:text-white dark:bg-white/5 dark:hover:bg-sky-500 transition-colors text-zinc-500 dark:text-zinc-400 shadow-sm"
                          title="Add to Inventory"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">{rec.reason}</p>
                      {rec.globalCuisine && (
                        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-white/5 text-[11px] font-medium flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                          <Globe className="w-3.5 h-3.5 text-sky-500" /> {rec.globalCuisine}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none 
                                prose-headings:text-sky-500 prose-headings:font-semibold
                                prose-a:text-sky-500 hover:prose-a:text-indigo-400
                                prose-li:marker:text-sky-500
                                prose-table:w-full prose-table:border-collapse 
                                prose-th:border prose-th:border-zinc-300 dark:prose-th:border-zinc-700 prose-th:p-2 prose-th:bg-zinc-50 dark:prose-th:bg-zinc-800/50
                                prose-td:border prose-td:border-zinc-200 dark:prose-td:border-zinc-800 prose-td:p-2">
                  <Markdown remarkPlugins={[remarkGfm]}>{recommendations}</Markdown>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
      

      {/* Detail Item Modal */}
      <Modal open={!!detailItem} onClose={() => setDetailItem(null)} title={
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-orange-500" />
          <span className="text-xl">Item Details</span>
        </div>
      } size="md">
        {detailItem && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{detailItem.name}</h3>
                  {detailItem.brand && <p className="text-zinc-500">{detailItem.brand}</p>}
                </div>
                <Badge color={STATUS_COLOR[detailItem.status] || "zinc"}>{detailItem.status}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mt-6">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-1">Category</p>
                  <p className="font-semibold capitalize">{detailItem.category}</p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-1">Location</p>
                  <p className="font-semibold capitalize">{detailItem.location}</p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-1">Quantity</p>
                  <p className="font-semibold">{detailItem.quantity} {detailItem.unit}</p>
                </div>
                {detailItem.expiryDate && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-1">Expiry Date</p>
                    <p className="font-semibold">{new Date(detailItem.expiryDate).toLocaleDateString()}</p>
                  </div>
                )}
                {detailItem.estimatedCost && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-1">Est. Cost</p>
                    <p className="font-semibold">${detailItem.estimatedCost}</p>
                  </div>
                )}
              </div>
            </div>

            {(detailItem.calories || detailItem.protein || detailItem.carbs || detailItem.fat || detailItem.fiber) && (
              <div className="glass rounded-2xl p-6">
                <h4 className="font-semibold mb-3">Nutrition</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  {detailItem.calories && <div><p className="text-orange-500 font-bold">{detailItem.calories}</p><p className="text-xs text-zinc-500">kcal</p></div>}
                  {detailItem.protein && <div><p className="text-blue-500 font-bold">{detailItem.protein}g</p><p className="text-xs text-zinc-500">Protein</p></div>}
                  {detailItem.carbs && <div><p className="text-yellow-500 font-bold">{detailItem.carbs}g</p><p className="text-xs text-zinc-500">Carbs</p></div>}
                  {detailItem.fat && <div><p className="text-pink-500 font-bold">{detailItem.fat}g</p><p className="text-xs text-zinc-500">Fat</p></div>}
                  {detailItem.fiber && <div><p className="text-green-500 font-bold">{detailItem.fiber}g</p><p className="text-xs text-zinc-500">Fiber</p></div>}
                </div>
              </div>
            )}

            {detailItem.notes && (
              <div className="glass rounded-2xl p-6">
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm">{detailItem.notes}</p>
              </div>
            )}

            {detailItem.status === "active" && (
              <div className="glass rounded-2xl p-6 mt-4">
                <h4 className="font-semibold mb-4 text-lg">Update Usage</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={handleCompletelyUsed} loading={useLoading} className="w-full h-12 bg-red-500 hover:bg-red-600 text-white border-0 font-semibold">
                    Mark as Consumed
                  </Button>
                  <form onSubmit={handlePartiallyUsed} className="flex flex-col gap-2">
                    <div className="relative">
                      <Input
                        placeholder="Amt used..."
                        type="number"
                        value={partialAmt}
                        onChange={e => setPartialAmt(e.target.value)}
                        required
                        className="h-10 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium">
                        {detailItem.unit}
                      </span>
                    </div>
                    <Button type="submit" loading={useLoading} variant="ghost" className="w-full h-10 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                      Partially Used
                    </Button>
                  </form>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-700 mt-2">
              <button 
                onClick={() => setDetailItem(null)} 
                className="px-5 py-2.5 rounded-xl font-medium transition-colors bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
