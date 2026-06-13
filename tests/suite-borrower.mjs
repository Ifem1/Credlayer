/**
 * Bucket 1 — Borrower profile CRUD (deterministic)
 *
 * create_borrower_profile(full_name, email_hash, country, occupation, monthly_income_usd, loan_purpose)
 * update_borrower_profile(full_name, occupation, monthly_income_usd, loan_purpose)
 * View: get_borrower(wallet)
 */
import { borrower1, borrower2, borrower3, lender1 } from "./helpers/client.mjs";
import { safeWrite, expectRevert, readView } from "./helpers/write.mjs";
import { assertEqual, assertNonEmpty } from "./helpers/assert.mjs";

const PROFILES = [
  {
    signer: borrower1,
    full_name: "Alice Tester",
    email_hash: "hash_alice_test",
    country: "US",
    occupation: "Software Engineer",
    monthly_income_usd: 5000n,
    loan_purpose: "Home improvement",
  },
  {
    signer: borrower2,
    full_name: "Bob Tester",
    email_hash: "hash_bob_test",
    country: "US",
    occupation: "Freelance Designer",
    monthly_income_usd: 3500n,
    loan_purpose: "Education",
  },
  {
    signer: borrower3,
    full_name: "Carol Tester",
    email_hash: "hash_carol_test",
    country: "CA",
    occupation: "Part-time Developer",
    monthly_income_usd: 2500n,
    loan_purpose: "Business startup",
  },
];

async function test_create_profiles() {
  for (let i = 0; i < PROFILES.length; i++) {
    const p = PROFILES[i];
    console.log(`\n  [borrower-0${i + 1}] Create profile for ${p.full_name}`);
    await safeWrite(
      p.signer.client,
      "create_borrower_profile",
      [p.full_name, p.email_hash, p.country, p.occupation, p.monthly_income_usd, p.loan_purpose],
      0n,
      `create_borrower_profile(${p.full_name})`
    );
  }
}

async function test_read_profiles() {
  for (let i = 0; i < PROFILES.length; i++) {
    const p = PROFILES[i];
    console.log(`\n  [borrower-0${4 + i}] Read profile for ${p.full_name}`);
    const profile = await readView("get_borrower", [p.signer.account.address]);
    assertNonEmpty(profile, `profile for ${p.full_name}`);
    assertEqual(profile.full_name, p.full_name, `profile.full_name`);
    assertEqual(profile.kyc_status, "PENDING", "initial kyc_status");
    console.log(`    ✓ full_name="${profile.full_name}" kyc_status="${profile.kyc_status}"`);
  }
}

async function test_update_profile() {
  console.log("\n  [borrower-07] Borrower1 updates occupation + income");
  await safeWrite(
    borrower1.client,
    "update_borrower_profile",
    ["Alice Tester", "Senior Engineer", 7500n, "Home renovation"],
    0n,
    "update_borrower_profile(Alice)"
  );
  const profile = await readView("get_borrower", [borrower1.account.address]);
  assertEqual(Number(profile.monthly_income_usd), 7500, "Alice updated income");
  assertEqual(profile.occupation, "Senior Engineer", "Alice updated occupation");
  console.log(`    ✓ income=${profile.monthly_income_usd} occupation="${profile.occupation}"`);
}

async function test_duplicate_profile_reverts() {
  console.log("\n  [borrower-08] Duplicate create_borrower_profile should revert");
  await expectRevert(
    borrower1.client,
    "create_borrower_profile",
    ["Alice Tester", "hash_alice_test", "US", "Senior Engineer", 7500n, "Home renovation"],
    0n,
    "already exists"
  );
}

async function test_update_nonexistent_reverts() {
  // lender1 has no borrower profile
  console.log("\n  [borrower-09] update_borrower_profile without profile should revert");
  await expectRevert(
    lender1.client,
    "update_borrower_profile",
    ["Ghost User", "None", 0n, "None"],
    0n,
    "not found"
  );
}

export async function runBorrowerSuite() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("SUITE  Borrower Profile CRUD");
  console.log("══════════════════════════════════════");

  await test_create_profiles();
  await test_read_profiles();
  await test_update_profile();
  await test_duplicate_profile_reverts();
  await test_update_nonexistent_reverts();

  const ms = Date.now() - t0;
  console.log(`\n✅  Borrower suite passed (${ms}ms)\n`);
  return { suite: "borrower", ms };
}
