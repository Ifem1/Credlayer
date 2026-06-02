"use client";
/**
 * useGenLayerDeposit
 *
 * 1. Builds a human-readable message describing the deposit
 * 2. Calls useSignMessage → MetaMask shows a clear popup with the full text
 * 3. POSTs signature + params to /api/pool/deposit
 *    Server verifies the signature then calls GenLayer + syncs Supabase
 */

import { useState, useCallback } from "react";
import { useSignMessage } from "wagmi";
import { buildDepositMessage } from "@/lib/pool-auth";

export type DepositStatus =
  | "idle"
  | "awaiting-signature"
  | "processing"
  | "success"
  | "error";

interface DepositState {
  status: DepositStatus;
  txHash: string;
  error: string;
}

export { buildDepositMessage };

export function useGenLayerDeposit() {
  const [state, setState] = useState<DepositState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const { signMessageAsync } = useSignMessage();

  const deposit = useCallback(
    async (poolId: string, poolName: string, amountGEN: number, wallet: string) => {
      setState({ status: "awaiting-signature", txHash: "", error: "" });

      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const message = buildDepositMessage(poolId, poolName, amountGEN, wallet, timestamp);

        // MetaMask popup — user sees the full message text
        const signature = await signMessageAsync({ message });

        setState((s) => ({ ...s, status: "processing" }));

        const res = await fetch("/api/pool/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pool_id: poolId,
            pool_name: poolName,
            amount_usd: amountGEN,
            wallet,
            signature,
            timestamp,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Deposit failed"
          );
        }

        setState({ status: "success", txHash: data.data?.tx_hash || "", error: "" });
        return data.data?.tx_hash as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    [signMessageAsync]
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, deposit, reset };
}
