"""
Nonce management for loan offers to prevent replay attacks
"""
from typing import Dict, Set
import time

class NonceManager:
    """Simple in-memory nonce manager (for demo; use Redis/DB in production)"""
    
    def __init__(self):
        # Mapping: address -> set of used nonces
        self._used_nonces: Dict[str, Set[int]] = {}
        # Mapping: address -> last nonce (for auto-increment)
        self._last_nonce: Dict[str, int] = {}
    
    def generate_nonce(self, address: str) -> int:
        """Generate a new nonce for an address"""
        if address not in self._last_nonce:
            self._last_nonce[address] = int(time.time())
        else:
            self._last_nonce[address] += 1
        
        return self._last_nonce[address]
    
    def is_nonce_used(self, address: str, nonce: int) -> bool:
        """Check if a nonce has been used"""
        return nonce in self._used_nonces.get(address, set())
    
    def mark_nonce_used(self, address: str, nonce: int):
        """Mark a nonce as used"""
        if address not in self._used_nonces:
            self._used_nonces[address] = set()
        self._used_nonces[address].add(nonce)
    
    def clear_old_nonces(self, address: str, older_than_seconds: int = 86400):
        """Clear nonces older than specified time (for cleanup)"""
        # Simple implementation: clear all if address exists
        # In production, would track timestamps per nonce
        if address in self._used_nonces:
            # For demo, we'll keep all nonces
            # In production, implement timestamp-based cleanup
            pass

# Global instance
nonce_manager = NonceManager()

