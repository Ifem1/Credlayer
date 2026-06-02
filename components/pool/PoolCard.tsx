"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatPercent, cn } from "@/lib/utils";
import type { LiquidityPool } from "@/types";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Wallet,
  Send,
  Clock,
} from "lucide-react";
import { useGenLayerDeposit, type DepositStatus } from "@/lib/hooks/useGenLayerDeposit";
import { useGenLayerWithdraw, type WithdrawStatus } from "@/lib/hooks/useGenLayerWithdraw";

interface Props {
  pool: LiquidityPool;
  wallet?: string;
  userDeposit?: number;
  onSuccess?: () => void;
}

const riskColors: Record<string, string> = {
  LOW: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

function formatGEN(amount: number) {
  return `${amount.toLocaleString()} GEN`;
}

// Maps a deposit/withdraw status to a user-friendly label + icon
function StatusIndicator({ status }: { status: DepositStatus | WithdrawStatus | "idle" }) {
  const steps: { statuses: string[]; icon: React.ReactNode; label: string }[] = [
    {
      statuses: ["awaiting-signature"],
      icon: <Wallet className="h-3.5 w-3.5 animate-bounce" />,
      label: "Check your wallet — sign to authorise…",
    },
    {
      statuses: ["processing"],
      icon: <Clock className="h-3.5 w-3.5 animate-spin" />,
      label: "Submitting to GenLayer — awaiting consensus…",
    },
  ];

  const active = steps.find((s) => s.statuses.includes(status));
  if (!active) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 rounded-lg px-3 py-2">
      {active.icon}
      <span>{active.label}</span>
    </div>
  );
}

type Mode = "idle" | "deposit" | "withdraw";

export function PoolCard({ pool, wallet, userDeposit = 0, onSuccess }: Props) {
  const utilization =
    pool.total_deposited > 0
      ? (pool.total_borrowed / pool.total_deposited) * 100
      : 0;
  const apy = pool.target_return_bps / 100;

  const [mode, setMode] = useState<Mode>("idle");
  const [amount, setAmount] = useState("");

  const depositHook = useGenLayerDeposit();
  const withdrawHook = useGenLayerWithdraw();

  const isDepositBusy = depositHook.status === "awaiting-signature" || depositHook.status === "processing";
  const isWithdrawBusy = withdrawHook.status === "awaiting-signature" || withdrawHook.status === "processing";
  const isBusy = isDepositBusy || isWithdrawBusy;

  function toggleMode(next: Mode) {
    if (isBusy) return;
    setMode((prev) => (prev === next ? "idle" : next));
    setAmount("");
    depositHook.reset();
    withdrawHook.reset();
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const usd = Number(amount);
    if (!wallet) return;
    if (!usd || usd <= 0) return;
    try {
      await depositHook.deposit(pool.pool_id, pool.name, usd, wallet);
      setAmount("");
      onSuccess?.();
    } catch {
      // error captured in hook state
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const usd = Number(amount);
    if (!wallet) return;
    if (!usd || usd <= 0) return;
    if (usd > userDeposit) return;
    try {
      await withdrawHook.withdraw(pool.pool_id, pool.name, usd, wallet);
      setAmount("");
      onSuccess?.();
    } catch {
      // error captured in hook state
    }
  }

  const activeStatus =
    mode === "deposit" ? depositHook.status :
    mode === "withdraw" ? withdrawHook.status : "idle";
  const activeError =
    mode === "deposit" ? depositHook.error :
    mode === "withdraw" ? withdrawHook.error : "";
  const activeTxHash =
    mode === "deposit" ? depositHook.txHash :
    mode === "withdraw" ? withdrawHook.txHash : "";
  const activeSuccess = activeStatus === "success";
  const activeBusy =
    mode === "deposit" ? isDepositBusy :
    mode === "withdraw" ? isWithdrawBusy : false;

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

        {/* Pool stats — GEN denomination */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Liquidity</span>
            <span className="text-slate-200">{formatGEN(pool.total_deposited)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Available</span>
            <span className="text-emerald-400">{formatGEN(pool.available_liquidity)}</span>
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
              utilization > 90 ? "bg-red-500" :
              utilization > 70 ? "bg-yellow-500" :
              "bg-emerald-500"
            }
          />
        </div>

        {/* My deposit badge */}
        {userDeposit > 0 && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
            <p className="text-xs text-slate-400">Your Deposit</p>
            <p className="text-sm font-bold text-blue-400">{formatGEN(userDeposit)}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleMode("deposit")}
            disabled={isBusy}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors disabled:opacity-50",
              mode === "deposit"
                ? "bg-blue-600 text-white"
                : "bg-blue-600/80 hover:bg-blue-600 text-white"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            Deposit GEN
            {mode === "deposit" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {userDeposit > 0 && (
            <button
              onClick={() => toggleMode("withdraw")}
              disabled={isBusy}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 h-9 text-sm font-medium transition-colors border disabled:opacity-50",
                mode === "withdraw"
                  ? "border-slate-500 bg-slate-700 text-slate-100"
                  : "border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
              )}
            >
              Withdraw
              {mode === "withdraw" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Inline form */}
        {mode !== "idle" && (
          <form
            onSubmit={mode === "deposit" ? handleDeposit : handleWithdraw}
            className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-300 capitalize">
                {mode === "deposit" ? "Deposit" : "Withdraw"} amount
              </p>
              <span className="text-xs text-slate-500 font-mono">GEN</span>
            </div>

            {!activeSuccess && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={activeBusy}
                  className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  autoFocus
                />
                {mode === "withdraw" && userDeposit > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(userDeposit))}
                    disabled={activeBusy}
                    className="rounded-lg border border-slate-700 px-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Max
                  </button>
                )}
              </div>
            )}

            {/* Step-by-step status */}
            <StatusIndicator status={activeStatus} />

            {/* tx hash while processing */}
            {activeTxHash && activeStatus === "processing" && (
              <p className="text-xs text-slate-500 font-mono break-all">
                tx: {activeTxHash.slice(0, 24)}…
              </p>
            )}

            {/* Error */}
            {activeError && (
              <div className="flex items-start gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {activeError}
              </div>
            )}

            {/* Success */}
            {activeSuccess && (
              <div className="flex items-start gap-1.5 text-xs text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {mode === "deposit"
                  ? `Deposited ${Number(amount) || ""} GEN successfully.`
                  : `Withdrew GEN successfully.`}
                {activeTxHash && (
                  <span className="font-mono text-slate-500 ml-1">
                    {activeTxHash.slice(0, 12)}…
                  </span>
                )}
              </div>
            )}

            {/* CTA */}
            {!activeSuccess && (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  loading={activeBusy}
                  disabled={!amount || Number(amount) <= 0 || activeBusy || !wallet}
                  className="flex-1 h-8 text-xs"
                >
                  {activeBusy ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing…</>
                  ) : (
                    `Confirm ${mode === "deposit" ? "Deposit" : "Withdrawal"}`
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => toggleMode(mode)}
                  disabled={activeBusy}
                  className="rounded-lg border border-slate-700 px-3 h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {activeSuccess && (
              <button
                type="button"
                onClick={() => { toggleMode(mode); }}
                className="w-full rounded-lg border border-slate-700 px-3 h-8 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            )}

            {/* Info callout for first-time users */}
            {mode === "deposit" && activeStatus === "idle" && (
              <p className="text-xs text-slate-600">
                Your wallet will be prompted to add the GenLayer Studionet network and confirm the transaction before funds are deposited.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
