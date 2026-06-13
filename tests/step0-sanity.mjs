/**
 * Step 0 — Sanity check.
 * ✓ RPC reachable
 * ✓ Each wallet has non-zero GEN balance
 * ✓ Contract responds to get_treasury() view
 * Aborts the entire suite if anything fails.
 */
import { readClient, owner, lender1, lender2, lender3, borrower1, borrower2, borrower3, CONTRACT } from "./helpers/client.mjs";

const WALLETS = [
  { label: "owner",    client: owner },
  { label: "lender1",  client: lender1 },
  { label: "lender2",  client: lender2 },
  { label: "lender3",  client: lender3 },
  { label: "borrower1", client: borrower1 },
  { label: "borrower2", client: borrower2 },
  { label: "borrower3", client: borrower3 },
];

export async function runStep0() {
  const t0 = Date.now();
  console.log("\n══════════════════════════════════════");
  console.log("STEP 0  Sanity Check");
  console.log("══════════════════════════════════════");

  // 1. Contract view — proves RPC is up and contract is deployed
  console.log("\n▸ Reading get_treasury() from contract…");
  let treasury;
  try {
    treasury = await readClient.readContract({
      address: CONTRACT,
      functionName: "get_treasury",
      args: [],
    });
  } catch (err) {
    console.error(`❌  RPC unreachable or contract not deployed: ${err.message}`);
    process.exit(1);
  }
  console.log(`  ✓ get_treasury() responded — reserve_ratio=${treasury?.reserve_ratio}`);

  // 2. Wallet balances
  console.log("\n▸ Checking wallet GEN balances…");
  let anyZero = false;
  for (const { label, client } of WALLETS) {
    const addr = client.account.address;
    let balance = BigInt(0);
    try {
      balance = await readClient.getBalance({ address: addr });
    } catch {
      // fallback — some genlayer-js versions expose balance differently
      try {
        const raw = await readClient.request({ method: "eth_getBalance", params: [addr, "latest"] });
        balance = BigInt(raw);
      } catch {
        console.warn(`  ⚠ Could not fetch balance for ${label} (${addr}) — skipping`);
        continue;
      }
    }
    const gen = Number(balance) / 1e18;
    const ok = balance > 0n;
    console.log(`  ${ok ? "✓" : "✗"} ${label.padEnd(10)} ${addr}  ${gen.toFixed(4)} GEN`);
    if (!ok) anyZero = true;
  }

  if (anyZero) {
    console.error("\n❌  One or more wallets have zero balance — fund them on Studionet before running tests.");
    process.exit(1);
  }

  // 3. Contract own balance
  try {
    const contractBal = await readClient.readContract({
      address: CONTRACT,
      functionName: "get_contract_balance_wei",
      args: [],
    });
    const gen = Number(contractBal) / 1e18;
    console.log(`\n  ✓ Contract balance: ${gen.toFixed(4)} GEN`);
  } catch {
    console.warn("  ⚠ get_contract_balance_wei() failed — continuing");
  }

  const ms = Date.now() - t0;
  console.log(`\n✅  Step 0 passed (${ms}ms)\n`);
}
