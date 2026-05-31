import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReputationBadge } from "@/components/credit/ReputationBadge";
import { FraudRiskBadge } from "@/components/credit/FraudRiskBadge";
import { shortenAddress, formatDate, formatUSD } from "@/lib/utils";
import type { BorrowerProfile, CreditProfile } from "@/types";
import { User, CheckCircle, Clock } from "lucide-react";

interface Props {
  profile: BorrowerProfile;
  creditProfile: CreditProfile;
}

export function BorrowerProfileCard({ profile, creditProfile }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Borrower Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-slate-100">{profile.full_name}</p>
            <p className="text-sm text-slate-400 font-mono">{shortenAddress(profile.wallet)}</p>
            <p className="text-sm text-slate-400 mt-1">{profile.occupation} · {profile.country}</p>
          </div>
          <div
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              profile.kyc_status === "VERIFIED"
                ? "bg-emerald-500/20 text-emerald-400"
                : profile.kyc_status === "UNDER_REVIEW"
                ? "bg-yellow-500/20 text-yellow-400"
                : profile.kyc_status === "REJECTED"
                ? "bg-red-500/20 text-red-400"
                : "bg-slate-500/20 text-slate-400"
            }`}
          >
            {profile.kyc_status === "VERIFIED" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            KYC {profile.kyc_status}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ReputationBadge tier={creditProfile.reputation_tier} score={creditProfile.reputation_score} />
          <FraudRiskBadge risk={creditProfile.fraud_risk} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Monthly Income", value: formatUSD(profile.monthly_income_usd) },
            { label: "Completed Loans", value: String(profile.completed_loans) },
            { label: "Defaults", value: String(profile.defaults) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-slate-800/50 p-2">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Identity Score</span>
            <span className="text-slate-200">{creditProfile.identity_score}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Wallet Trust</span>
            <span className="text-slate-200">{creditProfile.wallet_trust_score}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Repayment Score</span>
            <span className="text-slate-200">{creditProfile.repayment_score}/100</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">Member since {formatDate(profile.created_at)}</p>
      </CardContent>
    </Card>
  );
}
