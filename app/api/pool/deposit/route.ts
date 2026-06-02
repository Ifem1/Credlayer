import { NextRequest, NextResponse } from "next/server";
import { depositSchema } from "@/lib/validation";
import { depositLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, createNotification, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import { verifyTypedData } from "viem";

const DOMAIN = {
  name: "CredLayer",
  version: "1",
  chainId: 61999,
} as const;

const DEPOSIT_TYPES = {
  DepositAuthorization: [
    { name: "pool_id",    type: "string" },
    { name: "pool_name",  type: "string" },
    { name: "amount_gen", type: "uint256" },
    { name: "wallet",     type: "address" },
    { name: "timestamp",  type: "uint256" },
  ],
} as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pool_id, amount_usd, wallet } = parsed.data;

    // ── Verify wallet signature if provided ───────────────────────────────
    // Signature is required for client-initiated deposits (from PoolCard).
    // It proves the wallet owner authorised this specific deposit.
    if (body.signature && body.timestamp) {
      try {
        // Fetch pool name for verification (falls back gracefully)
        const poolForVerify = await getPool(pool_id).catch(() => null);
        const poolName = poolForVerify?.name ?? "";

        const valid = await verifyTypedData({
          address: wallet as `0x${string}`,
          domain: DOMAIN,
          types: DEPOSIT_TYPES,
          primaryType: "DepositAuthorization",
          message: {
            pool_id,
            pool_name: poolName,
            amount_gen: BigInt(amount_usd),
            wallet: wallet as `0x${string}`,
            timestamp: BigInt(body.timestamp),
          },
          signature: body.signature as `0x${string}`,
        });

        if (!valid) {
          return NextResponse.json(
            { success: false, error: "Invalid wallet signature — deposit not authorised." },
            { status: 403 }
          );
        }

        // Reject signatures older than 5 minutes
        const age = Math.floor(Date.now() / 1000) - Number(body.timestamp);
        if (age > 300) {
          return NextResponse.json(
            { success: false, error: "Signature expired. Please try again." },
            { status: 403 }
          );
        }
      } catch (sigErr) {
        console.warn("Signature verification failed:", sigErr);
        return NextResponse.json(
          { success: false, error: "Signature verification failed." },
          { status: 403 }
        );
      }
    }

    // ── Call GenLayer contract ─────────────────────────────────────────────
    const receipt = await depositLiquidity(pool_id, amount_usd, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    // ── Sync Supabase cache ───────────────────────────────────────────────
    const pool = await getPool(pool_id);
    if (pool) await upsertPool(pool);

    const proofHash = computeProofHash({
      action: "liquidity_deposited",
      pool_id,
      wallet,
      amount: amount_usd,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet,
      action: "liquidity_deposited",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "pre_deposit",
      state_after: `deposited:${amount_usd}_GEN`,
      proof_hash: proofHash,
    });

    await insertTransaction({
      wallet,
      type: "DEPOSIT",
      amount: amount_usd,
      tx_hash: txHash,
      status: "CONFIRMED",
      pool_id,
    });

    await createNotification({
      wallet,
      type: "DEPOSIT_CONFIRMED",
      title: "Deposit Confirmed",
      message: `Your deposit of ${amount_usd} GEN into pool ${pool_id} has been confirmed on GenLayer.`,
    });

    await writeAuditLog({
      wallet,
      action: "deposit_liquidity",
      entity_type: "pool",
      entity_id: pool_id,
      details: { amount_gen: amount_usd, tx_hash: txHash },
    });

    return NextResponse.json({ success: true, data: { pool, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/deposit error:", err);
    const message = err instanceof Error ? err.message : "Failed to deposit";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
