from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from services.scoring import ScoringService
from services.blockchain import BlockchainService

load_dotenv()

app = FastAPI(title="NeuroCred API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
scoring_service = ScoringService()
blockchain_service = BlockchainService()

# Request/Response models
class ScoreRequest(BaseModel):
    address: str

class ScoreResponse(BaseModel):
    address: str
    score: int  # Final score
    baseScore: int = 0  # Base score before boosts
    riskBand: int
    explanation: str
    transactionHash: Optional[str] = None
    stakingBoost: int = 0
    oraclePenalty: int = 0
    stakedAmount: int = 0
    stakingTier: int = 0

class UpdateOnChainRequest(BaseModel):
    address: str
    score: int
    riskBand: int

class UpdateOnChainResponse(BaseModel):
    success: bool
    transactionHash: Optional[str] = None
    message: str

@app.get("/")
async def root():
    return {"message": "NeuroCred API", "version": "1.0.0"}

@app.post("/api/score", response_model=ScoreResponse)
async def generate_score(request: ScoreRequest):
    """Generate credit score for a wallet address and update on-chain"""
    try:
        # Compute score
        result = await scoring_service.compute_score(request.address)
        
        # Automatically update on-chain
        tx_hash = None
        try:
            tx_hash = await blockchain_service.update_score(
                request.address,
                result["score"],
                result["riskBand"]
            )
        except Exception as e:
            # Log error but don't fail the request
            print(f"Warning: Failed to update on-chain: {e}")
            # Continue without tx_hash
        
        # Construct explorer URL if tx_hash exists
        explorer_prefix = os.getenv("QIE_EXPLORER_TX_URL_PREFIX", "https://testnet.qie.digital/tx")
        tx_url = f"{explorer_prefix}/{tx_hash}" if tx_hash else None
        
        return ScoreResponse(
            address=request.address,
            score=result["score"],
            baseScore=result.get("baseScore", result["score"]),
            riskBand=result["riskBand"],
            explanation=result["explanation"],
            transactionHash=tx_hash,
            stakingBoost=result.get("stakingBoost", 0),
            oraclePenalty=result.get("oraclePenalty", 0),
            stakedAmount=result.get("stakedAmount", 0),
            stakingTier=result.get("stakingTier", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/score/{address}", response_model=ScoreResponse)
async def get_score(address: str):
    """Get score for a wallet address (from blockchain or compute new)"""
    try:
        # First try to get from blockchain
        on_chain_score = await blockchain_service.get_score(address)
        if on_chain_score and on_chain_score["score"] > 0:
            return ScoreResponse(
                address=address,
                score=on_chain_score["score"],
                baseScore=on_chain_score["score"],  # On-chain doesn't store breakdown
                riskBand=on_chain_score["riskBand"],
                explanation="Score retrieved from blockchain",
                transactionHash=None,
                stakingBoost=0,
                oraclePenalty=0,
                stakedAmount=0,
                stakingTier=0
            )
        
        # If not on-chain, compute new score
        result = await scoring_service.compute_score(address)
        return ScoreResponse(
            address=address,
            score=result["score"],
            baseScore=result.get("baseScore", result["score"]),
            riskBand=result["riskBand"],
            explanation=result["explanation"],
            transactionHash=None,
            stakingBoost=result.get("stakingBoost", 0),
            oraclePenalty=result.get("oraclePenalty", 0),
            stakedAmount=result.get("stakedAmount", 0),
            stakingTier=result.get("stakingTier", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/oracle/price")
async def get_oracle_price():
    """Get current oracle price"""
    try:
        oracle_address = os.getenv("QIE_ORACLE_USD_ADDR")
        if not oracle_address or oracle_address == "0x0000000000000000000000000000000000000000":
            return {"price": None, "error": "Oracle address not configured"}
        
        from services.oracle import QIEOracleService
        oracle_service = QIEOracleService()
        price = await oracle_service.fetchOraclePrice(oracle_address)
        
        return {
            "price": price,
            "timestamp": int(__import__("time").time()),
            "oracleAddress": oracle_address
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/staking/{address}")
async def get_staking_info(address: str):
    """Get staking information for an address"""
    try:
        from services.staking import StakingService
        staking_service = StakingService()
        
        staked_amount = staking_service.get_staked_amount(address)
        tier = staking_service.get_integration_tier(address)
        boost = staking_service.calculate_staking_boost(tier)
        
        tier_names = {0: "None", 1: "Bronze", 2: "Silver", 3: "Gold"}
        
        return {
            "address": address,
            "stakedAmount": staked_amount,
            "tier": tier,
            "tierName": tier_names.get(tier, "Unknown"),
            "scoreBoost": boost
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lending/ltv/{address}")
async def get_ltv(address: str):
    """Get LTV (Loan-to-Value) for an address"""
    try:
        # Get score first
        result = await scoring_service.compute_score(address)
        risk_band = result["riskBand"]
        
        # Map risk band to LTV (basis points)
        ltv_map = {
            1: 7000,  # 70%
            2: 5000,  # 50%
            3: 3000,  # 30%
            0: 0      # No passport
        }
        
        ltv_bps = ltv_map.get(risk_band, 0)
        
        return {
            "address": address,
            "ltvBps": ltv_bps,
            "ltvPercent": ltv_bps / 100,
            "riskBand": risk_band,
            "score": result["score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Q-Loan Chat API
class ChatRequest(BaseModel):
    address: str
    message: str

class ChatResponse(BaseModel):
    response: str
    offer: Optional[Dict] = None
    signature: Optional[str] = None
    requiresSignature: bool = False

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with Q-Loan AI agent"""
    try:
        from core.agent import QLoanAgent
        agent = QLoanAgent()
        result = await agent.process_chat(request.address, request.message)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update-on-chain", response_model=UpdateOnChainResponse)
async def update_on_chain(request: UpdateOnChainRequest):
    """Update score on blockchain"""
    try:
        tx_hash = await blockchain_service.update_score(
            request.address,
            request.score,
            request.riskBand
        )
        return UpdateOnChainResponse(
            success=True,
            transactionHash=tx_hash,
            message="Score updated on-chain successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

