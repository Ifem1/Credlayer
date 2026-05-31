import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";
import type { RepaymentRecord } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  repayments: RepaymentRecord[];
}

export function RepaymentTimeline({ repayments }: Props) {
  if (repayments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-500">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No repayments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repayment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-800" />
          <div className="space-y-4">
            {repayments.map((r, i) => (
              <div key={i} className="relative flex gap-4">
                <div className="absolute -left-[1.15rem] mt-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full border-2",
                      r.status === "COMPLETED" ? "bg-emerald-500 border-emerald-500" :
                      r.status === "LATE" ? "bg-orange-500 border-orange-500" :
                      "bg-blue-500 border-blue-500"
                    )}
                  />
                </div>
                <div className="flex-1 rounded-lg bg-slate-800/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">{formatUSD(r.amount)}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        r.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400" :
                        r.status === "LATE" ? "bg-orange-500/20 text-orange-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">{formatDate(r.repaid_at)}</span>
                    {r.fee > 0 && <span className="text-xs text-slate-500">Fee: {formatUSD(r.fee)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
