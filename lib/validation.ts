import { z } from "zod";

export const createProfileSchema = z.object({
  full_name: z.string().min(2).max(100),
  email_hash: z.string().length(64),
  country: z.string().min(2).max(100),
  occupation: z.string().min(2).max(100),
  monthly_income_usd: z.number().min(0).max(10_000_000),
  loan_purpose: z.string().min(10).max(500),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid wallet address"),
});

export const loanRequestSchema = z.object({
  amount_usd: z.number().min(100).max(500_000),
  duration_days: z.number().min(7).max(1095),
  loan_type: z.enum(["PERSONAL","BUSINESS","CREATOR","FREELANCER","DAO_CONTRIBUTOR","REPUTATION_BACKED"]),
  purpose: z.string().min(10).max(500),
  collateral_amount: z.number().min(0),
  wallet_age_days: z.number().min(0),
  total_transactions: z.number().min(0),
  avg_balance_usd: z.number().min(0),
  github_contributions: z.number().min(0),
  dao_votes: z.number().min(0),
  income_documents_hash: z.string().min(1),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const repayLoanSchema = z.object({
  loan_id: z.string().min(1),
  amount_usd: z.number().min(1),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const depositSchema = z.object({
  pool_id: z.string().min(1),
  amount_usd: z.number().min(1),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const withdrawSchema = z.object({
  pool_id: z.string().min(1),
  amount_usd: z.number().min(1),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const identityVerificationSchema = z.object({
  document_type: z.enum(["PASSPORT","NATIONAL_ID","DRIVERS_LICENSE"]),
  document_hash: z.string().length(64),
  selfie_hash: z.string().length(64),
  proof_of_address_hash: z.string().length(64),
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

// ── Admin (owner-only) schemas ───────────────────────────────────────────────

export const adminCreatePoolSchema = z.object({
  name: z.string().min(3).max(80),
  target_return_bps: z.number().int().min(1).max(5000),    // 0.01% – 50%
  min_credit_score: z.number().int().min(0).max(850),
  max_loan_amount: z.number().min(100).max(10_000_000),
  risk_tier: z.enum(["LOW", "MEDIUM", "HIGH"]),
  owner_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const adminClosePoolSchema = z.object({
  pool_id: z.string().min(1),
  owner_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const adminActivateLoanSchema = z.object({
  loan_id: z.string().min(1),
  pool_id: z.string().min(1),
  owner_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const adminMarkDefaultSchema = z.object({
  loan_id: z.string().min(1),
  owner_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const adminWithdrawFeesSchema = z.object({
  amount_usd: z.number().min(1).max(10_000_000),
  owner_wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const syncSchema = z.object({
  wallet: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  action: z.enum(["profile","loan","pool","reputation","treasury"]),
  entity_id: z.string().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type LoanRequestInput = z.infer<typeof loanRequestSchema>;
export type RepayLoanInput = z.infer<typeof repayLoanSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type IdentityVerificationInput = z.infer<typeof identityVerificationSchema>;
export type SyncInput = z.infer<typeof syncSchema>;
