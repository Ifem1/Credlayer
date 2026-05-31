"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { CreditScoreCard } from "@/components/credit/CreditScoreCard";
import { LoanStatusPanel } from "@/components/loan/LoanStatusPanel";
import { GenLayerProofPanel } from "@/components/dashboard/GenLayerProofPanel";
import { IdentityVerificationPanel } from "@/components/credit/IdentityVerificationPanel";
import { ReputationBadge } from "@/components/credit/ReputationBadge";
import { ConnectWalletButton } from "@/components/layout/ConnectWalletButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { BorrowerProfile, CreditProfile, Loan, ProofEntry } from "@/types";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";

export default function BorrowerDashboard() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadData(wallet: string) {
    const profileRes = await fetch(`/api/profile/${wallet}`).then((r) => r.json());
    if (profileRes.success) {
      setProfile(profileRes.data.profile);
      setCreditProfile(profileRes.data.credit_profile);
      setLoans(profileRes.data.loans || []);
      setProofs(profileRes.data.proofs || []);
    }
    setLoading(false);
  }

  async function handleSync() {
    if (!address) return;
    setSyncing(true);
    await fetch("/api/genlayer/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address, action: "profile" }),
    });
    await loadData(address);
    setSyncing(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (address) loadData(address);
  }, [address]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Connect Your Wallet</h1>
        <p className="text-slate-400 mb-8">Connect a wallet to view your borrower dashboard.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">No Profile Found</h1>
        <p className="text-slate-400 mb-8">Create your borrower profile to get started.</p>
        <Link href="/apply">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const pendingLoans = loans.filter((l) => l.status === "PENDING_APPROVAL");
  const completedLoans = loans.filter((l) => l.status === "REPAID");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            Welcome, {profile.full_name.split(" ")[0]}
          </h1>
          <div className="flex items-center gap-3">
            {creditProfile && (
              <ReputationBadge
                tier={creditProfile.reputation_tier}
                score={creditProfile.reputation_score}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync GenLayer
          </Button>
          <Link href="/apply">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Loan
            </Button>
          </Link>
        </div>
      </div>

      {creditProfile && (
        <div className="mb-8">
          <DashboardStats
            stats={{
              credit_score: creditProfile.credit_score,
              active_loans: profile.active_loans,
              total_borrowed: creditProfile.total_borrowed,
              total_repaid: creditProfile.total_repaid,
              reputation_tier: creditProfile.reputation_tier,
              completed_loans: profile.completed_loans,
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* KYC */}
          {profile.kyc_status !== "VERIFIED" && (
            <IdentityVerificationPanel
              wallet={address!}
              kycStatus={profile.kyc_status}
              onVerified={() => setProfile({ ...profile, kyc_status: "UNDER_REVIEW" })}
            />
          )}

          {/* Pending Approvals */}
          {pendingLoans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">Pending Offers</h2>
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <LoanStatusPanel
                    key={loan.loan_id}
                    loan={loan}
                    onAccept={async () => {
                      await fetch("/api/loan/accept", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ loan_id: loan.loan_id, wallet: address }),
                      });
                      if (address) loadData(address);
                    }}
                    onCancel={async () => {
                      await fetch("/api/loan/cancel", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ loan_id: loan.loan_id, wallet: address }),
                      });
                      if (address) loadData(address);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Loans */}
          {activeLoans.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">Active Loans</h2>
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <LoanStatusPanel
                    key={loan.loan_id}
                    loan={loan}
                    onRepay={async (amount) => {
                      await fetch("/api/loan/repay", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ loan_id: loan.loan_id, amount_usd: amount, wallet: address }),
                      });
                      if (address) loadData(address);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {loans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <p className="mb-4">You have no loans yet.</p>
                <Link href="/apply">
                  <Button variant="secondary">Apply for Your First Loan</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          <GenLayerProofPanel proofs={proofs} />
        </div>

        <div className="space-y-6">
          {creditProfile && (
            <>
              <CreditScoreCard
                score={creditProfile.credit_score}
                tier={creditProfile.reputation_tier}
                confidence={undefined}
              />

              {/* Score Components */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Identity", score: creditProfile.identity_score, weight: 25, color: "bg-blue-500" },
                    { label: "Repayment", score: creditProfile.repayment_score, weight: 35, color: "bg-emerald-500" },
                    { label: "Wallet Trust", score: creditProfile.wallet_trust_score, weight: 20, color: "bg-purple-500" },
                    { label: "Income", score: creditProfile.income_score, weight: 15, color: "bg-yellow-500" },
                    { label: "Governance", score: creditProfile.governance_score, weight: 5, color: "bg-cyan-500" },
                  ].map((c) => (
                    <div key={c.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">{c.label} ({c.weight}%)</span>
                        <span className="text-slate-300">{c.score}</span>
                      </div>
                      <Progress value={c.score} barClassName={c.color} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {/* Recent History */}
          {completedLoans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Completed Loans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedLoans.slice(0, 5).map((l) => (
                    <div key={l.loan_id} className="flex justify-between text-sm">
                      <span className="text-slate-400 font-mono">{l.loan_id.slice(0, 14)}…</span>
                      <span className="text-emerald-400">${l.amount_usd.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
