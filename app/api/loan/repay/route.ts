export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { repayLoanSchema } from "@/lib/validation";
import { repayLoan, getLoan } from "@/lib/genlayer/contract";
import {
  upsertLoan, insertRepayment, insertProof,
  writeAuditLog, createNotification, insertTransaction,
} from "@/lib/supabase/queries";
import { computeProofHash, genToWei } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = repayLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { loan_id, amount_usd: amountGEN, wallet } = parsed.data;

    // repay_loan is payable â€” amount is sent as transaction value (wei)
    const amountWei = genToWei(amountGEN);
    const receipt = await repayLoan(loan_id, amountWei, wallet as `0x${string}`);
    const txHash = receipt?.hash || "pending";

    let glLoan = null;
    try {
      glLoan = await getLoan(loan_id);
      if (glLoan) await upsertLoan(glLoan);
    } catch (syncErr) {
      console.warn("Loan sync failed (non-fatal):", syncErr);
    }

    if (glLoan) {
      const fee = amountGEN * 0.01;
      await insertRepayment(
        {
          loan_id, amount: amountGEN, fee,
          status: glLoan.status === "REPAID" ? "COMPLETED" : "PARTIAL",
          repaid_at: new Date().toISOString(),
        },
        wallet
      );

      const proofHash = computeProofHash({
        action: "repayment", loan_id, wallet,
        amount_gen: amountGEN, amount_wei: amountWei.toString(),
        new_status: glLoan.status,
      });

      await insertProof({
        wallet,
        action: glLoan.status === "REPAID" ? "loan_repaid_full" : "loan_repaid_partial",
        contract_address: CONTRACT_ADDRESS, tx_hash: txHash,
        state_before: "ACTIVE", state_after: glLoan.status,
        proof_hash: proofHash, loan_id,
      });

      if (glLoan.status === "REPAID") {
        await createNotification({
          wallet, type: "LOAN_REPAID", title: "Loan Fully Repaid",
          message: `Congratulations! You have fully repaid loan ${loan_id}. Your credit score has been updated.`,
          loan_id,
        });
      }

      await insertTransaction({
        wallet, type: "LOAN_REPAYMENT", amount: amountGEN,
        tx_hash: txHash, status: "CONFIRMED", loan_id,
      });
    }

    await writeAuditLog({
      wallet, action: "repay_loan", entity_type: "loan", entity_id: loan_id,
      details: { amount_gen: amountGEN, amount_wei: amountWei.toString() },
    });

    return NextResponse.json({ success: true, data: { loan: glLoan, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/loan/repay error:", err);
    return NextResponse.json({ success: false, error: "Failed to repay loan" }, { status: 500 });
  }
}

