import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  MessageSquare, ArrowRight, Target, Activity,
  Leaf, BarChart3, Clock, LogIn, Moon, Sun, LayoutDashboard, LayoutList
} from "lucide-react";

/* ═══════════════════════════════════════════
   DESIGN TOKENS (matched to Login.jsx)
   ═══════════════════════════════════════════ */
const tokens = (dark) => ({
  textPrimary: dark ? "#FDF6F0" : "#1A1210",
  textSecondary: dark ? "#8A7A6E" : "#6B6560",
  textMuted: dark ? "#5A4E48" : "#A09890",
  cardBg: dark ? "rgba(40,28,24,0.6)" : "rgba(255,255,255,0.85)",
  cardBorder: dark ? "1px solid rgba(255,140,90,0.15)" : "1px solid rgba(255,237,224,0.8)",
  cardShadow: dark ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.06)",
  cardBlur: "backdrop-blur-xl",
  pillBg: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)",
  pillBorder: dark ? "1px solid rgba(255,107,74,0.3)" : "1px solid rgba(255,107,74,0.2)",
});

/* ═══════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════ */
export default function Home() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const t = tokens(dark);

  const [isExiting, setIsExiting] = useState(false);

  const handleNavigate = (path, state = {}) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path, { state });
    }, 600); // 600ms duration for exit animation
  };


  return (
    <div className="h-screen overflow-hidden bg-[#FDF8F3] dark:bg-[#110A08]">

      {/* ═════════════════════════════════════════════
          SECTION 1 — HERO
          ═════════════════════════════════════════════ */}
      <section className="relative h-full w-full flex items-center overflow-hidden">
        {/* Hero BG images — crossfade */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src="/lightlandingpage.png" alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out" style={{ opacity: dark ? 0 : 1, filter: "saturate(1.3) contrast(1.1)" }} />
          <img src="/darklandingpage.png" alt="" className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out" style={{ opacity: dark ? 1 : 0 }} />
        {/* Overlay for text legibility - subtle directional scrim */}
        <div className="absolute inset-0 transition-all duration-500" style={{
          background: dark
            ? "linear-gradient(270deg, rgba(17,10,8,0.5) 0%, rgba(17,10,8,0.2) 50%, rgba(0,0,0,0) 100%)"
            : "linear-gradient(270deg, rgba(253,248,243,0.5) 0%, rgba(253,248,243,0.2) 50%, rgba(255,255,255,0) 100%)"
        }} />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggle}
          className="p-3 rounded-full shadow-lg transition-colors duration-500 backdrop-blur-xl border flex items-center justify-center"
          style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.55)", borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)", color: dark ? "#FDF6F0" : "#000000" }}
        >
          {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </motion.button>
      </div>

      {/* Hero Content — RIGHT-ALIGNED, asymmetric */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex justify-end">
          <motion.div 
            className="max-w-2xl"
            initial={{ opacity: 1, x: 0 }}
            animate={isExiting ? { opacity: 0, x: -800 } : { opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Tagline pill */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: t.pillBg, border: t.pillBorder }}
            >
              <Leaf className="w-4 h-4" style={{ color: "#FF6B4A" }} />
              <span className="text-xs font-semibold tracking-wide" style={{ color: t.textPrimary }}>AI-Powered Nutrition Platform</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight mb-6"
              style={{ color: t.textPrimary }}
            >
              Eat smart.<br />
              <span className="bg-gradient-to-r from-[#FF7A45] to-[#FF4D6D] bg-clip-text text-transparent">Live better.</span>
            </motion.h1>

            {/* Subhead */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg sm:text-xl leading-relaxed mb-10 max-w-lg"
              style={{ color: t.textSecondary }}
            >
              Your food inventory, nutrition insights, and AI-powered kitchen assistant — all synced and ready the moment you sign in.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-start gap-4 mb-14"
            >
              {!user ? (
                <>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate("/login", { mode: "register" })}
                    className="flex items-center gap-2.5 px-8 py-4 rounded-full text-white font-bold text-base shadow-xl transition-all"
                    style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 8px 32px rgba(255,107,74,0.35)" }}
                  >
                    Sign Up Now <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate("/login", { mode: "login" })}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all"
                    style={{ color: "#FF6B4A", border: "2px solid rgba(255,107,74,0.3)", background: dark ? "rgba(255,107,74,0.05)" : "rgba(255,107,74,0.04)" }}
                  >
                    Login <LogIn className="w-4 h-4 ml-1" />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate("/dashboard")}
                    className="flex items-center gap-2.5 px-8 py-4 rounded-full text-white font-bold text-base shadow-xl transition-all"
                    style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 8px 32px rgba(255,107,74,0.35)" }}
                  >
                    Dashboard <LayoutDashboard className="w-5 h-5" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleNavigate("/inventory")}
                    className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all"
                    style={{ color: "#FF6B4A", border: "2px solid rgba(255,107,74,0.3)", background: dark ? "rgba(255,107,74,0.05)" : "rgba(255,107,74,0.04)" }}
                  >
                    Inventory <LayoutList className="w-4 h-4 ml-1" />
                  </motion.button>
                </>
              )}
            </motion.div>

            {/* Pill Badges */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              {[
                { icon: MessageSquare, label: "AI Chatbot" },
                { icon: BarChart3, label: "Nutrition Insights" },
                { icon: Clock, label: "Activity Tracking" },
              ].map(({ icon: Icon, label }) => (
                <motion.div key={label} whileHover={{ scale: 1.08, y: -2 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 cursor-default"
                  style={{ background: t.pillBg, border: t.pillBorder, color: t.textPrimary }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#FF6B4A" }} />
                  <span className="text-xs font-semibold">{label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Stat Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.55 }}
              className="flex flex-wrap gap-4"
            >
              {[
                { icon: Target, value: "500+", label: "Recipes Suggested" },
                { icon: Activity, value: "15K+", label: "Items Scanned" },
                { icon: Leaf, value: "30%", label: "Avg. Waste Reduced" },
              ].map(({ icon: Icon, value, label }) => (
                <motion.div key={label} whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all duration-300 cursor-default flex-1 whitespace-nowrap min-w-[140px]"
                  style={{ background: t.pillBg, border: dark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,255,255,0.4)", boxShadow: dark ? "none" : "0 8px 32px rgba(0,0,0,0.04)" }}
                >
                  <div>
                    <div className="text-lg font-bold tracking-tight" style={{ color: t.textPrimary }}>{value}</div>
                    <div className="text-[10px] font-medium tracking-wide uppercase" style={{ color: t.textSecondary }}>{label}</div>
                  </div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,107,74,0.1)", color: "#FF6B4A" }}>
                    <Icon className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
