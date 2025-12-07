import logging
import sys
from datetime import datetime
from config import Config

def setup_logger(name: str = "neurocred") -> logging.Logger:
    """Setup production-ready logger"""
    
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # File handler (for production)
    if Config.ENV == "production":
        file_handler = logging.FileHandler(f"logs/neurocred-{datetime.now().strftime('%Y%m%d')}.log")
        file_handler.setLevel(logging.DEBUG)
        logger.addHandler(file_handler)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    if Config.ENV == "production":
        file_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    return logger

# Global logger instance
logger = setup_logger()

