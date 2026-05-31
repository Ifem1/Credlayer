import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent, interestLabel } from "@/lib/utils";
import { TrendingDown } from "lucide-react";

interface Props {
  rate: number;
  duration_days: number;
  amount: number;
}

export function InterestRateCard({ rate, duration_days, amount }: Props) {
  const totalInterest = amount * (rate / 100) * (duration_days / 365);
  const totalOwed = amount + totalInterest;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-blue-400" />
          Interest Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-2">
          <span className="text-4xl font-bold text-blue-400">{formatPercent(rate)}</span>
          <p className="text-xs text-slate-400 mt-1">Annual Percentage Rate</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Rating</p>
            <p className="text-sm font-semibold text-slate-200 mt-1">{interestLabel(rate)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Duration</p>
            <p className="text-sm font-semibold text-slate-200 mt-1">{duration_days}d</p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Principal</span>
            <span className="text-slate-200">${amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Interest</span>
            <span className="text-orange-400">+${totalInterest.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-300">Total Owed</span>
            <span className="text-slate-100">${totalOwed.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
