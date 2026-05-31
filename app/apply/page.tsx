"use client";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { LoanRequestForm } from "@/components/loan/LoanRequestForm";
import { IdentityVerificationPanel } from "@/components/credit/IdentityVerificationPanel";
import { CreditScoreCard } from "@/components/credit/CreditScoreCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectWalletButton } from "@/components/layout/ConnectWalletButton";
import { useEffect } from "react";
import type { BorrowerProfile, CreditProfile } from "@/types";
import { hashString } from "@/lib/utils";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function ApplyPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [creditProfile, setCreditProfile] = useState<CreditProfile | null>(null);
  const [loanId, setLoanId] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    fetch(`/api/profile/${address}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data.profile);
          setCreditProfile(d.data.credit_profile);
        }
      });
  }, [address]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Connect Your Wallet</h1>
        <p className="text-slate-400 mb-8">You need to connect a wallet to apply for a loan.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  if (loanId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Application Submitted</h1>
        <p className="text-slate-400 mb-2">Loan ID: <span className="font-mono text-blue-400">{loanId}</span></p>
        <p className="text-slate-400 mb-8">GenLayer validators are evaluating your creditworthiness. This may take a few moments.</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push(`/loan/${loanId}`)}>
            View Loan Status <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            My Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Apply for a Loan</h1>
        <p className="text-slate-400">Complete the steps below to get AI-adjudicated credit from GenLayer.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[
          { n: 1, label: "Create Profile", done: !!profile },
          { n: 2, label: "Verify Identity", done: profile?.kyc_status === "VERIFIED" },
          { n: 3, label: "Apply for Loan", done: false },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              step.done ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400"
            }`}>
              {step.done ? <CheckCircle className="h-4 w-4" /> : step.n}
            </div>
            <span className={`text-sm ${step.done ? "text-emerald-400" : "text-slate-400"}`}>{step.label}</span>
            {i < 2 && <div className="h-px w-8 bg-slate-800" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Profile */}
          {!profile && (
            <CreateProfileForm wallet={address!} onCreated={(p) => setProfile(p)} />
          )}

          {/* Step 2: Identity */}
          {profile && (
            <IdentityVerificationPanel
              wallet={address!}
              kycStatus={profile.kyc_status}
              onVerified={() => setProfile({ ...profile, kyc_status: "UNDER_REVIEW" })}
            />
          )}

          {/* Step 3: Loan Application */}
          {profile?.kyc_status === "VERIFIED" && (
            <LoanRequestForm
              wallet={address!}
              onSuccess={(id) => setLoanId(id)}
            />
          )}

          {profile && profile.kyc_status !== "VERIFIED" && profile.kyc_status !== "UNDER_REVIEW" && (
            <Card>
              <CardContent className="py-6 text-center text-slate-400">
                Complete identity verification to unlock loan applications.
              </CardContent>
            </Card>
          )}

          {profile?.kyc_status === "UNDER_REVIEW" && (
            <Card>
              <CardContent className="py-6 text-center text-yellow-400">
                Identity verification is under review. You will be notified once approved.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {creditProfile && (
            <CreditScoreCard
              score={creditProfile.credit_score}
              tier={creditProfile.reputation_tier}
              confidence={undefined}
              riskLevel={undefined}
            />
          )}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-300">How It Works</p>
              {[
                "Create your borrower profile",
                "Complete KYC identity verification",
                "Submit your loan application",
                "GenLayer AI evaluates creditworthiness",
                "Validators reach consensus on your offer",
                "Accept your loan offer and receive funds",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="mt-0.5 text-blue-400 font-bold text-xs">{i + 1}.</span>
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CreateProfileForm({
  wallet,
  onCreated,
}: {
  wallet: string;
  onCreated: (p: BorrowerProfile) => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    country: "",
    occupation: "",
    monthly_income_usd: 0,
    loan_purpose: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email_hash: hashString(form.email),
          wallet,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === "string" ? data.error : "Failed to create profile");
      // Re-fetch profile
      const profileRes = await fetch(`/api/profile/${wallet}`);
      const profileData = await profileRes.json();
      if (profileData.success) onCreated(profileData.data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Create Borrower Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <input
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Country</label>
              <input
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="United States"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Occupation</label>
              <input
                className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Software Engineer"
                value={form.occupation}
                onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Monthly Income (USD)</label>
            <input
              type="number"
              min={0}
              className="flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000"
              value={form.monthly_income_usd || ""}
              onChange={(e) => setForm((p) => ({ ...p, monthly_income_usd: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Primary Loan Purpose</label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[72px]"
              placeholder="Describe your primary purpose for borrowing..."
              value={form.loan_purpose}
              onChange={(e) => setForm((p) => ({ ...p, loan_purpose: e.target.value }))}
              required
              minLength={10}
            />
          </div>
          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">{error}</p>}
          <Button type="submit" loading={loading} className="w-full">
            Create Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
