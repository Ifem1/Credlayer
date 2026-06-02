"use client";
/**
 * useGenLayerDeposit
 *
 * Deposit flow:
 *  1. Build EIP-712 typed data describing the deposit (pool, amount in GEN, wallet, timestamp)
 *  2. Ask the connected wallet to sign it via signTypedData → MetaMask shows a clear popup
 *  3. Send the signature + params to /api/pool/deposit for server-side verification + GenLayer call
 *
 * This works on any network the user has in MetaMask — no chain-switching needed.
 * The signature is verified server-side via viem's verifyTypedData before any funds move.
 */

import { useState, useCallback } from "react";
import { useSignTypedData } from "wagmi";

export type DepositStatus =
  | "idle"
  | "awaiting-signature"   // MetaMask popup open
  | "processing"           // server calling GenLayer + Supabase
  | "success"
  | "error";

interface DepositState {
  status: DepositStatus;
  txHash: string;
  error: string;
}

// EIP-712 domain for CredLayer
const DOMAIN = {
  name: "CredLayer",
  version: "1",
  chainId: 61999, // GenLayer Studionet
} as const;

// Typed message structure shown in MetaMask
const DEPOSIT_TYPES = {
  DepositAuthorization: [
    { name: "pool_id",    type: "string" },
    { name: "pool_name",  type: "string" },
    { name: "amount_gen", type: "uint256" },
    { name: "wallet",     type: "address" },
    { name: "timestamp",  type: "uint256" },
  ],
} as const;

export function useGenLayerDeposit() {
  const [state, setState] = useState<DepositState>({
    status: "idle",
    txHash: "",
    error: "",
  });

  const { signTypedDataAsync } = useSignTypedData();

  const deposit = useCallback(
    async (poolId: string, poolName: string, amountGEN: number, wallet: string) => {
      setState({ status: "awaiting-signature", txHash: "", error: "" });

      try {
        const timestamp = BigInt(Math.floor(Date.now() / 1000));

        // Step 1: MetaMask popup — user sees pool name, amount in GEN, wallet
        const signature = await signTypedDataAsync({
          domain: DOMAIN,
          types: DEPOSIT_TYPES,
          primaryType: "DepositAuthorization",
          message: {
            pool_id: poolId,
            pool_name: poolName,
            amount_gen: BigInt(amountGEN),
            wallet: wallet as `0x${string}`,
            timestamp,
          },
        });

        // Step 2: Server verifies signature, calls GenLayer, updates Supabase
        setState((s) => ({ ...s, status: "processing" }));

        const res = await fetch("/api/pool/deposit", {
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
            typeof data.error === "string" ? data.error : "Deposit failed"
          );
        }

        setState({
          status: "success",
          txHash: data.data?.tx_hash || "",
          error: "",
        });
        return data.data?.tx_hash as string;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Deposit failed";
        setState({ status: "error", txHash: "", error: message });
        throw err;
      }
    },
    [signTypedDataAsync]
  );

  function reset() {
    setState({ status: "idle", txHash: "", error: "" });
  }

  return { ...state, deposit, reset };
}
