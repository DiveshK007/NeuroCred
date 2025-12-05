import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy CreditPassportNFT
  const CreditPassportNFT = await ethers.getContractFactory("CreditPassportNFT");
  const passportNFT = await CreditPassportNFT.deploy(deployer.address);
  await passportNFT.waitForDeployment();

  const passportAddress = await passportNFT.getAddress();
  console.log("CreditPassportNFT deployed to:", passportAddress);

  // Get backend wallet address from env (or use deployer for now)
  const backendWalletAddress = process.env.BACKEND_WALLET_ADDRESS || deployer.address;
  
  // Set backend wallet as score updater
  const tx = await passportNFT.setScoreUpdater(backendWalletAddress, true);
  await tx.wait();
  console.log("Score updater role granted to:", backendWalletAddress);

  // Optional: Deploy staking contract if NCRD token address is provided
  if (process.env.NCRD_TOKEN_ADDRESS) {
    const NeuroCredStaking = await ethers.getContractFactory("NeuroCredStaking");
    const staking = await NeuroCredStaking.deploy(
      process.env.NCRD_TOKEN_ADDRESS,
      deployer.address
    );
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("NeuroCredStaking deployed to:", stakingAddress);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("CreditPassportNFT:", passportAddress);
  console.log("Backend Wallet (Score Updater):", backendWalletAddress);
  if (process.env.NCRD_TOKEN_ADDRESS) {
    console.log("NeuroCredStaking:", await staking.getAddress());
  }
  console.log("\nSave these addresses to your .env file!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

