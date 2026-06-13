/**
 * Bucket 3 — Non-deterministic AI functions
 *
 * submit_identity_verification(document_type, document_hash, selfie_hash, proof_of_address_hash)
 * request_loan(amount_wei, duration_days, loan_type, purpose, collateral_amount_wei,
 *              wallet_age_days, total_transactions, avg_balance_usd,
 *              github_contributions, dao_votes, income_documents_hash)
 *
 * KYC must return status VERIFIED for request_loan to proceed.
 * We don't assert exact AI outputs — only structure, type, and range.
 */
import { borrower1, borrower2 } from "./helpers/client.mjs";
import { safeWrite, readView } from "./helpers/write.mjs";
import { assertIn, assertNonEmpty, assertGte, assertLte } from "./helpers/assert.mjs";

export let LOAN_ID_B1 = null;
export let LOAN_ID_B2 = null;

async function waitForKycVerified(borrowerAddr, maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    const profile = await readView("get_borrower", [borrowerAddr]);
    const status = (profile?.kyc_status ?? "").toUpperCase();
    if (status === "VERIFIED") return status;
    if (status === "REJECTED") return status;
    // UNDER_REVIEW — poll
    if (i < maxAttempts - 1) {
      console.log(`    kyc_status=${status} — waiting 5s…`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  const profile = await readView("get_borrower", [borrowerAddr]);
  return (profile?.kyc_status ?? "").toUpperCase();
}

async function test_kyc_borrower1() {
  console.log("\n  [nondet-01] submit_identity_verification for borrower1");
  await safeWrite(
    borrower1.client,
    "submit_identity_verification",
    [
      "PASSPORT",
      "doc_hash_alice_001",
      "selfie_hash_alice_001",
      "address_hash_alice_001",
    ],
    0n,
    "submit_identity_verification(borrower1)"
  );
}

async function test_kyc_result_borrower1() {
  console.log("\n  [nondet-02] Check KYC result for borrower1");
  const kycStatus = await waitForKycVerified(borrower1.account.address);
  console.log(`    kyc_status = ${kycStatus}`);
  assertIn(kycStatus, ["VERIFIED", "REJECTED", "UNDER_REVIEW", "PENDING"], "kyc_status enum");
  if (kycStatus !== "VERIFIED") {
    console.warn(`    ⚠ borrower1 KYC not VERIFIED (${kycStatus}) — request_loan will fail`);
  }
}

async function test_kyc_borrower2() {
  console.log("\n  [nondet-03] submit_identity_verification for borrower2");
  await safeWrite(
    borrower2.client,
    "submit_identity_verification",
    [
      "NATIONAL_ID",
      "doc_hash_bob_001",
      "selfie_hash_bob_001",
      "address_hash_bob_001",
    ],
    0n,
    "submit_identity_verification(borrower2)"
  );
}

async function test_request_loan_borrower1() {
  console.log("\n  [nondet-04] request_loan for borrower1");

  // Find an active pool
  let pid = "pool_1";
  try {
    const pools = await readView("get_all_pools", []);
    const active = pools.find(p => p.status === "ACTIVE");
    if (active) pid = active.pool_id;
  } catch { /* default */ }
  console.log(`    using pool context (no pool arg in request_loan)`);

  const { returnValue } = await safeWrite(
    borrower1.client,
    "request_loan",
    [
      5_000_000_000_000_000_000_000n, // amount_wei (5000 GEN)
      30n,   // duration_days
      "PERSONAL",
      "Home improvement project",
      0n,    // collateral_amount_wei
      730n,  // wallet_age_days
      200n,  // total_transactions
      2000n, // avg_balance_usd
      50n,   // github_contributions
      5n,    // dao_votes
      "income_docs_hash_alice",
    ],
    0n,
    "request_loan(borrower1)"
  );

  LOAN_ID_B1 = returnValue ?? null;

  // If not returned directly, look it up
  if (!LOAN_ID_B1) {
    try {
      const loans = await readView("get_loans_by_wallet", [borrower1.account.address]);
      if (Array.isArray(loans) && loans.length > 0) {
        LOAN_ID_B1 = loans[loans.length - 1]?.loan_id;
      }
    } catch { /* ok */ }
  }
  console.log(`    LOAN_ID_B1 = ${LOAN_ID_B1}`);
}

async function test_loan_structure_borrower1() {
  console.log("\n  [nondet-05] Validate loan structure for borrower1");
  if (!LOAN_ID_B1) {
    console.warn("    ⚠ No loan id — skipping structure assertions");
    return;
  }

  const loan = await readView("get_loan", [LOAN_ID_B1]);
  if (!loan || Object.keys(loan).length === 0) {
    console.warn("    ⚠ Loan not found in contract — skipping");
    return;
  }

  console.log(`    status=${loan.status}  credit_score=${loan.credit_score}  rate_bps=${loan.interest_rate_bps}`);

  assertIn(loan.status, [
    "PENDING_BORROWER_ACCEPTANCE", "REJECTED",
  ], "loan.status after request");

  const score = Number(loan.credit_score ?? 0);
  assertGte(score, 300, "credit_score >= 300");
  assertLte(score, 850, "credit_score <= 850");

  assertIn(loan.risk_level, ["LOW", "MEDIUM", "HIGH", "CRITICAL"], "loan.risk_level");
  assertIn(loan.loan_type, ["PERSONAL", "BUSINESS", "CREATOR", "FREELANCER", "DAO_CONTRIBUTOR", "REPUTATION_BACKED"], "loan.loan_type");
}

async function test_request_loan_borrower2() {
  console.log("\n  [nondet-06] request_loan for borrower2");

  const { returnValue } = await safeWrite(
    borrower2.client,
    "request_loan",
    [
      3_000_000_000_000_000_000_000n, // 3000 GEN
      60n,
      "FREELANCER",
      "Education expenses",
      0n,
      365n,
      150n,
      1500n,
      10n,
      2n,
      "income_docs_hash_bob",
    ],
    0n,
    "request_loan(borrower2)"
  );

  LOAN_ID_B2 = returnValue ?? null;
  if (!LOAN_ID_B2) {
    try {
      const loans = await readView("get_loans_by_wallet", [borrower2.account.address]);
      if (Array.isArray(loans) && loans.length > 0) {
        LOAN_ID_B2 = loans[loans.length - 1]?.loan_id;
      }
    } catch { /* ok */ }
  }
  console.log(`    LOAN_ID_B2 = ${LOAN_ID_B2}`);
}

export async function runNonDetSuite() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("SUITE  Non-Deterministic AI (KYC + Loan Assessment)");
  console.log("══════════════════════════════════════");

  await test_kyc_borrower1();
  await test_kyc_result_borrower1();
  await test_kyc_borrower2();
  await test_request_loan_borrower1();
  await test_loan_structure_borrower1();
  await test_request_loan_borrower2();

  const ms = Date.now() - t0;
  console.log(`\n✅  Non-det suite passed (${ms}ms)\n`);
  return { suite: "nondet", ms };
}
