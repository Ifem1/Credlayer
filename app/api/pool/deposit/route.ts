import { NextRequest, NextResponse } from "next/server";
import { depositSchema } from "@/lib/validation";
import { depositLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, createNotification, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";
import { verifyMessage } from "viem";
import { buildDepositMessage } from "@/lib/pool-auth";

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

    // ── Verify wallet signature ────────────────────────────────────────────
    if (body.signature && body.timestamp) {
      try {
        const poolName: string = typeof body.pool_name === "string" ? body.pool_name : "";
        const timestamp: number = Number(body.timestamp);

        // Rebuild the exact message the client signed
        const message = buildDepositMessage(pool_id, poolName, amount_usd, wallet, timestamp);

        const valid = await verifyMessage({
          address: wallet as `0x${string}`,
          message,
          signature: body.signature as `0x${string}`,
        });

        if (!valid) {
          return NextResponse.json(
            { success: false, error: "Invalid wallet signature — deposit not authorised." },
            { status: 403 }
          );
        }

        // Reject signatures older than 5 minutes
        const age = Math.floor(Date.now() / 1000) - timestamp;
        if (age > 300) {
          return NextResponse.json(
            { success: false, error: "Signature expired. Please try again." },
            { status: 403 }
          );
        }
      } catch (sigErr) {
        console.warn("Signature verification error:", sigErr);
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
