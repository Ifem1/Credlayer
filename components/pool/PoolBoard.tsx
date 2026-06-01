"use client";
import { useState } from "react";
import { PoolCard } from "./PoolCard";
import type { LiquidityPool } from "@/types";

interface Props {
  pools: LiquidityPool[];
  wallet?: string;
  onSuccess?: () => void; // bubble up to parent so it can refresh balances
}

export function PoolBoard({ pools, wallet, onSuccess }: Props) {
  const [filter, setFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");

  const filtered = pools.filter(
    (p) => filter === "ALL" || p.risk_tier === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No pools found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((pool) => (
            <PoolCard
              key={pool.pool_id}
              pool={pool}
              wallet={wallet}
              userDeposit={
                wallet ? pool.depositors?.[wallet] ?? 0 : 0
              }
              onSuccess={onSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}
