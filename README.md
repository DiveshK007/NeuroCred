# NeuroCred

**AI-Powered Credit Passport on QIE Blockchain**

An on-chain credit scoring system that analyzes wallet activity, generates credit scores (0-1000), and stores them as soulbound NFTs. Any DeFi protocol on QIE can query scores to enable safer, under-collateralized lending.

---

## 🎯 Overview

NeuroCred solves the problem of blind lending in DeFi by providing portable, on-chain credit identity. Wallets receive a reusable credit score stored as a soulbound NFT, enabling any protocol to make informed lending decisions with a single contract call.

### Features

- 🤖 **AI-Powered Scoring** - Analyzes transaction history, portfolio composition, and on-chain behavior
- 🔒 **Soulbound NFT** - Non-transferable Credit Passport stores score on-chain
- 🔌 **Universal Integration** - Simple contract interface for any dApp
- ⚡ **QIE Optimized** - Built for QIE's 25,000+ TPS and near-zero fees
- 📊 **QIE Oracles** - Real-time price and volatility data integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Landing  │  │Dashboard │  │   Docs   │                  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                  │
│       └─────────────┴──────────────┘                         │
│                    │                                          │
│            WalletConnect │ ScoreDisplay                       │
└────────────────────┼──────────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────┼──────────────────────────────────────────┐
│              Backend (FastAPI)                                 │
│  ┌──────────────────────────────────────┐                     │
│  │  API: /api/score, /api/update        │                     │
│  └──────────────┬───────────────────────┘                     │
│                 │                                              │
│  ┌──────────────▼──────────────┐                             │
│  │  Scoring Service             │                             │
│  │  • Feature Extraction        │                             │
│  │  • Score Calculation (0-1000)│                             │
│  │  • Risk Band (1-3)           │                             │
│  └──────────────┬───────────────┘                             │
│                 │                                              │
│  ┌──────────────▼──────────────┐  ┌──────────────────────┐  │
│  │  Transaction Indexer        │  │  QIE Oracle Service   │  │
│  │  • Full TX History          │  │  • Price Data         │  │
│  │  • Volume Analysis          │  │  • Volatility         │  │
│  │  • Token Detection          │  │  • Historical Data    │  │
│  └──────────────┬───────────────┘  └──────────────────────┘  │
│                 │                                              │
│  ┌──────────────▼──────────────┐                             │
│  │  Blockchain Service          │                             │
│  │  • Contract Interaction      │                             │
│  │  • Transaction Signing       │                             │
│  └──────────────┬───────────────┘                             │
└─────────────────┼──────────────────────────────────────────────┘
                  │ RPC
┌─────────────────┼──────────────────────────────────────────────┐
│           QIE Blockchain (EVM-Compatible)                     │
│  ┌──────────────────────────────────────────────┐             │
│  │  CreditPassportNFT (Soulbound)               │             │
│  │  • mintOrUpdate(address, score, riskBand)   │             │
│  │  • getScore(address) → ScoreView             │             │
│  └──────────────────────────────────────────────┘             │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │  QIE Oracles    │  │  QIEDex          │                  │
│  │  (7 Oracles)    │  │  (Token Creator) │                  │
│  └──────────────────┘  └──────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User → Connect Wallet → Generate Score
  ↓
Backend → Analyze TX History → Fetch Oracle Data → Calculate Score
  ↓
Blockchain → mintOrUpdate() → Store as Soulbound NFT
  ↓
Frontend → Display Score + Risk Band + TX Hash
  ↓
DeFi Protocol → getScore(address) → Adjust LTV/Rates
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- QIE Testnet RPC access
- MetaMask or QIE Wallet

### Installation

```bash
# Clone repository
git clone https://github.com/DiveshK007/NeuroCred.git
cd NeuroCred

# Install contracts dependencies
cd contracts
npm install

# Install backend dependencies
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### Configuration

1. **Contracts** - Create `contracts/.env`:
```env
QIE_TESTNET_RPC_URL=https://testnet.qie.digital
PRIVATE_KEY=your_deployer_private_key
BACKEND_WALLET_ADDRESS=your_backend_wallet_address
```

2. **Backend** - Create `backend/.env`:
```env
QIE_TESTNET_RPC_URL=https://testnet.qie.digital
CREDIT_PASSPORT_NFT_ADDRESS=0x...  # After deployment
BACKEND_PRIVATE_KEY=your_backend_private_key
```

3. **Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # After deployment
```

### Deployment

```bash
# 1. Deploy contracts
cd contracts
npm run deploy:testnet

# 2. Start backend
cd ../backend
python app.py

# 3. Start frontend
cd ../frontend
npm run dev
```

Visit `http://localhost:3000` to use the application.

---

## 📁 Project Structure

```
NeuroCred/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/     # Solidity contracts
│   ├── scripts/       # Deployment & verification
│   └── test/          # Contract tests
├── backend/           # FastAPI backend
│   ├── services/      # Scoring, blockchain, oracle services
│   ├── utils/         # Logging, caching, error handling
│   └── models/        # Data models
├── frontend/          # Next.js frontend
│   └── app/           # Pages and components
└── docs/              # Documentation
```

---

## 🔧 API Endpoints

### Generate Score
```http
POST /api/score
Content-Type: application/json

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
  "explanation": "Low risk: High transaction activity...",
  "transactionHash": "0x..."
}
```

### Get Score
```http
GET /api/score/{address}
```

### Health Check
```http
GET /health
```

---

## 🔌 Integration

Any DeFi protocol can query NeuroCred scores:

```solidity
import "./INeuroCredScore.sol";

contract MyLendingProtocol {
    INeuroCredScore neuroCred = INeuroCredScore(0x...);
    
    function checkCredit(address borrower) external view {
        INeuroCredScore.ScoreView memory score = neuroCred.getScore(borrower);
        
        if (score.riskBand == 1) {
            // Low risk - allow higher LTV
            ltv = 80%;
        } else if (score.riskBand == 2) {
            // Medium risk
            ltv = 60%;
        } else {
            // High risk
            ltv = 40%;
        }
    }
}
```

---

## 🧪 Testing

```bash
# Test contracts
cd contracts
npm test

# Verify deployment
npm run verify:deployment
npm run verify:role
```

---

## 📚 Documentation

- [Demo Script](./docs/demo-script.md) - Video demo guide
- [QIEDex Integration](./docs/qiedex-integration.md) - Token creation guide

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Backend**: FastAPI, Python, Web3.py
- **Frontend**: Next.js, React, Ethers.js, Tailwind CSS
- **Blockchain**: QIE Testnet (EVM-compatible)
- **Oracles**: QIE Oracles (7 oracles)

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team

**Divesh Kumar**
- GitHub: [@DiveshK007](https://github.com/DiveshK007)
- Email: diveshkumar.s007@gmail.com

---

## 🔗 Links

- **GitHub**: https://github.com/DiveshK007/NeuroCred
- **Demo Video**: [Add your video link]
- **Contract Address**: [Add after deployment]
- **Explorer**: [Add explorer link]

---

Built for QIE Hackathon 2025 🚀
