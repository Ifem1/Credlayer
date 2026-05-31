import { NextRequest, NextResponse } from "next/server";
import { syncSchema } from "@/lib/validation";
import {
  getBorrower,
  getCreditProfile,
  getLoan,
  getPool,
  getAllPools,
  getTreasury,
  getReputation,
} from "@/lib/genlayer/contract";
import {
  upsertProfile,
  upsertCreditProfile,
  upsertLoan,
  upsertPool,
  writeAuditLog,
} from "@/lib/supabase/queries";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { wallet, action, entity_id } = parsed.data;

    let synced: unknown = null;

    switch (action) {
      case "profile": {
        const [borrower, creditProfile] = await Promise.all([
          getBorrower(wallet),
          getCreditProfile(wallet),
        ]);
        if (borrower) await upsertProfile(borrower);
        if (creditProfile) await upsertCreditProfile(creditProfile);
        synced = { borrower, credit_profile: creditProfile };
        break;
      }
      case "loan": {
        if (!entity_id) throw new Error("entity_id required for loan sync");
        const loan = await getLoan(entity_id);
        if (loan) await upsertLoan(loan);
        synced = loan;
        break;
      }
      case "pool": {
        if (entity_id) {
          const pool = await getPool(entity_id);
          if (pool) await upsertPool(pool);
          synced = pool;
        } else {
          const pools = await getAllPools();
          for (const pool of pools) {
            await upsertPool(pool);
          }
          synced = pools;
        }
        break;
      }
      case "reputation": {
        const rep = await getReputation(wallet);
        const cp = await getCreditProfile(wallet);
        if (cp) await upsertCreditProfile(cp);
        synced = { reputation: rep, credit_profile: cp };
        break;
      }
      case "treasury": {
        const treasury = await getTreasury();
        synced = treasury;
        break;
      }
    }

    await writeAuditLog({
      wallet,
      action: `sync_${action}`,
      entity_type: action,
      entity_id: entity_id || wallet,
      details: { synced_at: new Date().toISOString() },
    });

    return NextResponse.json({ success: true, data: { action, synced } });
  } catch (err) {
    console.error("POST /api/genlayer/sync error:", err);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
