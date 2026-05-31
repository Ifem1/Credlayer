import { NextRequest, NextResponse } from "next/server";
import { identityVerificationSchema } from "@/lib/validation";
import { submitIdentityVerification, getBorrower, getCreditProfile } from "@/lib/genlayer/contract";
import { upsertProfile, upsertCreditProfile, insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = identityVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { document_type, document_hash, selfie_hash, proof_of_address_hash, wallet } = parsed.data;

    const receipt = await submitIdentityVerification(
      document_type,
      document_hash,
      selfie_hash,
      proof_of_address_hash,
      wallet as `0x${string}`
    );
    const txHash = receipt?.hash || "pending";

    // Re-read from GenLayer (source of truth)
    const [borrower, creditProfile] = await Promise.all([
      getBorrower(wallet),
      getCreditProfile(wallet),
    ]);

    if (borrower) await upsertProfile(borrower);
    if (creditProfile) await upsertCreditProfile(creditProfile);

    const proofHash = computeProofHash({
      action: "identity_verified",
      wallet,
      document_type,
      document_hash,
    });

    await insertProof({
      wallet,
      action: "identity_verified",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "kyc_pending",
      state_after: borrower?.kyc_status || "UNDER_REVIEW",
      proof_hash: proofHash,
    });

    const statusMsg = borrower?.kyc_status === "VERIFIED"
      ? "Identity verified successfully. You can now apply for loans."
      : "Your identity documents have been submitted for review.";

    await createNotification({
      wallet,
      type: "KYC_SUBMITTED",
      title: "Identity Verification Submitted",
      message: statusMsg,
    });

    await writeAuditLog({
      wallet,
      action: "submit_identity",
      entity_type: "profile",
      entity_id: wallet,
      details: { document_type, kyc_status: borrower?.kyc_status },
    });

    return NextResponse.json({ success: true, data: { borrower, credit_profile: creditProfile, tx_hash: txHash } });
  } catch (err) {
    console.error("POST /api/profile/verify-identity error:", err);
    return NextResponse.json({ success: false, error: "Failed to submit verification" }, { status: 500 });
  }
}
