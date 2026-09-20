import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getActivity } from "../api/activity.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Clock, Package, Bot, Mail, ShieldCheck, Flame, Filter } from "lucide-react";

/* ── type config ── */
const TYPE_MAP = {
  "item:add":         { icon: Package,     color: "text-mint-500",  bg: "bg-mint-500/10 ring-mint-500/25", label: "Added",         group: "Items" },
  "item:update":      { icon: Package,     color: "text-blue-400",  bg: "bg-blue-500/10 ring-blue-500/25", label: "Updated",       group: "Items" },
  "item:delete":      { icon: Package,     color: "text-red-400",   bg: "bg-red-500/10 ring-red-500/25",   label: "Deleted",       group: "Items" },
  "item:consume":     { icon: Flame,       color: "text-orange-400",bg: "bg-orange-500/10 ring-orange-500/25", label: "Consumed",    group: "Items" },
  "item:expire":      { icon: Clock,       color: "text-amber-400", bg: "bg-amber-500/10 ring-amber-500/25", label: "Expired",       group: "Items" },
  "item:partial_use": { icon: Package,     color: "text-blue-400",  bg: "bg-blue-500/10 ring-blue-500/25", label: "Partially Used", group: "Items" },
  "system:expire":    { icon: Clock,       color: "text-amber-400", bg: "bg-amber-500/10 ring-amber-500/25", label: "Auto-Expired",  group: "Items" },
  "ai:scan":          { icon: Bot,         color: "text-violet-400",bg: "bg-violet-500/10 ring-violet-500/25", label: "AI Scan",     group: "AI" },
  "ai:search":        { icon: Bot,         color: "text-violet-400",bg: "bg-violet-500/10 ring-violet-500/25", label: "AI Search",   group: "AI" },
  "mail:sent":        { icon: Mail,        color: "text-sky-400",   bg: "bg-sky-500/10 ring-sky-500/25",   label: "Email",         group: "Email" },
  "auth:login":       { icon: ShieldCheck, color: "text-zinc-400",  bg: "bg-zinc-500/10 ring-zinc-500/25", label: "Login",         group: "Items" },
};

const FILTERS = [
  { key: "all", label: "All", icon: Filter },
  { key: "Items", label: "Items", icon: Package },
  { key: "AI", label: "AI", icon: Bot },
  { key: "Email", label: "Email", icon: Mail },
];

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const now = new Date();
  const diffMs = now - d;
  if (diffMs < 60000) return "Just now";
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDayHeader(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getActivity({ limit: 200 })
      .then(r => { 
        const d = r.data?.activities || r.data || []; 
        setLogs(d.filter(l => !l.type.startsWith("auth:"))); 
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => {
    const cfg = TYPE_MAP[l.type];
    return cfg?.group === filter;
  });

  /* Group by day */
  const grouped = filtered.reduce((acc, log) => {
    const day = new Date(log.createdAt || log.timestamp).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{logs.length} events recorded</p>
      </motion.div>

      {/* Filter chips */}
      <GlassCard hover={false} className="flex flex-wrap gap-2 p-3">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
              filter === key
                ? "bg-mint-500 text-white shadow-mint-glow/30"
                : "glass text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
        {filter !== "all" && (
          <span className="text-xs text-zinc-400 flex items-center ml-2">
            Showing {filtered.length} of {logs.length}
          </span>
        )}
      </GlassCard>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-400 text-sm">No activity recorded yet.</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, entries]) => (
            <div key={day}>
              {/* Day header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  {fmtDayHeader(entries[0].createdAt || entries[0].timestamp)}
                </span>
                <div className="flex-1 h-px bg-zinc-200/30 dark:bg-zinc-700/30" />
                <span className="text-[10px] text-zinc-500">{entries.length} events</span>
              </div>

              {/* Timeline */}
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-mint-400/40 via-mint-400/15 to-transparent" />

                <div className="space-y-3">
                  {entries.map((log, i) => {
                    const cfg = TYPE_MAP[log.type] || { icon: Clock, color: "text-zinc-400", bg: "bg-zinc-500/10 ring-zinc-500/25", label: log.type, group: "Items" };
                    const Icon = cfg.icon;
                    return (
                      <motion.div key={log.id || `${day}-${i}`}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className="relative flex items-start gap-4">

                        {/* Timeline dot */}
                        <div className={"absolute -left-8 w-[30px] h-[30px] rounded-xl flex items-center justify-center ring-2 z-10 " + cfg.bg}>
                          <Icon className={"w-3.5 h-3.5 " + cfg.color} />
                        </div>

                        {/* Card */}
                        <div className="flex-1 rounded-xl p-4 transition-all glass">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{log.message || log.description || cfg.label}</span>
                                <Badge color={{ Items: "green", AI: "violet", Email: "blue" }[cfg.group] || "zinc"}>{cfg.label}</Badge>
                              </div>
                              {log.meta?.name && <p className="text-xs text-zinc-500 mt-0.5">{log.meta.name}</p>}
                              {log.meta?.itemName && !log.meta?.name && <p className="text-xs text-zinc-500 mt-0.5">{log.meta.itemName}</p>}
                            </div>
                            <span className="text-[10px] text-zinc-500 whitespace-nowrap shrink-0">
                              {fmtDate(log.createdAt || log.timestamp)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

