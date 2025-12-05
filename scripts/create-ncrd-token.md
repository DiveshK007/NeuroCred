# Creating NCRD Token via QIEDex

This is a step-by-step guide for creating the NCRD utility token using QIEDex.

## Prerequisites

- QIE Wallet installed and funded with testnet tokens
- Access to [QIEDex](https://qiedex.qie.digital)

## Steps

### 1. Connect to QIEDex

1. Open https://qiedex.qie.digital
2. Click "Connect Wallet"
3. Select QIE Wallet or MetaMask (configured for QIE Testnet)
4. Approve connection

### 2. Navigate to Token Creation

1. Look for "Create Token" or "Token Creator" section
2. Click to open the token creation form

### 3. Fill Token Details

Enter the following information:

```
Token Name: NeuroCred
Token Symbol: NCRD
Description: NeuroCred utility token for staking and governance
Total Supply: 1000000000
Decimals: 18
```

**Note**: 
- Total Supply: 1,000,000,000 (1 billion tokens)
- Decimals: 18 (standard ERC-20)
- This gives you 1,000,000,000 * 10^18 total units

### 4. Review and Deploy

1. Review all parameters carefully
2. Confirm you have enough QIE for gas fees
3. Click "Create Token" or "Deploy"
4. Sign the transaction in your wallet
5. Wait for confirmation

### 5. Save Token Address

After deployment:
1. Copy the token contract address
2. Save it to `contracts/.env`:
   ```
   NCRD_TOKEN_ADDRESS=0xYourTokenAddressHere
   ```

### 6. Verify Token

1. Check the token on QIE Explorer
2. Verify name, symbol, and total supply
3. Test transferring a small amount

## Next Steps

After creating the token:

1. **Deploy Staking Contract**:
   ```bash
   cd contracts
   npm run deploy:testnet
   ```

2. **Update Backend** (if needed):
   Add NCRD token address to backend configuration

3. **Update Frontend**:
   Add NCRD token display and staking UI

## Token Distribution (Optional)

Consider initial distribution:
- 40% - Community rewards
- 30% - Team/Development
- 20% - Liquidity pools
- 10% - Reserve

## Troubleshooting

**Issue**: Transaction fails
- Check you have enough QIE for gas
- Verify you're on QIE Testnet
- Check token parameters are valid

**Issue**: Can't find token after creation
- Check QIE Explorer with your wallet address
- Verify transaction was successful
- Check token contract address is correct

## Support

For QIEDex-specific issues:
- QIE Discord: https://discord.com/invite/9HCNTygkwa
- QIE Telegram: https://t.me/HovRonQiblockchain

