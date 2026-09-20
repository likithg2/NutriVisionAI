import { cn } from "../../utils/cn.js";
import { forwardRef } from "react";

const Input = forwardRef(({ label, error, className, icon: Icon, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />}
      <input
        ref={ref}
        className={cn(
          "w-full glass rounded-xl px-4 py-2.5 text-sm outline-none",
          "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
          "focus:ring-2 focus:ring-mint-500/50 focus:border-mint-500/50",
          "transition-all duration-200",
          Icon && "pl-10",
          error && "ring-2 ring-red-400/50",
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Input.displayName = "Input";
export default Input;
