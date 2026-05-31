"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BorrowerProfileCard } from "@/components/loan/BorrowerProfileCard";
import { CreditScoreCard } from "@/components/credit/CreditScoreCard";
import { ReputationBadge } from "@/components/credit/ReputationBadge";
import { GenLayerProofPanel } from "@/components/dashboard/GenLayerProofPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BorrowerProfile, CreditProfile, Loan, ProofEntry } from "@/types";

export default function ProfilePage() {
  const params = useParams();
  const wallet = params.wallet as string;

  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/profile/${wallet}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data.profile);
          setCreditProfile(d.data.credit_profile);
          setLoans(d.data.loans || []);
          setProofs(d.data.proofs || []);
        }
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile || !creditProfile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-slate-500">
        Profile not found for this wallet.
      </div>
    );
  }

  const scoreComponents = [
    { label: "Identity", weight: 25, score: creditProfile.identity_score, color: "bg-blue-500" },
    { label: "Repayment History", weight: 35, score: creditProfile.repayment_score, color: "bg-emerald-500" },
    { label: "Wallet Trust", weight: 20, score: creditProfile.wallet_trust_score, color: "bg-purple-500" },
    { label: "Income Stability", weight: 15, score: creditProfile.income_score, color: "bg-yellow-500" },
    { label: "Governance Activity", weight: 5, score: creditProfile.governance_score, color: "bg-cyan-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Borrower Profile</h1>
        <p className="text-slate-400 font-mono text-sm">{wallet}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BorrowerProfileCard profile={profile} creditProfile={creditProfile} />

          {/* Reputation Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Reputation Score Breakdown</span>
                <ReputationBadge tier={creditProfile.reputation_tier} score={creditProfile.reputation_score} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreComponents.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{c.label}</span>
                    <span className="text-slate-400">{c.score}/100 <span className="text-slate-600">({c.weight}% weight)</span></span>
                  </div>
                  <Progress value={c.score} barClassName={c.color} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Loan History */}
          {loans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Loan History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loans.map((loan) => (
                    <div key={loan.loan_id} className="flex items-center justify-between rounded-lg bg-slate-800/40 p-3">
                      <div>
                        <p className="text-sm font-mono text-slate-300">{loan.loan_id}</p>
                        <p className="text-xs text-slate-500">${loan.amount_usd.toLocaleString()} · {loan.loan_type}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        loan.status === "REPAID" ? "bg-emerald-500/20 text-emerald-400" :
                        loan.status === "ACTIVE" ? "bg-blue-500/20 text-blue-400" :
                        loan.status === "DEFAULTED" ? "bg-red-500/20 text-red-400" :
                        "bg-slate-500/20 text-slate-400"
                      }`}>{loan.status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <GenLayerProofPanel proofs={proofs} />
        </div>

        <div className="space-y-6">
          <CreditScoreCard
            score={creditProfile.credit_score}
            tier={creditProfile.reputation_tier}
          />
        </div>
      </div>
    </div>
  );
}
