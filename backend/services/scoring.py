import os
from typing import Dict
from web3 import Web3
import requests
from models.score import WalletFeatures, ScoreResult
from services.oracle import QIEOracleService
from services.transaction_indexer import TransactionIndexer

class ScoringService:
    """AI-powered credit scoring service"""
    
    def __init__(self):
        self.rpc_url = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.explorer_url = os.getenv("QIE_EXPLORER_URL", "https://testnet.qie.digital")
        self.oracle_service = QIEOracleService()
        self.indexer = TransactionIndexer()
    
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
        """Extract features from wallet history using full transaction analysis"""
        try:
            # Get comprehensive transaction analysis
            tx_analysis = await self.indexer.analyze_transactions(address)
            
            # Get current balance
            balance = self.w3.eth.get_balance(Web3.to_checksum_address(address))
            balance_eth = self.w3.from_wei(balance, 'ether')
            
            # Get price data from QIE Oracles for volume calculation
            eth_price = await self.oracle_service.get_price('ETH', 'crypto')
            if not eth_price:
                eth_price = 2000  # Fallback
            
            # Calculate total volume in USD
            # Use analyzed volume if available, otherwise estimate from balance
            if tx_analysis['total_volume'] > 0:
                total_volume_usd = tx_analysis['total_volume'] * eth_price
            else:
                total_volume_usd = float(balance_eth) * eth_price
            
            # Get volatility from QIE Oracle (real calculation from price history)
            volatility = await self.oracle_service.get_volatility('ETH', days=30)
            if not volatility:
                volatility = 0.2  # Default
            
            # Calculate max drawdown from volatility
            # Max drawdown is typically 1.5-2x the volatility
            max_drawdown = volatility * 1.5
            
            # Use real analyzed data
            features = WalletFeatures(
                tx_count=tx_analysis['tx_count'],
                total_volume=total_volume_usd,
                stablecoin_ratio=tx_analysis['stablecoin_ratio'],
                avg_tx_value=tx_analysis['avg_tx_value'] * eth_price if tx_analysis['avg_tx_value'] > 0 else float(balance_eth) / max(tx_analysis['tx_count'], 1),
                days_active=tx_analysis['days_active'],
                unique_contracts=tx_analysis['unique_contracts'],
                max_drawdown=max_drawdown,
                volatility=volatility
            )
            
            return features
        except Exception as e:
            print(f"Error in feature extraction: {e}")
            # Return default features on error
            return WalletFeatures(
                tx_count=0,
                total_volume=0.0,
                stablecoin_ratio=0.0,
                avg_tx_value=0.0,
                days_active=0,
                unique_contracts=0,
                max_drawdown=0.0,
                volatility=0.2
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
        """
        Enhanced scoring algorithm with sophisticated feature weighting
        
        Uses weighted scoring model with multiple factors:
        - Transaction activity and frequency
        - Volume and value metrics
        - Portfolio stability (stablecoin ratio)
        - Account age and activity duration
        - Risk factors (volatility, drawdown)
        """
        score = 500  # Base score
        factors = []
        
        # 1. Transaction Activity (0-200 points, 20% weight)
        tx_score = 0
        if features.tx_count > 200:
            tx_score = 200
            factors.append("Very high transaction activity")
        elif features.tx_count > 100:
            tx_score = 180
            factors.append("High transaction activity")
        elif features.tx_count > 50:
            tx_score = 150
            factors.append("Good transaction activity")
        elif features.tx_count > 20:
            tx_score = 100
            factors.append("Moderate transaction activity")
        elif features.tx_count > 10:
            tx_score = 50
            factors.append("Limited transaction activity")
        else:
            tx_score = 0
            factors.append("Very low transaction activity")
        
        score += tx_score
        
        # 2. Volume Metrics (0-180 points, 18% weight)
        volume_score = 0
        if features.total_volume > 10000:
            volume_score = 180
            factors.append("Very high transaction volume")
        elif features.total_volume > 5000:
            volume_score = 150
            factors.append("High transaction volume")
        elif features.total_volume > 1000:
            volume_score = 120
            factors.append("Good transaction volume")
        elif features.total_volume > 500:
            volume_score = 80
            factors.append("Moderate transaction volume")
        elif features.total_volume > 100:
            volume_score = 40
            factors.append("Low transaction volume")
        else:
            factors.append("Very low transaction volume")
        
        score += volume_score
        
        # 3. Average Transaction Value (0-100 points, 10% weight)
        avg_tx_score = 0
        if features.avg_tx_value > 100:
            avg_tx_score = 100
            factors.append("High average transaction value")
        elif features.avg_tx_value > 50:
            avg_tx_score = 75
            factors.append("Good average transaction value")
        elif features.avg_tx_value > 10:
            avg_tx_score = 50
            factors.append("Moderate average transaction value")
        elif features.avg_tx_value > 1:
            avg_tx_score = 25
            factors.append("Low average transaction value")
        else:
            factors.append("Very low average transaction value")
        
        score += avg_tx_score
        
        # 4. Stablecoin Ratio (0-120 points, 12% weight)
        stablecoin_score = 0
        if features.stablecoin_ratio > 0.7:
            stablecoin_score = 120
            factors.append("High stablecoin usage (low risk portfolio)")
        elif features.stablecoin_ratio > 0.5:
            stablecoin_score = 90
            factors.append("Good stablecoin usage")
        elif features.stablecoin_ratio > 0.3:
            stablecoin_score = 60
            factors.append("Moderate stablecoin usage")
        elif features.stablecoin_ratio > 0.1:
            stablecoin_score = 30
            factors.append("Low stablecoin usage")
        else:
            factors.append("Very low stablecoin usage (higher risk)")
        
        score += stablecoin_score
        
        # 5. Account Age & Activity Duration (0-120 points, 12% weight)
        age_score = 0
        if features.days_active > 180:
            age_score = 120
            factors.append("Very established account (6+ months)")
        elif features.days_active > 90:
            age_score = 100
            factors.append("Established account (3+ months)")
        elif features.days_active > 30:
            age_score = 70
            factors.append("Moderate account age (1+ month)")
        elif features.days_active > 7:
            age_score = 40
            factors.append("New account (1+ week)")
        else:
            factors.append("Very new account")
        
        score += age_score
        
        # 6. Contract Diversity (0-80 points, 8% weight)
        contract_score = 0
        if features.unique_contracts > 20:
            contract_score = 80
            factors.append("High contract diversity")
        elif features.unique_contracts > 10:
            contract_score = 60
            factors.append("Good contract diversity")
        elif features.unique_contracts > 5:
            contract_score = 40
            factors.append("Moderate contract diversity")
        elif features.unique_contracts > 2:
            contract_score = 20
            factors.append("Limited contract diversity")
        else:
            factors.append("Very limited contract diversity")
        
        score += contract_score
        
        # 7. Volatility Penalty (0-200 points deduction, 20% weight)
        volatility_penalty = 0
        if features.volatility > 0.6:
            volatility_penalty = -200
            factors.append("Very high volatility (major risk)")
        elif features.volatility > 0.4:
            volatility_penalty = -150
            factors.append("High volatility (significant risk)")
        elif features.volatility > 0.3:
            volatility_penalty = -100
            factors.append("Moderate volatility")
        elif features.volatility > 0.2:
            volatility_penalty = -50
            factors.append("Low volatility")
        else:
            factors.append("Very low volatility (stable)")
        
        score += volatility_penalty
        
        # 8. Max Drawdown Penalty (0-100 points deduction, 10% weight)
        drawdown_penalty = 0
        if features.max_drawdown > 0.8:
            drawdown_penalty = -100
            factors.append("Very high max drawdown risk")
        elif features.max_drawdown > 0.5:
            drawdown_penalty = -70
            factors.append("High max drawdown risk")
        elif features.max_drawdown > 0.3:
            drawdown_penalty = -40
            factors.append("Moderate drawdown risk")
        else:
            factors.append("Low drawdown risk")
        
        score += drawdown_penalty
        
        # Clamp score to 0-1000
        score = max(0, min(1000, score))
        
        # Determine risk band with detailed explanation
        if score >= 750:
            risk_band = 1  # Low risk
            explanation = f"Low risk ({score}/1000): {'; '.join(factors[:3])}. Excellent creditworthiness."
        elif score >= 600:
            risk_band = 1  # Low risk (borderline)
            explanation = f"Low-Medium risk ({score}/1000): {'; '.join(factors[:3])}. Good creditworthiness."
        elif score >= 500:
            risk_band = 2  # Medium risk
            explanation = f"Medium risk ({score}/1000): {'; '.join(factors[:3])}. Moderate creditworthiness."
        elif score >= 300:
            risk_band = 2  # Medium-High risk
            explanation = f"Medium-High risk ({score}/1000): {'; '.join(factors[:3])}. Below average creditworthiness."
        elif score >= 250:
            risk_band = 3  # High risk
            explanation = f"High risk ({score}/1000): {'; '.join(factors[:3])}. Poor creditworthiness."
        else:
            risk_band = 3  # High risk
            explanation = f"Very high risk ({score}/1000): {'; '.join(factors[:3])}. Very poor creditworthiness."
        
        return score, risk_band, explanation

