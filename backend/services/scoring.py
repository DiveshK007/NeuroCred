import os
from typing import Dict
from web3 import Web3
import requests
from models.score import WalletFeatures, ScoreResult

class ScoringService:
    """AI-powered credit scoring service"""
    
    def __init__(self):
        self.rpc_url = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.explorer_url = os.getenv("QIE_EXPLORER_URL", "https://testnet.qie.digital")
    
    async def compute_score(self, address: str) -> Dict:
        """Compute credit score for a wallet address"""
        try:
            # Fetch wallet data
            features = await self._extract_features(address)
            
            # Compute score using rule-based algorithm
            score, risk_band, explanation = self._calculate_score(features)
            
            return {
                "score": score,
                "riskBand": risk_band,
                "explanation": explanation,
                "features": features.__dict__ if features else None
            }
        except Exception as e:
            # Return default score on error
            return {
                "score": 500,
                "riskBand": 2,
                "explanation": f"Error computing score: {str(e)}"
            }
    
    async def _extract_features(self, address: str) -> WalletFeatures:
        """Extract features from wallet history"""
        try:
            # Get transaction count (simplified - in production, use proper indexer)
            tx_count = await self._get_tx_count(address)
            
            # Get balance
            balance = self.w3.eth.get_balance(Web3.to_checksum_address(address))
            balance_eth = self.w3.from_wei(balance, 'ether')
            
            # Simplified feature extraction
            # In production, you would:
            # - Fetch full transaction history from explorer/indexer
            # - Analyze token holdings
            # - Calculate volatility from price oracles
            # - Check for liquidation events
            # - Analyze stablecoin usage
            
            features = WalletFeatures(
                tx_count=tx_count,
                total_volume=float(balance_eth) * 100,  # Simplified
                stablecoin_ratio=0.5,  # Placeholder
                avg_tx_value=float(balance_eth) / max(tx_count, 1),
                days_active=30,  # Placeholder
                unique_contracts=5,  # Placeholder
                max_drawdown=0.1,  # Placeholder
                volatility=0.2  # Placeholder
            )
            
            return features
        except Exception as e:
            # Return default features on error
            return WalletFeatures(
                tx_count=0,
                total_volume=0.0,
                stablecoin_ratio=0.0,
                avg_tx_value=0.0,
                days_active=0,
                unique_contracts=0,
                max_drawdown=0.0,
                volatility=0.0
            )
    
    async def _get_tx_count(self, address: str) -> int:
        """Get transaction count for address"""
        try:
            checksum_address = Web3.to_checksum_address(address)
            count = self.w3.eth.get_transaction_count(checksum_address)
            return count
        except:
            return 0
    
    def _calculate_score(self, features: WalletFeatures) -> tuple[int, int, str]:
        """Calculate score and risk band from features"""
        score = 500  # Base score
        
        # Rule-based scoring (can be replaced with ML model)
        # Transaction activity (0-200 points)
        if features.tx_count > 100:
            score += 200
        elif features.tx_count > 50:
            score += 150
        elif features.tx_count > 20:
            score += 100
        elif features.tx_count > 10:
            score += 50
        
        # Volume (0-150 points)
        if features.total_volume > 1000:
            score += 150
        elif features.total_volume > 500:
            score += 100
        elif features.total_volume > 100:
            score += 50
        
        # Stablecoin ratio (0-100 points)
        if features.stablecoin_ratio > 0.7:
            score += 100
        elif features.stablecoin_ratio > 0.5:
            score += 50
        
        # Activity duration (0-100 points)
        if features.days_active > 90:
            score += 100
        elif features.days_active > 30:
            score += 50
        
        # Volatility penalty (0-150 points deduction)
        if features.volatility > 0.5:
            score -= 150
        elif features.volatility > 0.3:
            score -= 100
        elif features.volatility > 0.2:
            score -= 50
        
        # Clamp score to 0-1000
        score = max(0, min(1000, score))
        
        # Determine risk band
        if score >= 750:
            risk_band = 1  # Low risk
            explanation = "Low risk: High transaction activity, good volume, stable portfolio"
        elif score >= 500:
            risk_band = 2  # Medium risk
            explanation = "Medium risk: Moderate activity and volume"
        elif score >= 250:
            risk_band = 3  # High risk
            explanation = "High risk: Low activity or high volatility"
        else:
            risk_band = 3  # High risk
            explanation = "High risk: Very low score, limited history"
        
        return score, risk_band, explanation

