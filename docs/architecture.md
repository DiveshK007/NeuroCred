# NeuroCred Architecture

## System Overview

NeuroCred is a three-tier architecture consisting of:

1. **Frontend** (Next.js + React)
2. **Backend** (FastAPI + Python)
3. **Blockchain** (Solidity contracts on QIE)

## Component Details

### Frontend Layer

**Technology**: Next.js 14, React, TypeScript, Tailwind CSS

**Key Components**:
- `WalletConnect`: Handles MetaMask/QIE Wallet connection
- `ScoreDisplay`: Visualizes credit score with gauge
- Landing page: User onboarding
- Dashboard: Score viewing and management
- Dev page: Integration documentation

**Responsibilities**:
- Wallet connection and transaction signing
- UI/UX for score generation
- Displaying on-chain data
- Integration documentation

### Backend Layer

**Technology**: FastAPI, Python, Web3.py

**Key Services**:
- `ScoringService`: AI-powered credit scoring
- `BlockchainService`: Contract interactions

**API Endpoints**:
- `POST /api/score`: Generate score for wallet
- `GET /api/score/{address}`: Get cached/on-chain score
- `POST /api/update-on-chain`: Update score on blockchain

**Scoring Algorithm**:
- Feature extraction from wallet history
- Rule-based scoring (extensible to ML)
- Risk band calculation (0-3)
- Score explanation generation

### Blockchain Layer

**Technology**: Solidity, Hardhat, OpenZeppelin

**Contracts**:
- `CreditPassportNFT`: Soulbound NFT storing scores
- `INeuroCredScore`: Interface for score queries
- `NeuroCredStaking`: Optional staking for NCRD token

**Key Functions**:
- `mintOrUpdate()`: Mint/update passport (backend only)
- `getScore()`: Public score query
- `passportIdOf()`: Get NFT token ID for wallet

## Data Flow

### Score Generation Flow

```
User → Frontend → Backend API → Scoring Service
                                    ↓
                            Wallet History Fetch
                                    ↓
                            Feature Extraction
                                    ↓
                            Score Calculation
                                    ↓
                            Backend → Blockchain
                                    ↓
                            mintOrUpdate() call
                                    ↓
                            NFT Minted/Updated
                                    ↓
                            Transaction Hash → Frontend
```

### Score Query Flow (for other dApps)

```
dApp → Contract Call → getScore(address)
                            ↓
                    Return ScoreView struct
                            ↓
                    dApp uses score for logic
```

## Security Considerations

1. **Soulbound NFTs**: Non-transferable, prevents score trading
2. **Access Control**: Only backend wallet can update scores
3. **Input Validation**: All addresses and scores validated
4. **Private Keys**: Backend keys stored securely in environment

## Scalability

- **Frontend**: Stateless, can scale horizontally
- **Backend**: Async FastAPI, can handle concurrent requests
- **Blockchain**: QIE's 25,000+ TPS handles high volume

## Future Enhancements

- ML model integration (XGBoost/neural networks)
- Oracle integration for real-time price data
- Multi-chain support
- Reputation system with history tracking
- Governance token (NCRD) for protocol decisions

