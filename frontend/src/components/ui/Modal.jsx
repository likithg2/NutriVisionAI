import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { useEffect } from "react";

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl"
};

export default function Modal({ open, onClose, title, children, size = 'md', zIndex = 'z-50' }) {
  const { dark } = useTheme();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
          className={`fixed inset-0 ${zIndex} flex items-start justify-center p-4 pb-6`}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-white/5 dark:bg-black/20 backdrop-blur-2xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            onClick={e => e.stopPropagation()}
            className={`relative flex flex-col w-full ${sizes[size]} rounded-2xl z-10 bg-white/70 dark:bg-[#1A1210]/70 backdrop-blur-3xl border border-white/60 dark:border-white/20 shadow-2xl ring-1 ring-white/40 dark:ring-white/10`}
            style={{ marginTop: '120px', maxHeight: 'calc(100dvh - 140px)' }}
          >
            <div className="flex-none flex items-center justify-between p-6 pb-4 border-b border-black/5 dark:border-white/5">
              <h2 className="text-lg font-semibold flex-1 pr-4">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-charcoal-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
