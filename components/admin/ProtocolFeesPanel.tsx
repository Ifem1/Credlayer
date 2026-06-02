"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Coins, AlertCircle, CheckCircle } from "lucide-react";
import { weiToGen } from "@/lib/utils";
import type { ProtocolFees } from "@/types";

interface Props {
  fees: ProtocolFees | null;
  ownerWallet: string;
  onChanged?: () => void;
}

export function ProtocolFeesPanel({ fees, ownerWallet, onChanged }: Props) {
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState(ownerWallet);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // total_collected may be wei string (new contract) or a plain number (old)
  const rawCollected = (fees as unknown as Record<string, unknown>)?.total_collected_wei
    ?? fees?.total_collected ?? 0;
  const totalGEN = typeof rawCollected === "string" && rawCollected.length > 10
    ? weiToGen(rawCollected)
    : Number(rawCollected);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (amount <= 0) { setError("Enter an amount greater than 0."); return; }
    if (!recipient || !/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      setError("Enter a valid recipient address."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_gen: amount, recipient, owner_wallet: ownerWallet }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === "string" ? data.error : "Withdraw failed");
      setSuccess(`Withdrew ${amount} GEN → ${recipient.slice(0, 10)}… tx: ${(data.data?.tx_hash || "").slice(0, 14)}…`);
      setAmount(0);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-400" />
          Protocol Fees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs text-slate-500 mb-1">Total Collected</p>
            <p className="text-xl font-bold text-yellow-400">
              {totalGEN.toLocaleString(undefined, { maximumFractionDigits: 4 })} GEN
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs text-slate-500 mb-1">Origination Fee</p>
            <p className="text-xl font-bold text-slate-100">
              {fees ? `${(fees.origination_fee_bps / 100).toFixed(2)}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs text-slate-500 mb-1">Late Fee</p>
            <p className="text-xl font-bold text-slate-100">
              {fees ? `${(fees.late_fee_bps / 100).toFixed(2)}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs text-slate-500 mb-1">Default Penalty</p>
            <p className="text-xl font-bold text-slate-100">
              {fees ? `${(fees.default_penalty_bps / 100).toFixed(2)}%` : "—"}
            </p>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-3">
          <Input
            label="Withdraw Amount (GEN)"
            type="number"
            min={0.000001}
            step="any"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0"
            hint={`Available: ${totalGEN.toLocaleString(undefined, { maximumFractionDigits: 4 })} GEN`}
          />
          <Input
            label="Recipient Address"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            hint="GEN will be transferred to this address"
          />
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-400/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-emerald-400/10 p-2.5 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {success}
            </div>
          )}
          <Button type="submit" loading={loading} disabled={amount <= 0} className="w-full">
            Withdraw Fees to Recipient
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
