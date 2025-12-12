import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env") });

async function main() {
  console.log("🚀 Starting NeuroCred full deployment...\n");

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);

  console.log("👤 Deploying with account:", deployer.address);
  console.log("💰 Account balance:", balanceEth, "QIE\n");

  if (parseFloat(balanceEth) < 0.01) {
    console.warn("⚠️  Warning: Low balance! You may need more QIE for gas fees.");
  }

  try {
    // 1. Deploy CreditPassportNFT
    console.log("📝 [1/3] Deploying CreditPassportNFT...");
    const CreditPassportNFT = await ethers.getContractFactory("CreditPassportNFT");
    const passportNFT = await CreditPassportNFT.deploy(deployer.address);
    await passportNFT.waitForDeployment();
    const passportAddress = await passportNFT.getAddress();
    console.log("✅ CreditPassportNFT deployed to:", passportAddress);

    // 2. Deploy NeuroCredStaking (requires NCRD token address)
    console.log("\n📝 [2/3] Deploying NeuroCredStaking...");
    const ncrdTokenAddress = process.env.NCRD_TOKEN_ADDRESS;
    
    if (!ncrdTokenAddress || ncrdTokenAddress === "0x0000000000000000000000000000000000000000") {
      console.warn("⚠️  NCRD_TOKEN_ADDRESS not set. Skipping NeuroCredStaking deployment.");
      console.log("   To deploy later: Set NCRD_TOKEN_ADDRESS in .env and run deploy script again.");
      console.log("   Or create token via QIEDex and update .env");
    } else {
      if (!ethers.isAddress(ncrdTokenAddress)) {
        throw new Error(`Invalid NCRD_TOKEN_ADDRESS: ${ncrdTokenAddress}`);
      }

      const NeuroCredStaking = await ethers.getContractFactory("NeuroCredStaking");
      const staking = await NeuroCredStaking.deploy(ncrdTokenAddress, deployer.address);
      await staking.waitForDeployment();
      const stakingAddress = await staking.getAddress();
      console.log("✅ NeuroCredStaking deployed to:", stakingAddress);
    }

    // 3. Deploy DemoLender
    console.log("\n📝 [3/3] Deploying DemoLender...");
    const DemoLender = await ethers.getContractFactory("DemoLender");
    const lender = await DemoLender.deploy(passportAddress);
    await lender.waitForDeployment();
    const lenderAddress = await lender.getAddress();
    console.log("✅ DemoLender deployed to:", lenderAddress);

    // Grant SCORE_UPDATER_ROLE to backend if address is provided
    const backendAddress = process.env.BACKEND_ADDRESS || process.env.BACKEND_WALLET_ADDRESS;
    if (backendAddress && ethers.isAddress(backendAddress)) {
      console.log("\n🔐 Granting SCORE_UPDATER_ROLE to backend...");
      const SCORE_UPDATER_ROLE = await passportNFT.SCORE_UPDATER_ROLE();
      const tx = await passportNFT.grantRole(SCORE_UPDATER_ROLE, backendAddress);
      console.log("   Transaction hash:", tx.hash);
      await tx.wait();
      
      // Verify role
      const hasRole = await passportNFT.hasRole(SCORE_UPDATER_ROLE, backendAddress);
      if (hasRole) {
        console.log("✅ SCORE_UPDATER_ROLE granted to:", backendAddress);
      } else {
        console.warn("⚠️  Role grant verification failed");
      }
    } else {
      console.log("\n⚠️  No BACKEND_ADDRESS set. Grant role manually using grant_updater_role.ts");
    }

    // Deployment Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log(`   CreditPassportNFT: ${passportAddress}`);
    if (ncrdTokenAddress && ncrdTokenAddress !== "0x0000000000000000000000000000000000000000") {
      const stakingAddress = await (await ethers.getContractFactory("NeuroCredStaking")).deploy(ncrdTokenAddress, deployer.address).then(c => c.waitForDeployment().then(() => c.getAddress()));
      console.log(`   NeuroCredStaking:  ${stakingAddress}`);
    } else {
      console.log(`   NeuroCredStaking:  NOT DEPLOYED (set NCRD_TOKEN_ADDRESS)`);
    }
    console.log(`   DemoLender:        ${lenderAddress}`);
    if (backendAddress && ethers.isAddress(backendAddress)) {
      console.log(`   Backend Address:   ${backendAddress}`);
    }
    
    console.log("\n📝 Next Steps:");
    console.log("   1. Add these addresses to backend/.env:");
    console.log(`      CREDIT_PASSPORT_ADDRESS=${passportAddress}`);
    if (ncrdTokenAddress && ncrdTokenAddress !== "0x0000000000000000000000000000000000000000") {
      console.log(`      STAKING_ADDRESS=${await (await ethers.getContractFactory("NeuroCredStaking")).deploy(ncrdTokenAddress, deployer.address).then(c => c.waitForDeployment().then(() => c.getAddress()))}`);
    }
    console.log(`      DEMO_LENDER_ADDRESS=${lenderAddress}`);
    console.log("\n   2. Add to frontend/.env.local:");
    console.log(`      NEXT_PUBLIC_CONTRACT_ADDRESS=${passportAddress}`);
    console.log(`      NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=<staking_address>`);
    console.log(`      NEXT_PUBLIC_DEMO_LENDER_ADDRESS=${lenderAddress}`);
    console.log("\n   3. View on explorer:");
    const explorerUrl = `https://testnet.qie.digital/address/${passportAddress}`;
    console.log(`      ${explorerUrl}`);
    console.log("\n" + "=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Deployment failed!");
    console.error("Error:", error.message);
    if (error.transaction) {
      console.error("Transaction:", error.transaction);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

