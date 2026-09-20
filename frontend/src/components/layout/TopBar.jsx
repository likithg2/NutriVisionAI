import { Sun, Moon, Bell, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function TopBar({ sidebarWidth }) {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) : "?";

  return (
    <header
      className="fixed top-0 right-0 h-16 z-20 flex items-center px-4 gap-3 glass border-b border-white/15 dark:border-white/6"
      style={{ left: sidebarWidth }}
    >
      {/* Search shortcut */}
      <button
        onClick={() => navigate("/search")}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 glass hover:text-zinc-600 dark:hover:text-zinc-200 transition-all flex-1 max-w-xs"
      >
        <Search className="w-4 h-4" />
        <span>Search foods...</span>
        <kbd className="ml-auto text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-charcoal-700 text-zinc-400">/</kbd>
      </button>
      <div className="flex-1" />
      {/* Theme toggle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={toggle}
        className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-orange-500 transition-colors"
      >
        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </motion.button>
      {/* Notification bell */}
      <button className="w-9 h-9 rounded-xl glass flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-orange-500 transition-colors relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
      </button>
      {/* Avatar */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/settings")}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7A45] to-[#FF4D6D] flex items-center justify-center text-white text-xs font-semibold shadow-orange-500/40"
      >
        {initials}
      </motion.button>
    </header>
  );
}
