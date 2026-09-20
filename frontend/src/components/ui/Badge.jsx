import { cn } from "../../utils/cn.js";

const colors = {
  green: "bg-mint-100 text-mint-700 dark:bg-mint-900/40 dark:text-mint-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

export default function Badge({ children, color = "zinc", className }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", colors[color], className)}>
      {children}
    </span>
  );
}
