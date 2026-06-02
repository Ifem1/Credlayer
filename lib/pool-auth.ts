/**
 * Shared message builders for deposit/withdrawal wallet authorization.
 * Used by both client-side hooks and server-side API routes for verification.
 * No "use client" — safe to import anywhere.
 */

export function buildDepositMessage(
  poolId: string,
  poolName: string,
  amountGEN: number,
  wallet: string,
  timestamp: number
): string {
  return [
    "CredLayer Deposit Authorization",
    "",
    `Pool:      ${poolName}`,
    `Pool ID:   ${poolId}`,
    `Amount:    ${amountGEN} GEN`,
    `Wallet:    ${wallet}`,
    `Timestamp: ${timestamp}`,
    "",
    "By signing you authorise this deposit of GEN tokens into the CredLayer liquidity pool.",
  ].join("\n");
}

export function buildWithdrawMessage(
  poolId: string,
  poolName: string,
  amountGEN: number,
  wallet: string,
  timestamp: number
): string {
  return [
    "CredLayer Withdrawal Authorization",
    "",
    `Pool:      ${poolName}`,
    `Pool ID:   ${poolId}`,
    `Amount:    ${amountGEN} GEN`,
    `Wallet:    ${wallet}`,
    `Timestamp: ${timestamp}`,
    "",
    "By signing you authorise this withdrawal of GEN tokens from the CredLayer liquidity pool.",
  ].join("\n");
}
