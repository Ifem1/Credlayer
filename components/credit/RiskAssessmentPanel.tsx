"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, riskLevelColor } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, ShieldX, AlertTriangle } from "lucide-react";
import type { CreditAssessment } from "@/types";

interface Props {
  assessment: CreditAssessment;
}

function RiskIcon({ level }: { level: string }) {
  if (level === "LOW") return <ShieldCheck className="h-5 w-5 text-emerald-400" />;
  if (level === "MEDIUM") return <ShieldAlert className="h-5 w-5 text-yellow-400" />;
  if (level === "HIGH") return <AlertTriangle className="h-5 w-5 text-orange-400" />;
  return <ShieldX className="h-5 w-5 text-red-400" />;
}

export function RiskAssessmentPanel({ assessment }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RiskIcon level={assessment.risk_level} />
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Decision</span>
          <span
            className={cn(
              "text-sm font-bold px-3 py-1 rounded-full",
              assessment.decision === "APPROVE"
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {assessment.decision === "APPROVE" ? "APPROVED" : "REJECTED"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Risk Level</span>
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", riskLevelColor(assessment.risk_level))}>
            {assessment.risk_level}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Confidence</span>
          <span className="text-sm font-semibold text-slate-200">
            {(assessment.confidence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Interest Rate</span>
          <span className="text-sm font-semibold text-slate-200">{assessment.interest_rate}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Collateral Required</span>
          <span className="text-sm font-semibold text-slate-200">
            {assessment.required_collateral_ratio}%
          </span>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-400 mb-2">AI Reasoning</p>
          <p className="text-sm text-slate-300 leading-relaxed">{assessment.reasoning}</p>
        </div>

        {assessment.positive_factors.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Positive Factors</p>
            <ul className="space-y-1">
              {assessment.positive_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-400">
                  <span className="mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assessment.risk_factors.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Risk Factors</p>
            <ul className="space-y-1">
              {assessment.risk_factors.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-orange-400">
                  <span className="mt-0.5">⚠</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
