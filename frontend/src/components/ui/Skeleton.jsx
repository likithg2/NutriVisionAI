import { cn } from "../../utils/cn.js";

export default function Skeleton({ className }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg",
      "bg-zinc-200/80 dark:bg-charcoal-700/80",
      className
    )}>
      <div className="absolute inset-0 shimmer-bg" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}
