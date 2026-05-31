-- CredLayer Supabase Setup Script
-- Run this in the Supabase SQL editor after creating your project

-- Step 1: Run migrations in order
-- \i supabase/migrations/001_initial_schema.sql
-- \i supabase/migrations/002_rls_policies.sql

-- Step 2: Seed initial liquidity pools (optional for testing)
INSERT INTO liquidity_pools (pool_id, name, target_return_bps, min_credit_score, max_loan_amount, risk_tier, status, total_deposited, available_liquidity)
VALUES
  ('pool_1', 'Conservative Income Pool', 600, 650, 5000, 'LOW', 'ACTIVE', 0, 0),
  ('pool_2', 'Balanced Growth Pool', 900, 550, 10000, 'MEDIUM', 'ACTIVE', 0, 0),
  ('pool_3', 'High Yield Opportunity Pool', 1500, 400, 25000, 'HIGH', 'ACTIVE', 0, 0)
ON CONFLICT (pool_id) DO NOTHING;

-- Step 3: Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 4: Verify policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
