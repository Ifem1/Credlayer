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
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { pool_id, amount_usd, wallet } = parsed.data;
    const receipt = await depositLiquidity(pool_id, amount_usd, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    const pool = await getPool(pool_id);
    if (pool) {
      await upsertPool(pool);
    }

    const proofHash = computeProofHash({ action: "deposit", pool_id, wallet, amount: amount_usd });
    await insertProof({
      wallet,
      action: "liquidity_deposited",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "pre_deposit",
      state_after: "deposited",
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
      message: `Your deposit of $${amount_usd} to pool ${pool_id} has been confirmed.`,
    });

    await writeAuditLog({ wallet, action: "deposit_liquidity", entity_type: "pool", entity_id: pool_id, details: { amount: amount_usd } });
    return NextResponse.json({ success: true, data: { pool, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/deposit error:", err);
    return NextResponse.json({ success: false, error: "Failed to deposit" }, { status: 500 });
  }
}
