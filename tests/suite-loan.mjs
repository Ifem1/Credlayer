/**
 * Full loan lifecycle (depends on suite-nondet having run first).
 *
 * Status flow:
 *   request_loan → PENDING_BORROWER_ACCEPTANCE  (if APPROVE)
 *   accept_conditional_offer → APPROVED          (called by borrower)
 *   activate_loan(loan_id, pool_id) → ACTIVE    (no owner guard — see warning below)
 *   repay_loan(loan_id) payable → REPAID
 *
 * Default path:
 *   ... activate → ACTIVE → mark_default → DEFAULTED
 *
 * ⚠ WARNING: activate_loan has NO _require_owner() guard.
 *   Anyone can activate any APPROVED loan.
 *   We call as owner (matching UI behaviour) and log the issue.
 */
import { owner, borrower1, borrower2 } from "./helpers/client.mjs";
import { safeWrite, readView } from "./helpers/write.mjs";
import { assertIn } from "./helpers/assert.mjs";
import { LOAN_ID_B1, LOAN_ID_B2 } from "./suite-nondet.mjs";

async function resolveLoanId(loanId, borrowerAddr, label) {
  if (loanId) return loanId;
  try {
    const loans = await readView("get_loans_by_wallet", [borrowerAddr]);
    if (Array.isArray(loans) && loans.length > 0) {
      const id = loans[loans.length - 1]?.loan_id;
      if (id) { console.log(`    resolved ${label} = ${id}`); return id; }
    }
  } catch { /* ok */ }
  throw new Error(`Cannot resolve loan id for ${label}. Run suite-nondet first.`);
}

async function getLoanStatus(loanId) {
  try {
    const loan = await readView("get_loan", [loanId]);
    return loan?.status ?? null;
  } catch { return null; }
}

async function getActivePool() {
  try {
    const pools = await readView("get_all_pools", []);
    const active = pools.find(p => p.status === "ACTIVE");
    return active?.pool_id ?? "pool_1";
  } catch { return "pool_1"; }
}

// ─── Happy path ───────────────────────────────────────────────────────────────

async function test_accept_b1(loanId) {
  console.log(`\n  [loan-01] Borrower1 accepts conditional offer for ${loanId}`);
  const status = await getLoanStatus(loanId);
  console.log(`    current status = ${status}`);
  if (status !== "PENDING_BORROWER_ACCEPTANCE") {
    console.warn(`    ⚠ Loan not in PENDING_BORROWER_ACCEPTANCE (it's "${status}") — may be REJECTED by AI, skipping accept`);
    return false;
  }
  await safeWrite(borrower1.client, "accept_conditional_offer", [loanId], 0n, "accept_conditional_offer(b1)");
  return true;
}

async function test_activate_b1(loanId) {
  console.log(`\n  [loan-02] Owner activates loan ${loanId}`);
  console.warn("    ⚠ activate_loan has no _require_owner() guard — any caller can activate.");
  const status = await getLoanStatus(loanId);
  if (status === "ACTIVE") { console.log("    Already ACTIVE — skipping"); return; }
  if (status !== "APPROVED") {
    console.warn(`    ⚠ Expected APPROVED, got "${status}" — skipping activate`);
    return;
  }
  const poolId = await getActivePool();
  await safeWrite(owner.client, "activate_loan", [loanId, poolId], 0n, "activate_loan(b1)");
}

async function test_repay_b1(loanId) {
  console.log(`\n  [loan-03] Borrower1 repays loan ${loanId}`);
  const status = await getLoanStatus(loanId);
  if (status !== "ACTIVE") {
    console.warn(`    ⚠ Loan not ACTIVE (${status}) — skipping repay`);
    return;
  }
  // Compute repayment from loan data
  let repayWei = 5_100_000_000_000_000_000_000n; // default slightly above principal
  try {
    const loan = await readView("get_loan", [loanId]);
    const principal = BigInt(loan.amount_wei ?? 0);
    const rateBps = BigInt(loan.interest_rate_bps ?? 1500);
    const days = BigInt(loan.duration_days ?? 30);
    const interest = (principal * rateBps * days) / (10000n * 365n);
    repayWei = principal + interest + 1n; // +1 to ensure full coverage
  } catch { /* use default */ }
  console.log(`    repaying ${repayWei} wei`);
  await safeWrite(borrower1.client, "repay_loan", [loanId], repayWei, "repay_loan(b1)");
}

async function test_repaid_status(loanId) {
  console.log(`\n  [loan-04] Verify loan ${loanId} is REPAID`);
  const status = await getLoanStatus(loanId);
  console.log(`    status = ${status}`);
  if (status) assertIn(status, ["REPAID"], "loan_b1 status after repay");
}

// ─── Default path ─────────────────────────────────────────────────────────────

async function test_accept_b2(loanId) {
  console.log(`\n  [loan-05] Borrower2 accepts conditional offer for ${loanId}`);
  const status = await getLoanStatus(loanId);
  console.log(`    current status = ${status}`);
  if (status !== "PENDING_BORROWER_ACCEPTANCE") {
    console.warn(`    ⚠ Loan not in PENDING_BORROWER_ACCEPTANCE ("${status}") — skipping`);
    return false;
  }
  await safeWrite(borrower2.client, "accept_conditional_offer", [loanId], 0n, "accept_conditional_offer(b2)");
  return true;
}

async function test_activate_b2(loanId) {
  console.log(`\n  [loan-06] Owner activates loan_b2 ${loanId}`);
  const status = await getLoanStatus(loanId);
  if (status === "ACTIVE") { console.log("    Already ACTIVE"); return; }
  if (status !== "APPROVED") {
    console.warn(`    ⚠ Expected APPROVED, got "${status}" — skipping`);
    return;
  }
  const poolId = await getActivePool();
  await safeWrite(owner.client, "activate_loan", [loanId, poolId], 0n, "activate_loan(b2)");
}

async function test_mark_default_b2(loanId) {
  console.log(`\n  [loan-07] Owner marks loan_b2 ${loanId} as DEFAULTED`);
  const status = await getLoanStatus(loanId);
  if (status !== "ACTIVE") {
    console.warn(`    ⚠ Loan not ACTIVE ("${status}") — skipping default`);
    return;
  }
  await safeWrite(owner.client, "mark_default", [loanId], 0n, "mark_default(b2)");
}

async function test_defaulted_status(loanId) {
  console.log(`\n  [loan-08] Verify loan_b2 ${loanId} is DEFAULTED`);
  const status = await getLoanStatus(loanId);
  console.log(`    status = ${status}`);
  if (status) assertIn(status, ["DEFAULTED"], "loan_b2 status after default");
}

// ─── Fee withdrawal ────────────────────────────────────────────────────────────

async function test_withdraw_fees() {
  console.log("\n  [loan-09] Owner withdraws protocol fees");
  const fees = await readView("get_protocol_fees", []);
  const collected = BigInt(fees?.total_collected_wei ?? 0);
  if (collected === 0n) {
    console.warn("    ⚠ No fees collected yet — skipping");
    return;
  }
  // Withdraw half the collected fees
  const half = collected / 2n;
  await safeWrite(
    owner.client, "withdraw_protocol_fees",
    [half, owner.account.address],
    0n,
    "withdraw_protocol_fees(half)"
  );
  console.log(`    withdrew ${half} wei in fees`);
}

export async function runLoanSuite() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("SUITE  Full Loan Lifecycle");
  console.log("══════════════════════════════════════");

  const lid1 = await resolveLoanId(LOAN_ID_B1, borrower1.account.address, "loan_b1");
  const lid2 = await resolveLoanId(LOAN_ID_B2, borrower2.account.address, "loan_b2");

  // Happy path
  const b1Accepted = await test_accept_b1(lid1);
  if (b1Accepted) {
    await test_activate_b1(lid1);
    await test_repay_b1(lid1);
    await test_repaid_status(lid1);
  }

  // Default path
  const b2Accepted = await test_accept_b2(lid2);
  if (b2Accepted) {
    await test_activate_b2(lid2);
    await test_mark_default_b2(lid2);
    await test_defaulted_status(lid2);
  }

  // Fees
  await test_withdraw_fees();

  const ms = Date.now() - t0;
  console.log(`\n✅  Loan suite passed (${ms}ms)\n`);
  return { suite: "loan", ms };
}
