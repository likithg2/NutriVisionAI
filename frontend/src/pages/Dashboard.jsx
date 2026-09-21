import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getItems } from "../api/items.js";
import { getActivity } from "../api/activity.js";
import { getDashboardSuggestions } from "../api/chat.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import AnimatedCounter from "../components/ui/AnimatedCounter.jsx";
import Badge from "../components/ui/Badge.jsx";
import MacroDonut from "../components/charts/MacroDonut.jsx";
import CalorieTrend from "../components/charts/CalorieTrend.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Flame, Package, AlertTriangle, Zap,
  ArrowUp, ArrowDown, ChevronDown, ChevronsUpDown,
  Clock, CalendarDays, Search, Sparkles, RotateCw
} from "lucide-react";

/* ───────────── helpers ───────────── */
function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function urgencyColor(days) {
  if (days <= 3) return { badge: "red", dot: "bg-red-500", ring: "ring-red-500/20", text: "text-red-500", bg: "rgba(239,68,68,0.15)" };
  if (days <= 7) return { badge: "yellow", dot: "bg-amber-400", ring: "ring-amber-400/20", text: "text-amber-500", bg: "rgba(245,158,11,0.15)" };
  return { badge: "green", dot: "bg-mint-500", ring: "ring-mint-500/20", text: "text-mint-500", bg: "rgba(34,197,94,0.1)" };
}

function urgencyLabel(days) {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Tomorrow";
  return `${days}d left`;
}

function streakDays(activities) {
  if (!activities?.length) return 0;
  const byDay = new Set();
  activities.forEach(a => { const d = new Date(a.createdAt); byDay.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`); });
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (byDay.has(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)) streak++;
    else break;
  }
  return streak;
}

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ───────────── KPI Card ───────────── */
function KPICard({ icon: Icon, label, value, prefix, suffix, color, delay, subtext }) {
  return (
    <GlassCard delay={delay} className="flex items-start gap-4 min-h-[96px]">
      <div className={"w-11 h-11 rounded-xl flex items-center justify-center shrink-0 " + color}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1 truncate">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-none">
          {prefix && <span className="text-sm font-semibold mr-0.5 text-zinc-400">{prefix}</span>}<AnimatedCounter value={value} />{suffix && <span className="text-sm font-semibold ml-0.5 text-zinc-400">{suffix}</span>}
        </p>
        {subtext && <p className="text-xs text-zinc-400 mt-1.5 truncate">{subtext}</p>}
      </div>
    </GlassCard>
  );
}

/* ───────────── Smart Suggestions ───────────── */
function SmartSuggestions({ delay }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = (force = false) => {
    setLoading(true);
    getDashboardSuggestions(force)
      .then(res => setSuggestion(res.data.reply))
      .catch(err => console.error("Failed to fetch suggestions:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSuggestions(false);
  }, []);

  const handleRefresh = (e) => {
    e.stopPropagation();
    fetchSuggestions(true);
  };

  if (!suggestion && !loading) {
    return (
      <GlassCard delay={delay} className="relative overflow-hidden mb-4 opacity-75">
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-zinc-400 to-zinc-600 text-white shadow-lg shadow-zinc-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI Assistant</h3>
              <button onClick={handleRefresh} className="p-1 text-zinc-400 hover:text-mint-500 transition-colors">
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
              AI suggestions are currently unavailable. Check back later!
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard delay={delay} className="relative overflow-hidden mb-4">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-mint-500/10 via-transparent to-purple-500/10 opacity-50 pointer-events-none" />
      
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-mint-400 to-mint-600 text-white shadow-lg shadow-mint-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI Assistant</h3>
            <button onClick={handleRefresh} disabled={loading} className={`p-1 transition-colors ${loading ? 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-mint-500'}`}>
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-2 mt-2">
              <div className="h-3 w-3/4 bg-zinc-200/60 dark:bg-zinc-700/60 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-zinc-200/60 dark:bg-zinc-700/60 rounded animate-pulse" />
            </div>
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
              {suggestion}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

/* ───────────── Expiring Soon List ───────────── */
function LiveCountdown({ targetDate, days }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) return;
    if (days > 2) {
      setTimeLeft(urgencyLabel(days));
      return;
    }
    const updateTimer = () => {
      const target = new Date(targetDate);
      target.setHours(23, 59, 59, 999);
      const diff = target - new Date();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      else setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate, days]);
  return <span>{timeLeft}</span>;
}

function ExpiringSoonList({ items }) {
  if (!items.length) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-mint-100 dark:bg-mint-900/30 flex items-center justify-center mb-3">
        <CalendarDays className="w-5 h-5 text-mint-500" />
      </div>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">All clear!</p>
      <p className="text-xs text-zinc-400 mt-0.5">No items expiring soon</p>
    </div>
  );

  return (
    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
      {items.map((item, i) => {
        const days = daysUntil(item.expiryDate);
        const urg = urgencyColor(days);
        return (
          <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className={"glass flex items-center gap-3 px-3.5 py-3 rounded-xl ring-1 transition-all hover:scale-[1.01] cursor-default " + urg.ring} style={{ background: urg.bg }}>
            {/* Urgency dot */}
            <span className={"w-2 h-2 rounded-full shrink-0 " + urg.dot} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {item.category && <span className="capitalize">{item.category}</span>}
                {item.quantity && <span> • {item.quantity} {item.unit || "pcs"}</span>}
              </p>
            </div>
            <div className={"text-xs font-semibold shrink-0 tabular-nums " + urg.text}>
              <LiveCountdown targetDate={item.expiryDate} days={days} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ───────────── Inventory Data Grid ───────────── */
function InventoryGrid({ items }) {
  const [sortCol, setSortCol] = useState("expiryDate");
  const [sortDir, setSortDir] = useState("asc");
  const [filter, setFilter] = useState("");

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let data = [...items];
    if (filter) data = data.filter(i => i.name?.toLowerCase().includes(filter.toLowerCase()) || i.category?.toLowerCase().includes(filter.toLowerCase()));
    data.sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol];
      if (sortCol === "expiryDate" || sortCol === "createdAt") { va = new Date(va || 0); vb = new Date(vb || 0); }
      if (typeof va === "string") { va = va.toLowerCase(); vb = (vb || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data.slice(0, 15);
  }, [items, sortCol, sortDir, filter]);

  const SortIcon = ({ col }) => (
    sortCol === col
      ? (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
      : <ChevronsUpDown className="w-3 h-3 opacity-30" />
  );

  const cols = [
    { key: "name", label: "Name", w: "flex-[2]" },
    { key: "category", label: "Category", w: "flex-1 hidden sm:flex" },
    { key: "calories", label: "Calories", w: "w-20 hidden md:flex" },
    { key: "protein", label: "Protein", w: "w-20 hidden lg:flex" },
    { key: "status", label: "Status", w: "w-24" },
    { key: "expiryDate", label: "Expiry", w: "w-28" },
  ];

  const statusColor = { active: "green", expired: "red", consumed: "zinc" };

  return (
    <div>
      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter items..."
            className="w-full glass rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-mint-500/30" />
        </div>
        <span className="text-xs text-zinc-400">{filtered.length} of {items.length} shown</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden ring-1 ring-white/10 dark:ring-white/5">
        {/* Header */}
        <div className="flex items-center px-4 py-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          {cols.map(c => (
            <button key={c.key} onClick={() => handleSort(c.key)}
              className={"flex items-center gap-1 hover:text-zinc-200 transition-colors " + c.w}>
              {c.label} <SortIcon col={c.key} />
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {filtered.map((item, i) => {
            const days = daysUntil(item.expiryDate);
            const urg = urgencyColor(days);
            return (
              <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-center px-4 py-3 text-sm transition-all duration-200 group cursor-default" 
                style={{ background: urg.bg, boxShadow: "inset 0 0 0 0 rgba(255,107,74,0)" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "inset 0 0 40px rgba(255,107,74,0.04)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "inset 0 0 0 0 rgba(255,107,74,0)"}>
                <div className={"truncate font-medium flex items-center gap-2 " + cols[0].w}>
                  <span className={"w-2 h-2 rounded-full shrink-0 " + urg.dot} />
                  {item.name}
                </div>
                <div className={"capitalize text-zinc-400 text-xs " + cols[1].w}>{item.category || "—"}</div>
                <div className={"text-zinc-400 text-xs tabular-nums " + cols[2].w}>{item.calories ? `${item.calories} kcal` : "—"}</div>
                <div className={"text-zinc-400 text-xs tabular-nums " + cols[3].w}>{item.protein ? `${item.protein}g` : "—"}</div>
                <div className={cols[4].w}><Badge color={statusColor[item.status] || "zinc"}>{item.status || "active"}</Badge></div>
                <div className={cols[5].w + " " + urgencyColor(days).text + " text-xs font-medium"}>{urgencyLabel(days)}</div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-sm">No items match your filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── MAIN ───────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getItems({ limit: 100, sort: "expiryDate", order: "asc" }),
      getActivity({ limit: 200 }),
    ])
      .then(([itemsRes, actRes]) => {
        setItems(itemsRes.data?.items || itemsRes.data || []);
        setActivities(actRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── compute KPIs from raw items ── */
  const computed = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const activeItems = items.filter(i => i.status === "active");
    const nonExpiredItems = items.filter(i => i.status !== "expired");
    const expiringItems = activeItems
      .map(i => ({ ...i, _days: daysUntil(i.expiryDate) }))
      .filter(i => i._days <= 7)
      .sort((a, b) => a._days - b._days);

    const totalCalories = items.reduce((s, i) => s + (Number(i.calories) || 0), 0);
    const totalProtein = items.reduce((s, i) => s + (Number(i.protein) || 0), 0);
    const totalCarbs = items.reduce((s, i) => s + (Number(i.carbs) || 0), 0);
    const totalFat = items.reduce((s, i) => s + (Number(i.fat) || 0), 0);
    
    const moneySaved = items
      .filter(i => {
        if (i.status !== "consumed") return false;
        if (!i.expiryDate) return true;
        return new Date(i.updatedAt) <= new Date(i.expiryDate);
      })
      .reduce((s, i) => s + (Number(i.estimatedCost) || 0), 0);

    /* calorie trend: aggregate items by creation day over last 7 days */
    const trend = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - idx));
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const cals = items
        .filter(i => { const c = new Date(i.createdAt); return c >= dayStart && c < dayEnd; })
        .reduce((s, i) => s + (Number(i.calories) || 0), 0);
      return { day: WEEKDAYS[d.getDay()], calories: Math.round(cals) };
    });

    const streak = streakDays(activities);

    return { activeItems, nonExpiredItems, expiringItems, totalCalories, totalProtein, totalCarbs, totalFat, trend, streak, moneySaved };
  }, [items, activities]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  /* ── loading state ── */
  if (loading) return (
    <div>
      <div className="h-8 w-64 bg-zinc-200/60 dark:bg-charcoal-700/60 rounded-xl mb-6 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2"><SkeletonCard /></div>
        <SkeletonCard />
      </div>
      <SkeletonCard />
    </div>
  );

  /* ── KPI definitions ── */
  const kpis = [
    { icon: Flame, label: "Total Calories", value: computed.totalCalories, suffix: " kcal", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-500", subtext: `${items.length} items tracked` },
    { icon: Package, label: "Items in Stock", value: computed.activeItems.length, suffix: "", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-500", subtext: `of ${items.length} total items` },
    { icon: AlertTriangle, label: "Expiring Soon", value: computed.expiringItems.length, suffix: " items", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-500", subtext: "within 7 days" },
    { icon: Zap, label: "Money Saved", value: computed.moneySaved, prefix: "₹", color: "bg-mint-100 dark:bg-mint-900/40 text-mint-600", subtext: "from consumed items" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold mt-0.5">
          {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <KPICard key={k.label} {...k} delay={i * 0.06} />)}
      </div>

      {/* ── Smart Suggestions ── */}
      <SmartSuggestions delay={0.20} />

      {/* ── Dashboard Grid: Calorie Trend + Macro (Left) | Expiring Soon (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassCard delay={0.24} hover={false} className="flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <p className="text-sm font-semibold">Calorie Trend — Last 7 Days</p>
              <span className="text-xs text-zinc-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Updated now</span>
            </div>
            <div className="flex-1 min-h-0">
              <CalorieTrend data={computed.trend} />
            </div>
          </GlassCard>

          <GlassCard delay={0.28} hover={false} className="flex flex-col">
            <p className="text-sm font-semibold mb-4">Macro Breakdown</p>
            <div className="flex-1 min-h-0">
              <MacroDonut protein={computed.totalProtein} carbs={computed.totalCarbs} fat={computed.totalFat} />
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Spoilage Tracker */}
        <div className="relative h-full lg:min-h-0">
          <div className="lg:absolute lg:inset-0">
            <GlassCard delay={0.3} hover={false} className="flex flex-col h-full max-h-[400px] lg:max-h-none">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Expiring Soon
                </p>
                <Badge color={computed.expiringItems.length > 0 ? "yellow" : "green"}>
                  {computed.expiringItems.length} items
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                <ExpiringSoonList items={computed.expiringItems} />
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* ── Inventory Grid ── */}
      <GlassCard delay={0.35} hover={false}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Recent SmartShelf Items</p>
          <span className="text-xs text-zinc-400">{computed.activeItems.length} total active items</span>
        </div>
        <InventoryGrid items={computed.activeItems} />
      </GlassCard>
    </div>
  );
}
