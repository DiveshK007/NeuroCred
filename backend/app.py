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
    score: int
    riskBand: int
    explanation: str
    transactionHash: Optional[str] = None

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
        
        return ScoreResponse(
            address=request.address,
            score=result["score"],
            riskBand=result["riskBand"],
            explanation=result["explanation"],
            transactionHash=tx_hash
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/score/{address}", response_model=ScoreResponse)
async def get_score(address: str):
    """Get cached score for a wallet address"""
    try:
        # First try to get from blockchain
        on_chain_score = await blockchain_service.get_score(address)
        if on_chain_score and on_chain_score["score"] > 0:
            return ScoreResponse(
                address=address,
                score=on_chain_score["score"],
                riskBand=on_chain_score["riskBand"],
                explanation="Score retrieved from blockchain",
                transactionHash=None
            )
        
        # If not on-chain, compute new score
        result = await scoring_service.compute_score(address)
        return ScoreResponse(
            address=address,
            score=result["score"],
            riskBand=result["riskBand"],
            explanation=result["explanation"],
            transactionHash=None
        )
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

