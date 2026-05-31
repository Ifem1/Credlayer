-- CredLayer Row Level Security Policies
-- Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
-- Public read
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Owner can insert
CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

-- Owner can update their own profile
CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role has full access
CREATE POLICY "profiles_service_all"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── credit_profiles ───────────────────────────────────────────────────────────
CREATE POLICY "credit_profiles_public_read"
  ON credit_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "credit_profiles_service_all"
  ON credit_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── loans ─────────────────────────────────────────────────────────────────────
-- Borrower can read their loans
CREATE POLICY "loans_borrower_read"
  ON loans FOR SELECT
  TO authenticated
  USING (
    borrower = current_setting('request.jwt.claims', true)::json->>'sub'
    OR status IN ('ACTIVE','APPROVED')
  );

CREATE POLICY "loans_anon_read_active"
  ON loans FOR SELECT
  TO anon
  USING (status IN ('ACTIVE','APPROVED','REPAID'));

CREATE POLICY "loans_service_all"
  ON loans FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── repayments ────────────────────────────────────────────────────────────────
CREATE POLICY "repayments_owner_read"
  ON repayments FOR SELECT
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "repayments_service_all"
  ON repayments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── risk_assessments ──────────────────────────────────────────────────────────
CREATE POLICY "risk_assessments_owner_read"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "risk_assessments_service_all"
  ON risk_assessments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── liquidity_pools ───────────────────────────────────────────────────────────
CREATE POLICY "pools_public_read"
  ON liquidity_pools FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "pools_service_all"
  ON liquidity_pools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── transactions ──────────────────────────────────────────────────────────────
CREATE POLICY "transactions_owner_read"
  ON transactions FOR SELECT
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "transactions_service_all"
  ON transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "notifications_owner_read"
  ON notifications FOR SELECT
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "notifications_owner_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (wallet = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (wallet = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "notifications_service_all"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── audit_logs ────────────────────────────────────────────────────────────────
CREATE POLICY "audit_logs_service_all"
  ON audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── proofs ────────────────────────────────────────────────────────────────────
CREATE POLICY "proofs_public_read"
  ON proofs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "proofs_service_all"
  ON proofs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
