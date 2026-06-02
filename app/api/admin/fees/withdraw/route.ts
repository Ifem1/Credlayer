import { NextRequest, NextResponse } from "next/server";
import { adminWithdrawFeesSchema } from "@/lib/validation";
import { assertOwner } from "@/lib/admin-guard";
import { withdrawProtocolFees } from "@/lib/genlayer/contract";
import { insertProof, writeAuditLog } from "@/lib/supabase/queries";
import { computeProofHash, genToWei } from "@/lib/utils";
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

    const amountWei = genToWei(data.amount_gen);
    const receipt = await withdrawProtocolFees(amountWei, data.recipient);
    const txHash = receipt?.hash || "pending";

    const proofHash = computeProofHash({
      action: "fees_withdrawn",
      amount_gen: data.amount_gen,
      amount_wei: amountWei.toString(),
      recipient: data.recipient,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.owner_wallet, action: "fees_withdrawn",
      contract_address: CONTRACT_ADDRESS, tx_hash: txHash,
      state_before: "fees_held",
      state_after: `fees_withdrawn:${data.amount_gen}_GEN_to_${data.recipient}`,
      proof_hash: proofHash,
    });

    await writeAuditLog({
      wallet: data.owner_wallet, action: "admin_withdraw_fees",
      entity_type: "treasury", entity_id: "protocol_fees",
      details: {
        amount_gen: data.amount_gen,
        amount_wei: amountWei.toString(),
        recipient: data.recipient,
      },
    });

    return NextResponse.json({ success: true, data: { tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/admin/fees/withdraw error:", err);
    const message = err instanceof Error ? err.message : "Failed to withdraw fees";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
