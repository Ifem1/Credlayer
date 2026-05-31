import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Lock } from "lucide-react";

interface Props {
  ratio: number;
  loanAmount: number;
  collateralProvided: number;
}

export function CollateralRequirementCard({ ratio, loanAmount, collateralProvided }: Props) {
  const required = (loanAmount * ratio) / 100;
  const covered = Math.min(100, (collateralProvided / required) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-yellow-400" />
          Collateral Requirement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-2">
          <span className="text-4xl font-bold text-yellow-400">{ratio}%</span>
          <p className="text-xs text-slate-400 mt-1">of loan amount required</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Required</span>
            <span className="text-slate-200">${required.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Provided</span>
            <span className={collateralProvided >= required ? "text-emerald-400" : "text-orange-400"}>
              ${collateralProvided.toLocaleString()}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Coverage</span>
            <span>{covered.toFixed(0)}%</span>
          </div>
          <Progress
            value={covered}
            barClassName={covered >= 100 ? "bg-emerald-500" : covered >= 70 ? "bg-yellow-500" : "bg-red-500"}
          />
        </div>

        {collateralProvided < required && (
          <p className="text-xs text-orange-400 bg-orange-400/10 rounded-lg p-2">
            ⚠ Collateral shortfall: ${(required - collateralProvided).toFixed(2)} more required
          </p>
        )}
      </CardContent>
    </Card>
  );
}
