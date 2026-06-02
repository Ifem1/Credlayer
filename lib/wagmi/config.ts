import { createConfig, http } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";
import { defineChain } from "viem";

// GenLayer Studionet — chain 61999
// Standard EVM-compatible JSON-RPC, MetaMask can connect natively.
export const genLayerStudionet = defineChain({
  id: 61999,
  name: "Genlayer Studio Network",
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
  },
});

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, hardhat, genLayerStudionet],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http("http://localhost:8545"),
    [genLayerStudionet.id]: http("https://studio.genlayer.com/api"),
  },
});

// Chain params for wallet_addEthereumChain (EIP-3085)
export const GENLAYER_CHAIN_PARAMS = {
  chainId: "0xF26F",              // 61999
  chainName: "Genlayer Studio Network",
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: [],
} as const;
