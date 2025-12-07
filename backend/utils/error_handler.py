from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Callable
import traceback
import logging
from utils.logger import logger

class NeuroCredError(Exception):
    """Base exception for NeuroCred"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class BlockchainError(NeuroCredError):
    """Blockchain-related errors"""
    def __init__(self, message: str):
        super().__init__(f"Blockchain error: {message}", 503)

class ScoringError(NeuroCredError):
    """Scoring-related errors"""
    def __init__(self, message: str):
        super().__init__(f"Scoring error: {message}", 500)

class OracleError(NeuroCredError):
    """Oracle-related errors"""
    def __init__(self, message: str):
        super().__init__(f"Oracle error: {message}", 503)

async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for FastAPI"""
    
    # Log the error
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Return appropriate response
    if isinstance(exc, NeuroCredError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.message,
                "type": exc.__class__.__name__,
                "path": str(request.url)
            }
        )
    
    # Generic error
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if logger.level == logging.DEBUG else "An unexpected error occurred",
            "path": str(request.url)
        }
    )

def handle_blockchain_error(func: Callable):
    """Decorator to handle blockchain errors"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Blockchain operation failed: {e}")
            raise BlockchainError(str(e))
    return wrapper

def handle_scoring_error(func: Callable):
    """Decorator to handle scoring errors"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Scoring operation failed: {e}")
            raise ScoringError(str(e))
    return wrapper

