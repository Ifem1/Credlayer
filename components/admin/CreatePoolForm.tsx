"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, AlertCircle, CheckCircle } from "lucide-react";

interface Props {
  ownerWallet: string;
  onCreated?: () => void;
}

const PRESETS = [
  {
    label: "Conservative (LOW risk)",
    name: "Conservative Stable Pool",
    risk_tier: "LOW" as const,
    min_credit_score: 650,
    max_loan_amount: 5000,
    target_return_bps: 500, // 5%
  },
  {
    label: "Balanced (MEDIUM risk)",
    name: "Balanced Growth Pool",
    risk_tier: "MEDIUM" as const,
    min_credit_score: 450,
    max_loan_amount: 20000,
    target_return_bps: 1000, // 10%
  },
  {
    label: "Aggressive (HIGH risk)",
    name: "High Yield Pool",
    risk_tier: "HIGH" as const,
    min_credit_score: 300,
    max_loan_amount: 10000,
    target_return_bps: 1800, // 18%
  },
];

export function CreatePoolForm({ ownerWallet, onCreated }: Props) {
  const [name, setName] = useState("");
  const [riskTier, setRiskTier] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [minCreditScore, setMinCreditScore] = useState(450);
  const [maxLoanAmount, setMaxLoanAmount] = useState(20000);
  const [targetReturnBps, setTargetReturnBps] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function applyPreset(p: (typeof PRESETS)[number]) {
    setName(p.name);
    setRiskTier(p.risk_tier);
    setMinCreditScore(p.min_credit_score);
    setMaxLoanAmount(p.max_loan_amount);
    setTargetReturnBps(p.target_return_bps);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (name.trim().length < 3) {
      setError("Pool name must be at least 3 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pool/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          risk_tier: riskTier,
          min_credit_score: minCreditScore,
          max_loan_amount: maxLoanAmount,
          target_return_bps: targetReturnBps,
          owner_wallet: ownerWallet,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Pool creation failed"
        );
      }
      setSuccess(`Pool created — ID: ${data.data.pool_id}`);
      setName("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pool creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-400" />
          Create Liquidity Pool
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Pool Name"
            placeholder="e.g. Conservative Stable Pool"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={80}
          />

          <Select
            label="Risk Tier"
            value={riskTier}
            onChange={(e) => setRiskTier(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
            options={[
              { value: "LOW", label: "LOW — conservative, top-tier borrowers only" },
              { value: "MEDIUM", label: "MEDIUM — balanced risk and return" },
              { value: "HIGH", label: "HIGH — aggressive, higher yield, more risk" },
            ]}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Min Credit Score"
              type="number"
              min={0}
              max={850}
              value={minCreditScore}
              onChange={(e) => setMinCreditScore(Number(e.target.value))}
              hint="Borrowers below this score cannot draw from this pool"
            />
            <Input
              label="Max Loan Amount (USD)"
              type="number"
              min={100}
              max={10_000_000}
              value={maxLoanAmount}
              onChange={(e) => setMaxLoanAmount(Number(e.target.value))}
              hint="Largest single loan this pool will fund"
            />
            <Input
              label="Target Return (bps)"
              type="number"
              min={1}
              max={5000}
              value={targetReturnBps}
              onChange={(e) => setTargetReturnBps(Number(e.target.value))}
              hint={`${(targetReturnBps / 100).toFixed(2)}% annualised target`}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-400/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create Pool
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
