export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { isOwnerWallet } from "@/lib/genlayer/client";
import { getLoansByStatus } from "@/lib/supabase/queries";

// GET /api/admin/loans?owner_wallet=0x...&status=PENDING_APPROVAL,APPROVED,ACTIVE
// Returns loans matching the requested statuses. Owner-gated.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get("owner_wallet") || "";
    const statusParam = searchParams.get("status") || "PENDING_APPROVAL,APPROVED,ACTIVE";

    if (!isOwnerWallet(owner)) {
      return NextResponse.json(
        { success: false, error: "Not authorised" },
        { status: 403 }
      );
    }

    const statuses = statusParam.split(",").map((s) => s.trim()).filter(Boolean);
    const loans = await getLoansByStatus(statuses);

    return NextResponse.json({ success: true, data: loans });
  } catch (err) {
    console.error("GET /api/admin/loans error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}

