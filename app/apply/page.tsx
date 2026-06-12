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
      <div className="mx-auto max-w-xl px-4 py-24 text-center" style={{ fontFamily: "Manrope" }}>
        <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 32, color: "#FFFFFF", marginBottom: 12 }}>Connect Your Wallet</h1>
        <p style={{ color: "#9ca3af", marginBottom: 32 }}>You need to connect a wallet to apply for a loan.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  if (loanId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center" style={{ fontFamily: "Manrope" }}>
        <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: "rgba(0,245,160,0.1)", border: "1px solid #00F5A0" }}>
          <CheckCircle className="h-10 w-10" style={{ color: "#00F5A0" }} />
        </div>
        <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 32, color: "#FFFFFF", marginBottom: 8 }}>Application Submitted</h1>
        <p style={{ color: "#9ca3af", marginBottom: 8 }}>Loan ID: <span style={{ fontFamily: "monospace", color: "#FCA311" }}>{loanId}</span></p>
        <p style={{ color: "#9ca3af", marginBottom: 32, lineHeight: 1.7 }}>GenLayer validators are evaluating your creditworthiness. This may take a few moments.</p>
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
    <div style={{ fontFamily: "Manrope" }}>
      {/* Page Hero */}
      <section className="relative px-4 pt-20 pb-14"
        style={{ background: "linear-gradient(180deg, rgba(20,33,61,0.4) 0%, transparent 100%)", borderBottom: "1px solid rgba(252,163,17,0.1)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(252,163,17,0.07) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-6xl">
          <p style={{ fontSize: 11, color: "#FCA311", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            On-Chain Credit Portal
          </p>
          <h1 style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: "clamp(28px,4vw,44px)", color: "#FFFFFF", marginBottom: 10 }}>
            Apply for a Loan
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 15, maxWidth: 500, lineHeight: 1.7 }}>
            Secure under-collateralized capital through GenLayer&apos;s AI consensus engine. Your wallet activity is your reputation.
          </p>
        </div>
      </section>

    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Steps indicator */}
      <div className="flex items-center gap-3 mb-10">
        {[
          { n: 1, label: "Wallet Connection", done: !!profile },
          { n: 2, label: "AI Adjudication", done: profile?.kyc_status === "VERIFIED" },
          { n: 3, label: "Terms & Sign", done: false },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: step.done ? "#FCA311" : "rgba(255,255,255,0.06)",
                border: step.done ? "none" : "1px solid rgba(255,255,255,0.15)",
                color: step.done ? "#000" : "#9ca3af",
                fontFamily: "Space Grotesk",
              }}
            >
              {step.done ? <CheckCircle className="h-4 w-4" /> : step.n}
            </div>
            <span style={{ fontSize: 13, color: step.done ? "#FCA311" : "#9ca3af", fontWeight: step.done ? 600 : 400 }}>{step.label}</span>
            {i < 2 && <div className="h-px w-8" style={{ background: "rgba(255,255,255,0.1)" }} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!profile && <CreateProfileForm wallet={address!} onCreated={(p) => setProfile(p)} />}
          {profile && (
            <IdentityVerificationPanel
              wallet={address!}
              kycStatus={profile.kyc_status}
              onVerified={() => setProfile({ ...profile, kyc_status: "UNDER_REVIEW" })}
            />
          )}
          {profile?.kyc_status === "VERIFIED" && (
            <LoanRequestForm wallet={address!} onSuccess={(id) => setLoanId(id)} />
          )}
          {profile && profile.kyc_status !== "VERIFIED" && profile.kyc_status !== "UNDER_REVIEW" && (
            <Card>
              <CardContent className="py-6 text-center" style={{ color: "#9ca3af" }}>
                Complete identity verification to unlock loan applications.
              </CardContent>
            </Card>
          )}
          {profile?.kyc_status === "UNDER_REVIEW" && (
            <Card>
              <CardContent className="py-6 text-center" style={{ color: "#FCA311" }}>
                Identity verification is under review. You will be notified once approved.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {creditProfile && (
            <CreditScoreCard score={creditProfile.credit_score} tier={creditProfile.reputation_tier} confidence={undefined} riskLevel={undefined} />
          )}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 14, color: "#FFFFFF", marginBottom: 4 }}>How It Works</p>
              {[
                "Create your borrower profile",
                "Complete KYC identity verification",
                "Submit your loan application",
                "GenLayer AI evaluates creditworthiness",
                "Validators reach consensus on your offer",
                "Accept your loan offer and receive funds",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9ca3af" }}>
                  <span style={{ color: "#FCA311", fontWeight: 700, fontSize: 11, marginTop: 2 }}>{i + 1}.</span>
                  {step}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
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

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 40, background: "#000", border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff", fontSize: 14, padding: "0 12px", outline: "none", fontFamily: "Manrope",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 18, color: "#FFFFFF", marginBottom: 20 }}>Create Borrower Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#E5E5E5", display: "block", marginBottom: 6 }}>Full Name</label>
              <input
                style={inputStyle}
                className="focus:border-[#FCA311]"
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
