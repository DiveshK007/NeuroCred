# NeuroCred Connection Verification Guide

This document verifies all connections and features are properly established.

## ✅ Frontend-Backend API Connections

### API Endpoints Used:
1. **POST `/api/score`** - Generate credit score
   - Used in: `app/page.tsx`, `app/lending-demo/page.tsx`
   - ✅ Connected

2. **GET `/api/score/{address}`** - Get existing score
   - Used in: `app/lend/page.tsx`, `app/dashboard/page.tsx`
   - ✅ Connected

3. **POST `/api/chat`** - Q-Loan AI chat
   - Used in: `app/components/ChatConsole.tsx`
   - ✅ Connected

4. **GET `/api/oracle/price`** - Oracle price data
   - Used in: `app/dashboard/page.tsx`
   - ✅ Connected

5. **GET `/api/staking/{address}`** - Staking information
   - Used in: `app/dashboard/page.tsx`
   - ✅ Connected

6. **GET `/api/lending/ltv/{address}`** - LTV calculation
   - Used in: `app/components/DeFiDemo.tsx`
   - ✅ Connected

## ✅ Wallet Connection Flow

### Pages with Wallet Integration:
1. **Home (`app/page.tsx`)**
   - ✅ Auto-connects wallet on load
   - ✅ Uses `ethers.BrowserProvider`
   - ✅ Calls `eth_requestAccounts` for permission

2. **Dashboard (`app/dashboard/page.tsx`)**
   - ✅ Auto-connects wallet on load
   - ✅ Fetches balance and score data

3. **Stake (`app/stake/page.tsx`)**
   - ✅ Auto-connects wallet on load
   - ✅ Manual connect button available
   - ✅ Uses new Layout component

4. **Lend (`app/lend/page.tsx`)**
   - ✅ Auto-connects wallet on load
   - ✅ Loads score and active loans
   - ✅ Uses new Layout component

5. **Lending Demo (`app/lending-demo/page.tsx`)**
   - ✅ Auto-connects wallet on load
   - ✅ Score generation flow
   - ✅ Uses new Layout component

## ✅ Smart Contract Interactions

### Contracts Used:
1. **CreditPassportNFT**
   - ✅ Read: `getScore(address)` - Used in backend
   - ✅ Write: `mintOrUpdate()` - Called by backend

2. **NeuroCredStaking**
   - ✅ Read: `integrationTier(address)`, `stakedAmount(address)`
   - ✅ Write: `stake(amount)`, `unstake(amount)`
   - ✅ Used in: `app/components/QIEStaking.tsx`

3. **LendingVault**
   - ✅ Read: `getBorrowerLoans(address)`, `calculateTotalOwed(loanId)`
   - ✅ Write: `createLoan(offer, signature)`
   - ✅ Used in: `app/lend/page.tsx`

4. **DemoLender**
   - ✅ Read: `getLTV(address)`
   - ✅ Used in: `app/components/DeFiDemo.tsx`

## ✅ Environment Variables

### Frontend (`NEXT_PUBLIC_*`):
- `NEXT_PUBLIC_API_URL` - Backend API URL ✅
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - CreditPassportNFT address ✅
- `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS` - Staking contract ✅
- `NEXT_PUBLIC_NCRD_TOKEN_ADDRESS` - NCRD token ✅
- `NEXT_PUBLIC_LENDING_VAULT_ADDRESS` - LendingVault address ✅
- `NEXT_PUBLIC_DEMO_LENDER_ADDRESS` - DemoLender address ✅
- `NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX` - Explorer URL ✅

### Backend:
- `QIE_RPC_URL` - QIE blockchain RPC ✅
- `BACKEND_PRIVATE_KEY` - Backend signer key ✅
- `CREDIT_PASSPORT_NFT_ADDRESS` - Contract address ✅
- `STAKING_ADDRESS` - Staking contract (optional) ✅
- `QIE_ORACLE_USD_ADDR` - Oracle address (optional) ✅

## ✅ Component Architecture

### Layout System:
- ✅ All pages use `Layout` component (includes Sidebar)
- ✅ Consistent navigation across all pages
- ✅ Wallet status displayed in Sidebar

### Feature Components:
- ✅ `CreditScoreOrb` - Score visualization
- ✅ `ScoreDisplay` - Score details
- ✅ `ChatConsole` - Q-Loan AI chat
- ✅ `QIEStaking` - Staking interface
- ✅ `DeFiDemo` - Lending demo
- ✅ `NeuroCredLogo` - Brand logo

## ✅ Data Flow

### Score Generation Flow:
1. User connects wallet ✅
2. Frontend calls `POST /api/score` ✅
3. Backend computes score (oracle + staking) ✅
4. Backend calls `mintOrUpdate()` on-chain ✅
5. Backend returns score + txHash ✅
6. Frontend displays score + explorer link ✅

### Staking Flow:
1. User connects wallet ✅
2. Frontend loads staking info from contract ✅
3. User stakes NCRD tokens ✅
4. Contract updates staked amount ✅
5. Next score refresh includes staking boost ✅

### Q-Loan Flow:
1. User connects wallet ✅
2. Frontend loads score ✅
3. User chats with AI agent ✅
4. AI generates loan offer ✅
5. AI signs offer with EIP-712 ✅
6. User accepts offer → creates loan on-chain ✅

## ✅ Error Handling

- ✅ API errors caught and displayed
- ✅ Wallet connection errors handled
- ✅ Contract call errors handled
- ✅ Loading states for async operations
- ✅ Fallback values for missing data

## 🧪 Testing Checklist

To verify all connections work:

1. **Start Backend:**
   ```bash
   cd backend
   python -m uvicorn app:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Each Feature:**
   - [ ] Home: Connect wallet → Generate score
   - [ ] Dashboard: View real-time data (oracle, staking, balance)
   - [ ] Stake: Stake/unstake NCRD tokens
   - [ ] Lend: Chat with AI → Accept loan offer
   - [ ] Lending Demo: Generate score → View LTV

4. **Verify On-Chain:**
   - [ ] Check explorer for score update transaction
   - [ ] Check explorer for staking transaction
   - [ ] Check explorer for loan creation transaction

## 🔧 Troubleshooting

### If API calls fail:
- Check `NEXT_PUBLIC_API_URL` is set correctly
- Verify backend is running on correct port
- Check CORS settings in backend

### If wallet connection fails:
- Ensure MetaMask/QIE Wallet is installed
- Check network is set to QIE Testnet
- Verify RPC URL is correct

### If contract calls fail:
- Verify contract addresses in `.env`
- Check contract is deployed on QIE Testnet
- Ensure wallet has testnet tokens for gas

