import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Production-ready configuration management"""
    
    # Environment
    ENV = os.getenv("ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # QIE Blockchain
    QIE_TESTNET_RPC_URL = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
    QIE_MAINNET_RPC_URL = os.getenv("QIE_MAINNET_RPC_URL", "https://mainnet.qie.digital")
    QIE_EXPLORER_URL = os.getenv("QIE_EXPLORER_URL", "https://testnet.qie.digital")
    QIE_EXPLORER_API = os.getenv("QIE_EXPLORER_API", None)
    
    # Contracts
    CREDIT_PASSPORT_NFT_ADDRESS = os.getenv("CREDIT_PASSPORT_NFT_ADDRESS")
    NCRD_TOKEN_ADDRESS = os.getenv("NCRD_TOKEN_ADDRESS")
    STAKING_CONTRACT_ADDRESS = os.getenv("STAKING_CONTRACT_ADDRESS")
    
    # Backend
    BACKEND_PRIVATE_KEY = os.getenv("BACKEND_PRIVATE_KEY")
    BACKEND_WALLET_ADDRESS = os.getenv("BACKEND_WALLET_ADDRESS")
    
    # API
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # QIE Oracles
    QIE_CRYPTO_ORACLE = os.getenv("QIE_CRYPTO_ORACLE", "0x0000000000000000000000000000000000000000")
    QIE_FOREX_ORACLE = os.getenv("QIE_FOREX_ORACLE", "0x0000000000000000000000000000000000000000")
    QIE_COMMODITY_ORACLE = os.getenv("QIE_COMMODITY_ORACLE", "0x0000000000000000000000000000000000000000")
    
    # External APIs
    METALS_API_KEY = os.getenv("METALS_API_KEY", "")
    COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY", "")
    
    # Feature Flags
    ENABLE_ORACLE_CACHE = os.getenv("ENABLE_ORACLE_CACHE", "true").lower() == "true"
    ENABLE_TX_INDEXER = os.getenv("ENABLE_TX_INDEXER", "true").lower() == "true"
    ENABLE_ML_SCORING = os.getenv("ENABLE_ML_SCORING", "false").lower() == "true"
    
    # Performance
    TX_HISTORY_LIMIT = int(os.getenv("TX_HISTORY_LIMIT", "10000"))  # Max blocks to scan
    ORACLE_CACHE_TTL = int(os.getenv("ORACLE_CACHE_TTL", "300"))  # 5 minutes
    SCORE_CACHE_TTL = int(os.getenv("SCORE_CACHE_TTL", "3600"))  # 1 hour
    
    # Monitoring
    ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Security
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    @classmethod
    def get_rpc_url(cls) -> str:
        """Get appropriate RPC URL based on environment"""
        if cls.ENV == "production":
            return cls.QIE_MAINNET_RPC_URL
        return cls.QIE_TESTNET_RPC_URL
    
    @classmethod
    def validate(cls) -> list:
        """Validate required configuration"""
        errors = []
        
        if not cls.CREDIT_PASSPORT_NFT_ADDRESS:
            errors.append("CREDIT_PASSPORT_NFT_ADDRESS not set")
        
        if not cls.BACKEND_PRIVATE_KEY:
            errors.append("BACKEND_PRIVATE_KEY not set")
        
        if cls.ENV == "production":
            if not cls.BACKEND_WALLET_ADDRESS:
                errors.append("BACKEND_WALLET_ADDRESS required in production")
        
        return errors

