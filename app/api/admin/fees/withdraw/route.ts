import { NextRequest, NextResponse } from "next/server";
import { adminWithdrawFeesSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { withdrawProtocolFees } from "@/lib/genlayer/contract";
import { insertProof, writeAuditLog } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = adminWithdrawFeesSchema.safeParse(body);
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

    const receipt = await withdrawProtocolFees(data.amount_usd);
    const txHash = receipt?.hash || "pending";

    const proofHash = computeProofHash({
      action: "fees_withdrawn",
      amount: data.amount_usd,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet,
      action: "fees_withdrawn",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "fees_held",
      state_after: `fees_withdrawn:${data.amount_usd}`,
      proof_hash: proofHash,
    });

    await writeAuditLog({
      wallet: data.owner_wallet,
      action: "admin_withdraw_fees",
      entity_type: "treasury",
      entity_id: "protocol_fees",
      details: { amount_usd: data.amount_usd },
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/admin/fees/withdraw error:", err);
    const message = err instanceof Error ? err.message : "Failed to withdraw fees";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
