import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Menu, X, Sun, Moon, Bell, Search, LogOut, Check, Languages } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal.jsx";
import { getNotifications, getUnreadCount, markMany } from "../../api/notifications.js";

export default function PillNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifTab, setNotifTab] = useState("unread");
  const location = useLocation();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const { user } = useAuth();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/inventory", label: "SmartShelf" },
    { path: "/kitchen", label: "Kitchen" },
    { path: "/calories", label: "Tracker" },
    { path: "/activity", label: "Activity" },
  ];
  
  const initials = user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) : "?";

  const fetchNotifs = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        getUnreadCount(),
        getNotifications({ limit: 50 })
      ]);
      setUnreadCount(countRes.data?.count || 0);
      setNotifications(listRes.data?.items || listRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await markMany({ ids: [id], read: true });
      fetchNotifs();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[200] px-4 py-6 pointer-events-none flex justify-center w-full">
        <motion.nav
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-6xl pointer-events-auto rounded-full px-8 py-3.5 flex items-center justify-between transition-all duration-300"
          style={{
            background: dark ? "rgba(20,12,10,0.5)" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: dark ? "1px solid rgba(255,140,90,0.15)" : "1px solid rgba(255,255,255,0.4)",
            boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,107,74,0.1) inset" : "0 4px 24px rgba(210,170,130,0.12), 0 1px 3px rgba(0,0,0,0.04)"
          }}
        >
          {/* Logo Badge */}
          <Link to="/" className="flex items-center gap-3 outline-none group">
            <motion.img
              src="/custom-logo.png"
              alt="Logo"
              whileHover={{ rotate: 10, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 object-contain drop-shadow-md"
            />
            <span className="font-semibold text-base hidden sm:block transition-colors" style={{ color: dark ? "#FDF6F0" : "#1A1210" }}>
              NutriVision<span style={{ color: "#FF6B4A" }}>Ai</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1 relative">
            {navLinks.map((link, i) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
                >
                  <Link
                    to={link.path}
                    className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors group outline-none block"
                    style={{ color: isActive ? (dark ? "#FDF6F0" : "#FF6B4A") : (dark ? "#C9B8AE" : "#6B6560") }}
                  >
                    <span className="relative z-10 group-hover:text-[#FF6B4A] transition-colors">{link.label || link.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-full z-0"
                        style={{
                          background: dark ? "rgba(255,107,74,0.15)" : "rgba(255,107,74,0.08)",
                          border: dark ? "1px solid rgba(255,107,74,0.2)" : "1px solid rgba(255,107,74,0.15)"
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="absolute left-4 right-4 bottom-1 h-[2px] rounded-full scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"
                      style={{ background: "#FF6B4A" }} />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Toggle, Icons & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Quick Search Shortcut */}
            <div className="hidden sm:block">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/search")}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none hover:text-[#FF6B4A]"
                style={{ color: dark ? "#C9B8AE" : "#6B6560", background: "transparent" }}
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { setShowNotifications(true); fetchNotifs(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none hover:text-[#FF6B4A] relative"
                style={{ color: dark ? "#C9B8AE" : "#6B6560", background: "transparent" }}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "#FF6B4A" }} />}
              </motion.button>
            </div>

            {/* Google Translate Widget Container */}
            <div id="google_translate_element" className="hidden sm:block [&>div]:!h-9 [&>div>div]:!h-9 [&_.goog-te-combo]:!h-9 [&_.goog-te-combo]:!rounded-xl [&_.goog-te-combo]:!text-sm [&_.goog-te-combo]:!border-none [&_.goog-te-combo]:!bg-zinc-100 dark:[&_.goog-te-combo]:!bg-zinc-800 dark:[&_.goog-te-combo]:!text-zinc-200" />

            {/* Theme Toggle */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={toggle}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none hover:text-[#FF6B4A]"
              style={{ color: dark ? "#C9B8AE" : "#6B6560", background: dark ? "rgba(255,255,255,0.05)" : "#F3EEE8" }}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Logout Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowLogoutConfirm(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors outline-none hover:text-red-500"
              style={{ color: dark ? "#C9B8AE" : "#6B6560", background: dark ? "rgba(255,255,255,0.05)" : "#F3EEE8" }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
            
            {/* Profile / Settings Avatar */}
            <Link to="/settings" className="outline-none hidden sm:block ml-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-lg overflow-hidden"
                style={{ background: "linear-gradient(135deg, #FF7A45, #FF4D6D)", boxShadow: "0 4px 14px rgba(255,107,74,0.3)" }}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </motion.div>
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors outline-none"
              style={{ color: dark ? "#FDF6F0" : "#1A1210", background: dark ? "rgba(255,255,255,0.05)" : "#F3EEE8" }}
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
            className="fixed inset-0 z-[250] flex justify-end"
            style={{ background: dark ? "rgba(26,18,16,0.6)" : "rgba(253,246,236,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm h-full shadow-2xl flex flex-col p-6"
              style={{ background: dark ? "rgba(26,18,16,0.8)" : "rgba(253,246,236,0.7)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderLeft: dark ? "1px solid rgba(255,140,90,0.15)" : "1px solid rgba(255,255,255,0.4)" }}
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
                  style={{ color: dark ? "#C9B8AE" : "#6B6560", background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-6 flex-1">
                {navLinks.map((link, i) => {
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <motion.div key={link.path} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <Link to={link.path} className="text-2xl font-semibold outline-none flex items-center gap-3 group"
                        style={{ color: isActive ? "#FF6B4A" : (dark ? "#FDF6F0" : "#1A1210") }}>
                        {link.label || link.name}
                        {isActive && <motion.div layoutId="mobileActive" className="w-2 h-2 rounded-full" style={{ background: "#FF6B4A" }} />}
                      </Link>
                    </motion.div>
                  );
                })}
                
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + navLinks.length * 0.05 }}>
                   <Link to="/settings" className="text-2xl font-semibold outline-none flex items-center gap-3 group"
                        style={{ color: location.pathname.startsWith("/settings") ? "#FF6B4A" : (dark ? "#FDF6F0" : "#1A1210") }}>
                        Settings
                   </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Confirm Logout" size="sm">
        <div className="p-4">
          <p className="mb-6 font-medium" style={{ color: dark ? "#C9B8AE" : "#6B6560" }}>Are you sure you want to log out?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowLogoutConfirm(false)} className="px-5 py-2.5 rounded-xl font-medium transition-colors" style={{ color: dark ? '#C9B8AE' : '#6B6560', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
              Cancel
            </button>
            <button onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications" size="md" zIndex="z-[300]">
        <div className="flex gap-2 mb-4">
          <button onClick={() => setNotifTab("unread")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${notifTab === "unread" ? "bg-mint-500 text-white" : "glass text-zinc-500"}`}>Unread ({unreadCount})</button>
          <button onClick={() => setNotifTab("all")} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${notifTab === "all" ? "bg-mint-500 text-white" : "glass text-zinc-500"}`}>History</button>
        </div>
        
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-2">
          {notifications.filter(n => notifTab === "all" || !n.read).length === 0 ? (
            <p className="text-center text-zinc-500 py-6 text-sm">No {notifTab === "unread" ? "unread " : ""}notifications.</p>
          ) : (
            notifications.filter(n => notifTab === "all" || !n.read).map(n => (
              <div key={n.id || n._id} className="p-4 rounded-xl relative group flex flex-col gap-1" style={{ background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-semibold text-sm" style={{ color: dark ? '#FDF6F0' : '#1A1210' }}>{n.title}</h4>
                  {!n.read && (
                    <button onClick={() => markRead(n.id || n._id)} className="text-mint-500 hover:text-mint-600 p-1 bg-mint-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Mark as read">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm" style={{ color: dark ? '#C9B8AE' : '#6B6560' }}>{n.message}</p>
                <p className="text-xs mt-1" style={{ color: dark ? '#a1a1aa' : '#a1a1aa' }}>{new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
                {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-mint-500 rounded-l-xl" />}
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
