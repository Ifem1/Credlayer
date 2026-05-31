"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, formatPercent } from "@/lib/utils";
import type { Treasury, ProtocolFees } from "@/types";
import { Building2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  treasury: Treasury;
  fees: ProtocolFees;
}

export function TreasuryPanel({ treasury, fees }: Props) {
  const healthRate = treasury.total_deposited > 0
    ? ((treasury.total_deposited - treasury.total_defaults) / treasury.total_deposited) * 100
    : 100;

  const utilization = treasury.total_deposited > 0
    ? (treasury.total_borrowed / treasury.total_deposited) * 100
    : 0;

  const chartData = [
    { label: "Deposited", value: treasury.total_deposited },
    { label: "Borrowed", value: treasury.total_borrowed },
    { label: "Repaid", value: treasury.total_repaid },
    { label: "Defaults", value: treasury.total_defaults },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-400" />
          Protocol Treasury
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Deposited", value: formatUSD(treasury.total_deposited), color: "text-blue-400" },
            { label: "Total Borrowed", value: formatUSD(treasury.total_borrowed), color: "text-orange-400" },
            { label: "Total Repaid", value: formatUSD(treasury.total_repaid), color: "text-emerald-400" },
            { label: "Total Defaults", value: formatUSD(treasury.total_defaults), color: "text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-slate-800/50 p-4 text-center">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Utilization</p>
            <p className="text-lg font-bold text-yellow-400">{formatPercent(utilization)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Health Score</p>
            <p className={`text-lg font-bold ${healthRate > 90 ? "text-emerald-400" : healthRate > 70 ? "text-yellow-400" : "text-red-400"}`}>
              {formatPercent(healthRate)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-800/50 p-3 text-center">
            <p className="text-xs text-slate-400">Fees Collected</p>
            <p className="text-lg font-bold text-purple-400">{formatUSD(fees.total_collected)}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300 mb-3">Treasury Overview</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <XAxis dataKey="label" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
