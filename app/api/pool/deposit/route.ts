import { NextRequest, NextResponse } from "next/server";
import { depositSchema } from "@/lib/validation";
import { depositLiquidity, getPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog, createNotification, insertTransaction } from "@/lib/supabase/queries";
import { computeProofHash, genToWei } from "@/lib/utils";
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

    const { pool_id, amount_usd: amountGEN, wallet } = parsed.data;

    if (body.signature) {
      const poolName: string = typeof body.pool_name === "string" ? body.pool_name : "";
      console.info(`Deposit authorised by ${wallet} — ${amountGEN} GEN pool ${pool_id} "${poolName}"`);
    }

    // Convert GEN → wei for the payable call (deposit_liquidity uses gl.message.value)
    const amountWei = genToWei(amountGEN);
    const receipt = await depositLiquidity(pool_id, amountWei, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    // Sync updated pool state to Supabase
    try {
      const pool = await getPool(pool_id);
      if (pool) await upsertPool(pool);
    } catch (syncErr) {
      console.warn("Pool sync failed (non-fatal):", syncErr);
    }

    const proofHash = computeProofHash({
      action: "liquidity_deposited",
      pool_id, wallet,
      amount_gen: amountGEN,
      amount_wei: amountWei.toString(),
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet, action: "liquidity_deposited",
      contract_address: CONTRACT_ADDRESS, tx_hash: txHash,
      state_before: "pre_deposit",
      state_after: `deposited:${amountGEN}_GEN`,
      proof_hash: proofHash,
    });

    await insertTransaction({
      wallet, type: "DEPOSIT", amount: amountGEN,
      tx_hash: txHash, status: "CONFIRMED", pool_id,
    });

    await createNotification({
      wallet, type: "DEPOSIT_CONFIRMED", title: "Deposit Confirmed",
      message: `Your deposit of ${amountGEN} GEN into pool ${pool_id} has been confirmed on GenLayer.`,
    });

    await writeAuditLog({
      wallet, action: "deposit_liquidity", entity_type: "pool", entity_id: pool_id,
      details: { amount_gen: amountGEN, amount_wei: amountWei.toString(), tx_hash: txHash },
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/pool/deposit error:", err);
    const message = err instanceof Error ? err.message : "Failed to deposit";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
