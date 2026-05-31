"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw, AlertCircle } from "lucide-react";
import type { LiquidityPool } from "@/types";
import { formatUSD, formatPercent, cn, riskLevelColor } from "@/lib/utils";

interface Props {
  pools: LiquidityPool[];
  ownerWallet: string;
  onChanged?: () => void;
}

export function PoolManagementPanel({ pools, ownerWallet, onChanged }: Props) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleClose(poolId: string) {
    if (!confirm(`Close pool ${poolId}? Lenders will no longer be able to deposit.`)) return;
    setError("");
    setClosingId(poolId);
    try {
      const res = await fetch("/api/admin/pool/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool_id: poolId, owner_wallet: ownerWallet }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(typeof data.error === "string" ? data.error : "Close failed");
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Close failed");
    } finally {
      setClosingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Pool Management
          <button
            onClick={() => onChanged?.()}
            className="ml-auto rounded p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-400/10 p-3 text-sm text-red-400 mb-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {pools.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500">
            No pools yet — create one above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Pool ID", "Name", "Risk", "Min Score", "Max Loan", "Yield", "Util", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium py-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pools.map((p) => {
                  const util = p.total_deposited > 0
                    ? (p.total_borrowed / p.total_deposited) * 100
                    : 0;
                  return (
                    <tr key={p.pool_id} className="border-b border-slate-800/50">
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{p.pool_id}</td>
                      <td className="py-2.5 pr-3 text-slate-200 font-medium">{p.name}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", riskLevelColor(p.risk_tier))}>
                          {p.risk_tier}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{p.min_credit_score}</td>
                      <td className="py-2.5 pr-3 text-slate-300">{formatUSD(p.max_loan_amount)}</td>
                      <td className="py-2.5 pr-3 text-emerald-400">
                        {(p.target_return_bps / 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{formatPercent(util)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          p.status === "ACTIVE"
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-slate-700 text-slate-400"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {p.status === "ACTIVE" && p.active_loans === 0 && (
                          <Button
                            variant="secondary"
                            onClick={() => handleClose(p.pool_id)}
                            loading={closingId === p.pool_id}
                            className="h-7 px-3 text-xs"
                          >
                            Close
                          </Button>
                        )}
                        {p.status === "ACTIVE" && p.active_loans > 0 && (
                          <span className="text-xs text-slate-500" title="Pool has active loans">
                            Has {p.active_loans} loan{p.active_loans === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
