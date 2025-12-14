from fastapi import FastAPI, HTTPException, Request, Depends, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv

from services.scoring import ScoringService
from services.blockchain import BlockchainService
from services.gdpr import GDPRService
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from utils.validators import validate_ethereum_address, validate_score, validate_risk_band, validate_message_length
from utils.sanitizers import sanitize_chat_message
from utils.wallet_verification import verify_timestamped_message, create_verification_message
from utils.audit_logger import log_score_generation, log_on_chain_update, log_loan_creation
from utils.jwt_handler import create_access_token
from models.auth import Token, AuthRequest
from utils.monitoring import init_sentry, capture_exception, set_user_context
from utils.logger import setup_logging, get_logger
from middleware.logging import LoggingMiddleware
from middleware.metrics import MetricsMiddleware
from middleware.performance import PerformanceMiddleware
from middleware.cache import CacheMiddleware
from utils.metrics import get_metrics, get_metrics_content_type, set_app_info

load_dotenv()

# Setup structured logging
setup_logging(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_file=os.getenv("LOG_FILE", os.path.join("logs", "app.log"))
)

logger = get_logger(__name__)

# Initialize Sentry before creating the app
init_sentry(
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
    enable_tracing=os.getenv("SENTRY_ENABLE_TRACING", "true").lower() == "true"
)

app = FastAPI(
    title="NeuroCred API",
    version="1.0.0",
    description="""
    NeuroCred API - AI-powered credit scoring on QIE blockchain.
    
    ## Features
    
    * **Credit Scoring**: Generate AI-powered credit scores based on on-chain activity
    * **Staking**: Stake NCRD tokens to boost your credit tier
    * **Lending**: Create and manage loans with AI negotiation
    * **Oracle Integration**: Real-time price and volatility data from QIE oracles
    * **Fraud Detection**: Advanced fraud detection and Sybil attack prevention
    
    ## Authentication
    
    Most endpoints require authentication via:
    * API Key in header: `X-API-Key: your-api-key`
    * JWT Token in header: `Authorization: Bearer your-jwt-token`
    * Wallet signature verification for blockchain operations
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Set application info for metrics
app_version = os.getenv("APP_VERSION", "1.0.0")
app_environment = os.getenv("ENVIRONMENT", "development")
set_app_info(app_version, app_environment)

# Add logging middleware (after CORS, before other middleware)
app.add_middleware(LoggingMiddleware)

# Add metrics middleware
if os.getenv("METRICS_ENABLED", "true").lower() == "true":
    app.add_middleware(MetricsMiddleware)

# Add performance monitoring middleware
if os.getenv("PERFORMANCE_MONITORING_ENABLED", "true").lower() == "true":
    app.add_middleware(PerformanceMiddleware)

# Add cache middleware (after logging, before other middleware)
if os.getenv("CACHE_ENABLED", "true").lower() == "true":
    app.add_middleware(CacheMiddleware)

# Add exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler that sends errors to Sentry"""
    from utils.monitoring import capture_exception
    
    # Capture exception in Sentry
    capture_exception(
        exc,
        endpoint=request.url.path,
        method=request.method,
        query_params=str(request.query_params),
    )
    
    # Return error response
    return HTTPException(
        status_code=500,
        detail="Internal server error"
    )

# Security headers middleware (must be first)
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware for frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url] if frontend_url != "*" else ["*"],  # Use env var in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Initialize database (if configured)
if os.getenv("DATABASE_URL"):
    from database.connection import init_db
    import asyncio
    # Initialize database on startup
    asyncio.create_task(init_db())

# Initialize services
scoring_service = ScoringService()
blockchain_service = BlockchainService()
gdpr_service = GDPRService()

# Request/Response models
class ScoreRequest(BaseModel):
    address: str = Field(..., description="Ethereum wallet address")
    signature: Optional[str] = Field(None, description="EIP-191 signature proving wallet ownership")
    message: Optional[str] = Field(None, description="Message that was signed")
    timestamp: Optional[int] = Field(None, description="Timestamp from signed message")
    
    @validator('address')
    def validate_address(cls, v):
        return validate_ethereum_address(v)

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
    address: str = Field(..., description="Ethereum wallet address")
    score: int = Field(..., description="Credit score (0-1000)")
    riskBand: int = Field(..., description="Risk band (0-3)")
    
    @validator('address')
    def validate_address(cls, v):
        return validate_ethereum_address(v)
    
    @validator('score')
    def validate_score(cls, v):
        return validate_score(v)
    
    @validator('riskBand')
    def validate_risk_band(cls, v):
        return validate_risk_band(v)

class UpdateOnChainResponse(BaseModel):
    success: bool
    transactionHash: Optional[str] = None
    message: str

@app.get("/")
@limiter.limit("100/minute")
async def root(request: Request):
    """API root endpoint"""
    return {"message": "NeuroCred API", "version": "1.0.0"}

@app.get("/health")
@limiter.exempt
async def health_check(request: Request):
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "NeuroCred API",
        "version": "1.0.0"
    }

@app.post("/api/auth/token", response_model=Token)
@limiter.limit("10/minute")
async def create_token(request: Request, auth_request: AuthRequest):
    """
    Create JWT token using wallet signature
    Alternative to API keys for user authentication
    """
    try:
        from utils.wallet_verification import verify_wallet_signature
        
        # Verify wallet signature
        if not verify_wallet_signature(
            auth_request.address,
            auth_request.message,
            auth_request.signature
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid wallet signature"
            )
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": auth_request.address, "role": "user"}
        )
        
        from utils.jwt_handler import JWT_EXPIRATION_HOURS
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=JWT_EXPIRATION_HOURS * 3600
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/score", response_model=ScoreResponse)
@limiter.limit("10/minute")  # Stricter limit for score generation
async def generate_score(
    request: Request,
    score_request: ScoreRequest,
    current_user: Optional[str] = Depends(get_current_user)
):
    """
    Generate credit score for a wallet address and update on-chain
    Requires authentication (API key or JWT) or wallet signature
    """
    try:
        # Verify wallet signature if provided (alternative to API key/JWT)
        if score_request.signature and score_request.message and score_request.timestamp:
            verification_message = create_verification_message(
                score_request.address,
                "generate_score",
                score_request.timestamp
            )
            
            if not verify_timestamped_message(
                score_request.address,
                verification_message,
                score_request.signature,
                max_age_seconds=300
            ):
                log_score_generation(request, score_request.address, 0, "failure", "Invalid wallet signature")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid wallet signature"
                )
        elif not current_user:
            # Require authentication if no signature provided
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required (API key, JWT, or wallet signature)"
            )
        
        # Compute score (use async task if enabled, otherwise sync)
        use_async = os.getenv("USE_ASYNC_SCORE_COMPUTATION", "false").lower() == "true"
        
        if use_async:
            # Enqueue for background processing
            from rq import Queue
            from redis import Redis
            from tasks.score_tasks import compute_score_task
            
            redis_url = os.getenv("RQ_REDIS_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/2")
            redis_conn = Redis.from_url(redis_url)
            queue = Queue("score_computation", connection=redis_conn)
            
            job = queue.enqueue(compute_score_task, score_request.address)
            
            # Return job ID, client can poll for result
            return ScoreResponse(
                address=score_request.address,
                score=0,  # Placeholder
                baseScore=0,
                riskBand=0,
                explanation="Score computation queued. Use job_id to check status.",
                transactionHash=None,
                stakingBoost=0,
                oraclePenalty=0,
                stakedAmount=0,
                stakingTier=0
            )
        else:
            # Compute synchronously
            result = await scoring_service.compute_score(score_request.address)
        
        # Automatically update on-chain
        tx_hash = None
        try:
            tx_hash = await blockchain_service.update_score(
                score_request.address,
                result["score"],
                result["riskBand"]
            )
            log_on_chain_update(request, score_request.address, tx_hash, "success")
        except Exception as e:
            # Log error but don't fail the request
            error_msg = str(e)
            log_on_chain_update(request, score_request.address, "", "failure", error_msg)
            # Continue without tx_hash
        
        # Log successful score generation
        log_score_generation(request, score_request.address, result["score"], "success")
        
        # Construct explorer URL if tx_hash exists
        explorer_prefix = os.getenv("QIE_EXPLORER_TX_URL_PREFIX", "https://testnet.qie.digital/tx")
        tx_url = f"{explorer_prefix}/{tx_hash}" if tx_hash else None
        
        return ScoreResponse(
            address=score_request.address,
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
    except HTTPException:
        raise
    except Exception as e:
        log_score_generation(request, score_request.address, 0, "failure", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/score/{address}", response_model=ScoreResponse)
@limiter.limit("60/minute")
async def get_score(request: Request, address: str):
    """Get score for a wallet address (from blockchain or compute new)"""
    try:
        # Validate address
        address = validate_ethereum_address(address)
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
@limiter.limit("60/minute")
async def get_oracle_price(request: Request):
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
@limiter.limit("60/minute")
async def get_staking_info(request: Request, address: str):
    """Get staking information for an address"""
    try:
        # Validate address
        address = validate_ethereum_address(address)
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
@limiter.limit("60/minute")
async def get_ltv(request: Request, address: str):
    """Get LTV (Loan-to-Value) for an address"""
    try:
        # Validate address
        address = validate_ethereum_address(address)
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

# NeuroLend Chat API
class ChatRequest(BaseModel):
    address: str = Field(..., description="Ethereum wallet address")
    message: str = Field(..., description="Chat message")
    
    @validator('address')
    def validate_address(cls, v):
        return validate_ethereum_address(v)
    
    @validator('message')
    def validate_message(cls, v):
        return validate_message_length(v, max_length=1000)

class ChatResponse(BaseModel):
    response: str
    offer: Optional[Dict[str, Any]] = None
    signature: Optional[str] = None
    requiresSignature: bool = False

@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("30/minute")  # Stricter limit for chat
async def chat(
    request: Request,
    chat_request: ChatRequest,
    current_user: Optional[str] = Depends(get_current_user)
):
    """
    Chat with NeuroLend AI agent
    Requires authentication (API key or JWT) or wallet signature
    """
    try:
        # Sanitize message
        sanitized_message = sanitize_chat_message(chat_request.message)
        
        # Verify authentication or wallet signature
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        from core.agent import NeuroLendAgent
        agent = NeuroLendAgent()
        result = await agent.process_chat(chat_request.address, sanitized_message)
        
        # Log chat interaction
        from utils.audit_logger import log_audit_event
        log_audit_event(
            request=request,
            action="chat_message",
            result="success",
            user_address=chat_request.address,
            metadata={"message_length": len(sanitized_message)}
        )
        
        return ChatResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        from utils.audit_logger import log_audit_event
        log_audit_event(
            request=request,
            action="chat_message",
            result="failure",
            user_address=chat_request.address,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/update-on-chain", response_model=UpdateOnChainResponse)
@limiter.limit("10/minute")
async def update_on_chain(
    request: Request,
    update_request: UpdateOnChainRequest,
    current_user: Optional[str] = Depends(get_current_user)
):
    """
    Update score on blockchain
    Requires authentication (API key or JWT) or wallet signature
    """
    try:
        # Require authentication
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
        
        tx_hash = await blockchain_service.update_score(
            update_request.address,
            update_request.score,
            update_request.riskBand
        )
        
        log_on_chain_update(request, update_request.address, tx_hash, "success")
        
        return UpdateOnChainResponse(
            success=True,
            transactionHash=tx_hash,
            message="Score updated on-chain successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        log_on_chain_update(request, update_request.address, "", "failure", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

# Add rate limit exception handler
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

