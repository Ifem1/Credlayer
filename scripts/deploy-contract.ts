/**
 * Deploy the CredLayer Intelligent Contract to GenLayer
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/deploy-contract.ts
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient, chains } = require("genlayer-js");
import * as fs from "fs";
import * as path from "path";

async function deploy() {
  const rpcUrl = process.env.GENLAYER_RPC_URL || "http://localhost:4000/api";
  console.log("Connecting to GenLayer at:", rpcUrl);

  const client = createClient({ chain: chains.localnet, endpoint: rpcUrl });

  const contractPath = path.join(__dirname, "..", "contracts", "credlayer.py");
  const contractCode = fs.readFileSync(contractPath, "utf-8");

  const deployerAddress = process.env.DEPLOYER_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("Deploying CredLayer contract...");
  const hash = await client.deployContract({
    code: contractCode,
    args: [],
    account: deployerAddress,
  });

  console.log("Deployment transaction hash:", hash);
  const receipt = await client.waitForTransactionReceipt({ hash, retries: 30 });
  const contractAddress = (receipt as Record<string, unknown>).contract_address as string;

  console.log("\n✅ CredLayer deployed successfully!");
  console.log("Contract address:", contractAddress);
  console.log("\nAdd to .env.local:");
  console.log(`GENLAYER_CONTRACT_ADDRESS=${contractAddress}`);

  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("GENLAYER_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(/GENLAYER_CONTRACT_ADDRESS=.*/, `GENLAYER_CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nGENLAYER_CONTRACT_ADDRESS=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log("Updated .env.local automatically.");
  }
}

deploy().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
