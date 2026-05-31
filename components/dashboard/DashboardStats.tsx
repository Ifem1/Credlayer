import { Card, CardContent } from "@/components/ui/card";
import { formatUSD } from "@/lib/utils";
import { TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  icon: React.ElementType;
  iconColor: string;
}

interface Props {
  stats: {
    credit_score: number;
    active_loans: number;
    total_borrowed: number;
    total_repaid: number;
    reputation_tier: string;
    completed_loans: number;
  };
}

export function DashboardStats({ stats }: Props) {
  const items: Stat[] = [
    {
      label: "Credit Score",
      value: String(stats.credit_score),
      icon: TrendingUp,
      iconColor: "text-blue-400",
    },
    {
      label: "Total Borrowed",
      value: formatUSD(stats.total_borrowed),
      icon: DollarSign,
      iconColor: "text-orange-400",
    },
    {
      label: "Active Loans",
      value: String(stats.active_loans),
      icon: Clock,
      iconColor: "text-yellow-400",
    },
    {
      label: "Completed Loans",
      value: String(stats.completed_loans),
      icon: CheckCircle,
      iconColor: "text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-full bg-slate-800 p-2 ${stat.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                {stat.delta && (
                  <p className={`text-xs ${stat.deltaUp ? "text-emerald-400" : "text-red-400"}`}>
                    {stat.deltaUp ? "+" : ""}{stat.delta}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
