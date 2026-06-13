/**
 * Bucket 1 — Pool lifecycle (deterministic)
 * create_pool(name, target_return_bps, min_credit_score, max_loan_amount_wei, risk_tier)
 * risk_tier: "LOW" | "MEDIUM" | "HIGH"
 */
import { owner, lender1, lender2, lender3 } from "./helpers/client.mjs";
import { safeWrite, readView } from "./helpers/write.mjs";
import { assertEqual, assertGte, assertNonEmpty } from "./helpers/assert.mjs";

const DEPOSIT_WEI = 5_000_000_000_000_000_000n; // 5 GEN

export let POOL_ID_1 = null;
export let POOL_ID_2 = null;

async function test_create_pool_low() {
  console.log("\n  [pool-01] Owner creates pool-1 (LOW risk)");
  const { returnValue } = await safeWrite(
    owner.client, "create_pool",
    [
      "Conservative Pool A",
      500n,    // target_return_bps (5%)
      400n,    // min_credit_score
      10_000_000_000_000_000_000_000n, // max_loan_amount_wei (10k GEN)
      "LOW",
    ],
    0n,
    "create_pool(LOW)"
  );
  POOL_ID_1 = returnValue ?? "pool_1";
  console.log(`    POOL_ID_1 = ${POOL_ID_1}`);
}

async function test_create_pool_high() {
  console.log("\n  [pool-02] Owner creates pool-2 (HIGH risk)");
  const { returnValue } = await safeWrite(
    owner.client, "create_pool",
    [
      "Aggressive Pool B",
      1500n,
      300n,
      5_000_000_000_000_000_000_000n,
      "HIGH",
    ],
    0n,
    "create_pool(HIGH)"
  );
  POOL_ID_2 = returnValue ?? "pool_2";
  console.log(`    POOL_ID_2 = ${POOL_ID_2}`);
}

async function test_deposit_lender1() {
  console.log("\n  [pool-03] Lender1 deposits 5 GEN into pool-1");
  await safeWrite(
    lender1.client, "deposit_liquidity",
    [POOL_ID_1],
    DEPOSIT_WEI,
    "deposit_liquidity(pool1, 5 GEN)"
  );
}

async function test_deposit_lender2() {
  console.log("\n  [pool-04] Lender2 deposits 5 GEN into pool-2");
  await safeWrite(
    lender2.client, "deposit_liquidity",
    [POOL_ID_2],
    DEPOSIT_WEI,
    "deposit_liquidity(pool2, 5 GEN)"
  );
}

async function test_get_pool_state() {
  console.log("\n  [pool-05] Read pool-1 state");
  const pool = await readView("get_pool", [POOL_ID_1]);
  assertNonEmpty(pool, "get_pool result");
  const deposited = BigInt(pool.total_deposited_wei ?? pool.total_deposited ?? 0);
  const depositorCount = Object.keys(pool.depositors ?? {}).length;
  console.log(`    total_deposited=${deposited}  depositors=${depositorCount}`);
  assertEqual(pool.risk_tier, "LOW", "pool1.risk_tier");
  assertEqual(pool.status, "ACTIVE", "pool1.status");
  assertGte(deposited, DEPOSIT_WEI, "pool1.total_deposited >= 5 GEN");
  assertGte(depositorCount, 1, "pool1 has at least 1 depositor");
}

async function test_get_all_pools() {
  console.log("\n  [pool-06] get_all_pools() returns ≥ 2 entries");
  const pools = await readView("get_all_pools", []);
  assertGte(Array.isArray(pools) ? pools.length : 0, 2, "pool count >= 2");
  console.log(`    pool count = ${pools.length}`);
}

async function test_withdraw_partial() {
  console.log("\n  [pool-07] Lender1 withdraws 2 GEN from pool-1");
  await safeWrite(
    lender1.client, "withdraw_liquidity",
    [POOL_ID_1, 2_000_000_000_000_000_000n],
    0n,
    "withdraw_liquidity(pool1, 2 GEN)"
  );
}

async function test_close_pool() {
  console.log("\n  [pool-08] Owner closes pool-2 (no active loans)");
  await safeWrite(
    owner.client, "close_pool",
    [POOL_ID_2],
    0n,
    "close_pool(pool2)"
  );
}

async function test_closed_pool_status() {
  console.log("\n  [pool-09] Pool-2 status should be CLOSED");
  const pool = await readView("get_pool", [POOL_ID_2]);
  assertEqual(pool.status, "CLOSED", "pool2.status after close");
  console.log(`    pool2.status = ${pool.status}`);
}

export async function runPoolSuite() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("SUITE  Pool Lifecycle");
  console.log("══════════════════════════════════════");

  await test_create_pool_low();
  await test_create_pool_high();
  await test_deposit_lender1();
  await test_deposit_lender2();
  await test_get_pool_state();
  await test_get_all_pools();
  await test_withdraw_partial();
  await test_close_pool();
  await test_closed_pool_status();

  const ms = Date.now() - t0;
  console.log(`\n✅  Pool suite passed (${ms}ms)\n`);
  return { suite: "pool", ms };
}
