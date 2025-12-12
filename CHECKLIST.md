# NeuroCred Hackathon Submission Checklist

## Pre-Deployment Checklist

### Environment Setup
- [ ] All `.env.example` files reviewed and copied to `.env` files
- [ ] No private keys committed to repository
- [ ] `.gitignore` verified to exclude all `.env` files
- [ ] QIE Testnet RPC URL configured
- [ ] Backend wallet has testnet tokens for gas

### NCRD Token Creation
- [ ] NCRD token created via QIEDex (or deployed locally)
- [ ] Token address added to all `.env` files
- [ ] Token address documented in README

## Deployment Checklist

### Smart Contracts
- [ ] `CreditPassportNFT` deployed to QIE Testnet
- [ ] `NeuroCredStaking` deployed (requires NCRD token address)
- [ ] `DemoLender` deployed (requires CreditPassportNFT address)
- [ ] All contract addresses saved and documented

### Role Configuration
- [ ] `SCORE_UPDATER_ROLE` granted to backend wallet address
- [ ] Role verified using `npx hardhat run scripts/checkRoles.ts --network qieTestnet`
- [ ] Verification output shows: `✅ SCORE_UPDATER_ROLE: GRANTED`

### Backend Configuration
- [ ] Backend `.env` file configured with all contract addresses
- [ ] Backend wallet has sufficient QIE for gas fees
- [ ] Backend starts successfully: `python -m uvicorn app:app --reload`
- [ ] Health check endpoint works: `GET /`
- [ ] Oracle service configured (if oracle address available)

### Frontend Configuration
- [ ] Frontend `.env.local` file configured with all contract addresses
- [ ] Frontend builds successfully: `npm run build`
- [ ] Frontend starts successfully: `npm run dev`
- [ ] Wallet connection works (MetaMask/QIE Wallet)

## Testing Checklist

### Contract Tests
- [ ] Run `npm --prefix contracts test`
- [ ] All tests pass
- [ ] CreditPassportNFT tests: mint, update, soulbound
- [ ] NeuroCredStaking tests: stake, unstake, tier calculation
- [ ] DemoLender tests: LTV calculation

### Integration Tests
- [ ] Generate score via frontend: Connect wallet → Generate passport
- [ ] Transaction appears on QIE explorer
- [ ] Score retrieved from blockchain: `GET /api/score/{address}`
- [ ] Staking UI works: Stake NCRD → Check tier
- [ ] DeFi demo works: Generate score → View LTV → Adjust collateral slider

### API Endpoints
- [ ] `POST /api/score` returns score with txHash
- [ ] `GET /api/score/{address}` returns on-chain score
- [ ] `GET /api/oracle/price` returns oracle price (if configured)
- [ ] `GET /api/staking/{address}` returns staking info
- [ ] `GET /api/lending/ltv/{address}` returns LTV

## QIE Hackathon $500 Requirements

### Wallet Integration ✅
- [ ] User can connect wallet in frontend
- [ ] Wallet balance displayed (or can be displayed)
- [ ] Transaction signing works (for staking, if implemented)

### Smart Contract Deployed ✅
- [ ] CreditPassportNFT deployed to QIE Testnet
- [ ] Contract address documented in README
- [ ] Contract verified on explorer (if supported)

### On-Chain Functionality ✅
- [ ] Backend successfully calls `mintOrUpdate()`
- [ ] Transaction hash returned in API response
- [ ] Transaction visible on QIE explorer
- [ ] Explorer link included in README

### Proof of On-Chain Write
- [ ] Sample transaction hash documented
- [ ] Explorer link to transaction included in README
- [ ] Screenshot of transaction on explorer (optional but recommended)

## Prize Category Eligibility

### Identity & Security ✅
- [ ] Soulbound NFT implementation (non-transferable)
- [ ] Role-based access control (SCORE_UPDATER_ROLE)
- [ ] On-chain credit identity storage

### AI × Blockchain ✅
- [ ] AI-powered scoring algorithm
- [ ] On-chain storage of AI-generated scores
- [ ] Score calculation uses wallet heuristics

### DeFi ✅
- [ ] DemoLender contract deployed
- [ ] LTV calculation based on credit score
- [ ] DeFi demo page shows borrowing terms
- [ ] Integration example for lending protocols

### Oracles/Tokenization ✅
- [ ] QIE Oracle integration (price fetching)
- [ ] Oracle price displayed in dashboard
- [ ] NCRD token created (via QIEDex or deployed)
- [ ] Staking mechanism uses NCRD token
- [ ] Tokenization bonus: QIEDex integration documented

## Documentation Checklist

### README.md
- [ ] Project overview and description
- [ ] Architecture diagram
- [ ] Quick start guide
- [ ] Deployment instructions
- [ ] Contract addresses section (with placeholders filled)
- [ ] API documentation
- [ ] Integration examples
- [ ] "How we satisfy QIE $500" section
- [ ] Demo video link (when available)
- [ ] Screenshots section
- [ ] Team information

### Screenshots
- [ ] `screenshots/landing.png` - Landing page
- [ ] `screenshots/generate_passport.png` - Score generation
- [ ] `screenshots/explorer_tx.png` - Transaction on explorer
- [ ] `screenshots/oracle_dashboard.png` - Oracle price display
- [ ] `screenshots/staking_ui.png` - Staking interface
- [ ] `screenshots/lending_demo.png` - DeFi demo

### Demo Video
- [ ] Video recorded (3-5 minutes)
- [ ] Shows wallet connection
- [ ] Shows score generation
- [ ] Shows transaction on explorer
- [ ] Shows oracle integration
- [ ] Shows staking (if implemented)
- [ ] Shows DeFi demo
- [ ] Video uploaded (YouTube/Drive)
- [ ] Link added to README

## Final Submission Checklist

### Repository
- [ ] All code committed to `feature/fullstack-enhancements` branch
- [ ] No secrets in repository
- [ ] `.gitignore` properly configured
- [ ] README.md complete
- [ ] CHECKLIST.md included
- [ ] All contract addresses documented
- [ ] All transaction links documented

### Submission Form
- [ ] Project title: "NeuroCred – AI Credit Passport on QIE"
- [ ] Tagline: "AI-powered soulbound credit identity for safer lending on QIE"
- [ ] Description (2-3 sentences)
- [ ] Tech stack listed
- [ ] GitHub repo link
- [ ] Live frontend URL (if deployed)
- [ ] Backend API URL (if deployed)
- [ ] Demo video URL
- [ ] Contract addresses
- [ ] Explorer links
- [ ] Screenshots uploaded
- [ ] Team information

### Verification Commands
Run these commands to verify everything works:

```bash
# Compile contracts
cd contracts && npm run compile

# Run tests
cd contracts && npm test

# Check roles
cd contracts && npx hardhat run scripts/checkRoles.ts --network qieTestnet

# Start backend
cd backend && python -m uvicorn app:app --reload

# Start frontend
cd frontend && npm run dev

# Test API
curl -X POST http://localhost:8000/api/score -H "Content-Type: application/json" -d '{"address":"0xYourTestAddress"}'
```

## Quick Test Flow (Prove $500 Eligibility)

1. [ ] Deploy contracts: `npx hardhat run scripts/deploy_all.ts --network qieTestnet`
2. [ ] Grant role: `npx hardhat run scripts/grant_updater_role.ts --network qieTestnet`
3. [ ] Start backend: `cd backend && python -m uvicorn app:app --reload`
4. [ ] Start frontend: `cd frontend && npm run dev`
5. [ ] Connect wallet in frontend
6. [ ] Click "Generate Credit Passport"
7. [ ] Copy transaction hash from response
8. [ ] Open explorer link: `https://testnet.qie.digital/tx/{txHash}`
9. [ ] Verify transaction is visible
10. [ ] Add transaction link to README

---

**Last Updated**: 2025-01-XX
**Status**: Ready for deployment and testing

