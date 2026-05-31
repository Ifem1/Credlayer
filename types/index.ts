// ── Core Domain Types ──────────────────────────────────────────────────────

export type ReputationTier =
  | "Unverified"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Institutional";

export type KycStatus = "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
export type KycLevel = "BASIC" | "ENHANCED" | "INSTITUTIONAL";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FraudRisk = "UNKNOWN" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type LoanDecision = "APPROVE" | "REJECT";
export type PoolRiskTier = "LOW" | "MEDIUM" | "HIGH";

export type LoanType =
  | "PERSONAL"
  | "BUSINESS"
  | "CREATOR"
  | "FREELANCER"
  | "DAO_CONTRIBUTOR"
  | "REPUTATION_BACKED";

export type LoanStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "ACTIVE"
  | "REPAID"
  | "DEFAULTED";

export type PoolStatus = "ACTIVE" | "CLOSED";

// ── Borrower ────────────────────────────────────────────────────────────────

export interface BorrowerProfile {
  wallet: string;
  full_name: string;
  email_hash: string;
  country: string;
  occupation: string;
  monthly_income_usd: number;
  loan_purpose: string;
  kyc_status: KycStatus;
  kyc_level?: KycLevel;
  identity_score: number;
  active_loans: number;
  completed_loans: number;
  defaults: number;
  created_at: string;
  updated_at: string;
  identity_documents?: {
    document_type: string;
    document_hash: string;
    selfie_hash: string;
    proof_of_address_hash: string;
    submitted_at: string;
  };
}

// ── Credit Profile ──────────────────────────────────────────────────────────

export interface CreditProfile {
  wallet: string;
  credit_score: number;
  reputation_score: number;
  reputation_tier: ReputationTier;
  identity_score: number;
  repayment_score: number;
  wallet_trust_score: number;
  income_score: number;
  governance_score: number;
  total_borrowed: number;
  total_repaid: number;
  active_loan_count: number;
  fraud_risk: FraudRisk;
  last_evaluated: string | null;
  approved_loans: string[];
  created_at: string;
}

// ── Credit Assessment ───────────────────────────────────────────────────────

export interface CreditAssessment {
  decision: LoanDecision;
  credit_score: number;
  risk_level: RiskLevel;
  max_loan_amount: number;
  required_collateral_ratio: number;
  interest_rate: number;
  confidence: number;
  reasoning: string;
  positive_factors: string[];
  risk_factors: string[];
  fraud_risk: FraudRisk;
}

// ── Loan ────────────────────────────────────────────────────────────────────

export interface Loan {
  loan_id: string;
  borrower: string;
  amount_usd: number;
  duration_days: number;
  loan_type: LoanType;
  purpose: string;
  collateral_amount: number;
  status: LoanStatus;
  credit_score: number;
  risk_level: RiskLevel;
  interest_rate: number;
  required_collateral_ratio: number;
  max_loan_amount: number;
  confidence: number;
  reasoning: string;
  positive_factors: string[];
  risk_factors: string[];
  approval_hash: string;
  approval_timestamp: string;
  consensus_id: string;
  requested_at: string;
  activated_at: string | null;
  due_date: string | null;
  repaid_at: string | null;
  total_repaid: number;
  is_immutable: boolean;
  pool_id?: string;
  accepted_at?: string;
  cancelled_at?: string;
  defaulted_at?: string;
}

// ── Repayment ────────────────────────────────────────────────────────────────

export interface RepaymentRecord {
  loan_id: string;
  amount: number;
  fee: number;
  status: "COMPLETED" | "PARTIAL" | "LATE";
  repaid_at: string;
}

// ── Liquidity Pool ───────────────────────────────────────────────────────────

export interface LiquidityPool {
  pool_id: string;
  name: string;
  target_return_bps: number;
  min_credit_score: number;
  max_loan_amount: number;
  risk_tier: PoolRiskTier;
  status: PoolStatus;
  total_deposited: number;
  available_liquidity: number;
  total_borrowed: number;
  total_repaid: number;
  active_loans: number;
  depositors: Record<string, number>;
  created_at: string;
  closed_at?: string;
}

// ── Treasury ─────────────────────────────────────────────────────────────────

export interface Treasury {
  total_deposited: number;
  total_borrowed: number;
  total_repaid: number;
  total_defaults: number;
  reserve_ratio: number;
  last_updated: string;
}

export interface ProtocolFees {
  total_collected: number;
  origination_fee_bps: number;
  late_fee_bps: number;
  default_penalty_bps: number;
  last_withdrawn?: string;
}

// ── Proof / Audit ─────────────────────────────────────────────────────────────

export interface ProofEntry {
  id?: string;
  wallet: string;
  action: string;
  contract_address: string;
  tx_hash: string;
  timestamp?: string;
  created_at?: string;
  state_before: string;
  state_after: string;
  proof_hash: string;
  loan_id?: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  wallet: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  loan_id?: string;
}

// ── API Request/Response Types ────────────────────────────────────────────────

export interface CreateProfileRequest {
  full_name: string;
  email_hash: string;
  country: string;
  occupation: string;
  monthly_income_usd: number;
  loan_purpose: string;
  wallet: string;
}

export interface LoanRequestPayload {
  amount_usd: number;
  duration_days: number;
  loan_type: LoanType;
  purpose: string;
  collateral_amount: number;
  wallet_age_days: number;
  total_transactions: number;
  avg_balance_usd: number;
  github_contributions: number;
  dao_votes: number;
  income_documents_hash: string;
}

export interface RepayLoanRequest {
  loan_id: string;
  amount_usd: number;
}

export interface DepositRequest {
  pool_id: string;
  amount_usd: number;
}

export interface WithdrawRequest {
  pool_id: string;
  amount_usd: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface BorrowerDashboardStats {
  credit_score: number;
  reputation_tier: ReputationTier;
  active_loans: number;
  total_borrowed: number;
  total_repaid: number;
  available_credit: number;
  next_payment_date: string | null;
  next_payment_amount: number | null;
}

export interface LenderDashboardStats {
  total_deposited: number;
  total_earned: number;
  active_pools: number;
  yield_rate: number;
  portfolio_health: "HEALTHY" | "AT_RISK" | "CRITICAL";
}

// ── GenLayer Sync ─────────────────────────────────────────────────────────────

export interface GenLayerSyncPayload {
  wallet: string;
  action: "profile" | "loan" | "pool" | "reputation" | "treasury";
  entity_id?: string;
}
