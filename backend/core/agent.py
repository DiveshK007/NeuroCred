"""
NeuroLend AI Agent for loan negotiation
Simple rule-based agent (can be upgraded to LangChain later)
"""
import os
from typing import Dict, Optional
from datetime import datetime, timedelta
from services.scoring import ScoringService
from services.blockchain import BlockchainService
from core.nonce import nonce_manager
from core.signing import LoanOfferSigner

class NeuroLendAgent:
    """AI agent for loan negotiation"""
    
    def __init__(self):
        self.scoring_service = ScoringService()
        self.blockchain_service = BlockchainService()
        self.signer = LoanOfferSigner()
        self.lending_vault_address = os.getenv("LENDING_VAULT_ADDRESS")
        
    async def process_chat(self, user_address: str, message: str) -> Dict:
        """
        Process a chat message and generate response
        
        Args:
            user_address: User's wallet address
            message: User's message
            
        Returns:
            Dict with 'response' (str) and optionally 'offer' (dict) and 'signature' (str)
        """
        message_lower = message.lower()
        
        # Check if user is requesting a loan
        loan_keywords = ['loan', 'borrow', 'lend', 'need', 'want', 'get']
        is_loan_request = any(keyword in message_lower for keyword in loan_keywords)
        
        # Extract amount if mentioned
        amount = self._extract_amount(message)
        
        if is_loan_request and amount:
            # Generate loan offer
            return await self._generate_loan_offer(user_address, amount)
        elif is_loan_request:
            # Ask for amount
            return {
                "response": "I'd be happy to help you get a loan! How much QIE would you like to borrow?",
                "offer": None,
                "signature": None,
                "requiresSignature": False
            }
        else:
            # General conversation
            score_info = await self._get_score_info(user_address)
            return {
                "response": f"Hello! I'm your NeuroLend AI assistant. Your current NeuroCred score is {score_info['score']} ({score_info['riskBand']}). How can I help you today?",
                "offer": None,
                "signature": None,
                "requiresSignature": False
            }
    
    async def _get_score_info(self, address: str) -> Dict:
        """Get user's NeuroCred score"""
        try:
            # Try to get from blockchain first
            on_chain_score = await self.blockchain_service.get_score(address)
            if on_chain_score and on_chain_score["score"] > 0:
                return {
                    "score": on_chain_score["score"],
                    "riskBand": on_chain_score["riskBand"]
                }
            
            # Compute new score
            result = await self.scoring_service.compute_score(address)
            return {
                "score": result["score"],
                "riskBand": result["riskBand"]
            }
        except Exception as e:
            print(f"Error getting score: {e}")
            return {"score": 500, "riskBand": 2}
    
    async def _generate_loan_offer(self, borrower: str, requested_amount: float) -> Dict:
        """
        Generate a personalized loan offer based on NeuroCred score
        
        Args:
            borrower: Borrower address
            requested_amount: Requested loan amount in QIE
            
        Returns:
            Dict with offer details and signature
        """
        # Get score
        score_info = await self._get_score_info(borrower)
        score = score_info["score"]
        risk_band = score_info["riskBand"]
        
        # Calculate loan terms based on score
        if score >= 750:
            # Low risk
            interest_rate = 450  # 4.5% APR in basis points
            ltv = 0.70  # 70% LTV
            rate_display = "4.5%"
        elif score >= 500:
            # Medium risk
            interest_rate = 750  # 7.5% APR
            ltv = 0.50  # 50% LTV
            rate_display = "7.5%"
        else:
            # High risk
            interest_rate = 1200  # 12% APR
            ltv = 0.30  # 30% LTV
            rate_display = "12%"
        
        # Calculate collateral needed
        collateral_amount = int(requested_amount / ltv * 1e18)  # Convert to wei
        loan_amount = int(requested_amount * 1e18)  # Convert to wei
        
        # Generate nonce
        nonce = nonce_manager.generate_nonce(borrower)
        
        # Set expiry (1 hour from now)
        expiry = int((datetime.now() + timedelta(hours=1)).timestamp())
        
        # Duration (30 days default)
        duration = 30 * 24 * 60 * 60  # 30 days in seconds
        
        # Create offer
        offer = {
            "borrower": borrower,
            "amount": loan_amount,
            "collateralAmount": collateral_amount,
            "interestRate": interest_rate,
            "duration": duration,
            "nonce": nonce,
            "expiry": expiry
        }
        
        # Sign offer
        if not self.lending_vault_address:
            signature = "0x" + "0" * 130  # Placeholder
        else:
            signature = self.signer.sign_loan_offer(offer, self.lending_vault_address)
        
        # Generate response message
        response = (
            f"Great! Based on your NeuroCred score of {score} (Risk Band {risk_band}), "
            f"I can offer you a loan with the following terms:\n\n"
            f"💰 Loan Amount: {requested_amount:.2f} QIE\n"
            f"💎 Collateral Required: {collateral_amount / 1e18:.2f} QIE\n"
            f"📊 Interest Rate: {rate_display} APR\n"
            f"⏱️ Duration: 30 days\n\n"
            f"Would you like to accept this offer?"
        )
        
        return {
            "response": response,
            "offer": offer,
            "signature": signature,
            "requiresSignature": True
        }
    
    def _extract_amount(self, message: str) -> Optional[float]:
        """Extract loan amount from message"""
        import re
        
        # Look for numbers followed by QIE or just numbers
        patterns = [
            r'(\d+(?:\.\d+)?)\s*qie',
            r'(\d+(?:\.\d+)?)\s*usd',
            r'(\d+(?:\.\d+)?)\s*dollars',
            r'(\d+(?:\.\d+)?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message.lower())
            if match:
                try:
                    amount = float(match.group(1))
                    # Cap at reasonable amount for demo
                    return min(amount, 10000)
                except:
                    pass
        
        return None

