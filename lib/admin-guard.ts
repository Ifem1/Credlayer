// Server-side guard for admin (owner-only) API routes.
// All /api/admin/* endpoints must call this before touching the contract.

import { isOwnerWallet } from "@/lib/genlayer/client";

export function assertOwner(wallet: string | undefined | null): {
  ok: boolean;
  reason?: string;
} {
  if (!wallet) return { ok: false, reason: "owner_wallet is required" };
  if (!isOwnerWallet(wallet)) {
    return { ok: false, reason: "Not authorised — only the contract owner may perform this action." };
  }
  if (!process.env.GENLAYER_OWNER_PRIVATE_KEY) {
    return {
      ok: false,
      reason: "GENLAYER_OWNER_PRIVATE_KEY is not configured on the server. Admin actions are disabled.",
    };
  }
  return { ok: true };
}
