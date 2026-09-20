import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, Search, MessageSquare, Activity, Settings, ChevronLeft, Leaf } from "lucide-react";
import { cn } from "../../utils/cn.js";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/search", icon: Search, label: "Smart Search" },
  { to: "/chat", icon: MessageSquare, label: "ChatBot" },
  { to: "/activity", icon: Activity, label: "Activity" },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-screen z-30 glass flex flex-col overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-200 dark:border-white/10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 0 12px rgba(255,107,74,0.25)" }}>
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="font-semibold text-sm whitespace-nowrap text-charcoal-900 dark:text-white">
              NutriVision<span className="text-mint-500">Ai</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
            isActive
              ? "bg-mint-500/15 text-mint-500 dark:text-mint-400"
              : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-charcoal-700/60 hover:text-gray-900 dark:hover:text-zinc-100"
          )}>
            <Icon className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} className="whitespace-nowrap">{label}</motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 space-y-1 border-t border-gray-200 dark:border-white/10 pt-3">
        <NavLink to="/settings" className={({ isActive }) => cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          isActive ? "bg-mint-500/15 text-mint-500 dark:text-mint-400" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-charcoal-700/60"
        )}>
          <Settings className="w-4 h-4 shrink-0" />
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Settings</motion.span>}</AnimatePresence>
        </NavLink>
        <button onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-gray-400 dark:text-zinc-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-charcoal-700/40 transition-all">
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}><ChevronLeft className="w-4 h-4" /></motion.div>
          <AnimatePresence>{!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Collapse</motion.span>}</AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
