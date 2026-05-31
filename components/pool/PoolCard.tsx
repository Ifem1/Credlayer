"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatUSD, formatPercent, cn } from "@/lib/utils";
import type { LiquidityPool } from "@/types";
import { TrendingUp } from "lucide-react";

interface Props {
  pool: LiquidityPool;
  userDeposit?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

const riskColors: Record<string, string> = {
  LOW: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  MEDIUM: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

export function PoolCard({ pool, userDeposit = 0, onDeposit, onWithdraw }: Props) {
  const utilization = pool.total_deposited > 0
    ? (pool.total_borrowed / pool.total_deposited) * 100
    : 0;
  const apy = pool.target_return_bps / 100;

  return (
    <Card className="hover:border-slate-700 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{pool.name}</span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full border font-semibold", riskColors[pool.risk_tier] ?? riskColors.MEDIUM)}>
            {pool.risk_tier} RISK
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {userDeposit > 0 && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
            <p className="text-xs text-slate-400">Your Deposit</p>
            <p className="text-sm font-bold text-blue-400">{formatUSD(userDeposit)}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="default" size="sm" className="flex-1" onClick={onDeposit}>
            Deposit
          </Button>
          {userDeposit > 0 && (
            <Button variant="secondary" size="sm" className="flex-1" onClick={onWithdraw}>
              Withdraw
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
