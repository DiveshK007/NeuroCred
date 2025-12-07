import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * NCRD Token Creation Helper
 * 
 * This script helps create NCRD token via QIEDex or direct deployment
 * 
 * Note: QIEDex is the recommended method. This script provides
 * a template for direct ERC-20 deployment if needed.
 */

async function main() {
  console.log("🚀 NCRD Token Creation Helper\n");

  const useQIEDex = process.env.USE_QIEDEX !== "false"; // Default to true

  if (useQIEDex) {
    console.log("📝 Recommended: Create NCRD token via QIEDex UI");
    console.log("   1. Go to: https://qiedex.qie.digital");
    console.log("   2. Connect wallet");
    console.log("   3. Create token with:");
    console.log("      - Name: NeuroCred");
    console.log("      - Symbol: NCRD");
    console.log("      - Supply: 1,000,000,000");
    console.log("      - Decimals: 18");
    console.log("   4. Save the token address to contracts/.env");
    console.log("      NCRD_TOKEN_ADDRESS=0x...\n");
    
    console.log("   See scripts/create-ncrd-token.md for detailed steps\n");
    return;
  }

  // Alternative: Direct ERC-20 deployment (if QIEDex not available)
  console.log("📝 Alternative: Deploying ERC-20 token directly...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Note: This would require an ERC-20 contract
  // For now, we recommend using QIEDex
  console.log("\n⚠️  Direct ERC-20 deployment not implemented.");
  console.log("   Please use QIEDex to create NCRD token.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

