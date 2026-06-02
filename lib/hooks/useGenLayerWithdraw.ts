"use client";
/**
 * useGenLayerWithdraw
 *
 * Withdraw flow — same signTypedData pattern as deposit.
 */

import { useState, useCallback } from "react";
import { useSignTypedData } from "wagmi";

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

const DOMAIN = {
  name: "CredLayer",
  version: "1",
  chainId: 61999,
} as const;

const WITHDRAW_TYPES = {
  WithdrawAuthorization: [
    { name: "pool_id",    type: "string" },
    { name: "pool_name",  type: "string" },
    { name: "amount_gen", type: "uint256" },
    { name: "wallet",     type: "address" },
    { name: "timestamp",  type: "uint256" },
  ],
} as const;

export function useGenLayerWithdraw() {
  const [state, setState] = useState<WithdrawState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const { signTypedDataAsync } = useSignTypedData();

  const withdraw = useCallback(
    async (poolId: string, poolName: string, amountGEN: number, wallet: string) => {
      setState({ status: "awaiting-signature", txHash: "", error: "" });

      try {
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        const signature = await signTypedDataAsync({
          domain: DOMAIN,
          types: WITHDRAW_TYPES,
          primaryType: "WithdrawAuthorization",
          message: {
            pool_id: poolId,
            pool_name: poolName,
            amount_gen: BigInt(amountGEN),
            wallet: wallet as `0x${string}`,
            timestamp,
          },
        });

        setState((s) => ({ ...s, status: "processing" }));

        const res = await fetch("/api/pool/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pool_id: poolId,
            amount_usd: amountGEN,
            wallet,
            signature,
            timestamp: timestamp.toString(),
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(
            typeof data.error === "string" ? data.error : "Withdrawal failed"
          );
        }

        setState({
          status: "success",
          txHash: data.data?.tx_hash || "",
          error: "",
        });
        return data.data?.tx_hash as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Withdrawal failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, withdraw, reset };
}
