export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getTreasury, getProtocolFees, getAllPools } from "@/lib/genlayer/contract";

export async function GET() {
  try {
    const [treasury, fees, pools] = await Promise.all([
      getTreasury(),
      getProtocolFees(),
      getAllPools(),
    ]);

    const totalLiquidity = pools.reduce((sum, p) => sum + (p.total_deposited || 0), 0);
    const utilization = totalLiquidity > 0
      ? ((treasury.total_borrowed || 0) / totalLiquidity) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        treasury,
        protocol_fees: fees,
        pools_summary: {
          total_pools: pools.length,
          active_pools: pools.filter((p) => p.status === "ACTIVE").length,
          total_liquidity: totalLiquidity,
          utilization_rate: utilization,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/treasury error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch treasury" }, { status: 500 });
  }
}

