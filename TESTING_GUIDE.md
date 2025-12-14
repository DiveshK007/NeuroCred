# NeuroCred V2 Testing Guide

## Quick Start

### 1. Start Services

```bash
# Option 1: Use the start script
./scripts/start-services.sh

# Option 2: Manual start
# Terminal 1 - Backend
cd backend
python -m uvicorn app:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Verify Deployment

```bash
# Run integration tests
./scripts/test-v2-integration.sh

# Test contract interactions
./scripts/test-v2-contracts.sh
```

## Testing Checklist

### ✅ Backend Tests

1. **Health Check**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Score Generation**
   ```bash
   curl -X POST http://localhost:8000/api/score \
     -H "Content-Type: application/json" \
     -d '{"walletAddress": "0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6"}'
   ```

3. **Staking Info**
   ```bash
   curl http://localhost:8000/api/staking/0x3e7716bee2d7e923cb9b572eb169edfb6cdbdab6
   ```

### ✅ Frontend Tests

1. **Open Application**
   - Navigate to http://localhost:3000
   - Connect wallet (MetaMask/QIE Wallet)

2. **Test Score Generation**
   - Click "Generate Credit Passport"
   - Verify score appears
   - Check transaction on [QIE Explorer](https://testnet.qie.digital)

3. **Test Staking**
   - Navigate to `/stake`
   - Connect wallet
   - Mint NCRD tokens (if needed)
   - Stake tokens
   - Verify tier increases

4. **Test Lending**
   - Navigate to `/lend`
   - Connect wallet
   - Test loan creation flow

### ✅ Contract Tests

1. **Verify Contract Deployment**
   - [CreditPassportNFTV2](https://testnet.qie.digital/address/0x34904952E5269290B783071f1eBba51c22ef6219)
   - [NeuroCredStakingV2](https://testnet.qie.digital/address/0x3E9943694a37d26987C1af36DE169e631b30F153)
   - [LendingVaultV2](https://testnet.qie.digital/address/0xd840f7E97Eb96d4901666f665A443Ea376e5BA32)

2. **Test Contract Functions**
   ```bash
   cd contracts
   npx hardhat run scripts/test-contract-interaction.ts --network qieTestnet
   ```

## Expected Results

### Score Generation
- ✅ Score between 0-1000
- ✅ Risk band (0-3)
- ✅ Transaction hash returned
- ✅ NFT minted on-chain
- ✅ Explorer link works

### Staking
- ✅ Staked amount displayed
- ✅ Tier calculated correctly
- ✅ Score boost applied
- ✅ Transactions successful

### Circuit Breakers
- ✅ Rate limits enforced (10 updates/hour)
- ✅ Amount limits enforced (200 point max change)
- ✅ Events emitted on limit hits

### Pausable
- ✅ Contracts can be paused
- ✅ Operations blocked when paused
- ✅ Can be unpaused

## Troubleshooting

### Backend Issues

**Error: CREDIT_PASSPORT_NFT_ADDRESS not set**
```bash
# Check backend/.env
grep CREDIT_PASSPORT_NFT_ADDRESS backend/.env
```

**Error: Connection refused**
```bash
# Ensure backend is running
curl http://localhost:8000/health
```

### Frontend Issues

**Error: Contract not found**
```bash
# Check frontend/.env.local
grep NEXT_PUBLIC_CONTRACT_ADDRESS frontend/.env.local
```

**Error: Wallet connection failed**
- Ensure MetaMask/QIE Wallet is installed
- Check network is set to QIE Testnet (Chain ID: 1983)

### Contract Issues

**Error: Transaction reverted**
- Check gas limits
- Verify wallet has testnet tokens
- Check contract is not paused

**Error: Role not granted**
```bash
# Grant roles using setup script
cd contracts
npm run setup:roles <CONTRACT_ADDRESS> SCORE_UPDATER_ROLE <ADDRESS> grant
```

## Performance Benchmarks

### Expected Response Times
- Score generation: < 5 seconds
- Staking info: < 2 seconds
- Contract interaction: < 10 seconds

### Gas Usage
- Mint passport: ~120,000 gas
- Update score: ~60,000 gas
- Stake: ~75,000 gas
- Create loan: ~160,000 gas

## Next Steps

1. ✅ All tests passing
2. ✅ UI working correctly
3. ✅ Contracts verified on explorer
4. ✅ Documentation updated
5. 🚀 Ready for production!

