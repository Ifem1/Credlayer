"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hashString } from "@/lib/utils";
import type { LoanType, LoanRequestPayload } from "@/types";
import { FileText } from "lucide-react";

interface Props {
  wallet: string;
  onSuccess?: (loanId: string) => void;
}

const LOAN_TYPES: { value: LoanType; label: string }[] = [
  { value: "PERSONAL", label: "Personal Loan" },
  { value: "BUSINESS", label: "Business Loan" },
  { value: "CREATOR", label: "Creator Loan" },
  { value: "FREELANCER", label: "Freelancer Loan" },
  { value: "DAO_CONTRIBUTOR", label: "DAO Contributor Loan" },
  { value: "REPUTATION_BACKED", label: "Reputation-Backed Loan" },
];

export function LoanRequestForm({ wallet, onSuccess }: Props) {
  const [form, setForm] = useState<LoanRequestPayload>({
    amount_usd: 1000,
    duration_days: 90,
    loan_type: "PERSONAL",
    purpose: "",
    collateral_amount: 0,
    wallet_age_days: 0,
    total_transactions: 0,
    avg_balance_usd: 0,
    github_contributions: 0,
    dao_votes: 0,
    income_documents_hash: "",
  });
  const [incomeRef, setIncomeRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  function setField<K extends keyof LoanRequestPayload>(key: K, value: LoanRequestPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        income_documents_hash: incomeRef ? hashString(incomeRef) : "no_income_docs",
        wallet,
      };
      const res = await fetch("/api/loan/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === "string" ? data.error : "Request failed");
      onSuccess?.(data.data.loan_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request loan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          Loan Application
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Step 1 — Loan Details</h3>
              <Select
                label="Loan Type"
                value={form.loan_type}
                onChange={(e) => setField("loan_type", e.target.value as LoanType)}
                options={LOAN_TYPES}
              />
              <Input
                label="Requested Amount (USD)"
                type="number"
                min={100}
                max={500000}
                value={form.amount_usd}
                onChange={(e) => setField("amount_usd", Number(e.target.value))}
              />
              <Input
                label="Duration (days)"
                type="number"
                min={7}
                max={1095}
                value={form.duration_days}
                onChange={(e) => setField("duration_days", Number(e.target.value))}
                hint="7–1095 days (up to 3 years)"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Purpose</label>
                <textarea
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Describe your loan purpose in detail..."
                  value={form.purpose}
                  onChange={(e) => setField("purpose", e.target.value)}
                  minLength={10}
                  required
                />
              </div>
              <Input
                label="Collateral Amount (USD)"
                type="number"
                min={0}
                value={form.collateral_amount}
                onChange={(e) => setField("collateral_amount", Number(e.target.value))}
                hint="More collateral improves approval odds"
              />
              <Button type="button" onClick={() => setStep(2)} className="w-full">
                Next: Wallet & Reputation
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Step 2 — Wallet Metrics</h3>
              <Input
                label="Wallet Age (days)"
                type="number"
                min={0}
                value={form.wallet_age_days}
                onChange={(e) => setField("wallet_age_days", Number(e.target.value))}
              />
              <Input
                label="Total Transactions"
                type="number"
                min={0}
                value={form.total_transactions}
                onChange={(e) => setField("total_transactions", Number(e.target.value))}
              />
              <Input
                label="Average Balance (USD)"
                type="number"
                min={0}
                value={form.avg_balance_usd}
                onChange={(e) => setField("avg_balance_usd", Number(e.target.value))}
              />
              <Input
                label="GitHub Contributions (past year)"
                type="number"
                min={0}
                value={form.github_contributions}
                onChange={(e) => setField("github_contributions", Number(e.target.value))}
              />
              <Input
                label="DAO Governance Votes"
                type="number"
                min={0}
                value={form.dao_votes}
                onChange={(e) => setField("dao_votes", Number(e.target.value))}
              />
              <Input
                label="Income Document Reference"
                placeholder="Bank statement, invoice, or payslip reference"
                value={incomeRef}
                onChange={(e) => setIncomeRef(e.target.value)}
                hint="Will be securely hashed before submission"
              />
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Submit Application
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400 bg-red-400/10 rounded-lg p-3">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
