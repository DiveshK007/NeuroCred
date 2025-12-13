# 🚀 Step-by-Step Guide: Deploy NeuroCred + Q-Loan

Follow these steps **in order**. I'll guide you through each one.

---

## ✅ STEP 1: Check Prerequisites

### 1.1 Do you have a wallet with QIE testnet tokens?

**If NO** → Get testnet tokens first:
1. Visit QIE testnet faucet (check QIE docs for URL)
2. Request tokens for your wallet address
3. Wait for tokens to arrive

**If YES** → Continue to Step 1.2

### 1.2 Get your wallet details

You need:
- **Private Key**: Your wallet's private key (starts with `0x`)
- **Address**: Your wallet's address (starts with `0x`)

**⚠️ SECURITY**: Never share your private key! Only use it in `.env` files (which are gitignored).

---

## ✅ STEP 2: Configure Contracts Environment

### 2.1 Edit `contracts/.env`

Open `contracts/.env` and fill in:

```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BACKEND_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS_HERE
```

**Note**: You can use the same wallet for both deployer and backend, or use different wallets.

### 2.2 Verify .env is gitignored

```bash
cd contracts
git check-ignore .env
```

Should output: `.env` (meaning it's ignored ✅)

---

## ✅ STEP 3: Deploy Contracts

### 3.1 Install dependencies (if needed)

```bash
cd contracts
npm install
```

### 3.2 Deploy all contracts

```bash
npx hardhat run scripts/deploy_all.ts --network qieTestnet
```

**What happens:**
- Deploys CreditPassportNFT
- Deploys DemoLender  
- Deploys LendingVault (Q-Loan)
- Grants SCORE_UPDATER_ROLE to backend wallet

**📝 IMPORTANT**: Copy all the contract addresses from the output!

**Expected output:**
```
✅ CreditPassportNFT deployed to: 0x...
✅ DemoLender deployed to: 0x...
✅ LendingVault deployed to: 0x...
✅ SCORE_UPDATER_ROLE granted to: 0x...
```

---

## ✅ STEP 4: Configure Backend

### 4.1 Create backend/.env

```bash
cd backend
cp .env.example .env
```

### 4.2 Edit `backend/.env`

Fill in the contract addresses from Step 3.2:

```env
QIE_RPC_URL=https://testnet.qie.digital
BACKEND_PK=0xYOUR_BACKEND_PRIVATE_KEY  # Same as PRIVATE_KEY from contracts/.env
CREDIT_PASSPORT_ADDRESS=0x...  # From Step 3.2
DEMO_LENDER_ADDRESS=0x...  # From Step 3.2
LENDING_VAULT_ADDRESS=0x...  # From Step 3.2
AI_SIGNER_ADDRESS=0x...  # Same as BACKEND_WALLET_ADDRESS
```

### 4.3 Install backend dependencies

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4.4 Test backend

```bash
python -m uvicorn app:app --reload --port 8000
```

**Test it:**
```bash
curl http://localhost:8000/
```

Should return: `{"message": "NeuroCred API", "version": "1.0.0"}`

**✅ SUCCESS**: Backend is running!

---

## ✅ STEP 5: Configure Frontend

### 5.1 Create frontend/.env.local

```bash
cd frontend
cp .env.local.example .env.local
```

### 5.2 Edit `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # CreditPassportNFT from Step 3.2
NEXT_PUBLIC_DEMO_LENDER_ADDRESS=0x...  # From Step 3.2
NEXT_PUBLIC_LENDING_VAULT_ADDRESS=0x...  # From Step 3.2
NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX=https://testnet.qie.digital/tx
```

### 5.3 Install frontend dependencies

```bash
cd frontend
npm install
```

### 5.4 Start frontend

```bash
npm run dev
```

**Open**: http://localhost:3000

**✅ SUCCESS**: Frontend is running!

---

## ✅ STEP 6: Generate Your First Credit Passport (CRITICAL!)

This proves you meet the $500 requirement!

### 6.1 Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask or QIE Wallet
4. **Switch to QIE Testnet** if needed
5. Approve connection

### 6.2 Generate Score

1. Click "Generate My Credit Passport"
2. Wait for backend to compute score
3. Backend automatically calls `mintOrUpdate()` on-chain
4. **COPY THE TRANSACTION HASH** from the response

**Expected:**
- Score displayed (e.g., 750)
- Risk band shown (e.g., Low Risk)
- Transaction hash: `0x...` ← COPY THIS!

### 6.3 Verify on Explorer

1. Click "View Transaction on Explorer" link
2. OR open: `https://testnet.qie.digital/tx/YOUR_TX_HASH`
3. Verify transaction is confirmed
4. **Take a screenshot** 📸

**✅ SUCCESS**: You've proven on-chain functionality!

---

## ✅ STEP 7: Test Q-Loan Chat

### 7.1 Navigate to Lending Page

1. Click "💬 Chat with Q-Loan AI" button
2. OR go to: http://localhost:3000/lend

### 7.2 Chat with AI

Type: `"I need 5000 QIE"`

**Expected:**
- AI responds with your score
- AI generates loan offer
- Shows: Amount, Collateral, Interest Rate, Duration
- "Accept Offer" button appears

### 7.3 Accept Offer (Optional - requires vault funding)

If you want to test full loan flow:
1. Make sure LendingVault has liquidity (deposit QIE to vault)
2. Click "Accept Offer"
3. Wallet popup → Sign transaction
4. Loan executes on-chain
5. Copy transaction hash

---

## ✅ STEP 8: Update README with Real Addresses

### 8.1 Edit README.md

Replace all placeholders with real addresses from Step 3.2:

```markdown
- **CreditPassportNFT**: `0x...` (your real address)
- **LendingVault**: `0x...` (your real address)
- **Example Transaction**: `https://testnet.qie.digital/tx/0x...` (from Step 6.2)
```

### 8.2 Commit changes

```bash
git add README.md
git commit -m "docs: Add real contract addresses and transaction hash"
git push origin feature/fullstack-enhancements
```

---

## ✅ STEP 9: Capture Screenshots

Take screenshots and save to `screenshots/` folder:

1. **landing.png** - Landing page
2. **generate_passport.png** - Score generation with tx hash
3. **explorer_tx.png** - Transaction on QIE explorer
4. **chat_negotiation.png** - Q-Loan chat interface
5. **lending_demo.png** - DeFi demo page

---

## ✅ STEP 10: Record Demo Video

Follow `docs/demo-script.md`:

**Must show:**
1. ✅ Wallet connection
2. ✅ Generate passport → Show tx → Explorer link
3. ✅ Chat with Q-Loan AI
4. ✅ Loan offer generation
5. ✅ All features working

**Upload to**: YouTube or Google Drive
**Add link to**: README.md

---

## ✅ STEP 11: Final Checklist

Run through `CHECKLIST.md`:

- [ ] All contracts deployed
- [ ] SCORE_UPDATER_ROLE granted
- [ ] Backend running
- [ ] Frontend running
- [ ] First passport minted (tx hash saved)
- [ ] Chat working
- [ ] Screenshots captured
- [ ] Demo video recorded
- [ ] README updated
- [ ] All addresses documented

---

## 🆘 Troubleshooting

### "Insufficient funds" error
→ Get more QIE testnet tokens from faucet

### "Role not granted" error
→ Run: `npx hardhat run scripts/grant_updater_role.ts --network qieTestnet`

### Backend won't start
→ Check all .env variables are set correctly

### Frontend can't connect to backend
→ Verify backend is running on port 8000
→ Check NEXT_PUBLIC_API_URL in frontend/.env.local

### Contract deployment fails
→ Check wallet has QIE tokens
→ Verify RPC URL is correct
→ Check private key format (must start with 0x)

---

**Ready to start?** Let me know when you've filled in `contracts/.env` and we'll proceed to Step 3 (deploy contracts)!

