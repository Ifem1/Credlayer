-- CredLayer Initial Schema Migration
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  country TEXT NOT NULL,
  occupation TEXT NOT NULL,
  monthly_income_usd NUMERIC NOT NULL DEFAULT 0,
  loan_purpose TEXT NOT NULL DEFAULT '',
  kyc_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (kyc_status IN ('PENDING','UNDER_REVIEW','VERIFIED','REJECTED')),
  kyc_level TEXT CHECK (kyc_level IN ('BASIC','ENHANCED','INSTITUTIONAL')),
  kyc_rejection_reason TEXT,
  identity_score INTEGER NOT NULL DEFAULT 0 CHECK (identity_score BETWEEN 0 AND 100),
  active_loans INTEGER NOT NULL DEFAULT 0,
  completed_loans INTEGER NOT NULL DEFAULT 0,
  defaults INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_wallet ON profiles (wallet);

-- ── credit_profiles ───────────────────────────────────────────────────────────
CREATE TABLE credit_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL UNIQUE REFERENCES profiles(wallet) ON DELETE CASCADE,
  credit_score INTEGER NOT NULL DEFAULT 0 CHECK (credit_score BETWEEN 0 AND 850),
  reputation_score INTEGER NOT NULL DEFAULT 0 CHECK (reputation_score BETWEEN 0 AND 100),
  reputation_tier TEXT NOT NULL DEFAULT 'Unverified'
    CHECK (reputation_tier IN ('Unverified','Bronze','Silver','Gold','Platinum','Institutional')),
  identity_score INTEGER NOT NULL DEFAULT 0,
  repayment_score INTEGER NOT NULL DEFAULT 0,
  wallet_trust_score INTEGER NOT NULL DEFAULT 0,
  income_score INTEGER NOT NULL DEFAULT 0,
  governance_score INTEGER NOT NULL DEFAULT 0,
  total_borrowed NUMERIC NOT NULL DEFAULT 0,
  total_repaid NUMERIC NOT NULL DEFAULT 0,
  active_loan_count INTEGER NOT NULL DEFAULT 0,
  fraud_risk TEXT NOT NULL DEFAULT 'UNKNOWN'
    CHECK (fraud_risk IN ('UNKNOWN','LOW','MEDIUM','HIGH','CRITICAL')),
  last_evaluated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_profiles_wallet ON credit_profiles (wallet);
CREATE INDEX idx_credit_profiles_tier ON credit_profiles (reputation_tier);

-- ── loans ─────────────────────────────────────────────────────────────────────
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id TEXT NOT NULL UNIQUE,
  borrower TEXT NOT NULL REFERENCES profiles(wallet) ON DELETE RESTRICT,
  amount_usd NUMERIC NOT NULL CHECK (amount_usd > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  loan_type TEXT NOT NULL
    CHECK (loan_type IN ('PERSONAL','BUSINESS','CREATOR','FREELANCER','DAO_CONTRIBUTOR','REPUTATION_BACKED')),
  purpose TEXT NOT NULL,
  collateral_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL'
    CHECK (status IN ('PENDING_APPROVAL','APPROVED','REJECTED','CANCELLED','ACTIVE','REPAID','DEFAULTED')),
  credit_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'HIGH'
    CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  interest_rate NUMERIC NOT NULL DEFAULT 0,
  required_collateral_ratio INTEGER NOT NULL DEFAULT 100,
  max_loan_amount NUMERIC NOT NULL DEFAULT 0,
  confidence NUMERIC NOT NULL DEFAULT 0,
  reasoning TEXT NOT NULL DEFAULT '',
  positive_factors JSONB NOT NULL DEFAULT '[]',
  risk_factors JSONB NOT NULL DEFAULT '[]',
  approval_hash TEXT NOT NULL DEFAULT '',
  approval_timestamp TIMESTAMPTZ,
  consensus_id TEXT NOT NULL DEFAULT '',
  pool_id TEXT,
  total_repaid NUMERIC NOT NULL DEFAULT 0,
  is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  defaulted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_loans_borrower ON loans (borrower);
CREATE INDEX idx_loans_status ON loans (status);
CREATE INDEX idx_loans_loan_id ON loans (loan_id);
CREATE INDEX idx_loans_pool ON loans (pool_id);

-- ── repayments ────────────────────────────────────────────────────────────────
CREATE TABLE repayments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id TEXT NOT NULL REFERENCES loans(loan_id) ON DELETE RESTRICT,
  wallet TEXT NOT NULL REFERENCES profiles(wallet) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('COMPLETED','PARTIAL','LATE')),
  repaid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repayments_wallet ON repayments (wallet);
CREATE INDEX idx_repayments_loan ON repayments (loan_id);

-- ── risk_assessments ──────────────────────────────────────────────────────────
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  loan_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE','REJECT')),
  credit_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  max_loan_amount NUMERIC NOT NULL,
  required_collateral_ratio INTEGER NOT NULL,
  interest_rate NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  reasoning TEXT NOT NULL,
  positive_factors JSONB NOT NULL DEFAULT '[]',
  risk_factors JSONB NOT NULL DEFAULT '[]',
  fraud_risk TEXT NOT NULL DEFAULT 'LOW',
  approval_hash TEXT NOT NULL,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_wallet ON risk_assessments (wallet);
CREATE INDEX idx_risk_assessments_loan ON risk_assessments (loan_id);

-- ── liquidity_pools ───────────────────────────────────────────────────────────
CREATE TABLE liquidity_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pool_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  target_return_bps INTEGER NOT NULL DEFAULT 0,
  min_credit_score INTEGER NOT NULL DEFAULT 0,
  max_loan_amount NUMERIC NOT NULL DEFAULT 0,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('LOW','MEDIUM','HIGH')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CLOSED')),
  total_deposited NUMERIC NOT NULL DEFAULT 0,
  available_liquidity NUMERIC NOT NULL DEFAULT 0,
  total_borrowed NUMERIC NOT NULL DEFAULT 0,
  total_repaid NUMERIC NOT NULL DEFAULT 0,
  active_loans INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_pools_status ON liquidity_pools (status);

-- ── transactions ──────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  loan_id TEXT,
  pool_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet ON transactions (wallet);
CREATE INDEX idx_transactions_type ON transactions (type);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  loan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_wallet ON notifications (wallet);
CREATE INDEX idx_notifications_unread ON notifications (wallet, read) WHERE read = FALSE;

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_wallet ON audit_logs (wallet);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);

-- ── proofs ────────────────────────────────────────────────────────────────────
CREATE TABLE proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet TEXT NOT NULL,
  action TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  state_before TEXT NOT NULL DEFAULT '',
  state_after TEXT NOT NULL DEFAULT '',
  proof_hash TEXT NOT NULL,
  loan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proofs_wallet ON proofs (wallet);
CREATE INDEX idx_proofs_loan ON proofs (loan_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_credit_profiles_updated_at
  BEFORE UPDATE ON credit_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pools_updated_at
  BEFORE UPDATE ON liquidity_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
