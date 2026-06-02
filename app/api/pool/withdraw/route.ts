import { NextRequest, NextResponse } from "next/server";
import { withdrawSchema } from "@/lib/validation";
import { withdrawLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import { verifyTypedData } from "viem";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { pool_id, amount_usd, wallet } = parsed.data;

    // ── Verify wallet signature if provided ───────────────────────────────
    if (body.signature && body.timestamp) {
      try {
        const poolForVerify = await getPool(pool_id).catch(() => null);
        const poolName = poolForVerify?.name ?? "";

        const valid = await verifyTypedData({
          address: wallet as `0x${string}`,
          domain: DOMAIN,
          types: WITHDRAW_TYPES,
          primaryType: "WithdrawAuthorization",
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
            { success: false, error: "Invalid wallet signature — withdrawal not authorised." },
            { status: 403 }
          );
        }

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
    const receipt = await withdrawLiquidity(pool_id, amount_usd, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    const pool = await getPool(pool_id);
    if (pool) await upsertPool(pool);

    const proofHash = computeProofHash({
      action: "liquidity_withdrawn",
      pool_id,
      wallet,
      amount: amount_usd,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet,
      action: "liquidity_withdrawn",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "deposited",
      state_after: `withdrawn:${amount_usd}_GEN`,
      proof_hash: proofHash,
    });

    await insertTransaction({
      wallet,
      type: "WITHDRAWAL",
      amount: amount_usd,
      tx_hash: txHash,
      status: "CONFIRMED",
      pool_id,
    });

    await writeAuditLog({
      wallet,
      action: "withdraw_liquidity",
      entity_type: "pool",
      entity_id: pool_id,
      details: { amount_gen: amount_usd, tx_hash: txHash },
    });

    return NextResponse.json({ success: true, data: { pool, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/withdraw error:", err);
    const message = err instanceof Error ? err.message : "Failed to withdraw";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
