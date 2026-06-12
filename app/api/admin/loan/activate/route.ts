export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminActivateLoanSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { activateLoan, getLoan } from "@/lib/genlayer/contract";
import { upsertLoan, insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminActivateLoanSchema.safeParse(body);
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

    const receipt = await activateLoan(data.loan_id, data.pool_id);
    const txHash = receipt?.hash || "pending";

    // Refresh loan from GenLayer and mirror to Supabase
    try {
      const fresh = await getLoan(data.loan_id);
      if (fresh) {
        await upsertLoan({
          ...fresh,
          status: "ACTIVE",
          pool_id: data.pool_id,
          activated_at: fresh.activated_at || new Date().toISOString(),
        });

        await createNotification({
          wallet: fresh.borrower,
          type: "LOAN_ACTIVATED",
          title: "Loan Activated",
          message: `Your loan ${data.loan_id} is now active. Funds have been drawn from pool ${data.pool_id}.`,
          loan_id: data.loan_id,
        });
      }
    } catch (cacheErr) {
      console.warn("Loan cache mirror failed (non-fatal):", cacheErr);
    }

    const proofHash = computeProofHash({
      action: "loan_activated",
      loan_id: data.loan_id,
      pool_id: data.pool_id,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet,
      action: "loan_activated",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "loan_approved",
      state_after: "loan_active",
      proof_hash: proofHash,
      loan_id: data.loan_id,
    });

    await writeAuditLog({
      wallet: data.owner_wallet,
      action: "admin_activate_loan",
      entity_type: "loan",
      entity_id: data.loan_id,
      details: { pool_id: data.pool_id },
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/admin/loan/activate error:", err);
    const message = err instanceof Error ? err.message : "Failed to activate loan";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

