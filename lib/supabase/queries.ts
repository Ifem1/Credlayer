/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServiceClient, supabase } from "./client";
import type {
  BorrowerProfile,
  CreditProfile,
  Loan,
  LiquidityPool,
  Notification,
  ProofEntry,
  RepaymentRecord,
} from "@/types";

// Supabase is a cache/index only — GenLayer is source of truth

// ── Profile ────────────────────────────────────────────────────────────────

export async function upsertProfile(profile: Partial<BorrowerProfile> & { wallet: string }) {
  const db = createServiceClient();
  const { error } = await (db as any)
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "wallet" });
  if (error) throw error;
}

export async function getProfileByWallet(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("wallet", wallet)
    .single();
  if (error) return null;
  return data;
}

// ── Credit Profile ──────────────────────────────────────────────────────────

export async function upsertCreditProfile(cp: Partial<CreditProfile> & { wallet: string }) {
  const db = createServiceClient();
  const { error } = await (db as any)
    .from("credit_profiles")
    .upsert({ ...cp, updated_at: new Date().toISOString() }, { onConflict: "wallet" });
  if (error) throw error;
}

export async function getCreditProfileByWallet(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("credit_profiles")
    .select("*")
    .eq("wallet", wallet)
    .single();
  if (error) return null;
  return data;
}

// ── Loans ─────────────────────────────────────────────────────────────────────

export async function upsertLoan(loan: Partial<Loan> & { loan_id: string }) {
  const db = createServiceClient();
  const { error } = await (db as any)
    .from("loans")
    .upsert({ ...loan, updated_at: new Date().toISOString() }, { onConflict: "loan_id" });
  if (error) throw error;
}

export async function getLoanById(loanId: string) {
  const { data, error } = await (supabase as any)
    .from("loans")
    .select("*")
    .eq("loan_id", loanId)
    .single();
  if (error) return null;
  return data;
}

export async function getLoansByBorrower(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("loans")
    .select("*")
    .eq("borrower", wallet)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// ── Repayments ────────────────────────────────────────────────────────────────

export async function insertRepayment(record: Omit<RepaymentRecord, "id">, wallet: string) {
  const db = createServiceClient();
  const { error } = await (db as any).from("repayments").insert({ ...record, wallet });
  if (error) throw error;
}

export async function getRepaymentsByWallet(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("repayments")
    .select("*")
    .eq("wallet", wallet)
    .order("repaid_at", { ascending: false });
  if (error) return [];
  return data;
}

// ── Risk Assessments ──────────────────────────────────────────────────────────

export async function insertRiskAssessment(assessment: {
  wallet: string;
  loan_id: string;
  decision: string;
  credit_score: number;
  risk_level: string;
  max_loan_amount: number;
  required_collateral_ratio: number;
  interest_rate: number;
  confidence: number;
  reasoning: string;
  positive_factors: string[];
  risk_factors: string[];
  fraud_risk: string;
  approval_hash: string;
  evaluated_at: string;
}) {
  const db = createServiceClient();
  const { error } = await (db as any).from("risk_assessments").insert(assessment);
  if (error) throw error;
}

// ── Liquidity Pools ───────────────────────────────────────────────────────────

export async function upsertPool(pool: Partial<LiquidityPool> & { pool_id: string }) {
  const db = createServiceClient();
  const { error } = await (db as any)
    .from("liquidity_pools")
    .upsert({ ...pool, updated_at: new Date().toISOString() }, { onConflict: "pool_id" });
  if (error) throw error;
}

export async function getAllPoolsFromDB() {
  const { data, error } = await (supabase as any)
    .from("liquidity_pools")
    .select("*")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

export async function getPoolById(poolId: string) {
  const { data, error } = await (supabase as any)
    .from("liquidity_pools")
    .select("*")
    .eq("pool_id", poolId)
    .single();
  if (error) return null;
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function createNotification(n: Omit<Notification, "id" | "created_at" | "read">) {
  const db = createServiceClient();
  const { error } = await (db as any).from("notifications").insert({ ...n, read: false });
  if (error) console.error("Notification error:", error);
}

export async function getNotifications(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("notifications")
    .select("*")
    .eq("wallet", wallet)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return data;
}

export async function markNotificationRead(id: string, wallet: string) {
  const { error } = await (supabase as any)
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("wallet", wallet);
  if (error) throw error;
}

// ── Proofs ────────────────────────────────────────────────────────────────────

export async function insertProof(proof: Omit<ProofEntry, "id" | "created_at">) {
  const db = createServiceClient();
  const { error } = await (db as any).from("proofs").insert(proof);
  if (error) throw error;
}

export async function getProofsByWallet(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("proofs")
    .select("*")
    .eq("wallet", wallet)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}

// ── Audit Logs ────────────────────────────────────────────────────────────────

export async function writeAuditLog(entry: {
  wallet: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
}) {
  const db = createServiceClient();
  await (db as any).from("audit_logs").insert(entry);
}

// ── Transactions ──────────────────────────────────────────────────────────────

export async function insertTransaction(tx: {
  wallet: string;
  type: string;
  amount: number;
  tx_hash: string;
  status: string;
  loan_id?: string;
  pool_id?: string;
}) {
  const db = createServiceClient();
  const { error } = await (db as any).from("transactions").insert(tx);
  if (error) throw error;
}

export async function getTransactionsByWallet(wallet: string) {
  const { data, error } = await (supabase as any)
    .from("transactions")
    .select("*")
    .eq("wallet", wallet)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data;
}
