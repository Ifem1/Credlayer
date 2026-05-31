-- CredLayer: Grant table privileges to Supabase roles
-- Run this in the Supabase SQL Editor after 001 and 002

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON credit_profiles TO anon, authenticated;
GRANT SELECT ON loans TO anon, authenticated;
GRANT SELECT ON liquidity_pools TO anon, authenticated;
GRANT SELECT ON proofs TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON repayments TO authenticated;
GRANT SELECT ON risk_assessments TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
