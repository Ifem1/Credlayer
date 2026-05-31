import { NextRequest, NextResponse } from "next/server";
import { adminCreatePoolSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { createPool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminCreatePoolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const guard = assertOwner(data.owner_wallet);
    if (!guard.ok) {
      return NextResponse.json({ success: false, error: guard.reason }, { status: 403 });
    }

    const receipt = await createPool({
      name: data.name,
      target_return_bps: data.target_return_bps,
      min_credit_score: data.min_credit_score,
      max_loan_amount: data.max_loan_amount,
      risk_tier: data.risk_tier,
    });

    const txHash = receipt?.hash || "pending";
    const returnedPoolId =
      typeof receipt?.return_value === "string" && receipt.return_value
        ? receipt.return_value
        : `pool_pending_${Date.now()}`;

    // Mirror to Supabase index
    try {
      await upsertPool({
        pool_id: returnedPoolId,
        name: data.name,
        target_return_bps: data.target_return_bps,
        min_credit_score: data.min_credit_score,
        max_loan_amount: data.max_loan_amount,
        risk_tier: data.risk_tier,
        status: "ACTIVE",
        total_deposited: 0,
        available_liquidity: 0,
        total_borrowed: 0,
        total_repaid: 0,
        active_loans: 0,
      });
    } catch (cacheErr) {
      console.warn("Pool cache mirror failed (non-fatal):", cacheErr);
    }

    const proofHash = computeProofHash({
      action: "pool_created",
      pool_id: returnedPoolId,
      name: data.name,
      risk_tier: data.risk_tier,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet,
      action: "pool_created",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "no_pool",
      state_after: `pool_active:${returnedPoolId}`,
      proof_hash: proofHash,
    });

    await writeAuditLog({
      wallet: data.owner_wallet,
      action: "admin_create_pool",
      entity_type: "pool",
      entity_id: returnedPoolId,
      details: {
        name: data.name,
        risk_tier: data.risk_tier,
        min_credit_score: data.min_credit_score,
        target_return_bps: data.target_return_bps,
      },
    });

    return NextResponse.json({
      success: true,
      data: { pool_id: returnedPoolId, tx_hash: txHash },
    });
  } catch (err) {
    console.error("POST /api/admin/pool/create error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create pool";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
