import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function Progress({ value, max = 100, className, barClassName, showLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-800", className)}>
      <div
        className={cn("h-full rounded-full bg-blue-500 transition-all duration-500", barClassName)}
        style={{ width: `${pct}%` }}
      />
      {showLabel && (
        <span className="absolute right-0 top-3 text-xs text-slate-400">{pct.toFixed(0)}%</span>
      )}
    </div>
  );
}
