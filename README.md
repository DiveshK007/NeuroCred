# NeuroCred: AI Credit Passport on QIE

An AI-powered on-chain credit passport that scores wallets, mints a soulbound NFT, and lets any DeFi app on QIE do safer lending in 1 call.

## 🎯 Project Overview

NeuroCred provides a reusable credit scoring system for the QIE blockchain ecosystem. Wallets receive a credit score (0-1000) stored as a soulbound NFT, which any DeFi protocol can query to make informed lending decisions.

### Key Features

- **AI-Powered Scoring**: Analyzes on-chain activity, transaction history, and portfolio composition
- **Soulbound NFT**: Non-transferable Credit Passport NFT stores score on-chain
- **Universal Integration**: Any dApp can read scores via simple contract call
- **QIE Ecosystem**: Built for QIE Testnet with 25,000+ TPS and near-zero fees

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐ │
│  │   Landing    │         │  Dashboard   │         │ Integration  │ │
│  │    Page      │         │    Page      │         │   Docs Page  │ │
│  └──────────────┘         └──────────────┘         └──────────────┘ │
│         │                       │                       │           │
│         └───────────────────────┴───────────────────────┘           │
│                                 │                                     │
│                    ┌────────────▼────────────┐                       │
│                    │   React Components      │                       │
│                    │  - WalletConnect        │                       │
│                    │  - ScoreDisplay         │                       │
│                    │  - TransactionHandler   │                       │
│                    └────────────┬────────────┘                       │
│                                 │                                     │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │ HTTP/REST API
┌─────────────────────────────────┼─────────────────────────────────────┐
│                    APPLICATION LAYER (Backend)                         │
├─────────────────────────────────┼─────────────────────────────────────┤
│                                 │                                     │
│         ┌───────────────────────▼───────────────────────┐            │
│         │          FastAPI Application                   │            │
│         │  - POST /api/score (generate + update)        │            │
│         │  - GET  /api/score/{address} (query)          │            │
│         │  - POST /api/update-on-chain (manual update)   │            │
│         └───────────────────────┬───────────────────────┘            │
│                                 │                                     │
│         ┌───────────────────────┼───────────────────────┐            │
│         │                       │                       │            │
│  ┌──────▼──────┐      ┌─────────▼─────────┐  ┌─────────▼─────────┐ │
│  │  Scoring    │      │  Transaction      │  │   Blockchain      │ │
│  │  Service    │      │   Indexer         │  │    Service        │ │
│  │             │      │                   │  │                   │ │
│  │ - Feature   │      │ - Full TX history │  │ - Contract calls   │ │
│  │   extraction│      │ - TX analysis     │  │ - mintOrUpdate()  │ │
│  │ - Score calc│      │ - Metrics calc    │  │ - getScore()      │ │
│  │ - Risk band │      │ - Token detection │  │ - TX signing      │ │
│  └──────┬──────┘      └─────────┬─────────┘  └─────────┬─────────┘ │
│         │                       │                       │            │
│         └───────────────────────┼───────────────────────┘            │
│                                 │                                     │
│                    ┌─────────────▼─────────────┐                     │
│                    │   QIE Oracle Service      │                     │
│                    │  - Price fetching         │                     │
│                    │  - Volatility calculation │                     │
│                    │  - Historical data         │                     │
│                    └─────────────┬─────────────┘                     │
│                                   │                                   │
└───────────────────────────────────┼───────────────────────────────────┘
                                    │ RPC Calls
┌───────────────────────────────────┼───────────────────────────────────┐
│                    BLOCKCHAIN LAYER (QIE Network)                      │
├───────────────────────────────────┼───────────────────────────────────┤
│                                   │                                   │
│         ┌─────────────────────────▼─────────────────────────┐         │
│         │            QIE Blockchain (EVM-Compatible)         │         │
│         │  - 25,000+ TPS                                     │         │
│         │  - 3-second finality                                │         │
│         │  - Near-zero fees                                   │         │
│         └─────────────────────────┬─────────────────────────┘         │
│                                   │                                   │
│         ┌─────────────────────────┼─────────────────────────┐         │
│         │                         │                         │         │
│  ┌──────▼──────┐        ┌─────────▼─────────┐  ┌─────────▼─────────┐│
│  │CreditPassport│       │  QIE Oracles       │  │   QIEDex          ││
│  │     NFT      │       │  (7 Oracles)       │  │  (Token Creator)  ││
│  │              │       │                    │  │                   ││
│  │- Soulbound   │       │- Crypto prices     │  │- NCRD token       ││
│  │- Score store │       │- Forex rates       │  │- DEX integration  ││
│  │- getScore()  │       │- Commodity prices  │  │- Liquidity       ││
│  │- mintOrUpdate│       │- Volatility data   │  │                   ││
│  └──────────────┘       └────────────────────┘  └───────────────────┘│
│         │                                                             │
│  ┌──────▼──────┐                                                     │
│  │NeuroCred     │                                                     │
│  │  Staking     │                                                     │
│  │              │                                                     │
│  │- NCRD staking│                                                     │
│  │- Tier system │                                                     │
│  └──────────────┘                                                     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  QIE Wallet  │  │  MetaMask    │  │  QIE Explorer│                │
│  │              │  │  (with QIE   │  │              │                │
│  │- Wallet conn │  │   RPC)       │  │- TX tracking │                │
│  │- Signing     │  │- Signing     │  │- Contract    │                │
│  │- Balance     │  │- Balance     │  │  verification │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action Flow:
─────────────────
1. User connects wallet (Frontend)
   ↓
2. User clicks "Generate Credit Passport" (Frontend)
   ↓
3. Frontend → POST /api/score (Backend API)
   ↓
4. Backend Scoring Service:
   ├─→ Transaction Indexer: Fetch full TX history
   ├─→ QIE Oracle Service: Get prices & volatility
   ├─→ Feature Extraction: Calculate metrics
   └─→ Score Calculation: Generate score (0-1000)
   ↓
5. Backend Blockchain Service:
   ├─→ Sign transaction with backend wallet
   ├─→ Call mintOrUpdate() on CreditPassportNFT
   └─→ Wait for confirmation
   ↓
6. Backend → Return score + txHash (Backend API)
   ↓
7. Frontend displays:
   ├─→ Score gauge
   ├─→ Risk band
   ├─→ Transaction hash
   └─→ Explorer link
   ↓
8. Other dApps can query:
   └─→ getScore(address) directly from contract

DeFi Integration Flow:
──────────────────────
1. DeFi Protocol calls getScore(userAddress)
   ↓
2. Contract returns ScoreView {score, riskBand, lastUpdated}
   ↓
3. Protocol adjusts:
   ├─→ Loan-to-Value (LTV) ratio
   ├─→ Interest rates
   ├─→ Collateral requirements
   └─→ Loan limits
```

### Component Details

**Frontend (Next.js)**
- **Pages**: Landing, Dashboard, Integration Docs
- **Components**: WalletConnect, ScoreDisplay
- **State Management**: React hooks
- **Wallet Integration**: Ethers.js with MetaMask/QIE Wallet

**Backend (FastAPI)**
- **Scoring Service**: AI-powered credit scoring with full feature extraction
- **Transaction Indexer**: Complete transaction history analysis
- **Oracle Service**: QIE Oracle integration with fallback APIs
- **Blockchain Service**: Contract interaction and transaction signing

**Smart Contracts (Solidity)**
- **CreditPassportNFT**: Soulbound NFT storing credit scores
- **INeuroCredScore**: Interface for dApp integration
- **NeuroCredStaking**: NCRD token staking for integration tiers

**External Integrations**
- **QIE Oracles**: Price, volatility, forex, commodity data
- **QIEDex**: Token creation and DEX integration
- **QIE Explorer**: Transaction verification and tracking

## 📁 Project Structure

```
NeuroCred/
├── contracts/          # Hardhat smart contracts
│   ├── contracts/      # Solidity contracts
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
├── backend/            # FastAPI backend
│   ├── services/       # Scoring & blockchain services
│   ├── models/         # Data models
│   └── app.py          # FastAPI application
├── frontend/           # Next.js frontend
│   ├── app/            # Next.js app directory
│   └── components/     # React components
└── docs/               # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MetaMask or QIE Wallet

### 1. Contracts Setup

```bash
cd contracts
npm install
npm run compile
```

### 2. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuration

### Environment Variables

#### Contracts (`.env` in `contracts/`)
```
QIE_TESTNET_RPC_URL=https://testnet.qie.digital
QIE_TESTNET_CHAIN_ID=1337
PRIVATE_KEY=your_deployer_private_key
BACKEND_WALLET_ADDRESS=backend_wallet_address
```

#### Backend (`.env` in `backend/`)
```
QIE_TESTNET_RPC_URL=https://testnet.qie.digital
CREDIT_PASSPORT_NFT_ADDRESS=deployed_contract_address
BACKEND_PRIVATE_KEY=backend_wallet_private_key
```

#### Frontend (`.env.local` in `frontend/`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

## 📝 Deployment

### Deploy Contracts

```bash
cd contracts
npm run deploy:testnet
```

Save the deployed contract address to your backend and frontend `.env` files.

### Run Backend

```bash
cd backend
source venv/bin/activate
python app.py
```

Backend runs on `http://localhost:8000`

### Run Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## 🔌 Integration

### For DeFi Protocols

```solidity
import "./INeuroCredScore.sol";

INeuroCredScore neuro = INeuroCredScore(CONTRACT_ADDRESS);
INeuroCredScore.ScoreView memory sv = neuro.getScore(user);

if (sv.riskBand == 1) {
    // Low risk - offer better rates
    ltv = 80%;
} else if (sv.riskBand == 2) {
    // Medium risk
    ltv = 60%;
} else {
    // High risk - require more collateral
    ltv = 40%;
}
```

See `frontend/app/dev/page.tsx` for full integration examples.

## 📡 API Documentation

### Generate Credit Score

**Endpoint:** `POST /api/score`

**Request:**
```json
{
  "address": "0x..."
}
```

**Response:**
```json
{
  "address": "0x...",
  "score": 750,
  "riskBand": 1,
  "explanation": "Low risk: High transaction activity, good volume, stable portfolio",
  "transactionHash": "0x..." // Transaction hash from on-chain update
}
```

### Get Score

**Endpoint:** `GET /api/score/{address}`

**Response:**
```json
{
  "address": "0x...",
  "score": 750,
  "riskBand": 1,
  "explanation": "Score retrieved from blockchain"
}
```

### Update Score On-Chain

**Endpoint:** `POST /api/update-on-chain`

**Request:**
```json
{
  "address": "0x...",
  "score": 750,
  "riskBand": 1
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "Score updated on-chain successfully"
}
```

## ✅ Verification Steps

### Verify Contract Deployment

1. Deploy contracts:
   ```bash
   cd contracts
   npm run deploy:testnet
   ```

2. Verify on explorer:
   - Visit: `https://testnet.qie.digital/address/[CONTRACT_ADDRESS]`
   - Check contract code is verified
   - Verify SCORE_UPDATER_ROLE is set

3. Run verification script:
   ```bash
   cd contracts
   npm run verify:deployment
   ```

### Verify SCORE_UPDATER_ROLE

Run the verification script:
```bash
cd contracts
npm run verify:role
```

Or manually check:
```typescript
const hasRole = await passportNFT.hasRole(
  await passportNFT.SCORE_UPDATER_ROLE(),
  backendWalletAddress
);
console.log("Has role:", hasRole); // Should be true
```

### Verify API Endpoints

Test all endpoints:
```bash
# Test score generation
curl -X POST http://localhost:8000/api/score \
  -H "Content-Type: application/json" \
  -d '{"address": "0x..."}'

# Test get score
curl http://localhost:8000/api/score/0x...

# Test on-chain update
curl -X POST http://localhost:8000/api/update-on-chain \
  -H "Content-Type: application/json" \
  -d '{"address": "0x...", "score": 750, "riskBand": 1}'
```

## 🧪 Testing

### Contract Tests

```bash
cd contracts
npm test
```

### End-to-End Flow

1. Connect wallet on frontend
2. Click "Generate My Credit Passport"
3. Backend computes score
4. Score is minted as NFT on-chain
5. View score on dashboard
6. Other dApps can query score via contract

## 📊 Evaluation Criteria Alignment

- ✅ **Innovation (25%)**: First AI credit passport on QIE
- ✅ **Impact (25%)**: Enables safer lending across QIE DeFi
- ✅ **Technical Execution (25%)**: Smart contracts, AI backend, full stack, contract tests
- ✅ **Presentation (15%)**: Clean UI, comprehensive docs
- ✅ **Bonus (10%)**: ✅ QIE Oracles integrated, ✅ QIEDex integration ready, ✅ Contract tests

## 🏆 Hackathon Requirements

### $500 Valid Submission Requirements

- ✅ Wallet Integration (MetaMask/QIE Wallet)
- ✅ Smart Contracts Ready for QIE Testnet Deployment
- ✅ Real On-Chain Functionality (minting, queries)
- ✅ Contract Tests Included

### Main Prize Requirements

- ✅ AI × Blockchain theme
- ✅ Identity & Security integration
- ✅ Tokenization (Credit Passport NFT)
- ✅ QIE Oracles integrated
- ✅ QIEDex integration ready

## 📍 Contract Addresses

### QIE Testnet Deployment

**CreditPassportNFT Contract:**
```
Address: [To be deployed - run npm run deploy:testnet]
Explorer: https://testnet.qie.digital/address/[CONTRACT_ADDRESS]
```

**NeuroCredStaking Contract (Optional):**
```
Address: [To be deployed after NCRD token creation]
Explorer: https://testnet.qie.digital/address/[STAKING_ADDRESS]
```

> **Note**: After deployment, update these addresses in your `.env` files and this README.

## 🎬 Demo Video

**Demo Video Link:** [Add your YouTube/Vimeo link here after recording]

The demo video showcases:
- Problem statement and solution overview
- Live wallet connection and score generation
- On-chain transaction verification
- Developer integration examples
- Technical architecture walkthrough

> **Recording Guide**: See [docs/demo-script.md](./docs/demo-script.md) for detailed script.

## 📸 Screenshots

### Landing Page
![Landing Page](./screenshots/landing.png)
*Clean, modern UI with wallet connection*

### Score Dashboard
![Score Dashboard](./screenshots/dashboard.png)
*Credit score visualization with risk band indicator*

### Integration Guide
![Integration Guide](./screenshots/integration.png)
*Developer documentation for dApp integration*

> **Note**: Add screenshots to `screenshots/` folder and update paths above.

## 👥 Team

**Divesh Kumar**
- Role: Full-Stack Developer
- Email: diveshkumar.s007@gmail.com
- GitHub: [DiveshK007](https://github.com/DiveshK007)

> **Note**: Update with your actual team information.

## 🔗 Submission Links

- **GitHub Repository**: https://github.com/DiveshK007/NeuroCred
- **Live Frontend**: [Add your deployed frontend URL]
- **Backend API**: [Add your deployed backend URL]
- **Demo Video**: [Add your video URL]
- **Contract Explorer**: [Add contract explorer link after deployment]

## 📚 Documentation

- [Architecture](./docs/architecture.md)
- [Demo Video Script](./docs/demo-script.md)
- [QIEDex Integration](./docs/qiedex-integration.md)
- [Integration Guide](./frontend/app/dev/page.tsx)

## 🤝 Contributing

This is a hackathon project. For questions or issues, please open an issue on GitHub.

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **QIE Testnet**: https://testnet.qie.digital
- **QIE Wallet**: https://qiewallet.me
- **QIEDex**: https://qiedex.qie.digital
- **Documentation**: https://docs.qie.digital/developer-docs

---

Built for QIE Hackathon 2025 🚀

