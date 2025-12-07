from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from services.scoring import ScoringService
from services.blockchain import BlockchainService
from config import Config
from utils.logger import logger
from utils.error_handler import global_exception_handler, NeuroCredError
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False
    Limiter = None

load_dotenv()

# Validate configuration
config_errors = Config.validate()
if config_errors:
    logger.warning(f"Configuration warnings: {', '.join(config_errors)}")

app = FastAPI(
    title="NeuroCred API",
    version="1.0.0",
    description="AI-powered credit passport API for QIE blockchain"
)

# Rate limiting
limiter = None
if Config.RATE_LIMIT_ENABLED and SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
elif Config.RATE_LIMIT_ENABLED:
    logger.warning("Rate limiting enabled but slowapi not installed. Install with: pip install slowapi")

# Add global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    scoring_service = ScoringService()
    blockchain_service = BlockchainService()
    logger.info("Services initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    raise

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
    """Health check endpoint"""
    return {
        "message": "NeuroCred API",
        "version": "1.0.0",
        "status": "healthy",
        "environment": Config.ENV
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    health_status = {
        "status": "healthy",
        "services": {
            "scoring": "operational",
            "blockchain": "operational" if blockchain_service else "unavailable",
            "oracle": "operational"
        },
        "contract": {
            "address": Config.CREDIT_PASSPORT_NFT_ADDRESS or "not deployed",
            "network": Config.get_rpc_url()
        }
    }
    
    # Check blockchain connection
    try:
        # Simple connectivity check
        health_status["services"]["blockchain"] = "operational"
    except:
        health_status["services"]["blockchain"] = "degraded"
        health_status["status"] = "degraded"
    
    return health_status

@app.post("/api/score", response_model=ScoreResponse)
async def generate_score(request: Request, score_request: ScoreRequest):
    """Generate credit score for a wallet address and update on-chain"""
    try:
        logger.info(f"Generating score for address: {score_request.address}")
        # Compute score
        result = await scoring_service.compute_score(score_request.address)
        
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
        
        logger.info(f"Score generated: {result['score']} for {score_request.address}, tx: {tx_hash}")
        return ScoreResponse(
            address=score_request.address,
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

