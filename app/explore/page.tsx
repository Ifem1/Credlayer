"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { PoolBoard } from "@/components/pool/PoolBoard";
import type { LiquidityPool } from "@/types";

export default function ExplorePage() {
  const { address } = useAccount();
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [loading, setLoading] = useState(true);

  function loadPools() {
    fetch("/api/pool/all")
      .then((r) => r.json())
      .then((d) => { if (d.success) setPools(d.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPools(); }, []);

  const totalLiquidity = pools.reduce((s, p) => s + p.total_deposited, 0);
  const activeLoans = pools.reduce((s, p) => s + p.active_loans, 0);

  return (
    <div style={{ fontFamily: "Manrope" }}>
      {/* Hero */}
      <section
        className="relative px-4 pt-20 pb-16"
        style={{
          background: "linear-gradient(180deg, rgba(20,33,61,0.4) 0%, transparent 100%)",
          borderBottom: "1px solid rgba(252,163,17,0.1)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(252,163,17,0.07) 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl">
          <p
            style={{
              fontFamily: "Manrope", fontWeight: 600, fontSize: 12,
              color: "#FCA311", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
            }}
          >
            Global Protocol
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1
                style={{
                  fontFamily: "Space Grotesk", fontWeight: 700,
                  fontSize: "clamp(36px,5vw,56px)", color: "#FFFFFF", lineHeight: 1.1, marginBottom: 12,
                }}
              >
                Liquidity Pools
              </h1>
              <p style={{ color: "#9ca3af", maxWidth: 480, lineHeight: 1.7, fontSize: 16 }}>
                Deposit capital and earn yield by funding AI-adjudicated loans. Transparent, decentralised intelligence for modern finance.
              </p>
            </div>
            <div className="flex gap-10 shrink-0">
              {[
                { label: "Active Pools", value: String(pools.length) },
                { label: "Total Liquidity", value: `$${totalLiquidity.toLocaleString()}` },
                { label: "Active Loans", value: String(activeLoans) },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 28, color: "#FCA311", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 6 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pool Board */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className="h-10 w-10 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(252,163,17,0.2)", borderTopColor: "#FCA311" }}
            />
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(252,163,17,0.08)", border: "1px solid rgba(252,163,17,0.2)" }}
            >
              <span style={{ fontSize: 24 }}>⬡</span>
            </div>
            <p style={{ color: "#9ca3af", fontSize: 16 }}>No active pools. Check back soon.</p>
          </div>
        ) : (
          <PoolBoard pools={pools} wallet={address} onSuccess={loadPools} />
        )}
      </section>
    </div>
  );
}
