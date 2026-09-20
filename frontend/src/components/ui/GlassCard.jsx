import { motion } from "framer-motion";
import { cn } from "../../utils/cn.js";

export default function GlassCard({ children, className, hover = true, delay = 0, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={hover ? { y: -3, boxShadow: "0 20px 60px rgba(0,0,0,0.14)" } : undefined}
      className={cn("glass rounded-2xl p-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
