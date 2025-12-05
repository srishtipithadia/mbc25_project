const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error("USDC_ADDRESS not set in .env");
  }

  const initialAdminsEnv = process.env.INITIAL_ADMINS || "";
  const initialAdmins = initialAdminsEnv
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  console.log("Deploying ClubTreasuryUSDC...");
  console.log("USDC:", usdcAddress);
  console.log("Initial admins:", initialAdmins);

  const ClubTreasuryUSDC = await hre.ethers.getContractFactory(
    "ClubTreasuryUSDC"
  );
  const contract = await ClubTreasuryUSDC.deploy(usdcAddress, initialAdmins);

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("ClubTreasuryUSDC deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
