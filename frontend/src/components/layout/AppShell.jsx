import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import PillNavbar from "./PillNavbar.jsx";

function AnimatedBackground({ dark }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none transition-colors duration-500" style={{ background: dark ? "#1A1210" : "#FDF6EC" }}>
      <img 
        src="/lightthemehome.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" 
        style={{ opacity: dark ? 0 : 1 }} 
      />
      <img 
        src="/darkthemehome.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out" 
        style={{ opacity: dark ? 1 : 0 }} 
      />
      {/* Shady overlay to ensure UI elements remain visible without completely dulling the vivid background */}
      <div 
        className="absolute inset-0 transition-colors duration-500" 
        style={{ 
          background: dark 
            ? "rgba(10, 5, 5, 0.55)" 
            : "rgba(245, 240, 235, 0.35)"
        }} 
      />
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();
  const { dark } = useTheme();

  return (
    <div className="min-h-screen">
      <AnimatedBackground dark={dark} />
      {/* PillNavbar is fixed to the top and persists across route changes */}
      <PillNavbar />
      
      <main className="min-h-screen pt-28 pb-24 px-4 md:px-6 transition-all duration-300 ease-out z-10 relative">
        <AnimatePresence mode="wait">
          <Outlet />
        </AnimatePresence>
      </main>

      {/* Floating ChatBot Icon */}
      {location.pathname !== "/chat" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Link to="/chat">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative"
              style={{
                background: "linear-gradient(135deg, #FF7A45, #FF4D6D)",
                boxShadow: "0 8px 32px rgba(255,107,74,0.4)"
              }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border border-[#FF6B4A] animate-ping opacity-30" />
            </motion.div>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

