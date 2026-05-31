"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useParams } from "next/navigation";
import { LoanStatusPanel } from "@/components/loan/LoanStatusPanel";
import { RiskAssessmentPanel } from "@/components/credit/RiskAssessmentPanel";
import { InterestRateCard } from "@/components/credit/InterestRateCard";
import { CollateralRequirementCard } from "@/components/credit/CollateralRequirementCard";
import { RepaymentTimeline } from "@/components/loan/RepaymentTimeline";
import { GenLayerProofPanel } from "@/components/dashboard/GenLayerProofPanel";
import type { Loan, CreditAssessment, ProofEntry, RepaymentRecord } from "@/types";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoanDetailPage() {
  const { address } = useAccount();
  const params = useParams();
  const loanId = params.loanId as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [repayments] = useState<RepaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchLoan() {
    const [loanRes, proofsRes] = await Promise.all([
      fetch(`/api/loan/${loanId}`).then((r) => r.json()),
      address ? fetch(`/api/profile/${address}`).then((r) => r.json()) : Promise.resolve(null),
    ]);
    if (loanRes.success) setLoan(loanRes.data);
    if (proofsRes?.success) setProofs(proofsRes.data.proofs || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLoan();
  }, [loanId, address]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRepay(amount: number) {
    if (!address) return;
    const res = await fetch("/api/loan/repay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loan_id: loanId, amount_usd: amount, wallet: address }),
    });
    const data = await res.json();
    if (data.success) fetchLoan();
  }

  async function handleAccept() {
    if (!address) return;
    const res = await fetch("/api/loan/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loan_id: loanId, wallet: address }),
    });
    const data = await res.json();
    if (data.success) fetchLoan();
  }

  async function handleCancel() {
    if (!address) return;
    const res = await fetch("/api/loan/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loan_id: loanId, wallet: address }),
    });
    const data = await res.json();
    if (data.success) fetchLoan();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-slate-500">
        Loan not found.
      </div>
    );
  }

  const assessment: CreditAssessment = {
    decision: loan.status === "REJECTED" ? "REJECT" : "APPROVE",
    credit_score: loan.credit_score,
    risk_level: loan.risk_level,
    max_loan_amount: loan.max_loan_amount,
    required_collateral_ratio: loan.required_collateral_ratio,
    interest_rate: loan.interest_rate,
    confidence: loan.confidence,
    reasoning: loan.reasoning,
    positive_factors: loan.positive_factors,
    risk_factors: loan.risk_factors,
    fraud_risk: "LOW",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Loan Detail</h1>
        <p className="text-slate-400 font-mono text-sm">{loan.loan_id}</p>
        <p className="text-xs text-slate-500 mt-1">Requested {formatDate(loan.requested_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <LoanStatusPanel
            loan={loan}
            onAccept={handleAccept}
            onRepay={handleRepay}
            onCancel={handleCancel}
          />
          <RepaymentTimeline repayments={repayments} />
          <GenLayerProofPanel proofs={proofs.filter((p) => p.loan_id === loanId)} />
        </div>

        <div className="space-y-6">
          <RiskAssessmentPanel assessment={assessment} />
          <InterestRateCard
            rate={loan.interest_rate}
            duration_days={loan.duration_days}
            amount={loan.amount_usd}
          />
          <CollateralRequirementCard
            ratio={loan.required_collateral_ratio}
            loanAmount={loan.amount_usd}
            collateralProvided={loan.collateral_amount}
          />
        </div>
      </div>
    </div>
  );
}
