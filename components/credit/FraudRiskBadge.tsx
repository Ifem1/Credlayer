import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldX } from "lucide-react";
import type { FraudRisk } from "@/types";

interface Props {
  risk: FraudRisk;
}

const config: Record<FraudRisk, { label: string; className: string; Icon: React.ElementType }> = {
  UNKNOWN: { label: "Unknown", className: "text-slate-400 bg-slate-400/10 border-slate-400/20", Icon: Shield },
  LOW: { label: "Low Fraud Risk", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", Icon: Shield },
  MEDIUM: { label: "Medium Fraud Risk", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", Icon: ShieldAlert },
  HIGH: { label: "High Fraud Risk", className: "text-orange-400 bg-orange-400/10 border-orange-400/20", Icon: ShieldAlert },
  CRITICAL: { label: "Critical Fraud Risk", className: "text-red-400 bg-red-400/10 border-red-400/20", Icon: ShieldX },
};

export function FraudRiskBadge({ risk }: Props) {
  const { label, className, Icon } = config[risk] ?? config.UNKNOWN;
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}
