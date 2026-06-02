/**
 * POST /api/pool/withdraw/sync
 *
 * Called by the client AFTER a successful client-side GenLayer withdraw transaction.
 * Only updates Supabase — GenLayer state was already written by the user's wallet.
 */
import { NextRequest, NextResponse } from "next/server";
import { withdrawSchema } from "@/lib/validation";
import { insertProof, writeAuditLog, createNotification } from "@/lib/supabase/queries";
import { computeProofHash } from "@/lib/utils";
import { CONTRACT_ADDRESS } from "@/lib/genlayer/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = withdrawSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const txHash = (body.tx_hash as string) || "client-signed";

    const proofHash = computeProofHash({
      action: "liquidity_withdrawn",
      pool_id: data.pool_id,
      wallet: data.wallet,
      amount: data.amount_usd,
      timestamp: new Date().toISOString(),
    });

    await insertProof({
      wallet: data.wallet,
      action: "liquidity_withdrawn",
      contract_address: CONTRACT_ADDRESS,
      tx_hash: txHash,
      state_before: "deposited",
      state_after: `withdrawn:${data.amount_usd}_GEN`,
      proof_hash: proofHash,
    });

    await createNotification({
      wallet: data.wallet,
      type: "WITHDRAWAL_CONFIRMED",
      title: "Withdrawal Confirmed",
      message: `Your withdrawal of ${data.amount_usd} GEN from pool ${data.pool_id} was confirmed on GenLayer.`,
    });

    await writeAuditLog({
      wallet: data.wallet,
      action: "withdraw_liquidity",
      entity_type: "pool",
      entity_id: data.pool_id,
      details: { amount_usd: data.amount_usd, tx_hash: txHash, source: "client_wallet" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/pool/withdraw/sync error:", err);
    return NextResponse.json(
      { success: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
