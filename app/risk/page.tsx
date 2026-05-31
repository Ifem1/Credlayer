"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, formatPercent, riskLevelColor, cn } from "@/lib/utils";
import type { LiquidityPool } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart2 } from "lucide-react";

export default function RiskPage() {
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [treasury, setTreasury] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/pool/all").then((r) => r.json()),
      fetch("/api/treasury").then((r) => r.json()),
    ]).then(([poolData, treasuryData]) => {
      if (poolData.success) setPools(poolData.data);
      if (treasuryData.success) setTreasury(treasuryData.data.treasury);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const riskDistribution = [
    { name: "LOW", value: pools.filter((p) => p.risk_tier === "LOW").length, color: "#10b981" },
    { name: "MEDIUM", value: pools.filter((p) => p.risk_tier === "MEDIUM").length, color: "#eab308" },
    { name: "HIGH", value: pools.filter((p) => p.risk_tier === "HIGH").length, color: "#f97316" },
  ].filter((d) => d.value > 0);

  const poolUtilization = pools.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    utilization: p.total_deposited > 0 ? ((p.total_borrowed / p.total_deposited) * 100) : 0,
    available: p.available_liquidity,
    borrowed: p.total_borrowed,
  }));

  const totalDeposited = pools.reduce((s, p) => s + p.total_deposited, 0);
  const totalBorrowed = pools.reduce((s, p) => s + p.total_borrowed, 0);
  const totalActiveLoans = pools.reduce((s, p) => s + p.active_loans, 0);
  const globalUtilization = totalDeposited > 0 ? (totalBorrowed / totalDeposited) * 100 : 0;

  const defRate = treasury
    ? ((Number(treasury.total_defaults) / Math.max(Number(treasury.total_borrowed), 1)) * 100)
    : 0;

  const riskMetrics = [
    { label: "Global Utilization", value: formatPercent(globalUtilization), risk: globalUtilization > 85 ? "HIGH" : globalUtilization > 70 ? "MEDIUM" : "LOW" },
    { label: "Default Rate", value: formatPercent(defRate), risk: defRate > 5 ? "HIGH" : defRate > 2 ? "MEDIUM" : "LOW" },
    { label: "Active Loans", value: String(totalActiveLoans), risk: "LOW" },
    { label: "Total Exposure", value: formatUSD(totalBorrowed), risk: "LOW" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1 flex items-center gap-3">
          <BarChart2 className="h-6 w-6 text-blue-400" />
          Risk Analytics
        </h1>
        <p className="text-slate-400">Protocol-level risk overview across all liquidity pools.</p>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {riskMetrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-slate-100">{m.value}</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-full mt-1 inline-block", riskLevelColor(m.risk))}>
                {m.risk}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Pool Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Utilization (%)</CardTitle>
          </CardHeader>
          <CardContent>
            {poolUtilization.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No pool data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={poolUtilization}>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#f1f5f9" }}
                    formatter={(v: number) => [`${v.toFixed(1)}%`, "Utilization"]}
                  />
                  <Bar dataKey="utilization" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {riskDistribution.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No pool data</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-pool risk table */}
      <Card>
        <CardHeader>
          <CardTitle>Pool Risk Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Pool", "Risk Tier", "Utilization", "Active Loans", "Available", "Borrowed"].map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pools.map((p) => {
                  const util = p.total_deposited > 0
                    ? ((p.total_borrowed / p.total_deposited) * 100)
                    : 0;
                  return (
                    <tr key={p.pool_id} className="border-b border-slate-800/50">
                      <td className="py-3 pr-4 text-slate-200 font-medium">{p.name}</td>
                      <td className="py-3 pr-4">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", riskLevelColor(p.risk_tier))}>
                          {p.risk_tier}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{formatPercent(util)}</td>
                      <td className="py-3 pr-4 text-slate-300">{p.active_loans}</td>
                      <td className="py-3 pr-4 text-emerald-400">{formatUSD(p.available_liquidity)}</td>
                      <td className="py-3 pr-4 text-orange-400">{formatUSD(p.total_borrowed)}</td>
                    </tr>
                  );
                })}
                {pools.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">No pools found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
