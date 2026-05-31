"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, AlertTriangle, Zap, AlertCircle, RefreshCw } from "lucide-react";
import type { Loan, LiquidityPool } from "@/types";
import { formatUSD, shortenAddress, cn, riskLevelColor, loanStatusColor } from "@/lib/utils";

interface Props {
  loans: Loan[];
  pools: LiquidityPool[];
  ownerWallet: string;
  onChanged?: () => void;
}

export function PendingLoansPanel({ loans, pools, ownerWallet, onChanged }: Props) {
  const [selectedPool, setSelectedPool] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleActivate(loan: Loan) {
    const poolId = selectedPool[loan.loan_id];
    if (!poolId) {
      setError(`Select a pool to activate loan ${loan.loan_id}.`);
      return;
    }
    setError("");
    setBusyId(loan.loan_id);
    try {
      const res = await fetch("/api/admin/loan/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loan.loan_id,
          pool_id: poolId,
          owner_wallet: ownerWallet,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(typeof data.error === "string" ? data.error : "Activate failed");
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activate failed");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDefault(loan: Loan) {
    if (!confirm(`Mark loan ${loan.loan_id} as defaulted? This is irreversible and affects borrower reputation.`)) return;
    setError("");
    setBusyId(loan.loan_id);
    try {
      const res = await fetch("/api/admin/loan/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loan_id: loan.loan_id, owner_wallet: ownerWallet }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(typeof data.error === "string" ? data.error : "Default failed");
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Default failed");
    } finally {
      setBusyId(null);
    }
  }

  // Only ACTIVE pools are eligible to fund a new loan
  const activePools = pools.filter((p) => p.status === "ACTIVE");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-400" />
          Loan Queue
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
        {loans.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-500">No loans needing action.</p>
        ) : (
          <div className="space-y-3">
            {loans.map((l) => {
              const isActivatable = l.status === "APPROVED" || l.status === "PENDING_APPROVAL";
              const isDefaultable = l.status === "ACTIVE";
              return (
                <div
                  key={l.loan_id}
                  className="rounded-lg border border-slate-800 bg-slate-800/30 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-blue-400">{l.loan_id}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", loanStatusColor(l.status))}>
                      {l.status}
                    </span>
                    {l.risk_level && (
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", riskLevelColor(l.risk_level))}>
                        {l.risk_level} risk
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-500">
                      Borrower: <span className="font-mono text-slate-400">{shortenAddress(l.borrower)}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-slate-500">Amount</p>
                      <p className="text-slate-200 font-medium">{formatUSD(l.amount_usd)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Duration</p>
                      <p className="text-slate-200 font-medium">{l.duration_days}d</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Credit Score</p>
                      <p className="text-slate-200 font-medium">{l.credit_score || "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Interest</p>
                      <p className="text-slate-200 font-medium">{l.interest_rate}%</p>
                    </div>
                  </div>

                  {isActivatable && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Fund from pool</label>
                        <select
                          value={selectedPool[l.loan_id] || ""}
                          onChange={(e) =>
                            setSelectedPool((prev) => ({ ...prev, [l.loan_id]: e.target.value }))
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 h-9 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select pool…</option>
                          {activePools.map((p) => (
                            <option key={p.pool_id} value={p.pool_id} disabled={p.available_liquidity < l.amount_usd}>
                              {p.name} ({p.risk_tier}) — {formatUSD(p.available_liquidity)} available
                              {p.available_liquidity < l.amount_usd ? " — insufficient" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={() => handleActivate(l)}
                        loading={busyId === l.loan_id}
                        disabled={!selectedPool[l.loan_id]}
                        className="h-9"
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Activate
                      </Button>
                    </div>
                  )}

                  {isDefaultable && (
                    <Button
                      onClick={() => handleDefault(l)}
                      loading={busyId === l.loan_id}
                      variant="secondary"
                      className="h-9 text-red-400 hover:text-red-300"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Mark as Defaulted
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
