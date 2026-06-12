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
import { Plus, RefreshCw, Lock } from "lucide-react";

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
    if (address) loadData(address);
  }, [address]);

  if (!isConnected) {
    return (
      <div
        className="flex flex-col items-center justify-center px-4 text-center"
        style={{ minHeight: "70vh", fontFamily: "Manrope" }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
          style={{ background: "rgba(252,163,17,0.08)", border: "1px solid rgba(252,163,17,0.2)" }}
        >
          <Lock className="h-9 w-9" style={{ color: "#FCA311" }} />
        </div>
        <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 36, color: "#FFFFFF", marginBottom: 12 }}>
          Borrower Dashboard
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 16, maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
          Connect your wallet to view your active loans, credit score, and repayment schedule. Powered by GenLayer AI Consensus.
        </p>
        <ConnectWalletButton />
        <div
          className="mt-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{ background: "rgba(20,33,61,0.6)", border: "1px solid rgba(252,163,17,0.15)" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: "#00F5A0" }} />
          <span style={{ color: "#9ca3af", fontFamily: "Manrope", fontSize: 13 }}>
            AI ENGINE STATUS: <span style={{ color: "#00F5A0", fontWeight: 600 }}>READY FOR CONSENSUS</span>
          </span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="h-10 w-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(252,163,17,0.2)", borderTopColor: "#FCA311" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" style={{ fontFamily: "Manrope" }}>
        <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 28, color: "#FFFFFF", marginBottom: 12 }}>
          No Profile Found
        </h1>
        <p style={{ color: "#9ca3af", marginBottom: 32 }}>Create your borrower profile to get started.</p>
        <Link href="/apply"><Button>Create Profile</Button></Link>
      </div>
    );
  }

  const activeLoans    = loans.filter((l) => l.status === "ACTIVE");
  const pendingLoans   = loans.filter((l) => l.status === "PENDING_APPROVAL");
  const completedLoans = loans.filter((l) => l.status === "REPAID");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12" style={{ fontFamily: "Manrope" }}>
      {/* Header */}
      <div className="mb-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p style={{ fontSize: 12, color: "#FCA311", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Borrower Dashboard
          </p>
          <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 32, color: "#FFFFFF", marginBottom: 8 }}>
            Welcome, {profile.full_name.split(" ")[0]}
          </h1>
          {creditProfile && (
            <ReputationBadge tier={creditProfile.reputation_tier} score={creditProfile.reputation_score} />
          )}
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
        <div className="mb-10">
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
          {profile.kyc_status !== "VERIFIED" && (
            <IdentityVerificationPanel
              wallet={address!}
              kycStatus={profile.kyc_status}
              onVerified={() => setProfile({ ...profile, kyc_status: "UNDER_REVIEW" })}
            />
          )}

          {pendingLoans.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 18, color: "#FFFFFF", marginBottom: 12 }}>Pending Offers</h2>
              <div className="space-y-4">
                {pendingLoans.map((loan) => (
                  <LoanStatusPanel
                    key={loan.loan_id}
                    loan={loan}
                    onAccept={async () => {
                      await fetch("/api/loan/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: loan.loan_id, wallet: address }) });
                      if (address) loadData(address);
                    }}
                    onCancel={async () => {
                      await fetch("/api/loan/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: loan.loan_id, wallet: address }) });
                      if (address) loadData(address);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeLoans.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 18, color: "#FFFFFF", marginBottom: 12 }}>Active Loans</h2>
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <LoanStatusPanel
                    key={loan.loan_id}
                    loan={loan}
                    onRepay={async (amount) => {
                      await fetch("/api/loan/repay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loan_id: loan.loan_id, amount_usd: amount, wallet: address }) });
                      if (address) loadData(address);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {loans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p style={{ color: "#9ca3af", marginBottom: 16 }}>You have no loans yet.</p>
                <Link href="/apply"><Button variant="secondary">Apply for Your First Loan</Button></Link>
              </CardContent>
            </Card>
          )}

          <GenLayerProofPanel proofs={proofs} />
        </div>

        <div className="space-y-6">
          {creditProfile && (
            <>
              <CreditScoreCard score={creditProfile.credit_score} tier={creditProfile.reputation_tier} confidence={undefined} />

              <Card>
                <CardHeader><CardTitle>Score Components</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Identity",     score: creditProfile.identity_score,     weight: 25, color: "#FCA311" },
                    { label: "Repayment",    score: creditProfile.repayment_score,    weight: 35, color: "#00F5A0" },
                    { label: "Wallet Trust", score: creditProfile.wallet_trust_score, weight: 20, color: "#b9c6ea" },
                    { label: "Income",       score: creditProfile.income_score,       weight: 15, color: "#ffddb8" },
                    { label: "Governance",   score: creditProfile.governance_score,   weight: 5,  color: "#9ca3af" },
                  ].map((c) => (
                    <div key={c.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: "#9ca3af" }}>{c.label} ({c.weight}%)</span>
                        <span style={{ color: "#E5E5E5", fontWeight: 600 }}>{c.score}</span>
                      </div>
                      <Progress value={c.score} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {completedLoans.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Completed Loans</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {completedLoans.slice(0, 5).map((l) => (
                    <div key={l.loan_id} className="flex justify-between text-sm">
                      <span style={{ color: "#9ca3af", fontFamily: "monospace" }}>{l.loan_id.slice(0, 14)}…</span>
                      <span style={{ color: "#00F5A0", fontWeight: 600 }}>${l.amount_usd.toLocaleString()}</span>
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
