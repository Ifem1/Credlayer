"use client";
import { useEffect, useState } from "react";
import { TreasuryPanel } from "@/components/dashboard/TreasuryPanel";
import type { Treasury, ProtocolFees } from "@/types";

export default function TreasuryPage() {
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [fees, setFees] = useState<ProtocolFees | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/treasury")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTreasury(d.data.treasury);
          setFees(d.data.protocol_fees);
        }
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

  if (!treasury || !fees) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center text-slate-500">
        Unable to load treasury data. Ensure GenLayer is running.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Protocol Treasury</h1>
        <p className="text-slate-400">Real-time treasury metrics from GenLayer (source of truth).</p>
      </div>
      <TreasuryPanel treasury={treasury} fees={fees} />
    </div>
  );
}
