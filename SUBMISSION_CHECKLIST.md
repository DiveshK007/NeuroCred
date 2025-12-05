# 🚀 QIE HACKATHON – FINAL SUBMISSION CHECKLIST

Complete checklist to verify before submitting your NeuroCred project.

---

## ✅ 1. Contract-Level Checklist (MUST)

### Contract Deployment
- [ ] Contract deployed on QIE Testnet
- [ ] QIE Testnet RPC set in `.env`
- [ ] CreditPassportNFT.sol deployed
- [ ] Contract address documented in README
- [ ] Contract is verifiable on explorer (if supported)

### SCORE_UPDATER_ROLE Configuration
- [ ] Backend signer wallet has SCORE_UPDATER_ROLE
- [ ] Verified with script: `npm run verify:role`
- [ ] Manual verification: `hasRole(SCORE_UPDATER_ROLE, backendAddress) → true`

### Contract Functions Tested
- [ ] `mintOrUpdate()` works (tx completes on QIE testnet)
- [ ] `getScore(address)` correctly returns score & riskBand
- [ ] Soulbound logic prevents transfer
- [ ] Events emit properly (ScoreUpdated, PassportMinted)

### Gas Usage & Execution
- [ ] `mintOrUpdate()` gas is acceptable
- [ ] No reverts for valid inputs
- [ ] Handles multiple calls (update existing passport)

**Verification Commands:**
```bash
cd contracts
npm run verify:deployment
npm run verify:role
npm test
```

---

## 🧠 2. Backend Checklist (MUST)

### Backend Environment Configured
- [ ] `.env` contains:
  - [ ] `QIE_TESTNET_RPC_URL`
  - [ ] `BACKEND_PRIVATE_KEY`
  - [ ] `CREDIT_PASSPORT_NFT_ADDRESS`
- [ ] Backend wallet has QIE testnet tokens for gas
- [ ] Server runs: `python app.py`

### API Functional
- [ ] `POST /api/score` returns:
  - [ ] `address`
  - [ ] `score`
  - [ ] `riskBand`
  - [ ] `transactionHash` ✅ (automatically updates on-chain)
  - [ ] `explanation`
- [ ] `GET /api/score/{address}` returns:
  - [ ] `score`
  - [ ] `riskBand`
  - [ ] `lastUpdated` (or explanation)

### Contract Integration Working
- [ ] Backend successfully calls `mintOrUpdate()`
- [ ] `txHash` returned by API is valid
- [ ] Explorer shows the minted/updated passport NFT

### AI/Scoring Logic
- [ ] Score algorithm produces deterministic results
- [ ] Handles invalid addresses gracefully
- [ ] Handles network failures gracefully
- [ ] QIE Oracles integration working

**Test Commands:**
```bash
cd backend
python app.py
# In another terminal:
curl -X POST http://localhost:8000/api/score \
  -H "Content-Type: application/json" \
  -d '{"address": "0x..."}'
```

---

## 💻 3. Frontend Checklist (MUST)

### Wallet Integration
- [ ] "Connect Wallet" works on QIE testnet
- [ ] Displays connected address
- [ ] Shows error if wallet not installed
- [ ] Allows MetaMask/QIE Wallet to pop signing window
- [ ] Shows wallet balance

### Core Actions
- [ ] Clicking "Generate Credit Passport":
  - [ ] Calls backend API
  - [ ] Backend writes to blockchain
  - [ ] Frontend displays `txHash`
  - [ ] Score card updates correctly
  - [ ] Shows on-chain tx link
  - [ ] Displays risk band & reasoning

### UI/UX Requirements
- [ ] Shows application purpose clearly
- [ ] Shows "Integrate with NeuroCred" snippet for dApps
- [ ] No broken buttons
- [ ] Responsive on laptop + mobile
- [ ] Clear instructions on homepage

**Test Steps:**
1. Open frontend: `cd frontend && npm run dev`
2. Connect wallet
3. Generate score
4. Verify transaction appears on explorer

---

## 📚 4. Repository (GitHub) Checklist (MANDATORY)

### Organized Structure
- [ ] `contracts/` folder (Hardhat)
- [ ] `backend/` folder (FastAPI)
- [ ] `frontend/` folder (Next.js)
- [ ] `docs/` folder with documentation

### README.md MUST Contain
- [ ] Title + one-line description
- [ ] Architecture diagram (text or image)
- [ ] Contract addresses + explorer links
- [ ] API endpoints documentation
- [ ] How to run:
  - [ ] Contracts setup
  - [ ] Backend setup
  - [ ] Frontend setup
- [ ] Demo video link
- [ ] Screenshots of UI
- [ ] Team members + contact info
- [ ] License (MIT recommended)

### .env.example Files Included
- [ ] `frontend/.env.example`
- [ ] `backend/.env.example`
- [ ] `contracts/.env.example`

### Security
- [ ] No private keys pushed to repo
- [ ] `.gitignore` includes `.env`
- [ ] All sensitive data in `.env.example` only

**Verification:**
```bash
git status
# Check no .env files are tracked
git log --all --full-history -- "*/.env"
# Should return nothing
```

---

## 🎬 5. Demo Video Checklist (CRITICAL FOR JUDGES)

### Section 1: Problem (10–15s)
- [ ] Clear explanation: "QIE has no portable on-chain credit identity. Lending is risky. NeuroCred fixes that."

### Section 2: Solution Overview (30–45s)
- [ ] What is NeuroCred?
- [ ] AI credit score ↔ Soulbound NFT ↔ DeFi integration

### Section 3: Architecture (30s)
- [ ] Show diagram:
  - [ ] Frontend
  - [ ] Backend (AI scoring)
  - [ ] QIE blockchain
  - [ ] Smart contract

### Section 4: Live Demo (2–3 mins)
**Must include:**
- [ ] Connect wallet
- [ ] Click "Generate Credit Passport"
- [ ] MetaMask/QIE Wallet opens → user confirms
- [ ] App shows:
  - [ ] Score
  - [ ] Risk band
  - [ ] Transaction hash
  - [ ] Link to explorer
- [ ] Show explorer verifying tx
- [ ] Show `getScore()` from a second account OR in code snippet

### Section 5: Developer Integration (20–30s)
- [ ] Show how any dApp uses:
```solidity
INeuroCredScore.ScoreView memory sv = neuro.getScore(user);
```

### Section 6: Closing (10s)
- [ ] Impact → "We enable safe undercollateralized lending on QIE."
- [ ] Future scope → "Oracle integration, advanced risk models, staking tiers."

**Total Duration:** 3–5 minutes

---

## 💰 6. Requirements for Guaranteed $500 Reward (DON'T MISS)

These MUST be satisfied or you lose the guaranteed payout:

### Wallet Integration
- [ ] User must connect wallet in your frontend
- [ ] Must show balance/tx request at least once

### Smart Contract Deployed to QIE Testnet
- [ ] Verified contract address
- [ ] On-chain writes must occur
- [ ] You must show the explorer link in README + video

### On-Chain Functionality
- [ ] A real state change must happen:
  - [ ] NFT mint
  - [ ] Score update
- [ ] Transaction MUST appear on QIE testnet explorer

**⚠️ If any of the above is missing → no $500**

---

## 🏆 7. Requirements for Competing for the $20,000 Main Prizes

### Innovation (25%)
- [ ] Problem clearly stated
- [ ] Unique AI + SBT + scoring system
- [ ] First-of-its-kind on QIE

### Impact (25%)
- [ ] Explain real DeFi use cases
- [ ] Show how protocols can integrate score
- [ ] Demonstrate scalability potential

### Technical Depth (25%)
- [ ] Clear contracts
- [ ] Use QIE features:
  - [ ] Score updater role
  - [ ] Smart contract logic
  - [ ] On-chain NFT storage
- [ ] Extra points:
  - [ ] QIEDex token integration
  - [ ] QIE Oracles usage
  - [ ] Staking tiers implementation

### Presentation (15%)
- [ ] Clean UI
- [ ] Smooth demo video
- [ ] Clear speech
- [ ] Professional documentation

### Bonus (10%)
- [ ] Uses QIE Oracles ✅
- [ ] Uses QIEDex token creator ✅
- [ ] Has staking logic ✅
- [ ] Makes your project "ecosystem-ready" ✅

---

## 🧾 8. Submission Form Checklist

Before submitting on DevFolio/Mailer:

### Project Information
- [ ] Project Title: "NeuroCred – AI Credit Passport on QIE"
- [ ] Tagline: "AI-powered soulbound credit identity for safer lending on QIE."
- [ ] Description (2–3 sentences) - See SUBMISSION_FORM_CONTENT.md
- [ ] Tech Stack listed
- [ ] Category: AI × Blockchain

### Links
- [ ] GitHub repo: https://github.com/DiveshK007/NeuroCred
- [ ] Live frontend URL
- [ ] Backend API URL
- [ ] Demo Video URL (YouTube/Drive)
- [ ] Contract address + explorer links

### Screenshots
- [ ] Landing page
- [ ] Wallet connect
- [ ] Score screen
- [ ] Explorer tx
- [ ] Integration guide

### Team Info
- [ ] Names, emails, roles
- [ ] GitHub profiles

---

## 🎯 FINAL: ULTIMATE SUBMISSION BEFORE CLICKING "SUBMIT"

### YOU SHOULD BE ABLE TO SAY YES TO ALL:

| Item | Yes/No |
|------|--------|
| Wallet connects successfully | ⬜ |
| Backend updates score + contract | ⬜ |
| Score NFT mints on testnet | ⬜ |
| Explorer link visible | ⬜ |
| Demo video recorded and uploaded | ⬜ |
| Repo clean, runs from scratch | ⬜ |
| README complete | ⬜ |
| No private keys leaked | ⬜ |
| Submission form filled | ⬜ |
| Deployments working live | ⬜ |
| All verification scripts pass | ⬜ |
| Contract tests pass | ⬜ |

---

## 📋 Quick Verification Commands

```bash
# 1. Verify contracts
cd contracts
npm run compile
npm test
npm run verify:deployment
npm run verify:role

# 2. Verify backend
cd ../backend
python app.py
# Test in another terminal:
curl http://localhost:8000/

# 3. Verify frontend
cd ../frontend
npm run dev
# Open http://localhost:3000

# 4. Check git status
cd ..
git status
# Ensure no .env files are tracked
```

---

## ✅ Final Pre-Submission Checklist

- [ ] All code committed and pushed to GitHub
- [ ] README.md updated with all sections
- [ ] Contract addresses added to README (after deployment)
- [ ] Demo video recorded and link added
- [ ] Screenshots taken and added to repo
- [ ] Team information updated
- [ ] All .env.example files created
- [ ] Verification scripts tested
- [ ] Submission form content prepared
- [ ] All links tested and working
- [ ] Final review of checklist completed

---

**🎉 Once all items are checked, you're ready to submit!**

Good luck with the QIE Hackathon 2025! 🚀

