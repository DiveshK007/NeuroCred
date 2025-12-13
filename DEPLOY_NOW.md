# 🚀 Ready to Deploy - Final Checklist

## ✅ Configuration Status

- ✅ QIE Testnet RPC: `https://rpc1testnet.qie.digital/`
- ✅ Chain ID: `1983`
- ✅ Wallet Address: `0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6`
- ✅ Backend Address: `0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6`

## 📋 Pre-Deployment Checklist

Before deploying, verify:

### 1. Get Testnet Tokens ✅
- [ ] Visit: https://www.qie.digital/faucet
- [ ] Connect MetaMask/Keplr
- [ ] Enter: `0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6`
- [ ] Click "Request Test Coins"
- [ ] Wait 1 minute
- [ ] Verify balance: https://testnet.qie.digital/address/0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6

### 2. Verify Private Key ✅
- [ ] Open `contracts/.env`
- [ ] Verify `PRIVATE_KEY` matches wallet `0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6`
- [ ] If not, export private key from MetaMask and update

### 3. Add QIE Testnet to MetaMask (if using MetaMask)
- [ ] Open MetaMask
- [ ] Click "Add Network"
- [ ] Enter:
  - Network Name: `QIE Testnet`
  - RPC URL: `https://rpc1testnet.qie.digital/`
  - Chain ID: `1983`
  - Currency Symbol: `QIE`
  - Block Explorer: `https://testnet.qie.digital/`
- [ ] Save and switch to QIE Testnet

## 🚀 Deployment Commands

Once you have tokens and verified private key:

```bash
cd contracts
npx hardhat run scripts/deploy_all.ts --network qieTestnet
```

**Expected Output:**
```
✅ CreditPassportNFT deployed to: 0x...
✅ DemoLender deployed to: 0x...
✅ LendingVault deployed to: 0x...
✅ SCORE_UPDATER_ROLE granted to: 0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6
```

## 📝 After Deployment

1. **Copy all contract addresses** from output
2. **Update backend/.env** with addresses
3. **Update frontend/.env.local** with addresses
4. **Start backend**: `cd backend && python -m uvicorn app:app --reload`
5. **Start frontend**: `cd frontend && npm run dev`
6. **Generate first passport** to get transaction hash

---

**Ready?** Tell me when you've:
1. ✅ Got testnet tokens
2. ✅ Verified private key in contracts/.env
3. ✅ Added QIE Testnet to MetaMask (if using)

Then say: **"Deploy now!"** and I'll run the deployment! 🚀

