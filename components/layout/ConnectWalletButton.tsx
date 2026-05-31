"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-slate-200 font-mono">{shortenAddress(address)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          title="Disconnect"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
        </Button>
      </div>
    );
  }

  const injected = connectors.find((c) => c.id === "injected" || c.id === "metaMask");

  return (
    <Button
      onClick={() => injected && connect({ connector: injected })}
      loading={isPending}
      size="sm"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
