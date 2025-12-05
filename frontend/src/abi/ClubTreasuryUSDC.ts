// src/abi/ClubTreasuryUSDC.ts
export const CLUB_TREASURY_ADDRESS = import.meta.env
  .VITE_CLUB_TREASURY_ADDRESS as `0x${string}`;

export const USDC_ADDRESS = import.meta.env
  .VITE_USDC_ADDRESS as `0x${string}`;

// Minimal ABI for the front-end features we need
export const CLUB_TREASURY_ABI = [
  // treasuryBalanceUSDC() -> uint256
  {
    type: "function",
    name: "treasuryBalanceUSDC",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  // depositUSDC(uint256 amount)
  {
    type: "function",
    name: "depositUSDC",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  // checkIn(uint256 eventId, string code, bytes32 salt)
  {
    type: "function",
    name: "checkIn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "eventId", type: "uint256" },
      { name: "code", type: "string" },
      { name: "salt", type: "bytes32" },
    ],
    outputs: [],
  },
] as const;
