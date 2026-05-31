import { readContract, writeContract, waitForTransaction } from "./client";
export { CONTRACT_ADDRESS } from "./client";
import type {
  BorrowerProfile,
  CreditProfile,
  Loan,
  LiquidityPool,
  Treasury,
  ProtocolFees,
  CreateProfileRequest,
  LoanRequestPayload,
} from "@/types";

// ── Read Methods ──────────────────────────────────────────────────────────────

export async function getBorrower(wallet: string): Promise<BorrowerProfile | null> {
  const result = await readContract<BorrowerProfile>("get_borrower", [wallet]);
  if (!result || !result.wallet) return null;
  return result;
}

export async function getCreditProfile(wallet: string): Promise<CreditProfile | null> {
  const result = await readContract<CreditProfile>("get_credit_profile", [wallet]);
  if (!result || !result.wallet) return null;
  return result;
}

export async function getLoan(loanId: string): Promise<Loan | null> {
  const result = await readContract<Loan>("get_loan", [loanId]);
  if (!result || !result.loan_id) return null;
  return result;
}

export async function getLoansByWallet(wallet: string): Promise<Loan[]> {
  return readContract<Loan[]>("get_loans_by_wallet", [wallet]);
}

export async function getPool(poolId: string): Promise<LiquidityPool | null> {
  const result = await readContract<LiquidityPool>("get_pool", [poolId]);
  if (!result || !result.pool_id) return null;
  return result;
}

export async function getAllPools(): Promise<LiquidityPool[]> {
  return readContract<LiquidityPool[]>("get_all_pools", []);
}

export async function getTreasury(): Promise<Treasury> {
  return readContract<Treasury>("get_treasury", []);
}

export async function getProtocolFees(): Promise<ProtocolFees> {
  return readContract<ProtocolFees>("get_protocol_fees", []);
}

export async function getReputation(wallet: string) {
  return readContract<Record<string, unknown>>("get_reputation", [wallet]);
}

// ── Write Methods ─────────────────────────────────────────────────────────────

export async function createBorrowerProfile(
  data: CreateProfileRequest,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "create_borrower_profile",
    [
      data.full_name,
      data.email_hash,
      data.country,
      data.occupation,
      data.monthly_income_usd,
      data.loan_purpose,
    ],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function submitIdentityVerification(
  documentType: string,
  documentHash: string,
  selfieHash: string,
  proofOfAddressHash: string,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "submit_identity_verification",
    [documentType, documentHash, selfieHash, proofOfAddressHash],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function requestLoan(
  data: LoanRequestPayload,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "request_loan",
    [
      data.amount_usd,
      data.duration_days,
      data.loan_type,
      data.purpose,
      data.collateral_amount,
      data.wallet_age_days,
      data.total_transactions,
      data.avg_balance_usd,
      data.github_contributions,
      data.dao_votes,
      data.income_documents_hash,
    ],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function acceptConditionalOffer(
  loanId: string,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "accept_conditional_offer",
    [loanId],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function cancelLoanRequest(
  loanId: string,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "cancel_loan_request",
    [loanId],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function repayLoan(
  loanId: string,
  amountUsd: number,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "repay_loan",
    [loanId, amountUsd],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function depositLiquidity(
  poolId: string,
  amountUsd: number,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "deposit_liquidity",
    [poolId, amountUsd],
    senderAddress
  );
  return waitForTransaction(hash);
}

export async function withdrawLiquidity(
  poolId: string,
  amountUsd: number,
  senderAddress: `0x${string}`
) {
  const hash = await writeContract(
    "withdraw_liquidity",
    [poolId, amountUsd],
    senderAddress
  );
  return waitForTransaction(hash);
}

