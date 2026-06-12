import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  TrendingUp,
  Layers,
  Users,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "AI Credit Adjudication",
    desc: "GenLayer's AI consensus evaluates your identity, wallet history, and reputation — bypassing the traditional 150% collateral requirement through deep on-chain behavior analysis.",
  },
  {
    icon: TrendingUp,
    title: "Reputation-Based Lending",
    desc: "Build your on-chain credit history over time. Every successful repayment unlocks lower rates and higher limits.",
  },
  {
    icon: Layers,
    title: "Liquidity Pools",
    desc: "Yield-seekers can fund high-performing portfolios adjudicated by decentralised intelligence.",
  },
  {
    icon: Lock,
    title: "Immutable Approvals",
    desc: "Every credit decision is hashed and stored immutably on GenLayer — provably tamper-proof and portable across the ecosystem.",
  },
];

const LOAN_TYPES = [
  { label: "Personal Loans", limit: "$50k", tag: "POPULAR" },
  { label: "Business Loans", limit: "$500k", tag: "" },
  { label: "Creator Loans", limit: "$75k", tag: "" },
  { label: "Freelancer Loans", limit: "$25k", tag: "" },
  { label: "DAO Contributor", limit: "$100k", tag: "" },
  { label: "Reputation-Backed", limit: "$1M+", tag: "" },
];

const STATS = [
  { label: "Loan Types", value: "6" },
  { label: "Credit Tiers", value: "6" },
  { label: "AI Consensus", value: "GenLayer" },
  { label: "Collateral Min", value: "0%" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col" style={{ fontFamily: "Manrope" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pt-32 pb-40 md:pt-44 md:pb-52">
        {/* radial amber glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(252,163,17,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow chip */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm"
            style={{
              background: "rgba(252,163,17,0.08)",
              border: "1px solid rgba(252,163,17,0.3)",
              color: "#FCA311",
              fontFamily: "Manrope",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            POWERED BY GENLAYER AI CONSENSUS
          </div>

          <h1
            className="mb-6"
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            Under-Collateralized Lending<br />
            <span style={{ color: "#FCA311" }}>Driven by AI Credit</span>
          </h1>

          <p
            className="max-w-2xl mx-auto mb-10"
            style={{ fontSize: 18, color: "#9ca3af", lineHeight: 1.7 }}
          >
            CredLayer evaluates your identity, wallet behavior, and repayment history using
            GenLayer&apos;s AI consensus engine — giving creditworthy borrowers access to capital
            without locking up 150% collateral.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply">
              <Button size="lg" className="gap-2 min-w-48">
                Apply for a Loan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary" className="gap-2 min-w-48">
                <TrendingUp className="h-4 w-4" />
                Browse Pools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section
        style={{
          borderTop: "1px solid rgba(252,163,17,0.15)",
          borderBottom: "1px solid rgba(252,163,17,0.15)",
          background: "rgba(20,33,61,0.5)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 700,
                  fontSize: 36,
                  color: "#FCA311",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#9ca3af",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 8,
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <div className="text-center mb-16">
          <p
            style={{
              fontFamily: "Manrope",
              fontWeight: 600,
              fontSize: 12,
              color: "#FCA311",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Protocol Features
          </p>
          <h2
            style={{
              fontFamily: "Space Grotesk",
              fontWeight: 700,
              fontSize: 40,
              color: "#FFFFFF",
              marginBottom: 16,
            }}
          >
            Built on GenLayer&apos;s Equivalence Principle
          </h2>
          <p style={{ color: "#9ca3af", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Subjective AI decisions reach consensus across multiple validators — giving you a credit score that&apos;s provably fair.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="card-hover rounded-lg p-8 transition-all duration-300"
                style={{ background: "#14213D" }}
              >
                <div
                  className="inline-flex items-center justify-center rounded-lg mb-5"
                  style={{
                    background: "rgba(252,163,17,0.1)",
                    border: "1px solid rgba(252,163,17,0.3)",
                    width: 44,
                    height: 44,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#FCA311" }} />
                </div>
                <h3
                  style={{
                    fontFamily: "Space Grotesk",
                    fontWeight: 600,
                    fontSize: 20,
                    color: "#FFFFFF",
                    marginBottom: 10,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontSize: 15, color: "#9ca3af", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Loan Types ── */}
      <section
        style={{
          borderTop: "1px solid rgba(252,163,17,0.1)",
          borderBottom: "1px solid rgba(252,163,17,0.1)",
          background: "rgba(20,33,61,0.3)",
          paddingTop: 100,
          paddingBottom: 100,
        }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 600,
                  fontSize: 12,
                  color: "#FCA311",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Loan Types Available
              </p>
              <h2
                style={{
                  fontFamily: "Space Grotesk",
                  fontWeight: 700,
                  fontSize: 36,
                  color: "#FFFFFF",
                }}
              >
                Six specialized loan products
              </h2>
            </div>
            <Link
              href="/explore"
              style={{ fontSize: 13, color: "#FCA311", fontWeight: 600, letterSpacing: "0.06em" }}
            >
              VIEW ALL PARAMETERS →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LOAN_TYPES.map((lt) => (
              <div
                key={lt.label}
                className="card-hover rounded-lg p-6"
                style={{ background: "#14213D" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(252,163,17,0.1)", border: "1px solid rgba(252,163,17,0.3)" }}
                  >
                    <Users className="h-4 w-4" style={{ color: "#FCA311" }} />
                  </div>
                  {lt.tag && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(252,163,17,0.15)", color: "#FCA311", fontFamily: "Manrope", fontWeight: 700, letterSpacing: "0.06em" }}
                    >
                      {lt.tag}
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 16, color: "#FFFFFF", marginBottom: 6 }}>
                  {lt.label}
                </p>
                <p style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 22, color: "#FCA311" }}>
                  {lt.limit}
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Limits up to
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-4xl px-4 text-center" style={{ paddingTop: 120, paddingBottom: 120 }}>
        <h2
          style={{
            fontFamily: "Space Grotesk",
            fontWeight: 700,
            fontSize: 44,
            color: "#FFFFFF",
            marginBottom: 16,
          }}
        >
          Ready to Build Your Credit?
        </h2>
        <p style={{ color: "#9ca3af", marginBottom: 40, maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Connect your wallet, complete identity verification, and let GenLayer&apos;s AI determine your credit profile in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/apply">
            <Button size="lg" className="gap-2 min-w-52">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/lender">
            <Button size="lg" variant="secondary" className="min-w-52">
              Become a Lender
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
