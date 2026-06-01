"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { PoolBoard } from "@/components/pool/PoolBoard";
import type { LiquidityPool } from "@/types";
import { Layers } from "lucide-react";

export default function ExplorePage() {
  const { address } = useAccount();
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [loading, setLoading] = useState(true);

  function loadPools() {
    fetch("/api/pool/all")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPools(d.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadPools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
            <Layers className="h-7 w-7 text-blue-400" />
            Liquidity Pools
          </h1>
          <p className="text-slate-400">
            Deposit capital and earn yield by funding AI-adjudicated loans.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-400">{pools.length}</p>
            <p className="text-xs text-slate-500">Active Pools</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">
              ${pools.reduce((s, p) => s + p.total_deposited, 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Total Liquidity</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-400">
              {pools.reduce((s, p) => s + p.active_loans, 0)}
            </p>
            <p className="text-xs text-slate-500">Active Loans</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : pools.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No active pools. Check back soon.</p>
        </div>
      ) : (
        <PoolBoard pools={pools} wallet={address} onSuccess={loadPools} />
      )}
    </div>
  );
}
