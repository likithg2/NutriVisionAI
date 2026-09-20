import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon, ArrowRight, LayoutDashboard, Package, LogOut } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const landingLinks = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#footer" },
];

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { dark, toggle } = useTheme();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!token;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 pointer-events-none flex justify-center w-full">
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-6xl pointer-events-auto rounded-full px-6 sm:px-8 py-3 flex items-center justify-between transition-all duration-300"
          style={{
            /* SOLID CONTRAST — always opaque enough to read */
            background: dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)",
            boxShadow: dark
              ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
              : "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}
        >
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 outline-none group">
            <motion.img
              src="/custom-logo.png"
              alt="Logo"
              whileHover={{ rotate: 10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 object-contain drop-shadow-md"
            />
            <span className="font-semibold text-base hidden sm:block transition-colors" style={{ color: dark ? "#FDF6F0" : "#1A1210" }}>
              NutriVision<span style={{ color: "#FF6B4A" }}>Ai</span>
            </span>
          </button>

          {/* Desktop Links — section anchors (always visible) */}
          <div className="hidden md:flex items-center gap-1">
            {landingLinks.map((link, i) => (
              <motion.button
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                onClick={() => scrollTo(link.href)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:text-[#FF6B4A] outline-none"
                style={{ color: dark ? "#E0D5CA" : "#4A4540" }}
              >
                {link.label}
              </motion.button>
            ))}
          </div>

          {/* Right: auth-aware buttons */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle — same position as login page (left of CTA) */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none"
              style={{
                color: dark ? "#FDF6F0" : "#1A1210",
                background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
              }}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {isLoggedIn ? (
              <>
                {/* Dashboard pill */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{ color: "#FF6B4A", border: "1px solid rgba(255,107,74,0.3)", background: dark ? "rgba(255,107,74,0.08)" : "rgba(255,107,74,0.06)" }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </motion.button>
                {/* Inventory pill */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/inventory")}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{ color: "#FF6B4A", border: "1px solid rgba(255,107,74,0.3)", background: dark ? "rgba(255,107,74,0.08)" : "rgba(255,107,74,0.06)" }}
                >
                  <Package className="w-3.5 h-3.5" /> Inventory
                </motion.button>
                {/* Avatar */}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-white text-xs font-semibold shadow-lg"
                  style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 4px 14px rgba(255,107,74,0.3)" }}
                  title="Logout"
                >
                  {initials}
                </motion.button>
              </>
            ) : (
              /* Not logged in: just "Login" button */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold shadow-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, #FF7A45, #FF4D6D)",
                  boxShadow: "0 4px 16px rgba(255,107,74,0.3)"
                }}
              >
                Login <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors outline-none"
              style={{ color: dark ? "#FDF6F0" : "#1A1210", background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] flex justify-end"
            style={{ background: dark ? "rgba(26,18,16,0.6)" : "rgba(253,246,236,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm h-full shadow-2xl flex flex-col p-6"
              style={{
                background: dark ? "rgba(26,18,16,0.85)" : "rgba(253,246,236,0.8)",
                backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                borderLeft: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)"
              }}
            >
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                  <img src="/custom-logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                  <span className="font-semibold text-lg" style={{ color: dark ? "#FDF6F0" : "#1A1210" }}>
                    NutriVision<span style={{ color: "#FF6B4A" }}>Ai</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                  style={{ color: dark ? "#E0D5CA" : "#4A4540", background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6 flex-1">
                {landingLinks.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => scrollTo(link.href)}
                    className="text-2xl font-semibold outline-none text-left"
                    style={{ color: dark ? "#FDF6F0" : "#1A1210" }}
                  >
                    {link.label}
                  </motion.button>
                ))}

                {/* Auth-aware mobile links */}
                {isLoggedIn && (
                  <>
                    <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
                      onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                      className="text-2xl font-semibold outline-none text-left" style={{ color: "#FF6B4A" }}>
                      Dashboard
                    </motion.button>
                    <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                      onClick={() => { setMobileOpen(false); navigate("/inventory"); }}
                      className="text-2xl font-semibold outline-none text-left" style={{ color: "#FF6B4A" }}>
                      Inventory
                    </motion.button>
                  </>
                )}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                onClick={() => {
                  setMobileOpen(false);
                  if (isLoggedIn) handleLogout();
                  else navigate("/login");
                }}
                className="w-full py-4 rounded-full text-white font-bold text-lg shadow-xl"
                style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)" }}
              >
                {isLoggedIn ? "Log Out" : "Login"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
