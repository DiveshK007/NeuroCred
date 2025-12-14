"""
EIP-712 signature generation and verification for loan offers
"""
import os
from typing import Dict
from eth_account import Account
from eth_account.messages import encode_defunct, _hash_eip191_message
from eth_utils import keccak, to_checksum_address
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

class LoanOfferSigner:
    """Handles EIP-712 signing of loan offers"""
    
    def __init__(self):
        self.private_key = os.getenv("AI_SIGNER_PRIVATE_KEY") or os.getenv("BACKEND_PK")
        if not self.private_key:
            raise ValueError("AI_SIGNER_PRIVATE_KEY or BACKEND_PK must be set")
        
        self.account = Account.from_key(self.private_key)
        self.rpc_url = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        # Get chain ID
        try:
            self.chain_id = self.w3.eth.chain_id
        except:
            self.chain_id = 1337  # Default for QIE testnet
    
    def get_domain_separator(self, contract_address: str) -> Dict:
        """Get EIP-712 domain separator"""
        return {
            "name": "NeuroLend LendingVault",
            "version": "1",
            "chainId": self.chain_id,
            "verifyingContract": to_checksum_address(contract_address)
        }
    
    def sign_loan_offer(self, offer: Dict, contract_address: str) -> str:
        """
        Sign a loan offer using EIP-712
        
        Args:
            offer: Loan offer dict with keys:
                - borrower: address
                - amount: uint256
                - collateralAmount: uint256
                - interestRate: uint256 (basis points)
                - duration: uint256 (seconds)
                - nonce: uint256
                - expiry: uint256 (timestamp)
            contract_address: LendingVault contract address
            
        Returns:
            Hex-encoded signature
        """
        domain = self.get_domain_separator(contract_address)
        
        # EIP-712 type hash
        LOAN_OFFER_TYPEHASH = keccak(
            b"LoanOffer(address borrower,uint256 amount,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 nonce,uint256 expiry)"
        )
        
        # Encode struct
        struct_hash = keccak(
            Web3.solidity_keccak(
                ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                [
                    LOAN_OFFER_TYPEHASH,
                    to_checksum_address(offer['borrower']),
                    offer['amount'],
                    offer['collateralAmount'],
                    offer['interestRate'],
                    offer['duration'],
                    offer['nonce'],
                    offer['expiry']
                ]
            )
        )
        
        # EIP-712 message
        message = {
            "types": {
                "EIP712Domain": [
                    {"name": "name", "type": "string"},
                    {"name": "version", "type": "string"},
                    {"name": "chainId", "type": "uint256"},
                    {"name": "verifyingContract", "type": "address"}
                ],
                "LoanOffer": [
                    {"name": "borrower", "type": "address"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "collateralAmount", "type": "uint256"},
                    {"name": "interestRate", "type": "uint256"},
                    {"name": "duration", "type": "uint256"},
                    {"name": "nonce", "type": "uint256"},
                    {"name": "expiry", "type": "uint256"}
                ]
            },
            "primaryType": "LoanOffer",
            "domain": domain,
            "message": offer
        }
        
        # Sign
        signed_message = Account.sign_message(
            encode_defunct(primitive=Web3.to_bytes(hexstr=Web3.to_hex(struct_hash))),
            self.account.key
        )
        
        return signed_message.signature.hex()
    
    def verify_signature(self, offer: Dict, signature: str, contract_address: str, expected_signer: str) -> bool:
        """
        Verify an EIP-712 signature
        
        Args:
            offer: Loan offer dict
            signature: Hex-encoded signature
            contract_address: Contract address
            expected_signer: Expected signer address
            
        Returns:
            True if signature is valid
        """
        try:
            domain = self.get_domain_separator(contract_address)
            
            LOAN_OFFER_TYPEHASH = keccak(
                b"LoanOffer(address borrower,uint256 amount,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 nonce,uint256 expiry)"
            )
            
            struct_hash = keccak(
                Web3.solidity_keccak(
                    ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
                    [
                        LOAN_OFFER_TYPEHASH,
                        to_checksum_address(offer['borrower']),
                        offer['amount'],
                        offer['collateralAmount'],
                        offer['interestRate'],
                        offer['duration'],
                        offer['nonce'],
                        offer['expiry']
                    ]
                )
            )
            
            message_hash = keccak(
                b'\x19\x01' +
                Web3.solidity_keccak(
                    ['string', 'string', 'uint256', 'address'],
                    [
                        domain['name'],
                        domain['version'],
                        domain['chainId'],
                        to_checksum_address(contract_address)
                    ]
                ) +
                struct_hash
            )
            
            signer = Account.recover_message(
                encode_defunct(primitive=Web3.to_bytes(hexstr=Web3.to_hex(message_hash))),
                signature=signature
            )
            
            return signer.lower() == expected_signer.lower()
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False

