export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createProfileSchema } from "@/lib/validation";
import { createBorrowerProfile } from "@/lib/genlayer/contract";
import { upsertProfile, upsertCreditProfile, insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const receipt = await createBorrowerProfile(data, data.wallet as `0x${string}`);

    await upsertProfile({
      wallet: data.wallet,
      full_name: data.full_name,
      email_hash: data.email_hash,
      country: data.country,
      occupation: data.occupation,
      monthly_income_usd: data.monthly_income_usd,
      loan_purpose: data.loan_purpose,
      kyc_status: "PENDING",
      identity_score: 0,
      active_loans: 0,
      completed_loans: 0,
      defaults: 0,
    });

    await upsertCreditProfile({
      wallet: data.wallet,
      credit_score: 0,
      reputation_score: 0,
      reputation_tier: "Unverified",
      identity_score: 0,
      repayment_score: 0,
      wallet_trust_score: 0,
      income_score: 0,
      governance_score: 0,
      total_borrowed: 0,
      total_repaid: 0,
      active_loan_count: 0,
      fraud_risk: "UNKNOWN",
      last_evaluated: null,
    });

    const proofHash = computeProofHash({
      action: "profile_created",
      wallet: data.wallet,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.wallet,
      action: "profile_created",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: receipt?.hash || "pending",
      state_before: "none",
      state_after: "profile_exists",
      proof_hash: proofHash,
    });

    await createNotification({
      wallet: data.wallet,
      type: "PROFILE_CREATED",
      title: "Profile Created",
      message: "Your CredLayer borrower profile has been created. Complete KYC verification to unlock loans.",
    });

    await writeAuditLog({
      wallet: data.wallet,
      action: "create_profile",
      entity_type: "profile",
      entity_id: data.wallet,
      details: { full_name: data.full_name, country: data.country },
    });

    return NextResponse.json({ success: true, data: { wallet: data.wallet } });
  } catch (err) {
    console.error("POST /api/profile error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

