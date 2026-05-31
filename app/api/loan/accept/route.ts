import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { acceptConditionalOffer, getLoan } from "@/lib/genlayer/contract";
import { upsertLoan, insertProof, createNotification, writeAuditLog } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

const schema = z.object({
  loan_id: z.string().min(1),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { loan_id, wallet } = parsed.data;
    const receipt = await acceptConditionalOffer(loan_id, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    const glLoan = await getLoan(loan_id);
    if (glLoan) {
      await upsertLoan(glLoan);
      const proofHash = computeProofHash({ action: "loan_accepted", loan_id, wallet });
      await insertProof({
        wallet,
        action: "loan_accepted",
        contract_address: CONTRACT_ADDRESS,
        tx_hash: txHash,
        state_before: "PENDING_APPROVAL",
        state_after: "APPROVED",
        proof_hash: proofHash,
        loan_id,
      });
      await createNotification({
        wallet,
        type: "LOAN_ACCEPTED",
        title: "Offer Accepted",
        message: `You have accepted the loan offer for $${glLoan.amount_usd}. Funds will be disbursed shortly.`,
        loan_id,
      });
    }

    await writeAuditLog({ wallet, action: "accept_loan", entity_type: "loan", entity_id: loan_id, details: {} });
    return NextResponse.json({ success: true, data: { loan: glLoan, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/loan/accept error:", err);
    return NextResponse.json({ success: false, error: "Failed to accept loan offer" }, { status: 500 });
  }
}
