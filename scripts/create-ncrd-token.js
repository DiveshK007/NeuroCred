/**
 * NCRD Token Creation Script
 * 
 * This script automates the creation of NCRD token via QIEDex API
 * or provides instructions for manual creation via QIEDex UI
 * 
 * Usage:
 *   node scripts/create-ncrd-token.js
 * 
 * Or follow manual instructions in scripts/create-ncrd-token.md
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../contracts/.env') });

// NCRD Token Configuration
const NCRD_CONFIG = {
  name: 'NeuroCred',
  symbol: 'NCRD',
  totalSupply: '1000000000', // 1 billion tokens
  decimals: 18,
  description: 'NeuroCred utility token for staking and governance on QIE blockchain'
};

/**
 * Generate token creation instructions
 */
function generateInstructions() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  NCRD Token Creation - QIEDex Integration');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('Token Configuration:');
  console.log(`  Name: ${NCRD_CONFIG.name}`);
  console.log(`  Symbol: ${NCRD_CONFIG.symbol}`);
  console.log(`  Total Supply: ${NCRD_CONFIG.totalSupply} tokens`);
  console.log(`  Decimals: ${NCRD_CONFIG.decimals}\n`);
  
  console.log('Method 1: Via QIEDex UI (Recommended)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('1. Go to: https://qiedex.qie.digital');
  console.log('2. Connect your QIE Wallet');
  console.log('3. Navigate to "Create Token" section');
  console.log('4. Fill in the token details:');
  console.log(`   - Name: ${NCRD_CONFIG.name}`);
  console.log(`   - Symbol: ${NCRD_CONFIG.symbol}`);
  console.log(`   - Total Supply: ${NCRD_CONFIG.totalSupply}`);
  console.log(`   - Decimals: ${NCRD_CONFIG.decimals}`);
  console.log('5. Review and confirm');
  console.log('6. Sign the transaction');
  console.log('7. Wait for confirmation\n');
  
  console.log('Method 2: Via QIEDex API (If available)');
  console.log('─────────────────────────────────────────────────────────');
  console.log('If QIEDex provides an API, you can use:');
  console.log(`
const response = await fetch('https://qiedex.qie.digital/api/tokens/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: '${NCRD_CONFIG.name}',
    symbol: '${NCRD_CONFIG.symbol}',
    totalSupply: '${NCRD_CONFIG.totalSupply}',
    decimals: ${NCRD_CONFIG.decimals}
  })
});
  `);
  
  console.log('\nAfter Token Creation:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('1. Copy the token contract address');
  console.log('2. Add to contracts/.env:');
  console.log(`   NCRD_TOKEN_ADDRESS=0xYourTokenAddressHere`);
  console.log('3. Deploy staking contract:');
  console.log('   cd contracts && npm run deploy:testnet');
  console.log('4. Update frontend to display NCRD token');
  console.log('5. Update backend if needed\n');
  
  console.log('Token Distribution Recommendations:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('  • 40% - Community rewards and liquidity');
  console.log('  • 30% - Team and development');
  console.log('  • 20% - Liquidity pools (QIEDex, DEX)');
  console.log('  • 10% - Reserve and treasury\n');
  
  console.log('Verification:');
  console.log('─────────────────────────────────────────────────────────');
  console.log('1. Check token on QIE Explorer');
  console.log('2. Verify name, symbol, and total supply');
  console.log('3. Test transferring a small amount');
  console.log('4. Verify token appears in QIE Wallet\n');
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Save token config to file for reference
 */
function saveConfig() {
  const configPath = path.join(__dirname, '../contracts/ncrd-config.json');
  fs.writeFileSync(configPath, JSON.stringify(NCRD_CONFIG, null, 2));
  console.log(`✅ Token configuration saved to: ${configPath}\n`);
}

// Main execution
if (require.main === module) {
  generateInstructions();
  saveConfig();
  
  console.log('Next Steps:');
  console.log('1. Follow the instructions above to create NCRD token');
  console.log('2. Update contracts/.env with NCRD_TOKEN_ADDRESS');
  console.log('3. Deploy NeuroCredStaking contract');
  console.log('4. Integrate NCRD into your application\n');
}

module.exports = { NCRD_CONFIG, generateInstructions };

