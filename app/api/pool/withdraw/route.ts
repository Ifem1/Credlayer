export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withdrawSchema } from "@/lib/validation";
import { withdrawLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash, genToWei } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

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

    const { pool_id, amount_usd: amountGEN, wallet } = parsed.data;

    if (body.signature) {
      console.info(`Withdrawal authorised by ${wallet} â€” ${amountGEN} GEN pool ${pool_id}`);
    }

    // Convert GEN â†’ wei; withdraw_liquidity takes amount_wei as an arg
    const amountWei = genToWei(amountGEN);
    const receipt = await withdrawLiquidity(pool_id, amountWei, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    try {
      const pool = await getPool(pool_id);
      if (pool) await upsertPool(pool);
    } catch (syncErr) {
      console.warn("Pool sync failed (non-fatal):", syncErr);
    }

    const proofHash = computeProofHash({
      action: "liquidity_withdrawn", pool_id, wallet,
      amount_gen: amountGEN, amount_wei: amountWei.toString(),
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet, action: "liquidity_withdrawn",
      contract_address: CONTRACT_ADDRESS, tx_hash: txHash,
      state_before: "deposited",
      state_after: `withdrawn:${amountGEN}_GEN`,
      proof_hash: proofHash,
    });

    await insertTransaction({
      wallet, type: "WITHDRAWAL", amount: amountGEN,
      tx_hash: txHash, status: "CONFIRMED", pool_id,
    });

    await writeAuditLog({
      wallet, action: "withdraw_liquidity", entity_type: "pool", entity_id: pool_id,
      details: { amount_gen: amountGEN, amount_wei: amountWei.toString(), tx_hash: txHash },
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/withdraw error:", err);
    const message = err instanceof Error ? err.message : "Failed to withdraw";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

