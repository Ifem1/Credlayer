"use client";
/**
 * useGenLayerWithdraw
 * Same flow as deposit but calls withdraw_liquidity.
 */

import { useState, useCallback } from "react";
import { GENLAYER_CHAIN_PARAMS } from "@/lib/wagmi/config";

export type WithdrawStatus =
  | "idle"
  | "adding-network"
  | "switching-network"
  | "awaiting-confirmation"
  | "pending-consensus"
  | "syncing"
  | "success"
  | "error";

interface WithdrawState {
  status: WithdrawStatus;
  txHash: string;
  error: string;
}

const CA = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

async function ensureGenLayerNetwork() {
  const ethereum = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error("No wallet found. Please install MetaMask.");
  try {
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [GENLAYER_CHAIN_PARAMS],
    });
  } catch {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_PARAMS.chainId }],
    });
  }
}

export function useGenLayerWithdraw() {
  const [state, setState] = useState<WithdrawState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const withdraw = useCallback(
    async (poolId: string, amountGEN: number, wallet: string) => {
      setState({ status: "adding-network", txHash: "", error: "" });

      try {
        setState((s) => ({ ...s, status: "adding-network" }));
        await ensureGenLayerNetwork();

        setState((s) => ({ ...s, status: "switching-network" }));
        await new Promise((r) => setTimeout(r, 300));

        setState((s) => ({ ...s, status: "awaiting-confirmation" }));

        const { createClient, chains } = await import("genlayer-js");
        const glClient = createClient({
          chain: chains.studionet,
          endpoint: "https://studio.genlayer.com/api",
          account: wallet as `0x${string}`,
        });

        const hash = await (glClient as unknown as {
          writeContract: (p: {
            address: `0x${string}`;
            functionName: string;
            args: unknown[];
          }) => Promise<string>;
        }).writeContract({
          address: CA,
          functionName: "withdraw_liquidity",
          args: [poolId, amountGEN],
        });

        setState((s) => ({ ...s, status: "pending-consensus", txHash: hash }));

        await (glClient as unknown as {
          waitForTransactionReceipt: (p: { hash: string; retries?: number }) => Promise<unknown>;
        }).waitForTransactionReceipt({ hash, retries: 25 });

        setState((s) => ({ ...s, status: "syncing" }));
        const syncRes = await fetch("/api/pool/withdraw/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pool_id: poolId,
            amount_usd: amountGEN,
            wallet,
            tx_hash: hash,
          }),
        });
        const syncData = await syncRes.json();
        if (!syncData.success) {
          console.warn("Supabase sync failed (non-fatal):", syncData.error);
        }

        setState((s) => ({ ...s, status: "success" }));
        return hash;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Withdrawal failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    []
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, withdraw, reset };
}
