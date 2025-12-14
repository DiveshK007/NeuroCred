import os
import time
from web3 import Web3
from eth_account import Account
from typing import Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class BlockchainService:
    """Service for interacting with QIE blockchain"""
    
    def __init__(self):
        self.rpc_url = os.getenv("QIE_RPC_URL") or os.getenv("QIE_TESTNET_RPC_URL", "https://rpc1testnet.qie.digital/")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract_address = os.getenv("CREDIT_PASSPORT_NFT_ADDRESS")
        
        # Use secrets manager for private key
        from utils.secrets_manager import get_secrets_manager
        secrets_manager = get_secrets_manager()
        
        # Try to get encrypted private key, fallback to plaintext
        private_key = secrets_manager.get_secret("BACKEND_PRIVATE_KEY_ENCRYPTED", encrypted=True)
        if not private_key:
            private_key = os.getenv("BACKEND_PRIVATE_KEY")
        
        if not self.contract_address:
            raise ValueError("CREDIT_PASSPORT_NFT_ADDRESS not set in environment")
        if not private_key:
            raise ValueError("BACKEND_PRIVATE_KEY not set in environment")
        
        self.account = Account.from_key(private_key)
        self.contract_abi = self._get_contract_abi()
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contract_address),
            abi=self.contract_abi
        )
    
    def _get_contract_abi(self) -> list:
        """Get contract ABI - simplified version"""
        # In production, load from artifacts or verify on explorer
        # This is a minimal ABI for the functions we need
        return [
            {
                "inputs": [{"internalType": "address", "name": "user", "type": "address"},
                          {"internalType": "uint16", "name": "score", "type": "uint16"},
                          {"internalType": "uint8", "name": "riskBand", "type": "uint8"}],
                "name": "mintOrUpdate",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
                "name": "getScore",
                "outputs": [
                    {"internalType": "uint16", "name": "score", "type": "uint16"},
                    {"internalType": "uint8", "name": "riskBand", "type": "uint8"},
                    {"internalType": "uint64", "name": "lastUpdated", "type": "uint64"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    
    async def get_score(self, address: str) -> Optional[Dict]:
        """Get score from blockchain"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            result = self.contract.functions.getScore(checksum_address).call()
            
            if result[0] == 0:  # score is 0, no passport exists
                return None
            
            return {
                "score": result[0],
                "riskBand": result[1],
                "lastUpdated": result[2]
            }
        except Exception as e:
            from utils.logger import get_logger
            logger = get_logger(__name__)
            logger.error(f"Error getting score from blockchain: {e}", exc_info=True)
            return None
    
    async def update_score(self, address: str, score: int, risk_band: int) -> str:
        """Update score on blockchain"""
        start_time = time.time()
        try:
            checksum_address = Web3.to_checksum_address(address)
            
            # Build transaction
            transaction = self.contract.functions.mintOrUpdate(
                checksum_address,
                score,
                risk_band
            ).build_transaction({
                'from': self.account.address,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            # Sign transaction
            signed_txn = self.account.sign_transaction(transaction)
            
            # Send transaction (use raw_transaction for newer web3.py, fallback to rawTransaction for older)
            raw_tx = getattr(signed_txn, 'raw_transaction', None) or getattr(signed_txn, 'rawTransaction', None)
            tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            tx_hash_hex = receipt.transactionHash.hex()
            
            # Log transaction details
            from utils.logger import get_logger
            logger = get_logger(__name__)
            transaction_duration = time.time() - start_time
            
            logger.info(
                "Transaction successful",
                extra={
                    "address": address,
                    "tx_hash": tx_hash_hex,
                    "gas_used": receipt.gasUsed,
                    "score": score,
                    "risk_band": risk_band,
                }
            )
            
            # Record metrics (if available)
            try:
                from utils.metrics import record_blockchain_transaction
                record_blockchain_transaction(
                    status="success",
                    contract="CreditPassportNFT",
                    operation="mintOrUpdate",
                    duration=transaction_duration,
                    gas_used=receipt.gasUsed
                )
            except ImportError:
                # Metrics not available in test environment
                pass
            
            # Invalidate caches for this address
            from utils.cache import invalidate_score_cache, invalidate_pattern
            invalidate_score_cache(address)
            invalidate_pattern(f"rpc:getScore:*{address}*")
            
            return tx_hash_hex
        except ValueError as e:
            # Handle invalid address format
            from utils.logger import get_logger
            logger = get_logger(__name__)
            logger.error(f"Invalid address format: {e}", exc_info=True)
            
            # Record error metrics (if available)
            try:
                from utils.metrics import record_blockchain_transaction, record_blockchain_rpc_error
                duration = time.time() - start_time
                error_type = type(e).__name__
                record_blockchain_rpc_error(error_type)
                record_blockchain_transaction(
                    status="error",
                    contract="CreditPassportNFT",
                    operation="mintOrUpdate",
                    duration=duration
                )
            except ImportError:
                # Metrics not available in test environment
                pass
            
            raise ValueError(f"Invalid address format: {str(e)}")
        except Exception as e:
            from utils.logger import get_logger
            logger = get_logger(__name__)
            logger.error(f"Error updating score on blockchain: {e}", exc_info=True)
            
            # Record error metrics (if available)
            try:
                from utils.metrics import record_blockchain_transaction, record_blockchain_rpc_error
                duration = time.time() - start_time
                error_type = type(e).__name__
                record_blockchain_rpc_error(error_type)
                record_blockchain_transaction(
                    status="error",
                    contract="CreditPassportNFT",
                    operation="mintOrUpdate",
                    duration=duration
                )
            except ImportError:
                # Metrics not available in test environment
                pass
            
            raise Exception(f"Error updating score on blockchain: {str(e)}")

