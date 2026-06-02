/**
 * POST /api/pool/deposit/sync
 *
 * Called by the client AFTER a successful client-side GenLayer deposit transaction.
 * Only updates Supabase — the GenLayer state was already written by the user's wallet.
 */
import { NextRequest, NextResponse } from "next/server";
import { depositSchema } from "@/lib/validation";
import { upsertPool, insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = depositSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const txHash = (body.tx_hash as string) || "client-signed";

    // Mirror updated pool state to Supabase
    // We don't know the exact new values without a GenLayer read, so just record the action.
    // The /api/genlayer/sync endpoint can do a full re-sync if needed.
    try {
      await upsertPool({
        pool_id: data.pool_id,
        // Note: exact balance is updated by the contract on-chain.
        // A background sync will pick up the accurate state.
      });
    } catch {
      // Non-fatal — pool row may not exist yet in Supabase cache
    }

    const proofHash = computeProofHash({
      action: "liquidity_deposited",
      pool_id: data.pool_id,
      wallet: data.wallet,
      amount: data.amount_usd,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.wallet,
      action: "liquidity_deposited",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "pre_deposit",
      state_after: `deposited:${data.amount_usd}_GEN`,
      proof_hash: proofHash,
    });

    await createNotification({
      wallet: data.wallet,
      type: "DEPOSIT_CONFIRMED",
      title: "Deposit Confirmed",
      message: `Your deposit of ${data.amount_usd} GEN into pool ${data.pool_id} was confirmed on GenLayer.`,
    });

    await writeAuditLog({
      wallet: data.wallet,
      action: "deposit_liquidity",
      entity_type: "pool",
      entity_id: data.pool_id,
      details: { amount_usd: data.amount_usd, tx_hash: txHash, source: "client_wallet" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/pool/deposit/sync error:", err);
    return NextResponse.json(
      { success: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
