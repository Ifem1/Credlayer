import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  TrendingUp,
  Layers,
  Users,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    title: "AI Credit Adjudication",
    desc: "GenLayer's AI consensus evaluates your identity, wallet history, and reputation — no collateral wall.",
  },
  {
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    title: "Reputation-Based Lending",
    desc: "Build on-chain credit over time. Better history unlocks lower rates and higher loan limits.",
  },
  {
    icon: Layers,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    title: "Liquidity Pools",
    desc: "Lenders earn competitive yield by funding a diverse portfolio of AI-adjudicated loans.",
  },
  {
    icon: Lock,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    title: "Immutable Approvals",
    desc: "Every credit decision is hashed and stored immutably on GenLayer — provably tamper-proof.",
  },
  {
    icon: Users,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    title: "6 Loan Types",
    desc: "Personal, Business, Creator, Freelancer, DAO Contributor, and Reputation-Backed loans.",
  },
  {
    icon: Zap,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    title: "Proof Trail",
    desc: "Every action generates a verifiable on-chain proof entry tied to a GenLayer transaction hash.",
  },
];

const LOAN_TYPES = [
  "Personal Loans",
  "Business Loans",
  "Creator Loans",
  "Freelancer Loans",
  "DAO Contributor Loans",
  "Reputation-Backed Loans",
];

const STATS = [
  { label: "Loan Types", value: "6" },
  { label: "Credit Tiers", value: "6" },
  { label: "AI Consensus", value: "GenLayer" },
  { label: "Collateral Min", value: "0%" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-28 md:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,#3b82f620,transparent)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400">
            <Zap className="h-3.5 w-3.5" />
            Powered by GenLayer AI Consensus
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-100 leading-tight tracking-tight mb-6">
            Under-Collateralized Lending<br />
            <span className="text-blue-400">Driven by AI Credit</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
            CredLayer evaluates your identity, wallet behavior, and repayment history using
            GenLayer&apos;s AI consensus engine — giving creditworthy borrowers access to capital
            without locking up 150% collateral.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply">
              <Button size="lg" className="gap-2">
                Apply for a Loan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="secondary" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Browse Pools
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-blue-400">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-100 mb-3">Protocol Features</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built on GenLayer&apos;s equivalence principle — subjective AI decisions reach consensus across multiple validators.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="hover:border-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className={`inline-flex rounded-lg p-2.5 mb-4 ${f.bg}`}>
                    <Icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Loan Types */}
      <section className="bg-slate-900/30 border-y border-slate-800 py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-slate-100 mb-4">Loan Types Available</h2>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto">
            Six specialized loan products, each with AI-calibrated risk parameters.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {LOAN_TYPES.map((lt) => (
              <div
                key={lt}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300"
              >
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                {lt}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">
          Ready to Build Your Credit?
        </h2>
        <p className="text-slate-400 mb-10 max-w-xl mx-auto">
          Connect your wallet, complete identity verification, and let GenLayer&apos;s AI determine your credit profile.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/apply">
            <Button size="lg" className="gap-2 min-w-48">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard/lender">
            <Button size="lg" variant="secondary" className="min-w-48">
              Become a Lender
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
