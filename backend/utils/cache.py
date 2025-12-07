from typing import Optional, Any
from datetime import datetime, timedelta
import json

class SimpleCache:
    """Simple in-memory cache for production use"""
    
    def __init__(self, default_ttl: int = 300):
        self.cache: dict = {}
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if datetime.now() > entry['expires_at']:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Set value in cache with TTL"""
        ttl = ttl or self.default_ttl
        self.cache[key] = {
            'value': value,
            'expires_at': datetime.now() + timedelta(seconds=ttl)
        }
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
    
    def delete(self, key: str):
        """Delete specific key"""
        if key in self.cache:
            del self.cache[key]

# Global cache instance
cache = SimpleCache(default_ttl=300)

