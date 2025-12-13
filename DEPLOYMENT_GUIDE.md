# Step-by-Step Deployment Guide

Follow these steps in order to deploy and test NeuroCred for hackathon submission.

---

## STEP 1: Prepare Environment Files

### 1.1 Create Contracts .env

```bash
cd contracts
cp .env.example .env
```

**Edit `contracts/.env` with:**
- `QIE_TESTNET_RPC_URL` - QIE testnet RPC (default: https://testnet.qie.digital)
- `PRIVATE_KEY` - Your deployer wallet private key (starts with 0x)
- `BACKEND_WALLET_ADDRESS` - Your backend wallet address (will receive SCORE_UPDATER_ROLE)
- `NCRD_TOKEN_ADDRESS` - Leave empty for now (we'll create token later)

**⚠️ IMPORTANT**: Never commit `.env` files to git!

### 1.2 Verify Wallet Has Testnet Tokens

Your deployer wallet needs QIE testnet tokens for gas. If you don't have any:
- Visit QIE faucet: https://qie.digital/faucet (or check QIE docs)
- Request testnet tokens for your deployer address

**Check balance:**
```bash
# You can check balance after connecting to QIE testnet
# Or use QIE explorer to check your address
```

---

## STEP 2: Deploy CreditPassportNFT (Required)

### 2.1 Deploy the Main Contract

```bash
cd contracts
npx hardhat run scripts/deploy_all.ts --network qieTestnet
```

**What this does:**
- Deploys CreditPassportNFT
- Optionally deploys NeuroCredStaking (if NCRD_TOKEN_ADDRESS is set)
- Deploys DemoLender
- Grants SCORE_UPDATER_ROLE to backend wallet (if BACKEND_WALLET_ADDRESS is set)

**Expected Output:**
```
✅ CreditPassportNFT deployed to: 0x...
✅ DemoLender deployed to: 0x...
```

**📝 ACTION**: Copy the CreditPassportNFT address - you'll need it for backend/frontend config!

### 2.2 Verify Deployment

Open QIE explorer and check your contract:
```
https://testnet.qie.digital/address/YOUR_CONTRACT_ADDRESS
```

---

## STEP 3: Grant SCORE_UPDATER_ROLE (Required)

### 3.1 Grant Role to Backend

If role wasn't granted during deployment, run:

```bash
cd contracts
# Make sure BACKEND_ADDRESS is set in .env
npx hardhat run scripts/grant_updater_role.ts --network qieTestnet
```

### 3.2 Verify Role

```bash
cd contracts
npx hardhat run scripts/checkRoles.ts --network qieTestnet
```

**Expected Output:**
```
✅ SCORE_UPDATER_ROLE: GRANTED
   Backend address 0x... has the role.
```

**✅ SUCCESS**: If you see this, role is correctly set!

---

## STEP 4: Configure Backend

### 4.1 Create Backend .env

```bash
cd backend
cp .env.example .env
```

### 4.2 Edit backend/.env

**Required values:**
```env
QIE_RPC_URL=https://testnet.qie.digital
BACKEND_PK=0xYOUR_BACKEND_PRIVATE_KEY  # Must match BACKEND_WALLET_ADDRESS from contracts/.env
CREDIT_PASSPORT_ADDRESS=0x...  # From Step 2.1
DEMO_LENDER_ADDRESS=0x...  # From Step 2.1
```

**Optional (can add later):**
```env
STAKING_ADDRESS=0x...  # If you deployed staking contract
NCRD_TOKEN_ADDRESS=0x...  # If you created NCRD token
QIE_ORACLE_USD_ADDR=0x...  # If you have oracle address
```

### 4.3 Verify Backend Wallet Has Tokens

Your backend wallet (BACKEND_PK) needs QIE testnet tokens for gas fees.

### 4.4 Test Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python -m uvicorn app:app --reload --port 8000
```

**Test health endpoint:**
```bash
curl http://localhost:8000/
```

**Expected:** `{"message": "NeuroCred API", "version": "1.0.0"}`

**✅ SUCCESS**: Backend is running!

---

## STEP 5: Configure Frontend

### 5.1 Create Frontend .env.local

```bash
cd frontend
cp .env.local.example .env.local
```

### 5.2 Edit frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # CreditPassportNFT from Step 2.1
NEXT_PUBLIC_DEMO_LENDER_ADDRESS=0x...  # DemoLender from Step 2.1
NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX=https://testnet.qie.digital/tx
```

**Optional:**
```env
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=0x...  # If deployed
NEXT_PUBLIC_NCRD_TOKEN_ADDRESS=0x...  # If created
```

### 5.3 Start Frontend

```bash
cd frontend
npm run dev
```

**Open:** http://localhost:3000

**✅ SUCCESS**: Frontend is running!

---

## STEP 6: Generate First Credit Passport (CRITICAL FOR $500)

### 6.1 Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask or QIE Wallet
4. **Switch to QIE Testnet** (if needed)
5. Approve connection

### 6.2 Generate Score

1. Click "Generate My Credit Passport"
2. Wait for backend to compute score
3. Backend will automatically call `mintOrUpdate()` on-chain
4. **Copy the transaction hash** from the response

**Expected Response:**
```json
{
  "address": "0x...",
  "score": 750,
  "riskBand": 1,
  "transactionHash": "0x..."  // ← COPY THIS!
}
```

### 6.3 Verify Transaction on Explorer

1. Click the "View Transaction on Explorer" link
2. OR manually open: `https://testnet.qie.digital/tx/YOUR_TX_HASH`
3. Verify transaction is confirmed
4. **Take a screenshot** of the transaction page

**✅ SUCCESS**: You've proven on-chain functionality! This satisfies the $500 requirement.

### 6.4 Update README

Add your transaction hash to README.md:
```markdown
- **Example Transaction**: `https://testnet.qie.digital/tx/YOUR_TX_HASH`
```

---

## STEP 7: Test Additional Features

### 7.1 Test Dashboard

1. Navigate to `/dashboard`
2. Verify score is displayed
3. Check oracle price (if configured)
4. Check staking info (if configured)

### 7.2 Test DeFi Demo

1. Navigate to `/lending-demo`
2. Generate score first (if not already done)
3. Adjust collateral slider
4. Verify LTV calculation
5. Verify interest rate display

### 7.3 Test Staking (Optional - requires NCRD token)

1. Navigate to `/stake`
2. Connect wallet
3. Approve NCRD token (if needed)
4. Stake some NCRD
5. Verify tier updates
6. Regenerate score to see boost

---

## STEP 8: Create NCRD Token (Optional but Recommended)

### Option A: Via QIEDex (Recommended for Bonus Points)

1. Visit QIEDex token creator (check QIE docs for URL)
2. Create ERC-20 token:
   - Name: "NeuroCred Token"
   - Symbol: "NCRD"
   - Decimals: 18
   - Initial supply: Your choice
3. Copy deployed token address
4. Add to `.env` files:
   - `contracts/.env`: `NCRD_TOKEN_ADDRESS=0x...`
   - `backend/.env`: `NCRD_TOKEN_ADDRESS=0x...`
   - `frontend/.env.local`: `NEXT_PUBLIC_NCRD_TOKEN_ADDRESS=0x...`
5. Redeploy staking contract (or deploy if skipped earlier)

### Option B: Deploy Locally (For Testing)

```bash
cd contracts
# Deploy MockERC20 as NCRD token
npx hardhat run scripts/deploy_mock_token.ts --network qieTestnet
# (You may need to create this script or use deploy_all.ts with token)
```

---

## STEP 9: Capture Screenshots

Take screenshots and save to `screenshots/` folder:

1. **landing.png** - Landing page with wallet connection
2. **generate_passport.png** - Score generation showing score, risk band, tx hash
3. **explorer_tx.png** - QIE explorer showing your transaction
4. **oracle_dashboard.png** - Dashboard showing oracle price (if configured)
5. **staking_ui.png** - Staking interface (if configured)
6. **lending_demo.png** - DeFi demo with LTV calculation

---

## STEP 10: Record Demo Video

Follow `docs/demo-script.md` to record a 3-5 minute video:

**Must Include:**
1. ✅ Wallet connection (10s)
2. ✅ Architecture overview (20s)
3. ✅ Generate passport → show tx → explorer link (1-2 min)
4. ✅ Oracle integration (if configured) (30s)
5. ✅ Staking demo (if configured) (30s)
6. ✅ DeFi demo (30s)
7. ✅ Closing statement (10s)

**Upload to:** YouTube or Google Drive
**Add link to:** README.md

---

## STEP 11: Final README Updates

Update README.md with:

1. ✅ Contract addresses (replace placeholders)
2. ✅ Transaction hash (from Step 6.2)
3. ✅ Demo video link
4. ✅ Live frontend URL (if deployed)
5. ✅ Live backend URL (if deployed)
6. ✅ Screenshot references

---

## STEP 12: Final Verification

Run these checks:

```bash
# 1. Compile contracts
cd contracts && npm run compile

# 2. Run tests
cd contracts && npm test

# 3. Verify roles
cd contracts && npx hardhat run scripts/checkRoles.ts --network qieTestnet

# 4. Check backend health
curl http://localhost:8000/

# 5. Build frontend
cd frontend && npm run build
```

**All should pass!**

---

## STEP 13: Submission

1. ✅ Review CHECKLIST.md
2. ✅ Fill hackathon submission form:
   - Project title: "NeuroCred – AI Credit Passport on QIE"
   - Tagline: "AI-powered soulbound credit identity for safer lending on QIE"
   - Description: 2-3 sentences
   - Tech stack: Solidity, Hardhat, FastAPI, Next.js, QIE Testnet
   - GitHub repo: https://github.com/DiveshK007/NeuroCred
   - Demo video: Your YouTube/Drive link
   - Contract addresses: From Step 2.1
   - Transaction link: From Step 6.3
   - Screenshots: Upload all from Step 9
3. ✅ Submit!

---

## Troubleshooting

### Contract deployment fails
- Check wallet has QIE testnet tokens
- Verify RPC URL is correct
- Check private key format (must start with 0x)

### Backend fails to start
- Verify all .env variables are set
- Check backend wallet has tokens
- Verify contract addresses are correct

### Frontend can't connect to backend
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_API_URL in frontend/.env.local
- Check CORS settings in backend

### Transaction fails
- Verify backend wallet has SCORE_UPDATER_ROLE
- Check backend wallet has QIE tokens for gas
- Verify contract address is correct

---

**Need help?** Check CHECKLIST.md or review error messages carefully.

