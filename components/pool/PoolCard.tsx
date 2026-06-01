"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatUSD, formatPercent, cn } from "@/lib/utils";
import type { LiquidityPool } from "@/types";
import { TrendingUp, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  pool: LiquidityPool;
  wallet?: string;
  userDeposit?: number;
  onSuccess?: () => void; // called after any successful deposit/withdraw so parent can refresh
}

const riskColors: Record<string, string> = {
  LOW: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

type Mode = "idle" | "deposit" | "withdraw";

export function PoolCard({ pool, wallet, userDeposit = 0, onSuccess }: Props) {
  const utilization =
    pool.total_deposited > 0
      ? (pool.total_borrowed / pool.total_deposited) * 100
      : 0;
  const apy = pool.target_return_bps / 100;

  const [mode, setMode] = useState<Mode>("idle");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleMode(next: Mode) {
    setMode((prev) => (prev === next ? "idle" : next));
    setAmount("");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const usd = Number(amount);
    if (!wallet) { setError("Connect your wallet first."); return; }
    if (!usd || usd <= 0) { setError("Enter a valid amount greater than 0."); return; }
    if (mode === "withdraw" && usd > userDeposit) {
      setError(`You can only withdraw up to ${formatUSD(userDeposit)}.`);
      return;
    }
    if (mode === "withdraw" && usd > pool.available_liquidity) {
      setError(`Only ${formatUSD(pool.available_liquidity)} is currently available.`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = mode === "deposit" ? "/api/pool/deposit" : "/api/pool/withdraw";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool_id: pool.pool_id, amount_usd: usd, wallet }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(typeof data.error === "string" ? data.error : `${mode} failed`);
      }
      setSuccess(
        mode === "deposit"
          ? `Successfully deposited ${formatUSD(usd)}.`
          : `Successfully withdrew ${formatUSD(usd)}.`
      );
      setAmount("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode} failed`);
    } finally {
      setLoading(false);
    }
  }

  const isOpen = mode !== "idle";

  return (
    <Card className="hover:border-slate-700 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{pool.name}</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border font-semibold",
              riskColors[pool.risk_tier] ?? riskColors.MEDIUM
            )}
          >
            {pool.risk_tier} RISK
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* APY + Min Credit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">APY</p>
            <p className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {formatPercent(apy)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Min Credit</p>
            <p className="text-xl font-bold text-slate-200">{pool.min_credit_score}</p>
          </div>
        </div>

        {/* Pool stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Liquidity</span>
            <span className="text-slate-200">{formatUSD(pool.total_deposited)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Available</span>
            <span className="text-emerald-400">{formatUSD(pool.available_liquidity)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Active Loans</span>
            <span className="text-slate-200">{pool.active_loans}</span>
          </div>
        </div>

        {/* Utilization bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Utilization</span>
            <span>{utilization.toFixed(1)}%</span>
          </div>
          <Progress
            value={utilization}
            barClassName={
              utilization > 90
                ? "bg-red-500"
                : utilization > 70
                ? "bg-yellow-500"
                : "bg-emerald-500"
            }
          />
        </div>

        {/* My deposit badge */}
        {userDeposit > 0 && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
            <p className="text-xs text-slate-400">Your Deposit</p>
            <p className="text-sm font-bold text-blue-400">{formatUSD(userDeposit)}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleMode("deposit")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors",
              mode === "deposit"
                ? "bg-blue-600 text-white"
                : "bg-blue-600/80 hover:bg-blue-600 text-white"
            )}
          >
            Deposit
            {mode === "deposit" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
          {userDeposit > 0 && (
            <button
              onClick={() => toggleMode("withdraw")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors border",
                mode === "withdraw"
                  ? "border-slate-500 bg-slate-700 text-slate-100"
                  : "border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              Withdraw
              {mode === "withdraw" ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Inline deposit / withdraw form */}
        {isOpen && (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-3"
          >
            <p className="text-xs font-semibold text-slate-300 capitalize">{mode} amount (USD)</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {mode === "withdraw" && userDeposit > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(userDeposit))}
                  className="rounded-lg border border-slate-700 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Max
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-start gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                loading={loading}
                disabled={!amount || Number(amount) <= 0}
                className="flex-1 h-8 text-xs"
              >
                Confirm {mode === "deposit" ? "Deposit" : "Withdrawal"}
              </Button>
              <button
                type="button"
                onClick={() => toggleMode(mode)}
                className="rounded-lg border border-slate-700 px-3 h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
