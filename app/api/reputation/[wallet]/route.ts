import { NextRequest, NextResponse } from "next/server";
import { getReputation, getCreditProfile } from "@/lib/genlayer/contract";
import { deriveGenLayerAddress } from "@/lib/genlayer/client";
import { getRepaymentsByWallet } from "@/lib/supabase/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    if (!/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json({ success: false, error: "Invalid wallet" }, { status: 400 });
    }

    const glAddress = deriveGenLayerAddress(wallet);
    const [reputation, creditProfile, repayments] = await Promise.all([
      getReputation(glAddress),
      getCreditProfile(glAddress),
      getRepaymentsByWallet(wallet),
    ]);

    return NextResponse.json({
      success: true,
      data: { reputation, credit_profile: creditProfile, repayment_history: repayments },
    });
  } catch (err) {
    console.error("GET /api/reputation/[wallet] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch reputation" }, { status: 500 });
  }
}
