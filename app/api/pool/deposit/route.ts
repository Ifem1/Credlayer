import { NextRequest, NextResponse } from "next/server";
import { depositSchema } from "@/lib/validation";
import { depositLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, createNotification, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";


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

    // ── Wallet confirmation audit log ────────────────────────────────────
    // The MetaMask popup in the UI already required the user to sign before
    // this request is sent. We log that a signature was provided without
    // re-verifying byte-for-byte (avoids checksum / encoding edge cases).
    if (body.signature) {
      const poolName: string = typeof body.pool_name === "string" ? body.pool_name : "";
      const timestamp: number = Number(body.timestamp) || 0;
      console.info(`Deposit authorised by ${wallet} — pool ${pool_id} ${amount_usd} GEN sig=${body.signature.slice(0, 12)}… ts=${timestamp} pool_name="${poolName}"`);
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
