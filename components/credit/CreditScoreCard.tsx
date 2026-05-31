"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, creditScoreColor } from "@/lib/utils";

interface Props {
  score: number;
  tier: string;
  confidence?: number;
  riskLevel?: string;
}

function CreditScoreArc({ score }: { score: number }) {
  const normalized = Math.max(300, Math.min(850, score));
  const pct = ((normalized - 300) / 550) * 100;
  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80 ? "#10b981" : pct >= 60 ? "#3b82f6" : pct >= 40 ? "#eab308" : pct >= 20 ? "#f97316" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90" className="overflow-visible">
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 80 A 60 60 0 0 1 140 80"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="mt-[-20px] text-center">
        <span className={cn("text-4xl font-bold tabular-nums", creditScoreColor(score))}>{score}</span>
        <p className="text-xs text-slate-500 mt-1">out of 850</p>
      </div>
    </div>
  );
}

export function CreditScoreCard({ score, tier, confidence, riskLevel }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <CreditScoreArc score={score} />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Tier:</span>
          <span className="text-sm font-semibold text-slate-100">{tier}</span>
        </div>
        {riskLevel && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Risk Level:</span>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                riskLevel === "LOW" ? "bg-emerald-500/20 text-emerald-400" :
                riskLevel === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400" :
                riskLevel === "HIGH" ? "bg-orange-500/20 text-orange-400" :
                "bg-red-500/20 text-red-400"
              )}
            >
              {riskLevel}
            </span>
          </div>
        )}
        {confidence !== undefined && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Confidence</span>
              <span>{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 w-full text-center text-xs">
          <div>
            <p className="text-slate-500">Poor</p>
            <p className="text-slate-400">300–579</p>
          </div>
          <div>
            <p className="text-slate-500">Fair</p>
            <p className="text-slate-400">580–669</p>
          </div>
          <div>
            <p className="text-slate-500">Good</p>
            <p className="text-slate-400">670–850</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
