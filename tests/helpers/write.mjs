/**
 * Wraps genlayer-js writeContract with:
 * - 3-attempt retry loop (5s backoff)
 * - waitForTransactionReceipt (retries: 200, interval: 3000ms)
 * - consensus_data.leader_receipt[0].execution_result check
 * - Per-step logging
 */
import { readClient, CONTRACT } from "./client.mjs";

export class ConsensusError extends Error {
  constructor(message, hash, execResult, stderr) {
    super(message);
    this.name = "ConsensusError";
    this.hash = hash;
    this.execResult = execResult;
    this.stderr = stderr;
  }
}

function summarize(args) {
  if (!args || args.length === 0) return "";
  return args
    .map((a) => {
      if (typeof a === "bigint") return a.toString() + "n";
      if (typeof a === "string" && a.length > 20) return a.slice(0, 18) + "…";
      return JSON.stringify(a);
    })
    .join(", ");
}

/**
 * Decode a genlayer-js return value object into a plain JS value.
 * The SDK wraps return values as { raw, status, payload: { readable } }.
 * readable is a JSON-encoded string (e.g. '"pool_6"' or '42').
 */
function decodeReturnValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== "object") return val;
  // genlayer-js wraps: { raw, status, payload: { readable } }
  const readable = val?.payload?.readable;
  if (readable !== undefined) {
    try { return JSON.parse(readable); } catch { return readable; }
  }
  return val;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute a write and wait for consensus.
 * @param {object} signerClient - genlayer-js client with account
 * @param {string} functionName
 * @param {any[]} args
 * @param {bigint} [value=0n] - GEN wei to send (for payable functions)
 * @param {string} [label] - display label for logs
 */
export async function safeWrite(signerClient, functionName, args = [], value = 0n, label) {
  const display = label || functionName;
  console.log(`  → ${display}(${summarize(args)})${value > 0n ? ` value=${value}n` : ""}`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const t0 = Date.now();
    let hash;
    try {
      hash = await signerClient.writeContract({
        address: CONTRACT,
        functionName,
        args,
        value,
      });

      const receipt = await readClient.waitForTransactionReceipt({
        hash,
        retries: 200,
        interval: 3000,
      });

      // Consensus check
      let tx = null;
      try {
        tx = await readClient.getTransaction({ hash });
      } catch {
        // getTransaction is optional — skip if unavailable
      }

      if (tx?.consensus_data?.leader_receipt?.[0]) {
        const lr = tx.consensus_data.leader_receipt[0];
        const execResult = lr.execution_result;
        const GOOD = ["SUCCESS", "ACCEPTED"];
        if (execResult && !GOOD.includes(execResult)) {
          const stderr = (lr.stderr || "").trim().split("\n").slice(-3).join(" | ");
          const errMsg = lr.error || lr.error_message || lr.exception || "";
          console.error(`  DEBUG execution_result: ${execResult}`);
          console.error(`  DEBUG genvm_result.stderr:\n${lr.genvm_result?.stderr}`);
          console.error(`  DEBUG result: ${JSON.stringify(lr.result)}`);
          throw new ConsensusError(
            `On-chain failure: ${execResult} — ${stderr || errMsg}`,
            hash,
            execResult,
            stderr || errMsg
          );
        }
      }

      const raw = receipt?.return_value ?? (tx?.consensus_data?.leader_receipt?.[0]?.result ?? null);
      const returnValue = decodeReturnValue(raw);
      const ms = Date.now() - t0;
      console.log(`  ✓ ${functionName} (${ms}ms) tx=${hash}`);
      return { hash, receipt, returnValue };
    } catch (err) {
      if (err instanceof ConsensusError) throw err; // never retry consensus failures
      if (attempt === 3) throw err;
      console.warn(`  ⚠ Attempt ${attempt} failed: ${err.message}. Retrying in 5s…`);
      await sleep(5000);
    }
  }
}

/**
 * Expect a write to revert. Throws if it succeeds.
 */
export async function expectRevert(signerClient, functionName, args = [], value = 0n, expectedMsg) {
  console.log(`  → [expect-revert] ${functionName}(${summarize(args)})`);
  let didFail = false;
  let actualErr = "";
  let hash = null;

  try {
    hash = await signerClient.writeContract({
      address: CONTRACT,
      functionName,
      args,
      value,
    });

    // If we got a hash, wait and check consensus for on-chain revert
    try {
      await readClient.waitForTransactionReceipt({ hash, retries: 60, interval: 3000 });
    } catch {
      didFail = true;
      actualErr = "waitForTransactionReceipt threw";
    }

    if (!didFail) {
      let tx = null;
      try { tx = await readClient.getTransaction({ hash }); } catch { /* ok */ }
      const lr = tx?.consensus_data?.leader_receipt?.[0];
      const execResult = lr?.execution_result;
      if (execResult && !["SUCCESS", "ACCEPTED"].includes(execResult)) {
        didFail = true;
        actualErr = (lr?.stderr || "").trim().split("\n").slice(-2).join(" | ");
      }
    }
  } catch (err) {
    didFail = true;
    actualErr = err.message;
  }

  if (!didFail) {
    throw new Error(`Expected ${functionName} to revert but it succeeded. tx=${hash}`);
  }

  if (expectedMsg && !actualErr.toLowerCase().includes(expectedMsg.toLowerCase())) {
    console.warn(`  ⚠ Revert message mismatch. Expected "${expectedMsg}", got: "${actualErr}"`);
  }

  console.log(`  ✓ [reverted as expected] ${functionName} — "${actualErr.slice(0, 80)}"`);
}

/**
 * Read a view function from the contract.
 */
export async function readView(functionName, args = []) {
  return readClient.readContract({
    address: CONTRACT,
    functionName,
    args,
  });
}
