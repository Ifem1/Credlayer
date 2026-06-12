"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, formatPercent, cn } from "@/lib/utils";
import type { LiquidityPool } from "@/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

function riskColor(r: string) {
  if (r === "HIGH") return "#FF4D4D";
  if (r === "MEDIUM") return "#FCA311";
  return "#00F5A0";
}

function RiskBadge({ risk }: { risk: string }) {
  const color = riskColor(risk);
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${color}18`, border: `1px solid ${color}`, color, fontFamily: "Manrope", letterSpacing: "0.06em" }}
    >
      {risk}
    </span>
  );
}

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
      <div className="flex justify-center py-32">
        <div className="h-10 w-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "rgba(252,163,17,0.2)", borderTopColor: "#FCA311" }} />
      </div>
    );
  }

  const totalDeposited = pools.reduce((s, p) => s + p.total_deposited, 0);
  const totalBorrowed  = pools.reduce((s, p) => s + p.total_borrowed, 0);
  const totalActiveLoans = pools.reduce((s, p) => s + p.active_loans, 0);
  const globalUtilization = totalDeposited > 0 ? (totalBorrowed / totalDeposited) * 100 : 0;
  const defRate = treasury
    ? ((Number(treasury.total_defaults) / Math.max(Number(treasury.total_borrowed), 1)) * 100)
    : 0;

  const riskMetrics = [
    { label: "Global Utilization", value: formatPercent(globalUtilization), risk: globalUtilization > 85 ? "HIGH" : globalUtilization > 70 ? "MEDIUM" : "LOW" },
    { label: "Default Rate",       value: formatPercent(defRate),            risk: defRate > 5 ? "HIGH" : defRate > 2 ? "MEDIUM" : "LOW" },
    { label: "Active Loans",       value: String(totalActiveLoans),          risk: "LOW" },
    { label: "Total Exposure",     value: formatUSD(totalBorrowed),          risk: "LOW" },
  ];

  const riskDistribution = [
    { name: "LOW",    value: pools.filter((p) => p.risk_tier === "LOW").length,    color: "#00F5A0" },
    { name: "MEDIUM", value: pools.filter((p) => p.risk_tier === "MEDIUM").length, color: "#FCA311" },
    { name: "HIGH",   value: pools.filter((p) => p.risk_tier === "HIGH").length,   color: "#FF4D4D" },
  ].filter((d) => d.value > 0);

  const poolUtilization = pools.map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    utilization: p.total_deposited > 0 ? (p.total_borrowed / p.total_deposited) * 100 : 0,
  }));

  return (
    <div style={{ fontFamily: "Manrope" }}>
      {/* Hero */}
      <section
        className="relative px-4 pt-20 pb-16"
        style={{
          background: "linear-gradient(180deg, rgba(20,33,61,0.5) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(252,163,17,0.1)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(252,163,17,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div
              className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs"
              style={{ background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.3)", color: "#00F5A0", fontWeight: 600, letterSpacing: "0.08em" }}
            >
              ⬡ AI RISK STATUS: OPTIMAL
            </div>
            <h1
              style={{
                fontFamily: "Space Grotesk", fontWeight: 700,
                fontSize: "clamp(32px,4vw,48px)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: 10,
              }}
            >
              Risk Intelligence
            </h1>
            <p style={{ color: "#9ca3af", fontSize: 15, maxWidth: 480, lineHeight: 1.7 }}>
              Real-time cryptographic proof-of-solvency and AI-driven predictive modeling. Monitor protocol health with institutional-grade risk metrics.
            </p>
          </div>
          {/* Protocol Health Score */}
          <div
            className="rounded-lg p-6 text-center shrink-0"
            style={{ background: "#14213D", border: "1px solid rgba(252,163,17,0.2)", minWidth: 180 }}
          >
            <p style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Protocol Health Score</p>
            <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 56, color: "#FCA311", lineHeight: 1 }}>
              {Math.round(100 - defRate * 5 - globalUtilization * 0.1)}
            </p>
            <p style={{ fontSize: 12, color: "#00F5A0", marginTop: 8 }}>↑ Optimal</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 space-y-10">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {riskMetrics.map((m) => (
            <Card key={m.label}>
              <CardContent className="p-5">
                <p style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{m.label}</p>
                <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 28, color: "#FCA311", marginBottom: 8 }}>{m.value}</p>
                <RiskBadge risk={m.risk} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Loan Health Distribution</CardTitle></CardHeader>
            <CardContent>
              {poolUtilization.length === 0 ? (
                <p className="text-center py-8" style={{ color: "#9ca3af" }}>No pool data</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={poolUtilization}>
                    <XAxis dataKey="name" stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <YAxis stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#14213D", border: "1px solid rgba(252,163,17,0.3)", borderRadius: "8px", color: "#fff" }}
                      formatter={(v: number) => [`${v.toFixed(1)}%`, "Utilization"]}
                    />
                    <Bar dataKey="utilization" fill="#FCA311" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pool Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              {riskDistribution.length === 0 ? (
                <p className="text-center py-8" style={{ color: "#9ca3af" }}>No pool data</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={riskDistribution} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90} dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {riskDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "#14213D", border: "1px solid rgba(252,163,17,0.3)", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Pool Risk Details</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(252,163,17,0.15)" }}>
                    {["Pool", "Risk Tier", "Utilization", "Active Loans", "Available", "Borrowed"].map((h) => (
                      <th key={h} className="text-left py-3 pr-4"
                        style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pools.map((p) => {
                    const util = p.total_deposited > 0 ? (p.total_borrowed / p.total_deposited) * 100 : 0;
                    return (
                      <tr key={p.pool_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td className="py-3 pr-4" style={{ color: "#FFFFFF", fontWeight: 500 }}>{p.name}</td>
                        <td className="py-3 pr-4"><RiskBadge risk={p.risk_tier} /></td>
                        <td className="py-3 pr-4" style={{ color: "#E5E5E5" }}>{formatPercent(util)}</td>
                        <td className="py-3 pr-4" style={{ color: "#E5E5E5" }}>{p.active_loans}</td>
                        <td className="py-3 pr-4" style={{ color: "#00F5A0" }}>{formatUSD(p.available_liquidity)}</td>
                        <td className="py-3 pr-4" style={{ color: "#FCA311" }}>{formatUSD(p.total_borrowed)}</td>
                      </tr>
                    );
                  })}
                  {pools.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8" style={{ color: "#9ca3af" }}>No pools found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
