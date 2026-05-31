"use client";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { ShieldCheck, RefreshCw, Server, TrendingUp, Users } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminGate";
import { CreatePoolForm } from "@/components/admin/CreatePoolForm";
import { PoolManagementPanel } from "@/components/admin/PoolManagementPanel";
import { PendingLoansPanel } from "@/components/admin/PendingLoansPanel";
import { ProtocolFeesPanel } from "@/components/admin/ProtocolFeesPanel";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSD, shortenAddress } from "@/lib/utils";
import type { LiquidityPool, Loan, ProtocolFees, Treasury } from "@/types";

interface TreasuryEnvelope {
  treasury: Treasury;
  protocol_fees: ProtocolFees;
  pools_summary: {
    total_pools: number;
    active_pools: number;
    total_liquidity: number;
    utilization_rate: number;
  };
}

function AdminDashboard() {
  const { address } = useAccount();
  const ownerWallet = address!;

  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [envelope, setEnvelope] = useState<TreasuryEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [poolsRes, treasuryRes, loansRes] = await Promise.all([
        fetch("/api/pool/all").then((r) => r.json()),
        fetch("/api/treasury").then((r) => r.json()),
        fetch(
          `/api/admin/loans?owner_wallet=${ownerWallet}&status=PENDING_APPROVAL,APPROVED,ACTIVE`
        ).then((r) => r.json()),
      ]);
      if (poolsRes.success) setPools(poolsRes.data);
      if (treasuryRes.success) setEnvelope(treasuryRes.data);
      if (loansRes.success) setLoans(loansRes.data);
    } catch (err) {
      console.error("Admin data load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ownerWallet]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalLiquidity = envelope?.pools_summary.total_liquidity ?? 0;
  const activePools = envelope?.pools_summary.active_pools ?? 0;
  const utilization = envelope?.pools_summary.utilization_rate ?? 0;
  const totalDeposited = Number(envelope?.treasury.total_deposited ?? 0);
  const totalBorrowed = Number(envelope?.treasury.total_borrowed ?? 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
          <ShieldCheck className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CredLayer Admin</h1>
          <p className="text-sm text-slate-400">
            Owner control panel — connected as{" "}
            <span className="font-mono text-emerald-400">{shortenAddress(ownerWallet)}</span>
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={refreshing}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Server className="h-4 w-4 text-blue-400" />}
          label="Active Pools"
          value={String(activePools)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          label="Total Liquidity"
          value={formatUSD(totalLiquidity)}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-purple-400" />}
          label="Loans In Queue"
          value={String(loans.length)}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-yellow-400" />}
          label="Utilization"
          value={`${utilization.toFixed(1)}%`}
        />
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CreatePoolForm ownerWallet={ownerWallet} onCreated={loadData} />
          <PoolManagementPanel
            pools={pools}
            ownerWallet={ownerWallet}
            onChanged={loadData}
          />
          <PendingLoansPanel
            loans={loans}
            pools={pools}
            ownerWallet={ownerWallet}
            onChanged={loadData}
          />
        </div>
        <div className="space-y-6">
          <ProtocolFeesPanel
            fees={envelope?.protocol_fees ?? null}
            ownerWallet={ownerWallet}
            onChanged={loadData}
          />
          <Card>
            <CardContent className="p-4 space-y-3 text-sm">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                Treasury Snapshot
              </p>
              <Row label="Total Deposited" value={formatUSD(totalDeposited)} />
              <Row label="Total Borrowed" value={formatUSD(totalBorrowed)} />
              <Row
                label="Total Defaults"
                value={formatUSD(Number(envelope?.treasury.total_defaults ?? 0))}
              />
              <Row
                label="Reserve Ratio"
                value={`${envelope?.treasury.reserve_ratio ?? 0}%`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-300 text-sm">Owner-Only Actions</p>
              <ul className="space-y-1 pl-4 list-disc marker:text-slate-700">
                <li>Create new liquidity pools</li>
                <li>Activate approved loans against pools</li>
                <li>Mark active loans as defaulted</li>
                <li>Close empty pools</li>
                <li>Withdraw protocol fees</li>
              </ul>
              <p className="pt-2 text-slate-600">
                All actions are signed with the contract owner&apos;s key and recorded
                in the GenLayer proof trail.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <p className="text-xs text-slate-400">{label}</p>
        </div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 font-medium">{value}</span>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboard />
    </AdminGate>
  );
}
