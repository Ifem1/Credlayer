"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, loanStatusColor, formatUSD, formatDate, daysUntil } from "@/lib/utils";
import type { Loan } from "@/types";
import { useState } from "react";

interface Props {
  loan: Loan;
  onAccept?: () => void;
  onRepay?: (amount: number) => void;
  onCancel?: () => void;
}

export function LoanStatusPanel({ loan, onAccept, onRepay, onCancel }: Props) {
  const [repayAmount, setRepayAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalOwed = loan.amount_usd * (1 + (loan.interest_rate / 100) * (loan.duration_days / 365));
  const remaining = totalOwed - loan.total_repaid;
  const daysLeft = loan.due_date ? daysUntil(loan.due_date) : null;

  async function handleRepay() {
    if (!repayAmount || repayAmount <= 0) return;
    setLoading(true);
    try {
      await onRepay?.(repayAmount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Loan {loan.loan_id}</span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", loanStatusColor(loan.status))}>
            {loan.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-400">Loan Amount</p>
            <p className="text-lg font-bold text-slate-100">{formatUSD(loan.amount_usd)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-400">Interest Rate</p>
            <p className="text-lg font-bold text-blue-400">{loan.interest_rate}%</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-400">Total Owed</p>
            <p className="text-lg font-bold text-orange-400">{formatUSD(totalOwed)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-400">Remaining</p>
            <p className="text-lg font-bold text-slate-100">{formatUSD(remaining)}</p>
          </div>
        </div>

        {loan.due_date && (
          <div className={cn("rounded-lg p-3", daysLeft !== null && daysLeft < 7 ? "bg-red-400/10 border border-red-400/20" : "bg-slate-800/50")}>
            <p className="text-xs text-slate-400">Due Date</p>
            <p className="text-sm font-semibold text-slate-200">{formatDate(loan.due_date)}</p>
            {daysLeft !== null && <p className={cn("text-xs mt-1", daysLeft < 7 ? "text-red-400" : "text-slate-400")}>{daysLeft > 0 ? `${daysLeft} days remaining` : "Overdue!"}</p>}
          </div>
        )}

        {/* Approval proof */}
        {loan.is_immutable && (
          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-400 font-semibold mb-1">Immutable Approval Record</p>
            <p className="text-xs text-slate-400 font-mono break-all">{loan.approval_hash}</p>
          </div>
        )}

        {/* Actions */}
        {loan.status === "PENDING_APPROVAL" && (
          <div className="flex gap-3">
            <Button onClick={onAccept} className="flex-1">Accept Offer</Button>
            <Button variant="destructive" onClick={onCancel} className="flex-1">Decline</Button>
          </div>
        )}

        {loan.status === "ACTIVE" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                className="flex h-10 flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100"
                placeholder={`Amount (up to $${remaining.toFixed(2)})`}
                min={1}
                max={remaining}
                value={repayAmount || ""}
                onChange={(e) => setRepayAmount(Number(e.target.value))}
              />
              <Button onClick={handleRepay} loading={loading} variant="success">
                Repay
              </Button>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => { setRepayAmount(remaining); handleRepay(); }}
              loading={loading}
            >
              Repay Full Amount
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
