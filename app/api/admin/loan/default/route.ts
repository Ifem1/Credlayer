export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminMarkDefaultSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { markLoanDefault, getLoan } from "@/lib/genlayer/contract";
import { upsertLoan, insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminMarkDefaultSchema.safeParse(body);
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

    const receipt = await markLoanDefault(data.loan_id);
    const txHash = receipt?.hash || "pending";

    try {
      const fresh = await getLoan(data.loan_id);
      if (fresh) {
        await upsertLoan({
          ...fresh,
          status: "DEFAULTED",
          defaulted_at: new Date().toISOString(),
        });

        await createNotification({
          wallet: fresh.borrower,
          type: "LOAN_DEFAULTED",
          title: "Loan Marked as Defaulted",
          message: `Your loan ${data.loan_id} has been marked as defaulted. This affects your reputation score.`,
          loan_id: data.loan_id,
        });
      }
    } catch (cacheErr) {
      console.warn("Loan cache mirror failed (non-fatal):", cacheErr);
    }

    const proofHash = computeProofHash({
      action: "default_recorded",
      loan_id: data.loan_id,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet,
      action: "default_recorded",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "loan_active",
      state_after: "loan_defaulted",
      proof_hash: proofHash,
      loan_id: data.loan_id,
    });

    await writeAuditLog({
      wallet: data.owner_wallet,
      action: "admin_mark_default",
      entity_type: "loan",
      entity_id: data.loan_id,
      details: {},
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/admin/loan/default error:", err);
    const message = err instanceof Error ? err.message : "Failed to mark default";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

