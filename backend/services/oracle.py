import os
from typing import Dict, Optional, List
from web3 import Web3
import requests
from dotenv import load_dotenv
from config import Config
from utils.cache import cache
from utils.logger import logger

load_dotenv()

class QIEOracleService:
    """Service for interacting with QIE Oracles"""
    
    def __init__(self):
        self.rpc_url = os.getenv("QIE_TESTNET_RPC_URL", "https://testnet.qie.digital")
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        # QIE has 7 oracles - these are example addresses (update with actual QIE oracle addresses)
        self.oracle_addresses = {
            'forex': os.getenv("QIE_FOREX_ORACLE", "0x0000000000000000000000000000000000000000"),
            'commodity': os.getenv("QIE_COMMODITY_ORACLE", "0x0000000000000000000000000000000000000000"),
            'crypto': os.getenv("QIE_CRYPTO_ORACLE", "0x0000000000000000000000000000000000000000"),
        }
    
    async def get_price(self, asset: str, oracle_type: str = 'crypto') -> Optional[float]:
        """
        Get price from QIE Oracle with fallback and caching
        
        Args:
            asset: Asset symbol (e.g., 'ETH', 'BTC', 'USDT')
            oracle_type: Type of oracle ('forex', 'commodity', 'crypto')
        
        Returns:
            Price in USD or None if unavailable
        """
        # Check cache first
        cache_key = f"price:{oracle_type}:{asset}"
        if Config.ENABLE_ORACLE_CACHE:
            cached_price = cache.get(cache_key)
            if cached_price is not None:
                logger.debug(f"Cache hit for {asset} price")
                return cached_price
        
        try:
            # Try to get from QIE oracle contract first
            oracle_address = self.oracle_addresses.get(oracle_type)
            if oracle_address and oracle_address != "0x0000000000000000000000000000000000000000":
                try:
                    price = await self._call_oracle_contract(oracle_address, asset, oracle_type)
                    if price:
                        # Cache the result
                        if Config.ENABLE_ORACLE_CACHE:
                            cache.set(cache_key, price, ttl=Config.ORACLE_CACHE_TTL)
                        return price
                except Exception as e:
                    logger.warning(f"QIE Oracle contract call failed: {e}, using fallback")
            
            # Fallback to public API
            price = await self._fetch_price_fallback(asset)
            
            # Cache fallback result
            if price and Config.ENABLE_ORACLE_CACHE:
                cache.set(cache_key, price, ttl=Config.ORACLE_CACHE_TTL)
            
            return price
            
        except Exception as e:
            logger.error(f"Error fetching price from oracle: {e}")
            return None
    
    async def _call_oracle_contract(
        self, 
        oracle_address: str, 
        asset: str, 
        oracle_type: str
    ) -> Optional[float]:
        """
        Call QIE Oracle contract to get price
        
        Args:
            oracle_address: Oracle contract address
            asset: Asset symbol
            oracle_type: Type of oracle
        
        Returns:
            Price in USD or None
        """
        try:
            # Standard oracle ABI (Chainlink-style, adjust for QIE's actual oracle format)
            oracle_abi = [
                {
                    "inputs": [],
                    "name": "latestRoundData",
                    "outputs": [
                        {"internalType": "uint80", "name": "roundId", "type": "uint80"},
                        {"internalType": "int256", "name": "answer", "type": "int256"},
                        {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
                        {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
                        {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"}
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "string", "name": "symbol", "type": "string"}],
                    "name": "getPrice",
                    "outputs": [{"internalType": "uint256", "name": "price", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
            
            contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(oracle_address),
                abi=oracle_abi
            )
            
            # Try getPrice(string) first
            try:
                price_wei = contract.functions.getPrice(asset).call()
                # Assuming price is in 8 decimals (like Chainlink)
                price = price_wei / 10**8
                return float(price)
            except:
                pass
            
            # Try latestRoundData() for Chainlink-style oracles
            try:
                round_data = contract.functions.latestRoundData().call()
                if len(round_data) >= 2:
                    price_wei = round_data[1]  # answer
                    price = price_wei / 10**8
                    return float(price)
            except:
                pass
            
            return None
            
        except Exception as e:
            print(f"Error calling oracle contract: {e}")
            return None
    
    async def _fetch_price_fallback(self, asset: str) -> Optional[float]:
        """Fallback method to fetch prices from public APIs"""
        try:
            # Use CoinGecko or similar API as fallback
            asset_lower = asset.lower()
            
            # Map common assets
            asset_map = {
                'eth': 'ethereum',
                'btc': 'bitcoin',
                'usdt': 'tether',
                'usdc': 'usd-coin',
                'qie': 'qie',  # QIE token
            }
            
            coin_id = asset_map.get(asset_lower, asset_lower)
            
            # Try CoinGecko API
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if coin_id in data and 'usd' in data[coin_id]:
                    return float(data[coin_id]['usd'])
            
            return None
        except Exception as e:
            print(f"Error in price fallback: {e}")
            return None
    
    async def get_volatility(self, asset: str, days: int = 30) -> Optional[float]:
        """
        Calculate volatility from price history
        
        Args:
            asset: Asset symbol
            days: Number of days to calculate volatility
        
        Returns:
            Volatility as a decimal (e.g., 0.25 for 25%)
        """
        try:
            # Fetch historical prices
            prices = await self._get_price_history(asset, days)
            
            if not prices or len(prices) < 2:
                # Fallback to asset-type-based estimate
                return self._get_default_volatility(asset)
            
            # Calculate volatility using standard deviation
            import statistics
            
            # Calculate daily returns
            returns = []
            for i in range(1, len(prices)):
                if prices[i-1] > 0:
                    daily_return = (prices[i] - prices[i-1]) / prices[i-1]
                    returns.append(daily_return)
            
            if not returns:
                return self._get_default_volatility(asset)
            
            # Calculate standard deviation of returns
            std_dev = statistics.stdev(returns) if len(returns) > 1 else abs(returns[0])
            
            # Annualize volatility (multiply by sqrt of trading days)
            # For daily data, multiply by sqrt(365)
            annualized_volatility = std_dev * (365 ** 0.5)
            
            return min(1.0, max(0.0, annualized_volatility))  # Clamp between 0 and 1
            
        except Exception as e:
            print(f"Error calculating volatility: {e}")
            return self._get_default_volatility(asset)
    
    async def _get_price_history(self, asset: str, days: int) -> List[float]:
        """
        Get historical price data for volatility calculation
        
        Args:
            asset: Asset symbol
            days: Number of days of history
        
        Returns:
            List of prices
        """
        try:
            # Try to get from CoinGecko historical API
            asset_lower = asset.lower()
            asset_map = {
                'eth': 'ethereum',
                'btc': 'bitcoin',
                'usdt': 'tether',
                'usdc': 'usd-coin',
            }
            
            coin_id = asset_map.get(asset_lower, asset_lower)
            
            # CoinGecko historical API
            url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
            params = {
                'vs_currency': 'usd',
                'days': days,
                'interval': 'daily'
            }
            
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                prices = data.get('prices', [])
                # Extract just the price values
                return [price[1] for price in prices]  # [timestamp, price]
            
            # Fallback: Get current price and estimate
            current_price = await self.get_price(asset)
            if current_price:
                # Return array with current price (simplified)
                return [current_price] * min(days, 30)
            
            return []
            
        except Exception as e:
            print(f"Error fetching price history: {e}")
            return []
    
    def _get_default_volatility(self, asset: str) -> float:
        """Get default volatility based on asset type"""
        volatility_map = {
            'usdt': 0.01,  # Stablecoins have low volatility
            'usdc': 0.01,
            'dai': 0.01,
            'eth': 0.30,   # ETH has moderate volatility
            'btc': 0.35,   # BTC has higher volatility
            'qie': 0.25,   # QIE token estimated
        }
        
        asset_lower = asset.lower()
        return volatility_map.get(asset_lower, 0.25)  # Default 25%
    
    async def get_forex_rate(self, pair: str) -> Optional[float]:
        """
        Get forex rate from QIE Forex Oracle
        
        Args:
            pair: Forex pair (e.g., 'USD/EUR', 'USD/GBP')
        
        Returns:
            Exchange rate or None
        """
        try:
            # Try QIE Forex Oracle first
            oracle_address = self.oracle_addresses.get('forex')
            if oracle_address and oracle_address != "0x0000000000000000000000000000000000000000":
                try:
                    rate = await self._call_oracle_contract(oracle_address, pair, 'forex')
                    if rate:
                        return rate
                except:
                    pass
            
            # Fallback to public API
            if '/' in pair:
                base, quote = pair.split('/')
                return await self._fetch_forex_rate_fallback(base, quote)
            
            return None
        except Exception as e:
            print(f"Error fetching forex rate: {e}")
            return None
    
    async def _fetch_forex_rate_fallback(self, base: str, quote: str) -> Optional[float]:
        """Fetch forex rate from public API"""
        try:
            # Use exchangerate-api.io or similar
            url = f"https://api.exchangerate-api.com/v4/latest/{base}"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                rates = data.get('rates', {})
                if quote in rates:
                    return float(rates[quote])
            
            return None
        except Exception as e:
            print(f"Forex fallback error: {e}")
            return None
    
    async def get_commodity_price(self, commodity: str) -> Optional[float]:
        """
        Get commodity price from QIE Commodity Oracle
        
        Args:
            commodity: Commodity symbol (e.g., 'GOLD', 'OIL', 'SILVER')
        
        Returns:
            Price in USD or None
        """
        try:
            # Try QIE Commodity Oracle first
            oracle_address = self.oracle_addresses.get('commodity')
            if oracle_address and oracle_address != "0x0000000000000000000000000000000000000000":
                try:
                    price = await self._call_oracle_contract(oracle_address, commodity, 'commodity')
                    if price:
                        return price
                except:
                    pass
            
            # Fallback to public API
            return await self._fetch_commodity_price_fallback(commodity)
            
        except Exception as e:
            print(f"Error fetching commodity price: {e}")
            return None
    
    async def _fetch_commodity_price_fallback(self, commodity: str) -> Optional[float]:
        """Fetch commodity price from public API"""
        try:
            # Map commodity symbols
            commodity_map = {
                'GOLD': 'XAU',
                'SILVER': 'XAG',
                'OIL': 'WTI',
                'CRUDE': 'WTI'
            }
            
            symbol = commodity_map.get(commodity.upper(), commodity.upper())
            
            # Use metals-api.com or similar for gold/silver
            if symbol in ['XAU', 'XAG']:
                api_key = os.getenv("METALS_API_KEY", "")
                if api_key:
                    url = f"https://api.metals.live/v1/spot/{symbol}"
                    headers = {"x-api-key": api_key}
                    response = requests.get(url, headers=headers, timeout=5)
                    if response.status_code == 200:
                        data = response.json()
                        return float(data.get('price', 0))
            
            # For other commodities, return None (would need specific APIs)
            return None
            
        except Exception as e:
            print(f"Commodity fallback error: {e}")
            return None

