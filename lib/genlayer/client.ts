/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient, chains, createAccount } = require("genlayer-js");
const crypto = require("crypto");

type GenLayerClientInstance = ReturnType<typeof createClient>;

// ── Chain selection ──────────────────────────────────────────────────────────

function getChain() {
  const name = process.env.GENLAYER_CHAIN || "localnet";
  if (name === "studionet") return chains.studionet;
  if (name === "testnetAsimov") return chains.testnetAsimov;
  if (name === "testnetBradbury") return chains.testnetBradbury;
  return chains.localnet;
}

const BASE_CONFIG = {
  chain: getChain(),
  endpoint: process.env.GENLAYER_RPC_URL || "http://localhost:4000/api",
};

// ── Read-only singleton client (no account needed) ───────────────────────────

let readClient: GenLayerClientInstance | null = null;

function getReadClient(): GenLayerClientInstance {
  if (!readClient) {
    readClient = createClient(BASE_CONFIG);
  }
  return readClient;
}

// ── Per-user account derivation ───────────────────────────────────────────────
// Each user wallet gets a deterministic private key derived from the master secret.
// This ensures the GenLayer contract's self._caller() always maps to the same
// address for a given user wallet — enabling true multi-user support.

function derivePrivateKeyForWallet(userWallet: string): `0x${string}` {
  const master = process.env.GENLAYER_PRIVATE_KEY || "default-insecure-secret";
  const hash = crypto
    .createHmac("sha256", master)
    .update(userWallet.toLowerCase())
    .digest("hex");
  return `0x${hash}` as `0x${string}`;
}

export function deriveGenLayerAddress(userWallet: string): string {
  const pk = derivePrivateKeyForWallet(userWallet);
  const account = createAccount(pk);
  return account.address as string;
}

function getUserClient(userWallet: string): GenLayerClientInstance {
  const pk = derivePrivateKeyForWallet(userWallet);
  const account = createAccount(pk);
  return createClient({ ...BASE_CONFIG, account });
}

// ── Owner client (privileged admin operations) ───────────────────────────────
// Signs with the deployer's private key so self._require_owner() on the
// contract succeeds. Required for create_pool, close_pool, activate_loan,
// mark_default, withdraw_protocol_fees.

let ownerClient: GenLayerClientInstance | null = null;

function getOwnerClient(): GenLayerClientInstance {
  if (!ownerClient) {
    const pk = process.env.GENLAYER_OWNER_PRIVATE_KEY;
    if (!pk || pk.trim() === "") {
      throw new Error(
        "GENLAYER_OWNER_PRIVATE_KEY is not set. Owner-only operations are disabled."
      );
    }
    const account = createAccount(pk as `0x${string}`);
    ownerClient = createClient({ ...BASE_CONFIG, account });
  }
  return ownerClient;
}

export const OWNER_ADDRESS = (
  process.env.GENLAYER_OWNER_ADDRESS ||
  process.env.NEXT_PUBLIC_OWNER_ADDRESS ||
  "0x0000000000000000000000000000000000000000"
).toLowerCase();

export function isOwnerWallet(wallet: string): boolean {
  return !!wallet && wallet.toLowerCase() === OWNER_ADDRESS;
}

// ── Contract address ─────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS =
  (process.env.GENLAYER_CONTRACT_ADDRESS as `0x${string}`) ||
  ("0x0000000000000000000000000000000000000000" as `0x${string}`);

// ── Read (view) helper ───────────────────────────────────────────────────────

export async function readContract<T>(
  method: string,
  args: unknown[] = []
): Promise<T> {
  const gl = getReadClient();
  const result = await (gl as unknown as {
    readContract: (params: { address: `0x${string}`; functionName: string; args: unknown[] }) => Promise<unknown>
  }).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
  return result as T;
}

// ── Write helper ─────────────────────────────────────────────────────────────
// Uses a per-user derived account so the contract's self._caller() maps to
// a unique, stable address per user wallet.
// Pass `value` (in wei as bigint) for @gl.public.write.payable functions.

export async function writeContract(
  method: string,
  args: unknown[],
  userWallet: `0x${string}`,
  value?: bigint
): Promise<{ hash: string }> {
  const client = getUserClient(userWallet);
  const params: {
    address: `0x${string}`;
    functionName: string;
    args: unknown[];
    value?: bigint;
  } = { address: CONTRACT_ADDRESS, functionName: method, args };
  if (value !== undefined) params.value = value;

  const hash = await (client as unknown as {
    writeContract: (p: typeof params) => Promise<string>;
  }).writeContract(params);
  return { hash };
}

// ── Owner write helper ──────────────────────────────────────────────────────
// Used by /api/admin/* routes for privileged operations.

export async function writeAsOwner(
  method: string,
  args: unknown[],
  value?: bigint
): Promise<{ hash: string }> {
  const client = getOwnerClient();
  const params: {
    address: `0x${string}`;
    functionName: string;
    args: unknown[];
    value?: bigint;
  } = { address: CONTRACT_ADDRESS, functionName: method, args };
  if (value !== undefined) params.value = value;

  const hash = await (client as unknown as {
    writeContract: (p: typeof params) => Promise<string>;
  }).writeContract(params);
  return { hash };
}

// ── Wait for consensus ───────────────────────────────────────────────────────

export async function waitForTransaction(txResult: { hash: string }): Promise<{ hash: string; return_value: unknown }> {
  const gl = getReadClient();
  try {
    const receipt = await (gl as unknown as {
      waitForTransactionReceipt: (params: { hash: string; retries?: number }) => Promise<{ hash: string; return_value: unknown }>
    }).waitForTransactionReceipt({ hash: txResult.hash, retries: 20 });
    return receipt;
  } catch {
    return { hash: txResult.hash, return_value: null };
  }
}
