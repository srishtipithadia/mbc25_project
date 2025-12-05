export const clubTreasuryAbi = [
  // getTreasuryBalance() -> uint256
  {
    inputs: [],
    name: "treasuryBalanceUSDC",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // voteOnProposal(uint256 proposalId, bool support)
  {
    inputs: [
      { internalType: "uint256", name: "proposalId", type: "uint256" },
      { internalType: "bool", name: "support", type: "bool" },
    ],
    name: "voteOnProposal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // markAttendance(bytes32 code)
  {
    inputs: [{ internalType: "bytes32", name: "code", type: "bytes32" }],
    name: "markAttendance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
