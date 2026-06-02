"use client";
/**
 * useGenLayerDeposit
 *
 * Handles the full client-side deposit flow:
 *  1. Prompt MetaMask to add the GenLayer Studionet network (if not already added)
 *  2. Switch MetaMask to GenLayer Studionet (chain 61999)
 *  3. Call deposit_liquidity on the contract — MetaMask shows a real tx confirmation
 *  4. Wait for GenLayer consensus receipt
 *  5. Sync the new pool state to Supabase via /api/pool/deposit/sync
 */

import { useState, useCallback } from "react";
import { GENLAYER_CHAIN_PARAMS } from "@/lib/wagmi/config";

export type DepositStatus =
  | "idle"
  | "adding-network"
  | "switching-network"
  | "awaiting-confirmation"   // MetaMask popup open
  | "pending-consensus"       // tx submitted, waiting for GenLayer validators
  | "syncing"                 // updating Supabase
  | "success"
  | "error";

interface DepositState {
  status: DepositStatus;
  txHash: string;
  error: string;
}

const CA = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

async function ensureGenLayerNetwork() {
  const ethereum = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error("No wallet found. Please install MetaMask.");

  try {
    // Try adding the network — MetaMask silently no-ops if it already exists
    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [GENLAYER_CHAIN_PARAMS],
    });
  } catch {
    // Fallback: try switching directly (works if network was already added)
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_PARAMS.chainId }],
    });
  }
}

export function useGenLayerDeposit() {
  const [state, setState] = useState<DepositState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const deposit = useCallback(
    async (poolId: string, amountGEN: number, wallet: string) => {
      setState({ status: "adding-network", txHash: "", error: "" });

      try {
        // ── Step 1: Ensure GenLayer network is in MetaMask ──────────────────
        setState((s) => ({ ...s, status: "adding-network" }));
        await ensureGenLayerNetwork();

        // ── Step 2: Switch to GenLayer network ──────────────────────────────
        setState((s) => ({ ...s, status: "switching-network" }));
        // (ensureGenLayerNetwork already switches; this is a safety wait)
        await new Promise((r) => setTimeout(r, 300));

        // ── Step 3: Create browser-side GenLayer client ─────────────────────
        // When `account` is a plain address string (not an Account object),
        // genlayer-js auto-routes eth_sendTransaction through window.ethereum,
        // which triggers the MetaMask confirmation popup.
        setState((s) => ({ ...s, status: "awaiting-confirmation" }));

        const { createClient, chains } = await import("genlayer-js");
        const glClient = createClient({
          chain: chains.studionet,
          endpoint: "https://studio.genlayer.com/api",
          account: wallet as `0x${string}`,
        });

        // This triggers the MetaMask confirmation popup
        const hash = await (glClient as unknown as {
          writeContract: (p: {
            address: `0x${string}`;
            functionName: string;
            args: unknown[];
          }) => Promise<string>;
        }).writeContract({
          address: CA,
          functionName: "deposit_liquidity",
          args: [poolId, amountGEN],
        });

        setState((s) => ({ ...s, status: "pending-consensus", txHash: hash }));

        // ── Step 4: Wait for GenLayer validator consensus ────────────────────
        await (glClient as unknown as {
          waitForTransactionReceipt: (p: { hash: string; retries?: number }) => Promise<unknown>;
        }).waitForTransactionReceipt({ hash, retries: 25 });

        // ── Step 5: Sync updated pool state to Supabase ──────────────────────
        setState((s) => ({ ...s, status: "syncing" }));
        const syncRes = await fetch("/api/pool/deposit/sync", {
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
          err instanceof Error ? err.message : "Deposit failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    []
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, deposit, reset };
}
