import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getActivity } from "../api/activity.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import Badge from "../components/ui/Badge.jsx";
import Modal from "../components/ui/Modal.jsx";
import { Clock, Package, Bot, Mail, ShieldCheck, Flame, Filter, Info } from "lucide-react";

/* ── type config ── */
const TYPE_MAP = {
  "item:add":         { icon: Package,     color: "text-mint-500",  bg: "bg-mint-500/10 ring-mint-500/25", label: "Added",         group: "Added" },
  "item:update":      { icon: Package,     color: "text-blue-400",  bg: "bg-blue-500/10 ring-blue-500/25", label: "Updated",       group: "Other" },
  "item:delete":      { icon: Package,     color: "text-red-400",   bg: "bg-red-500/10 ring-red-500/25",   label: "Deleted",       group: "Other" },
  "item:consume":     { icon: Flame,       color: "text-orange-400",bg: "bg-orange-500/10 ring-orange-500/25", label: "Consumed",    group: "Used" },
  "item:expire":      { icon: Clock,       color: "text-amber-400", bg: "bg-amber-500/10 ring-amber-500/25", label: "Expired",       group: "Expired" },
  "item:partial_use": { icon: Package,     color: "text-blue-400",  bg: "bg-blue-500/10 ring-blue-500/25", label: "Partially Used", group: "Used" },
  "system:expire":    { icon: Clock,       color: "text-amber-400", bg: "bg-amber-500/10 ring-amber-500/25", label: "Auto-Expired",  group: "Expired" },
  "calories:log":     { icon: Flame,       color: "text-red-400",   bg: "bg-red-500/10 ring-red-500/25",   label: "Meal Logged",   group: "Logged Meals" },
  "ai:scan":          { icon: Bot,         color: "text-violet-400",bg: "bg-violet-500/10 ring-violet-500/25", label: "AI Scan",     group: "Other" },
  "ai:search":        { icon: Bot,         color: "text-violet-400",bg: "bg-violet-500/10 ring-violet-500/25", label: "AI Search",   group: "Other" },
  "mail:sent":        { icon: Mail,        color: "text-sky-400",   bg: "bg-sky-500/10 ring-sky-500/25",   label: "Email",         group: "Other" },
  "auth:login":       { icon: ShieldCheck, color: "text-zinc-400",  bg: "bg-zinc-500/10 ring-zinc-500/25", label: "Login",         group: "Other" },
};

const FILTERS = [
  { key: "all", label: "All", icon: Filter },
  { key: "Logged Meals", label: "Logged Meals", icon: Flame },
  { key: "Expired", label: "Expired Items", icon: Clock },
  { key: "Added", label: "Added Items", icon: Package },
  { key: "Used", label: "Used Items", icon: Flame },
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
  const [selectedLog, setSelectedLog] = useState(null);

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
        <h1 className="text-2xl font-bold">History</h1>
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
                        <div 
                          className="flex-1 rounded-xl p-4 transition-all glass cursor-pointer hover:shadow-lg hover:scale-[1.01]"
                          onClick={() => setSelectedLog(log)}
                        >
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

      {/* Detail Modal */}
      <Modal 
        open={!!selectedLog} 
        onClose={() => setSelectedLog(null)}
        title={
          <div className="flex items-center gap-2 text-xl">
            <Info className="w-6 h-6 text-mint-500" />
            Activity Details
          </div>
        }
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="glass p-4 rounded-xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Message</p>
              <p className="font-semibold text-lg">{selectedLog.message || selectedLog.description || selectedLog.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Type</p>
                <p className="font-medium">{selectedLog.type}</p>
              </div>
              <div className="glass p-4 rounded-xl">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Time</p>
                <p className="font-medium">{new Date(selectedLog.createdAt || selectedLog.timestamp).toLocaleString()}</p>
              </div>
            </div>
            {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
              <div className="glass p-4 rounded-xl overflow-x-auto">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 border-b border-zinc-200 dark:border-zinc-700 pb-2">Additional Data</p>
                <div className="space-y-2">
                  {Object.entries(selectedLog.meta).map(([key, val]) => {
                    if (typeof val === 'object' && val !== null) {
                      const ignoreKeys = ['id', 'userId', '_id', 'createdAt', 'updatedAt', 'notifiedAt', 'notified', 'status', 'barcode'];
                      const validEntries = Object.entries(val).filter(([k, v]) => !ignoreKeys.includes(k) && v !== null && v !== '');
                      if (validEntries.length === 0) return null;
                      
                      return (
                        <div key={key} className="flex flex-col gap-1 text-sm border-b border-zinc-200/50 dark:border-zinc-700/50 pb-3 last:border-0 last:pb-0">
                          <span className="font-semibold capitalize text-zinc-700 dark:text-zinc-300 mb-1">{key.replace(/_/g, ' ')} Details</span>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {validEntries.map(([k, v]) => {
                              const niceKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <div key={k} className="flex flex-col">
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{niceKey}</span>
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{String(v)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex justify-between items-center text-sm border-b border-zinc-200/50 dark:border-zinc-700/50 pb-2 last:border-0 last:pb-0">
                        <span className="font-medium capitalize text-zinc-600 dark:text-zinc-400">{key.replace(/_/g, ' ')}</span>
                        <span className="text-zinc-800 dark:text-zinc-200 break-words">{String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-xl font-medium transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-700"
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
