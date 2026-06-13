#!/usr/bin/env node
/**
 * test-all.mjs — Master test runner
 *
 * Usage:
 *   node tests/test-all.mjs              # run all suites
 *   node tests/test-all.mjs pool         # run only the pool suite
 *   node tests/test-all.mjs pool revert  # run pool + revert suites
 *
 * Exits non-zero on first suite failure.
 * Prints a final summary table with per-suite wall-clock times.
 */

import { ENV } from "./helpers/env.mjs";
import { CONTRACT } from "./helpers/client.mjs";
import { runStep0 } from "./step0-sanity.mjs";
import { runPoolSuite } from "./suite-pool.mjs";
import { runBorrowerSuite } from "./suite-borrower.mjs";
import { runRevertSuite } from "./suite-reverts.mjs";
import { runNonDetSuite } from "./suite-nondet.mjs";
import { runLoanSuite } from "./suite-loan.mjs";

const ALL_SUITES = [
  { key: "sanity",   label: "Step 0 Sanity",               run: runStep0 },
  { key: "pool",     label: "Pool Lifecycle",               run: runPoolSuite },
  { key: "borrower", label: "Borrower Profile CRUD",        run: runBorrowerSuite },
  { key: "revert",   label: "Revert / Access Control",      run: runRevertSuite },
  { key: "nondet",   label: "Non-Deterministic AI",         run: runNonDetSuite },
  { key: "loan",     label: "Full Loan Lifecycle",          run: runLoanSuite },
];

const filter = process.argv.slice(2).map(a => a.toLowerCase());

function shouldRun(key) {
  if (filter.length === 0) return true;
  return filter.some(f => key.startsWith(f));
}

const results = [];
let anyFailed = false;

const totalStart = Date.now();

console.log("\n╔══════════════════════════════════════╗");
console.log("║   CredLayer E2E Test Suite           ║");
console.log("╠══════════════════════════════════════╣");
console.log(`║ Network  : ${(ENV.CHAIN ?? "studionet").padEnd(26)}║`);
console.log(`║ Contract : ${CONTRACT.slice(0, 26).padEnd(26)}║`);
console.log("╚══════════════════════════════════════╝\n");

for (const suite of ALL_SUITES) {
  if (!shouldRun(suite.key)) {
    results.push({ label: suite.label, status: "SKIP", ms: 0 });
    continue;
  }

  const t0 = Date.now();
  try {
    await suite.run();
    const ms = Date.now() - t0;
    results.push({ label: suite.label, status: "PASS", ms });
  } catch (err) {
    const ms = Date.now() - t0;
    results.push({ label: suite.label, status: "FAIL", ms });
    console.error(`\n❌  Suite "${suite.label}" FAILED after ${ms}ms`);
    console.error(`    ${err.message}`);
    if (err.stderr) console.error(`    stderr: ${err.stderr}`);
    anyFailed = true;
    break; // stop on first failure
  }
}

// ─── Summary table ────────────────────────────────────────────────────────────
const totalMs = Date.now() - totalStart;

console.log("\n══════════════════════════════════════════════════════");
console.log("  RESULTS");
console.log("══════════════════════════════════════════════════════");

const labelWidth = Math.max(...results.map(r => r.label.length), 20);
for (const r of results) {
  const icon  = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : "⏭ ";
  const time  = r.status === "SKIP" ? "—" : `${(r.ms / 1000).toFixed(1)}s`;
  console.log(`  ${icon}  ${r.label.padEnd(labelWidth)}  ${time.padStart(7)}`);
}

console.log("──────────────────────────────────────────────────────");
console.log(`  Total: ${(totalMs / 1000).toFixed(1)}s`);
console.log(`  Contract: ${CONTRACT}`);
console.log(`  Network:  ${ENV.CHAIN ?? "studionet"}`);
console.log("══════════════════════════════════════════════════════\n");

process.exit(anyFailed ? 1 : 0);
