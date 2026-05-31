import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shortenAddress, formatDate } from "@/lib/utils";
import type { ProofEntry } from "@/types";
import { ShieldCheck, ExternalLink } from "lucide-react";

interface Props {
  proofs: ProofEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  profile_created: "Profile Created",
  identity_verified: "Identity Verified",
  loan_requested: "Loan Requested",
  loan_accepted: "Offer Accepted",
  loan_cancelled: "Loan Cancelled",
  loan_repaid_full: "Loan Fully Repaid",
  loan_repaid_partial: "Partial Repayment",
  liquidity_deposited: "Liquidity Deposited",
  liquidity_withdrawn: "Liquidity Withdrawn",
  default_recorded: "Default Recorded",
  reputation_updated: "Reputation Updated",
};

export function GenLayerProofPanel({ proofs }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
          GenLayer Proof Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        {proofs.length === 0 ? (
          <p className="text-center text-slate-500 py-6">No proof entries yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {proofs.map((p) => (
              <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-200">
                    {ACTION_LABELS[p.action] ?? p.action}
                  </span>
                  <span className="text-xs text-slate-500">{p.created_at ? formatDate(p.created_at) : ""}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500 w-24 shrink-0">Contract</span>
                    <span className="text-slate-400 font-mono">{shortenAddress(p.contract_address)}</span>
                    <ExternalLink className="h-3 w-3 text-slate-600 ml-auto shrink-0" />
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500 w-24 shrink-0">Tx Hash</span>
                    <span className="text-blue-400 font-mono truncate">{shortenAddress(p.tx_hash)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500 w-24 shrink-0">State</span>
                    <span className="text-slate-400">{p.state_before} → {p.state_after}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500 w-24 shrink-0">Proof Hash</span>
                    <span className="text-slate-400 font-mono break-all text-xs">{p.proof_hash.slice(0, 24)}…</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
