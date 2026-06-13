/**
 * Load and validate all environment variables required by the test suite.
 * Reads from tests/test.env + root .env.local.
 * Aborts immediately if any required var is missing.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

function loadEnvFile(filePath) {
  try {
    const contents = readFileSync(filePath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // file not found — skip silently
  }
}

// Load both env files (test.env takes precedence over .env.local for test vars)
loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(__dirname, "../test.env"));

function require_env(name) {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    console.error(`\n❌  MISSING ENV VAR: ${name}`);
    console.error(`    Add it to tests/test.env or .env.local and re-run.\n`);
    process.exit(1);
  }
  return val.trim();
}

export const ENV = {
  RPC_URL:            require_env("GENLAYER_RPC_URL"),
  CONTRACT_ADDRESS:   require_env("GENLAYER_CONTRACT_ADDRESS"),
  CHAIN:              process.env.GENLAYER_CHAIN || "studionet",
  OWNER_PK:           require_env("GENLAYER_OWNER_PRIVATE_KEY"),
  LENDER1_PK:         require_env("TEST_LENDER1_PK"),
  LENDER2_PK:         require_env("TEST_LENDER2_PK"),
  LENDER3_PK:         require_env("TEST_LENDER3_PK"),
  BORROWER1_PK:       require_env("TEST_BORROWER1_PK"),
  BORROWER2_PK:       require_env("TEST_BORROWER2_PK"),
  BORROWER3_PK:       require_env("TEST_BORROWER3_PK"),
};
