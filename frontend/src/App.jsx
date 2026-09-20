import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./context/AuthContext.jsx";
import { InventoryProvider } from "./context/InventoryContext.jsx";
import { KitchenProvider } from "./context/KitchenContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Inventory from "./pages/Inventory.jsx";
import Kitchen from "./pages/Kitchen.jsx";
import ChatBot from "./pages/ChatBot.jsx";
import ActivityLog from "./pages/ActivityLog.jsx";
import Settings from "./pages/Settings.jsx";
import CalorieTracker from "./pages/CalorieTracker.jsx";
import SearchPage from "./pages/Search.jsx";
import Home from "./pages/Home.jsx";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-[#FF6B4A] border-t-transparent animate-spin" />
    </div>
  );
  return token ? children : <Navigate to="/login" replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const { token } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <PageWrapper><Login /></PageWrapper>} />
        <Route element={
          <ProtectedRoute>
            <InventoryProvider>
              <KitchenProvider>
                <AppShell />
              </KitchenProvider>
            </InventoryProvider>
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/inventory" element={<PageWrapper><Inventory /></PageWrapper>} />
          <Route path="/kitchen" element={<PageWrapper><Kitchen /></PageWrapper>} />
          <Route path="/calories" element={<PageWrapper><CalorieTracker /></PageWrapper>} />
          <Route path="/chat" element={<PageWrapper><ChatBot /></PageWrapper>} />
          <Route path="/activity" element={<PageWrapper><ActivityLog /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="/search" element={<PageWrapper><SearchPage /></PageWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

