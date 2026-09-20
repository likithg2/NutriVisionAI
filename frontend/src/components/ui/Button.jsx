import { motion } from "framer-motion";
import { cn } from "../../utils/cn.js";

const variants = {
  primary: "bg-mint-500 hover:bg-mint-600 text-white shadow-mint-glow/40 hover:shadow-mint-glow",
  secondary: "glass hover:bg-white/80 dark:hover:bg-charcoal-700/80 text-zinc-800 dark:text-zinc-100",
  danger: "bg-red-500/90 hover:bg-red-600 text-white",
  ghost: "hover:bg-zinc-100 dark:hover:bg-charcoal-700 text-zinc-600 dark:text-zinc-300",
};

export default function Button({ children, variant = "primary", className, disabled, loading, size = "md", ...props }) {
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {children}
    </motion.button>
  );
}
