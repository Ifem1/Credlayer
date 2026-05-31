import { NextRequest, NextResponse } from "next/server";
import { getLoan } from "@/lib/genlayer/contract";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ loanId: string }> }
) {
  try {
    const { loanId } = await params;
    const loan = await getLoan(loanId);
    if (!loan) {
      return NextResponse.json({ success: false, error: "Loan not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: loan });
  } catch (err) {
    console.error("GET /api/loan/[loanId] error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch loan" }, { status: 500 });
  }
}
