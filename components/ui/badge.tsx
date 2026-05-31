import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-800 text-slate-200",
        outline: "border-slate-600 text-slate-300",
        success: "border-transparent bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        warning: "border-transparent bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        danger: "border-transparent bg-red-500/20 text-red-400 border-red-500/30",
        info: "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
