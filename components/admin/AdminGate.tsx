"use client";
import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ShieldAlert, Lock } from "lucide-react";
import { ConnectWalletButton } from "@/components/layout/ConnectWalletButton";
import { Card, CardContent } from "@/components/ui/card";

const OWNER = (process.env.NEXT_PUBLIC_OWNER_ADDRESS || "").toLowerCase();

export function AdminGate({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Lock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-100 mb-3">Owner Access Required</h1>
        <p className="text-slate-400 mb-8">
          Connect the contract owner wallet to access the admin dashboard.
        </p>
        <ConnectWalletButton />
      </div>
    );
  }

  const isOwner = !!address && address.toLowerCase() === OWNER;

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied</h1>
            <p className="text-slate-400 mb-6">
              This dashboard is reserved for the CredLayer contract owner.
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4 text-left">
              <p className="text-xs text-slate-500 mb-1">Connected wallet</p>
              <p className="font-mono text-sm text-red-400 mb-3 break-all">{address}</p>
              <p className="text-xs text-slate-500 mb-1">Expected owner</p>
              <p className="font-mono text-sm text-emerald-400 break-all">{OWNER || "(not configured)"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
