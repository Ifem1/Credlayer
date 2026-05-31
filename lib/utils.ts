import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function hashString(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function computeProofHash(data: Record<string, unknown>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function creditScoreColor(score: number): string {
  if (score >= 750) return "text-emerald-400";
  if (score >= 650) return "text-blue-400";
  if (score >= 550) return "text-yellow-400";
  if (score >= 450) return "text-orange-400";
  return "text-red-400";
}

export function riskLevelColor(risk: string): string {
  switch (risk) {
    case "LOW":
      return "text-emerald-400 bg-emerald-400/10";
    case "MEDIUM":
      return "text-yellow-400 bg-yellow-400/10";
    case "HIGH":
      return "text-orange-400 bg-orange-400/10";
    case "CRITICAL":
      return "text-red-400 bg-red-400/10";
    default:
      return "text-slate-400 bg-slate-400/10";
  }
}

export function tierColor(tier: string): string {
  const colors: Record<string, string> = {
    Unverified: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    Bronze: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    Silver: "text-slate-300 bg-slate-300/10 border-slate-300/20",
    Gold: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Platinum: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    Institutional: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };
  return colors[tier] ?? colors["Unverified"];
}

export function loanStatusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-blue-400 bg-blue-400/10";
    case "APPROVED":
      return "text-emerald-400 bg-emerald-400/10";
    case "REPAID":
      return "text-emerald-600 bg-emerald-600/10";
    case "PENDING_APPROVAL":
      return "text-yellow-400 bg-yellow-400/10";
    case "REJECTED":
    case "DEFAULTED":
      return "text-red-400 bg-red-400/10";
    case "CANCELLED":
      return "text-slate-400 bg-slate-400/10";
    default:
      return "text-slate-400 bg-slate-400/10";
  }
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function reputationTierToLevel(tier: string): number {
  const levels: Record<string, number> = {
    Unverified: 0,
    Bronze: 1,
    Silver: 2,
    Gold: 3,
    Platinum: 4,
    Institutional: 5,
  };
  return levels[tier] ?? 0;
}

export function interestLabel(rate: number): string {
  if (rate < 7) return "Excellent";
  if (rate < 10) return "Good";
  if (rate < 15) return "Fair";
  return "High";
}
