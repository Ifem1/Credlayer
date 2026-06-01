"use client";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { PoolBoard } from "@/components/pool/PoolBoard";
import { ConnectWalletButton } from "@/components/layout/ConnectWalletButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenLayerProofPanel } from "@/components/dashboard/GenLayerProofPanel";
import { formatUSD, formatPercent } from "@/lib/utils";
import type { LiquidityPool, ProofEntry } from "@/types";
import { TrendingUp, DollarSign, Activity } from "lucide-react";

export default function LenderDashboard() {
  const { address, isConnected } = useAccount();
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [proofs, setProofs] = useState<ProofEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    const [poolRes, proofRes] = await Promise.all([
      fetch("/api/pool/all").then((r) => r.json()),
      address
        ? fetch(`/api/profile/${address}`).then((r) => r.json())
        : Promise.resolve(null),
    ]);
    if (poolRes.success) setPools(poolRes.data);
    if (proofRes?.success) setProofs(proofRes.data.proofs || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Lender Dashboard</h1>
        <p className="text-slate-400 mb-8">Connect a wallet to view your lender dashboard.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  const myPools = address
    ? pools.filter((p) => address in (p.depositors || {}))
    : [];
  const totalDeposited = myPools.reduce(
    (sum, p) => sum + (p.depositors?.[address!] || 0),
    0
  );
  const avgApy =
    myPools.length > 0
      ? myPools.reduce((s, p) => s + p.target_return_bps / 100, 0) / myPools.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Lender Dashboard</h1>
        <p className="text-slate-400">Manage your liquidity positions and monitor performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { icon: DollarSign, label: "Total Deposited", value: formatUSD(totalDeposited), color: "text-blue-400" },
          { icon: TrendingUp, label: "Average APY", value: formatPercent(avgApy), color: "text-emerald-400" },
          { icon: Activity, label: "Active Positions", value: String(myPools.length), color: "text-purple-400" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`rounded-full bg-slate-800 p-3 ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* My Positions */}
          {myPools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myPools.map((pool) => {
                    const myDeposit = pool.depositors?.[address!] || 0;
                    const utilization = pool.total_deposited > 0
                      ? (pool.total_borrowed / pool.total_deposited) * 100
                      : 0;
                    return (
                      <div key={pool.pool_id} className="flex items-center justify-between rounded-lg bg-slate-800/40 p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{pool.name}</p>
                          <p className="text-xs text-slate-500">Utilization: {utilization.toFixed(1)}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-400">{formatUSD(myDeposit)}</p>
                          <p className="text-xs text-emerald-400">{formatPercent(pool.target_return_bps / 100)} APY</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Pools */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Available Pools</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <PoolBoard pools={pools} wallet={address} onSuccess={fetchData} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <GenLayerProofPanel
            proofs={proofs.filter((p) => p.action.includes("liquidity"))}
          />
        </div>
      </div>
    </div>
  );
}
