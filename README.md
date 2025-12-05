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

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│  QIE Chain  │
│  (Next.js)  │      │  (FastAPI)   │      │ (Contracts) │
└─────────────┘      └──────────────┘      └─────────────┘
     │                     │                      │
     │                     │                      │
     └─────────────────────┴──────────────────────┘
                    Wallet Integration
```

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
- ✅ **Technical Execution (25%)**: Smart contracts, AI backend, full stack
- ✅ **Presentation (15%)**: Clean UI, comprehensive docs
- ✅ **Bonus (10%)**: Uses QIE Oracles, QIEDex integration ready

## 🏆 Hackathon Requirements

### $500 Valid Submission Requirements

- ✅ Wallet Integration (MetaMask/QIE Wallet)
- ✅ Smart Contracts Deployed on QIE Testnet
- ✅ Real On-Chain Functionality (minting, queries)

### Main Prize Requirements

- ✅ AI × Blockchain theme
- ✅ Identity & Security integration
- ✅ Tokenization (Credit Passport NFT)
- ✅ Oracle integration ready

## 📚 Documentation

- [Architecture](./docs/architecture.md)
- [API Documentation](./docs/api.md)
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

