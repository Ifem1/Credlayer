import { NextRequest, NextResponse } from "next/server";
import { getBorrower, getCreditProfile, getLoansByWallet } from "@/lib/genlayer/contract";
import { deriveGenLayerAddress } from "@/lib/genlayer/client";
import { getProfileByWallet, getProofsByWallet } from "@/lib/supabase/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ success: false, error: "Invalid wallet address" }, { status: 400 });
    }

    // GenLayer is source of truth.
    // The contract stores data by the derived signer address (self._caller()),
    // not the user's raw wallet — derive that address for lookups.
    const glAddress = deriveGenLayerAddress(wallet);
    const [glBorrower, glCreditProfile, glLoans] = await Promise.all([
      getBorrower(glAddress),
      getCreditProfile(glAddress),
      getLoansByWallet(glAddress),
    ]);

    // Supabase for supplementary data (proofs, notifications)
    const [dbProfile, proofs] = await Promise.all([
      getProfileByWallet(wallet),
      getProofsByWallet(wallet),
    ]);

    if (!glBorrower) {
      return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: glBorrower,
        credit_profile: glCreditProfile,
        loans: glLoans,
        proofs,
        db_supplemental: dbProfile,
      },
    });
  } catch (err) {
    console.error("GET /api/profile/[wallet] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}
