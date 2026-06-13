/**
 * Creates genlayer-js clients from private keys.
 * Uses createAccount (not viem's privateKeyToAccount) because genlayer-js
 * has its own account type.
 */
import { createClient, chains, createAccount } from "genlayer-js";
import { ENV } from "./env.mjs";

function getChain() {
  if (ENV.CHAIN === "studionet")       return chains.studionet;
  if (ENV.CHAIN === "testnetAsimov")   return chains.testnetAsimov;
  if (ENV.CHAIN === "testnetBradbury") return chains.testnetBradbury;
  return chains.studionet;
}

const BASE = { chain: getChain(), endpoint: ENV.RPC_URL };

/** Read-only client — no account needed */
export const readClient = createClient(BASE);

/** Create a signing client from a raw private key hex string */
export function clientFromPk(pk) {
  const account = createAccount(pk);
  return { client: createClient({ ...BASE, account }), account };
}

/** Pre-built clients for each test wallet */
export const owner    = clientFromPk(ENV.OWNER_PK);
export const lender1  = clientFromPk(ENV.LENDER1_PK);
export const lender2  = clientFromPk(ENV.LENDER2_PK);
export const lender3  = clientFromPk(ENV.LENDER3_PK);
export const borrower1 = clientFromPk(ENV.BORROWER1_PK);
export const borrower2 = clientFromPk(ENV.BORROWER2_PK);
export const borrower3 = clientFromPk(ENV.BORROWER3_PK);

export const CONTRACT = ENV.CONTRACT_ADDRESS;
