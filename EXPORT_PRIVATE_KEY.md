# 🔐 How to Export Your Private Key Safely

**⚠️ SECURITY WARNING**: 
- Never share your private key with anyone!
- Only use it in `.env` files (which are gitignored)
- Never commit private keys to git
- Consider using a separate wallet for development

## MetaMask

1. Open MetaMask extension
2. Click the account icon (top right)
3. Click "Account Details"
4. Click "Export Private Key"
5. Enter your MetaMask password
6. Copy the private key (starts with `0x`)
7. Paste into `contracts/.env` as `PRIVATE_KEY=0x...`

## Other Wallets

### Trust Wallet
1. Settings → Security → Show Private Key
2. Enter password/biometric
3. Copy private key

### Coinbase Wallet
1. Settings → Advanced → Export Private Key
2. Enter password
3. Copy private key

### Hardware Wallets (Ledger/Trezor)
**⚠️ Don't export private key from hardware wallets!**
- Use a software wallet for development instead
- Or use a separate development account

## After Exporting

1. Open `contracts/.env`
2. Find the line: `PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY`
3. Replace `0xYOUR_DEPLOYER_PRIVATE_KEY` with your actual private key
4. Save the file
5. **Verify it's gitignored**: Run `git check-ignore contracts/.env` (should output `.env`)

## Verify Setup

After adding your private key, verify:

```bash
cd contracts
# Check .env is ignored
git check-ignore .env

# Check address matches (optional verification)
# The address derived from your private key should match your wallet address
```

---

**Ready?** After you've:
1. ✅ Got testnet tokens
2. ✅ Exported private key
3. ✅ Added private key to contracts/.env

Tell me: **"Ready to deploy!"** and I'll proceed! 🚀

