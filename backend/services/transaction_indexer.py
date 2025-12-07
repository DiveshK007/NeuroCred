import os
from typing import List, Dict, Optional
from web3 import Web3
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv

load_dotenv()

class TransactionIndexer:
    """Service for fetching and analyzing full transaction history"""
    
    def __init__(self):
        self.rpc_url = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.explorer_url = os.getenv("QIE_EXPLORER_URL", "https://testnet.qie.digital")
        self.explorer_api = os.getenv("QIE_EXPLORER_API", None)  # If QIE has explorer API
    
    async def get_transaction_history(
        self, 
        address: str, 
        from_block: Optional[int] = None,
        to_block: Optional[int] = None
    ) -> List[Dict]:
        """
        Get full transaction history for an address
        
        Args:
            address: Wallet address
            from_block: Starting block (optional)
            to_block: Ending block (optional, defaults to latest)
        
        Returns:
            List of transaction dictionaries
        """
        try:
            checksum_address = Web3.to_checksum_address(address)
            
            # Try to use explorer API if available
            if self.explorer_api:
                return await self._fetch_from_explorer_api(checksum_address, from_block, to_block)
            
            # Fallback: Use RPC to get transactions
            return await self._fetch_from_rpc(checksum_address, from_block, to_block)
            
        except Exception as e:
            print(f"Error fetching transaction history: {e}")
            return []
    
    async def _fetch_from_explorer_api(
        self, 
        address: str, 
        from_block: Optional[int],
        to_block: Optional[int]
    ) -> List[Dict]:
        """Fetch transactions from QIE Explorer API"""
        try:
            # If QIE has an explorer API endpoint
            url = f"{self.explorer_api}/api/address/{address}/transactions"
            params = {}
            if from_block:
                params['from'] = from_block
            if to_block:
                params['to'] = to_block
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('transactions', [])
        except Exception as e:
            print(f"Explorer API error: {e}")
        
        # Fallback to RPC
        return await self._fetch_from_rpc(address, from_block, to_block)
    
    async def _fetch_from_rpc(
        self, 
        address: str, 
        from_block: Optional[int],
        to_block: Optional[int]
    ) -> List[Dict]:
        """Fetch transactions using RPC calls"""
        transactions = []
        
        try:
            # Get current block
            if to_block is None:
                to_block = self.w3.eth.block_number
            
            # If from_block not specified, go back reasonable amount (e.g., last 10000 blocks)
            if from_block is None:
                from_block = max(0, to_block - 10000)
            
            # Fetch transactions in batches
            batch_size = 1000
            for block_num in range(from_block, to_block + 1, batch_size):
                end_block = min(block_num + batch_size - 1, to_block)
                
                # Get block
                try:
                    block = self.w3.eth.get_block(block_num, full_transactions=True)
                    
                    # Filter transactions for this address
                    for tx in block.transactions:
                        if (tx.get('from') and tx['from'].lower() == address.lower()) or \
                           (tx.get('to') and tx['to'].lower() == address.lower()):
                            tx_dict = {
                                'hash': tx['hash'].hex(),
                                'from': tx.get('from', ''),
                                'to': tx.get('to', ''),
                                'value': tx.get('value', 0),
                                'blockNumber': tx.get('blockNumber'),
                                'timestamp': block.get('timestamp'),
                                'gasUsed': tx.get('gas', 0),
                                'input': tx.get('input', '0x')
                            }
                            transactions.append(tx_dict)
                except Exception as e:
                    # Block might not exist, skip
                    continue
            
            return transactions
            
        except Exception as e:
            print(f"Error in RPC fetch: {e}")
            return []
    
    async def analyze_transactions(self, address: str) -> Dict:
        """
        Analyze transaction history and extract metrics
        
        Returns:
            Dictionary with analysis results
        """
        try:
            # Get transaction history
            transactions = await self.get_transaction_history(address)
            
            if not transactions:
                return self._default_analysis()
            
            # Calculate metrics
            total_txs = len(transactions)
            
            # Calculate total volume (sum of all transaction values)
            total_volume_wei = sum(int(tx.get('value', 0)) for tx in transactions)
            total_volume_eth = self.w3.from_wei(total_volume_wei, 'ether')
            
            # Get unique contracts interacted with
            unique_contracts = set()
            for tx in transactions:
                if tx.get('to') and tx['to'].lower() != address.lower():
                    # Check if it's a contract (has input data)
                    if tx.get('input') and tx['input'] != '0x':
                        unique_contracts.add(tx['to'].lower())
            
            # Calculate time range
            timestamps = [tx.get('timestamp', 0) for tx in transactions if tx.get('timestamp')]
            if timestamps:
                first_tx_time = min(timestamps)
                last_tx_time = max(timestamps)
                days_active = (last_tx_time - first_tx_time) / 86400  # Convert to days
            else:
                days_active = 0
            
            # Calculate average transaction value
            avg_tx_value = float(total_volume_eth) / max(total_txs, 1)
            
            # Analyze transaction frequency
            tx_frequency = self._calculate_tx_frequency(transactions)
            
            # Detect stablecoin usage (simplified - would need token contract analysis)
            stablecoin_ratio = await self._estimate_stablecoin_ratio(address, transactions)
            
            return {
                'tx_count': total_txs,
                'total_volume': float(total_volume_eth),
                'unique_contracts': len(unique_contracts),
                'days_active': max(1, int(days_active)),
                'avg_tx_value': avg_tx_value,
                'tx_frequency': tx_frequency,
                'stablecoin_ratio': stablecoin_ratio,
                'first_tx_timestamp': min(timestamps) if timestamps else 0,
                'last_tx_timestamp': max(timestamps) if timestamps else 0,
                'unique_contract_addresses': list(unique_contracts)
            }
            
        except Exception as e:
            print(f"Error analyzing transactions: {e}")
            return self._default_analysis()
    
    def _calculate_tx_frequency(self, transactions: List[Dict]) -> Dict:
        """Calculate transaction frequency metrics"""
        if not transactions:
            return {'daily_avg': 0, 'weekly_avg': 0, 'monthly_avg': 0}
        
        # Group by day
        daily_counts = {}
        for tx in transactions:
            if tx.get('timestamp'):
                date = datetime.fromtimestamp(tx['timestamp']).date()
                daily_counts[date] = daily_counts.get(date, 0) + 1
        
        if not daily_counts:
            return {'daily_avg': 0, 'weekly_avg': 0, 'monthly_avg': 0}
        
        days_span = (max(daily_counts.keys()) - min(daily_counts.keys())).days + 1
        total_txs = len(transactions)
        
        return {
            'daily_avg': total_txs / max(days_span, 1),
            'weekly_avg': (total_txs / max(days_span, 1)) * 7,
            'monthly_avg': (total_txs / max(days_span, 1)) * 30
        }
    
    async def _estimate_stablecoin_ratio(self, address: str, transactions: List[Dict]) -> float:
        """
        Estimate stablecoin usage ratio
        In production, would analyze ERC-20 token transfers
        """
        try:
            # Get current balance
            balance = self.w3.eth.get_balance(Web3.to_checksum_address(address))
            balance_eth = self.w3.from_wei(balance, 'ether')
            
            # Simplified: If balance is high and transactions are frequent, 
            # assume some stablecoin usage
            # In production, would analyze token contract interactions
            
            # Check for common stablecoin contract interactions
            stablecoin_contracts = [
                '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',  # USDC
                '0xdac17f958d2ee523a2206206994597c13d831ec7',  # USDT
                '0x6b175474e89094c44da98b954eedeac495271d0f',  # DAI
            ]
            
            stablecoin_txs = 0
            for tx in transactions:
                if tx.get('to') and tx['to'].lower() in [c.lower() for c in stablecoin_contracts]:
                    stablecoin_txs += 1
            
            if len(transactions) > 0:
                return min(1.0, stablecoin_txs / len(transactions) * 2)  # Estimate
            
            # Default based on balance
            if balance_eth > 1.0:
                return 0.3
            elif balance_eth > 0.1:
                return 0.2
            else:
                return 0.1
                
        except Exception as e:
            print(f"Error estimating stablecoin ratio: {e}")
            return 0.2  # Default
    
    def _default_analysis(self) -> Dict:
        """Return default analysis when no transactions found"""
        return {
            'tx_count': 0,
            'total_volume': 0.0,
            'unique_contracts': 0,
            'days_active': 0,
            'avg_tx_value': 0.0,
            'tx_frequency': {'daily_avg': 0, 'weekly_avg': 0, 'monthly_avg': 0},
            'stablecoin_ratio': 0.1,
            'first_tx_timestamp': 0,
            'last_tx_timestamp': 0,
            'unique_contract_addresses': []
        }

