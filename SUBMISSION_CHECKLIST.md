# Submission Checklist

## ✅ Priority Fixes (Completed)

- [x] **README placeholders filled** - Added structure with placeholders for contract address, tx hash, demo video, live URLs
- [x] **.env.example files created** - Added for contracts, backend, and frontend
- [x] **SCORE_UPDATER_ROLE verification script** - Created `contracts/scripts/checkRoles.ts`
- [x] **Deploy and setup script** - Created `contracts/scripts/deployAndSetup.ts`
- [x] **LICENSE file** - Added MIT License
- [x] **Screenshots folder** - Created with README
- [x] **CI workflow** - Added `.github/workflows/contracts.yml`
- [x] **.gitignore verified** - Confirmed all .env files are ignored

## 📝 Before Submission - Fill These In

### 1. Deploy Contract
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network qieTestnet
```
- [ ] Copy contract address to README.md (replace `0xYourContractAddress`)
- [ ] Add to `backend/.env` as `CREDIT_PASSPORT_ADDRESS`
- [ ] Add to `frontend/.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 2. Verify Role
```bash
cd contracts
npx hardhat run scripts/checkRoles.ts --network qieTestnet
```
- [ ] Confirm output shows: `✅ SCORE_UPDATER_ROLE: GRANTED`
- [ ] If not granted, run deploy script again or grant manually

### 3. Generate First Passport
- [ ] Start backend: `cd backend && python -m uvicorn app:app --reload`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Connect wallet in frontend
- [ ] Click "Generate Credit Passport"
- [ ] Copy transaction hash from response
- [ ] Add explorer link to README.md (replace `0xYourTxHash`)

### 4. Add Screenshots
- [ ] Take screenshot of landing page → `screenshots/landing.png`
- [ ] Take screenshot of score generation → `screenshots/generate_passport.png`
- [ ] Take screenshot of explorer transaction → `screenshots/explorer_tx.png`

### 5. Deploy Frontend & Backend
- [ ] Deploy frontend to Vercel (or similar)
- [ ] Deploy backend to Render/Railway (or similar)
- [ ] Update README.md with live URLs

### 6. Record Demo Video
- [ ] Follow `docs/demo-script.md`
- [ ] Upload to YouTube
- [ ] Add link to README.md

### 7. Final Checks
- [ ] No private keys in repository (check with `git grep -i "private.*key"`)
- [ ] All .env files are gitignored
- [ ] README.md has all placeholders filled
- [ ] Contract address is correct
- [ ] Transaction hash link works
- [ ] Screenshots are added
- [ ] Demo video is uploaded

## 🔒 Security Verification

Run these commands to verify no secrets are committed:

```bash
# Check for private keys
git grep -i "private.*key" -- "*.ts" "*.js" "*.py" "*.md" "*.txt"

# Check for .env files (should return nothing)
git ls-files | grep "\.env$"

# Check git history for secrets (optional, but recommended)
git log --all --full-history --source -S "0x[a-fA-F0-9]{64}" -- "*.ts" "*.js" "*.py"
```

If any secrets are found:
1. Rotate the keys immediately
2. Remove from git history: `git filter-branch` or create new repo
3. Add to .gitignore if not already there

## 📋 Submission Form Checklist

When filling out the hackathon submission form:

- [ ] **Project Title**: "NeuroCred – AI Credit Passport on QIE"
- [ ] **Tagline**: "AI-powered soulbound credit identity for safer lending on QIE."
- [ ] **Description**: 2-3 sentences explaining problem + solution
- [ ] **Tech Stack**: Solidity, Hardhat, Next.js, FastAPI, Python, Web3.py, Ethers.js, QIE Testnet
- [ ] **GitHub Repo**: https://github.com/DiveshK007/NeuroCred
- [ ] **Live Frontend URL**: (your Vercel/deployment URL)
- [ ] **Backend API URL**: (your Render/Railway URL)
- [ ] **Demo Video URL**: (your YouTube link)
- [ ] **Contract Address**: (from deployment)
- [ ] **Explorer Link**: (QIE testnet explorer link)
- [ ] **Screenshots**: Upload landing, generate passport, explorer tx
- [ ] **Team Info**: Name, email, role

## ✅ QIE Requirements Verification

### Guaranteed $500 Requirements
- [x] **Wallet Integration**: ✅ MetaMask/QIE Wallet connect implemented
- [ ] **Smart Contract Deployed**: ⏳ Fill after deployment
- [ ] **On-Chain Functionality**: ⏳ Fill after first mint (tx hash)

### $20,000 Prize Pool Requirements
- [x] **Innovation**: ✅ AI + SBT + scoring system
- [x] **Impact**: ✅ Enables safer DeFi lending
- [x] **Technical Depth**: ✅ Smart contracts, on-chain storage, role-based access
- [x] **Presentation**: ⏳ Complete after demo video
- [x] **Bonus Points**: ✅ QIE Oracles integration, QIEDex token guide

---

**Last Updated**: 2025-01-XX
**Status**: Ready for deployment and final steps

