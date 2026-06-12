export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAllPools } from "@/lib/genlayer/contract";

export async function GET() {
  try {
    const pools = await getAllPools();
    return NextResponse.json({ success: true, data: pools });
  } catch (err) {
    console.error("GET /api/pool/all error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch pools" }, { status: 500 });
  }
}

