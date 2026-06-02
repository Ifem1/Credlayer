"use client";
import { useState, useCallback } from "react";
import { useSignMessage } from "wagmi";
import { buildWithdrawMessage } from "@/lib/pool-auth";

export type WithdrawStatus =
  | "idle"
  | "awaiting-signature"
  | "processing"
  | "success"
  | "error";

interface WithdrawState {
  status: WithdrawStatus;
  txHash: string;
  error: string;
}

export { buildWithdrawMessage };

export function useGenLayerWithdraw() {
  const [state, setState] = useState<WithdrawState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const { signMessageAsync } = useSignMessage();

  const withdraw = useCallback(
    async (poolId: string, poolName: string, amountGEN: number, wallet: string) => {
      setState({ status: "awaiting-signature", txHash: "", error: "" });

      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const message = buildWithdrawMessage(poolId, poolName, amountGEN, wallet, timestamp);

        const signature = await signMessageAsync({ message });

        setState((s) => ({ ...s, status: "processing" }));

        const res = await fetch("/api/pool/withdraw", {
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
            typeof data.error === "string" ? data.error : "Withdrawal failed"
          );
        }

        setState({ status: "success", txHash: data.data?.tx_hash || "", error: "" });
        return data.data?.tx_hash as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    [signMessageAsync]
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, withdraw, reset };
}
