export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminClosePoolSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { closePool } from "@/lib/genlayer/contract";
import { upsertPool, insertProof, writeAuditLog } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminClosePoolSchema.safeParse(body);
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

    const receipt = await closePool(data.pool_id);
    const txHash = receipt?.hash || "pending";

    try {
      await upsertPool({
        pool_id: data.pool_id,
        status: "CLOSED",
        closed_at: new Date().toISOString(),
      });
    } catch (cacheErr) {
      console.warn("Pool cache mirror failed (non-fatal):", cacheErr);
    }

    const proofHash = computeProofHash({
      action: "pool_closed",
      pool_id: data.pool_id,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet,
      action: "pool_closed",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "pool_active",
      state_after: "pool_closed",
      proof_hash: proofHash,
    });

    await writeAuditLog({
      wallet: data.owner_wallet,
      action: "admin_close_pool",
      entity_type: "pool",
      entity_id: data.pool_id,
      details: {},
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/admin/pool/close error:", err);
    const message = err instanceof Error ? err.message : "Failed to close pool";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

