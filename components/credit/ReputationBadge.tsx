"use client";
import { cn, tierColor } from "@/lib/utils";
import { Award } from "lucide-react";
import type { ReputationTier } from "@/types";

interface Props {
  tier: ReputationTier;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export function ReputationBadge({ tier, score, size = "md" }: Props) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", tierColor(tier), sizeClasses[size])}>
      <Award className={size === "lg" ? "h-4 w-4" : "h-3 w-3"} />
      {tier}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </div>
  );
}
