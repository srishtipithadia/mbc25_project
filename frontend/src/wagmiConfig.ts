// src/wagmiConfig.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";
import { http } from "viem";

export const wagmiConfig = getDefaultConfig({
  appName: "PoolParty",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(
      import.meta.env.VITE_BASE_SEPOLIA_RPC_URL as string
    ),
  },
});
