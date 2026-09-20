import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, Search, MessageSquare, Activity } from "lucide-react";
import { cn } from "../../utils/cn.js";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home", end: true },
  { to: "/inventory", icon: Package, label: "Food" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/chat", icon: MessageSquare, label: "Chat" },
  { to: "/activity", icon: Activity, label: "Log" },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/15 dark:border-white/6 flex md:hidden">
      {nav.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cn(
          "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all",
          isActive ? "text-mint-500" : "text-zinc-400 dark:text-zinc-500"
        )}>
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

