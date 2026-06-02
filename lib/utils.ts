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

// ── GEN / Wei conversion (1 GEN = 10^18 wei) ─────────────────────────────────

/** Convert a GEN amount (decimal, e.g. 1.5) → wei as bigint */
export function genToWei(gen: number): bigint {
  // Use string arithmetic to avoid floating-point precision loss
  const fixed = gen.toFixed(18);
  const [whole, dec = ""] = fixed.split(".");
  const paddedDec = dec.padEnd(18, "0").slice(0, 18);
  return BigInt(whole) * BigInt("1000000000000000000") + BigInt(paddedDec);
}

/** Convert wei (string|number|bigint) → GEN as a JS number */
export function weiToGen(wei: string | number | bigint): number {
  const w = BigInt(wei);
  const wholePart = w / BigInt("1000000000000000000");
  const fracPart  = w % BigInt("1000000000000000000");
  return Number(wholePart) + Number(fracPart) / 1e18;
}

/** Format wei as a human-readable GEN string */
export function formatGEN(wei: string | number | bigint | null | undefined): string {
  if (wei === null || wei === undefined || wei === "" || wei === 0 || wei === "0") return "0 GEN";
  try {
    const gen = weiToGen(BigInt(String(wei)));
    if (gen === 0) return "0 GEN";
    if (gen < 0.0001) return `<0.0001 GEN`;
    return `${gen.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 4 })} GEN`;
  } catch {
    return "— GEN";
  }
}

/** Bigint → hex string suitable for JSON transport and contract value field */
export function weiToHex(wei: bigint): string {
  return "0x" + wei.toString(16);
}

export function interestLabel(rate: number): string {
  if (rate < 7) return "Excellent";
  if (rate < 10) return "Good";
  if (rate < 15) return "Fair";
  return "High";
}
