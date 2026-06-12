export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { loanRequestSchema } from "@/lib/validation";
import { requestLoan, getLoan } from "@/lib/genlayer/contract";
import {
  upsertLoan,
  insertRiskAssessment,
  insertProof,
  writeAuditLog,
  createNotification,
  insertTransaction,
} from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const receipt = await requestLoan(data, data.wallet as `0x${string}`);

    // Wait for GenLayer to finalize, then read the loan back
    const txHash = receipt?.hash || "pending";

    // Extract loan_id from receipt or events (simulator returns it)
    const loanId = (receipt as Record<string, unknown>)?.return_value as string || `loan_pending_${Date.now()}`;

    let glLoan = null;
    if (loanId && !loanId.startsWith("loan_pending")) {
      glLoan = await getLoan(loanId);
    }

    if (glLoan) {
      await upsertLoan(glLoan);

      await insertRiskAssessment({
        wallet: data.wallet,
        loan_id: glLoan.loan_id,
        decision: glLoan.status === "REJECTED" ? "REJECT" : "APPROVE",
        credit_score: glLoan.credit_score,
        risk_level: glLoan.risk_level,
        max_loan_amount: glLoan.max_loan_amount,
        required_collateral_ratio: glLoan.required_collateral_ratio,
        interest_rate: glLoan.interest_rate,
        confidence: glLoan.confidence,
        reasoning: glLoan.reasoning,
        positive_factors: glLoan.positive_factors,
        risk_factors: glLoan.risk_factors,
        fraud_risk: "LOW",
        approval_hash: glLoan.approval_hash,
        evaluated_at: new Date().toISOString(),
      });

      const proofHash = computeProofHash({
        action: "loan_requested",
        loan_id: glLoan.loan_id,
        wallet: data.wallet,
        approval_hash: glLoan.approval_hash,
      });

      await insertProof({
        wallet: data.wallet,
        action: "loan_requested",
        contract_address: CONTRACT_ADDRESS,
        tx_hash: txHash,
        state_before: "no_loan",
        state_after: glLoan.status,
        proof_hash: proofHash,
        loan_id: glLoan.loan_id,
      });

      const notifMsg =
        glLoan.status === "PENDING_APPROVAL"
          ? `Your loan request for $${glLoan.amount_usd} has been approved with a credit score of ${glLoan.credit_score}. Review and accept your offer.`
          : `Your loan request for $${glLoan.amount_usd} was not approved. ${glLoan.reasoning}`;

      await createNotification({
        wallet: data.wallet,
        type: glLoan.status === "PENDING_APPROVAL" ? "LOAN_APPROVED" : "LOAN_REJECTED",
        title: glLoan.status === "PENDING_APPROVAL" ? "Loan Offer Ready" : "Loan Request Rejected",
        message: notifMsg,
        loan_id: glLoan.loan_id,
      });

      await insertTransaction({
        wallet: data.wallet,
        type: "LOAN_REQUEST",
        amount: data.amount_usd,
        tx_hash: txHash,
        status: "CONFIRMED",
        loan_id: glLoan.loan_id,
      });
    }

    await writeAuditLog({
      wallet: data.wallet,
      action: "request_loan",
      entity_type: "loan",
      entity_id: loanId,
      details: { amount: data.amount_usd, loan_type: data.loan_type },
    });

    return NextResponse.json({
      success: true,
      data: { loan_id: loanId, loan: glLoan, tx_hash: txHash },
    });
  } catch (err) {
    console.error("POST /api/loan/request error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to request loan" },
      { status: 500 }
    );
  }
}

