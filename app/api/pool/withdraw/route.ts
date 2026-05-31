import { NextRequest, NextResponse } from "next/server";
import { withdrawSchema } from "@/lib/validation";
import { withdrawLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { pool_id, amount_usd, wallet } = parsed.data;
    const receipt = await withdrawLiquidity(pool_id, amount_usd, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    const pool = await getPool(pool_id);
    if (pool) await upsertPool(pool);

    const proofHash = computeProofHash({ action: "withdraw", pool_id, wallet, amount: amount_usd });
    await insertProof({
      wallet,
      action: "liquidity_withdrawn",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "deposited",
      state_after: "withdrawn",
      proof_hash: proofHash,
    });

    await insertTransaction({ wallet, type: "WITHDRAWAL", amount: amount_usd, tx_hash: txHash, status: "CONFIRMED", pool_id });
    await writeAuditLog({ wallet, action: "withdraw_liquidity", entity_type: "pool", entity_id: pool_id, details: { amount: amount_usd } });
    return NextResponse.json({ success: true, data: { pool, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/withdraw error:", err);
    return NextResponse.json({ success: false, error: "Failed to withdraw" }, { status: 500 });
  }
}
