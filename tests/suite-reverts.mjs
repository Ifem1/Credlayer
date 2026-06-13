/**
 * Bucket 2 — Revert / access-control paths
 * Every test expects the call to fail.
 */
import { owner, lender1, lender2, lender3, borrower1, borrower3 } from "./helpers/client.mjs";
import { expectRevert, readView } from "./helpers/write.mjs";

// ─── Pool reverts ─────────────────────────────────────────────────────────────

async function test_non_owner_create_pool() {
  console.log("\n  [revert-01] Non-owner create_pool should revert");
  await expectRevert(
    lender1.client, "create_pool",
    ["Hack Pool", 500n, 400n, 1_000_000_000_000_000_000_000n, "LOW"],
    0n,
    "owner"
  );
}

async function test_invalid_risk_tier() {
  console.log("\n  [revert-02] create_pool with invalid risk tier should revert");
  await expectRevert(
    owner.client, "create_pool",
    ["Bad Pool", 500n, 400n, 1_000_000_000_000_000_000_000n, "ULTRA_MOON"],
    0n,
    "Invalid risk tier"
  );
}

async function test_deposit_nonexistent_pool() {
  console.log("\n  [revert-03] deposit_liquidity to nonexistent pool should revert");
  await expectRevert(
    lender1.client, "deposit_liquidity",
    ["pool_9999"],
    1_000_000_000_000_000_000n,
    ""
  );
}

async function test_withdraw_exceeds_balance() {
  console.log("\n  [revert-05] withdraw_liquidity more than deposited should revert");
  let pid = "pool_1";
  try {
    const pools = await readView("get_all_pools", []);
    const open = pools.find(p => p.status === "ACTIVE");
    if (open) pid = open.pool_id;
  } catch { /* ok */ }
  // lender3 never deposited
  await expectRevert(
    lender3.client, "withdraw_liquidity",
    [pid, 10_000_000_000_000_000_000n],
    0n,
    ""
  );
}

async function test_close_nonexistent_pool() {
  console.log("\n  [revert-06] close_pool for nonexistent pool should revert");
  await expectRevert(
    owner.client, "close_pool",
    ["pool_9999"],
    0n,
    ""
  );
}

async function test_non_owner_close_pool() {
  console.log("\n  [revert-07] Non-owner close_pool should revert");
  let pid = "pool_1";
  try {
    const pools = await readView("get_all_pools", []);
    const open = pools.find(p => p.status === "ACTIVE");
    if (open) pid = open.pool_id;
  } catch { /* ok */ }
  await expectRevert(
    lender1.client, "close_pool",
    [pid],
    0n,
    "owner"
  );
}

// ─── Loan reverts ──────────────────────────────────────────────────────────────

async function test_request_loan_no_kyc() {
  // borrower3 has a profile but no KYC at this point (suite-nondet hasn't run)
  console.log("\n  [revert-08] request_loan without VERIFIED KYC should revert");
  await expectRevert(
    borrower3.client, "request_loan",
    [
      2_000_000_000_000_000_000_000n, // amount_wei
      30n,     // duration_days
      "PERSONAL",
      "Buy a laptop",
      0n,      // collateral_amount_wei
      365n,    // wallet_age_days
      100n,    // total_transactions
      1000n,   // avg_balance_usd
      0n,      // github_contributions
      0n,      // dao_votes
      "hash_no_docs",
    ],
    0n,
    "KYC"
  );
}

async function test_request_loan_invalid_type() {
  console.log("\n  [revert-09] request_loan with invalid loan type should revert");
  await expectRevert(
    borrower1.client, "request_loan",
    [
      2_000_000_000_000_000_000_000n,
      30n,
      "MOON_LOAN",
      "Buy a rocket",
      0n, 365n, 100n, 1000n, 0n, 0n,
      "hash_no_docs",
    ],
    0n,
    "Invalid loan type"
  );
}

async function test_request_loan_no_profile() {
  // lender1 has no borrower profile
  console.log("\n  [revert-10] request_loan without borrower profile should revert");
  await expectRevert(
    lender1.client, "request_loan",
    [
      1_000_000_000_000_000_000_000n,
      30n,
      "PERSONAL",
      "Test",
      0n, 365n, 100n, 1000n, 0n, 0n,
      "hash_test",
    ],
    0n,
    "not found"
  );
}

async function test_accept_loan_wrong_caller() {
  // owner tries to accept on behalf of borrower — only the borrower can accept
  console.log("\n  [revert-11] Owner calling accept_conditional_offer should revert");
  await expectRevert(
    owner.client, "accept_conditional_offer",
    ["loan_9999_0x000000"],
    0n,
    ""
  );
}

async function test_cancel_nonexistent_loan() {
  console.log("\n  [revert-12] cancel_loan_request for nonexistent loan should revert");
  await expectRevert(
    borrower1.client, "cancel_loan_request",
    ["loan_9999_0x000000"],
    0n,
    ""
  );
}

async function test_mark_default_wrong_caller() {
  console.log("\n  [revert-13] Non-owner mark_default should revert");
  await expectRevert(
    lender1.client, "mark_default",
    ["loan_9999_0x000000"],
    0n,
    "owner"
  );
}

async function test_withdraw_fees_wrong_caller() {
  console.log("\n  [revert-14] Non-owner withdraw_protocol_fees should revert");
  await expectRevert(
    lender1.client, "withdraw_protocol_fees",
    [1_000_000_000_000_000_000n, lender1.account.address],
    0n,
    "owner"
  );
}

export async function runRevertSuite() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("SUITE  Revert / Access Control");
  console.log("══════════════════════════════════════");

  await test_non_owner_create_pool();
  await test_invalid_risk_tier();
  await test_deposit_nonexistent_pool();
  await test_withdraw_exceeds_balance();
  await test_close_nonexistent_pool();
  await test_non_owner_close_pool();
  await test_request_loan_no_kyc();
  await test_request_loan_invalid_type();
  await test_request_loan_no_profile();
  await test_accept_loan_wrong_caller();
  await test_cancel_nonexistent_loan();
  await test_mark_default_wrong_caller();
  await test_withdraw_fees_wrong_caller();

  const ms = Date.now() - t0;
  console.log(`\n✅  Revert suite passed (${ms}ms)\n`);
  return { suite: "reverts", ms };
}
