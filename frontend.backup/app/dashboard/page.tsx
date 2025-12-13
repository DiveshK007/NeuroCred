'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import WalletConnect from '../components/WalletConnect';
import ScoreDisplay from '../components/ScoreDisplay';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [baseScore, setBaseScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [stakingBoost, setStakingBoost] = useState<number>(0);
  const [oraclePenalty, setOraclePenalty] = useState<number>(0);
  const [stakedAmount, setStakedAmount] = useState<number>(0);
  const [stakingTier, setStakingTier] = useState<number>(0);
  const [oraclePrice, setOraclePrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  const handleConnect = async (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
    loadScore(addr);
    try {
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (e) {
      console.error('Error fetching balance:', e);
    }
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
    setScore(null);
    setRiskBand(null);
    setExplanation('');
    setBaseScore(null);
    setStakingBoost(0);
    setOraclePenalty(0);
    setStakedAmount(0);
    setStakingTier(0);
    setBalance('0');
  };

  const loadScore = async (addr: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/score/${addr}`);
      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setBaseScore(data.baseScore || data.score);
        setRiskBand(data.riskBand);
        setExplanation(data.explanation);
        setStakingBoost(data.stakingBoost || 0);
        setOraclePenalty(data.oraclePenalty || 0);
        setStakedAmount(data.stakedAmount || 0);
        setStakingTier(data.stakingTier || 0);
      }
    } catch (error) {
      console.error('Error loading score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOraclePrice = async () => {
    try {
      const response = await fetch(`${API_URL}/api/oracle/price`);
      if (response.ok) {
        const data = await response.json();
        setOraclePrice(data.price);
      }
    } catch (error) {
      console.error('Error loading oracle price:', error);
    }
  };

  useEffect(() => {
    if (address) {
      loadOraclePrice();
      const interval = setInterval(loadOraclePrice, 60000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const getTierInfo = (tier: number) => {
    switch (tier) {
      case 1: return { name: 'Bronze', color: 'from-amber-500 to-orange-500', icon: '🥉' };
      case 2: return { name: 'Silver', color: 'from-gray-400 to-gray-500', icon: '🥈' };
      case 3: return { name: 'Gold', color: 'from-yellow-400 to-amber-500', icon: '🥇' };
      default: return { name: 'None', color: 'from-gray-600 to-gray-700', icon: '⚪' };
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="gradient-mesh"></div>
      <div className="grid-pattern absolute inset-0 opacity-30"></div>

      {/* Sidebar */}
      <Sidebar 
        address={address} 
        balance={balance}
        onConnect={() => address && provider ? null : null}
        onDisconnect={handleDisconnect}
      />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
              <p className="text-text-secondary">Your NeuroCred overview</p>
            </div>
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>

          {address ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Oracle Price Card */}
                <div className="glass-hover rounded-xl p-6 animate-slide-up">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl">📡</div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <h3 className="text-sm text-text-secondary mb-2">Oracle Price</h3>
                  {oraclePrice !== null ? (
                    <p className="text-2xl font-bold text-white font-mono">
                      ${oraclePrice.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-text-secondary text-sm">Loading...</p>
                  )}
                  <p className="text-xs text-text-muted mt-1">QIE/USD</p>
                </div>

                {/* Staking Tier Card */}
                <div className="glass-hover rounded-xl p-6 animate-slide-up stagger-1">
                  <div className="text-2xl mb-4">{getTierInfo(stakingTier).icon}</div>
                  <h3 className="text-sm text-text-secondary mb-2">Staking Tier</h3>
                  <p className={`text-2xl font-bold bg-gradient-to-r ${getTierInfo(stakingTier).color} bg-clip-text text-transparent`}>
                    {getTierInfo(stakingTier).name}
                  </p>
                  {stakingTier > 0 && (
                    <p className="text-xs text-green-400 mt-1">+{stakingBoost} boost</p>
                  )}
                </div>

                {/* Staked Amount Card */}
                <div className="glass-hover rounded-xl p-6 animate-slide-up stagger-2">
                  <div className="text-2xl mb-4">🔒</div>
                  <h3 className="text-sm text-text-secondary mb-2">Staked Amount</h3>
                  <p className="text-2xl font-bold text-white font-mono">
                    {stakedAmount > 0 ? (stakedAmount / 1e18).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">NCRD</p>
                </div>

                {/* Balance Card */}
                <div className="glass-hover rounded-xl p-6 animate-slide-up stagger-3">
                  <div className="text-2xl mb-4">💰</div>
                  <h3 className="text-sm text-text-secondary mb-2">Wallet Balance</h3>
                  <p className="text-2xl font-bold text-white font-mono">
                    {parseFloat(balance).toFixed(4)}
                  </p>
                  <p className="text-xs text-text-muted mt-1">QIE</p>
                </div>
              </div>

              {/* Main Score Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Display */}
                <div className="lg:col-span-2">
                  {isLoading ? (
                    <div className="glass rounded-2xl p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                      <p className="mt-4 text-text-secondary">Loading score...</p>
                    </div>
                  ) : score !== null ? (
                    <div className="animate-fade-in">
                      <ScoreDisplay
                        score={score}
                        riskBand={riskBand || 0}
                        explanation={explanation}
                        baseScore={baseScore || undefined}
                        stakingBoost={stakingBoost}
                        oraclePenalty={oraclePenalty}
                      />
                    </div>
                  ) : (
                    <div className="glass rounded-2xl p-12 text-center">
                      <p className="text-text-secondary mb-4">
                        No score found. Generate your credit passport first.
                      </p>
                      <Link
                        href="/"
                        className="btn-gradient px-6 py-3 rounded-lg font-semibold inline-block"
                      >
                        Go to Home
                      </Link>
                    </div>
                  )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="glass rounded-xl p-6">
                    <h3 className="font-semibold mb-4 text-white">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link
                        href="/stake"
                        className="block w-full px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-500/30 rounded-lg text-center text-sm font-medium text-white transition-all"
                      >
                        Stake NCRD
                      </Link>
                      <Link
                        href="/lending-demo"
                        className="block w-full px-4 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg text-center text-sm font-medium text-white transition-all"
                      >
                        DeFi Demo
                      </Link>
                      <Link
                        href="/lend"
                        className="block w-full px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg text-center text-sm font-medium text-white transition-all"
                      >
                        Q-Loan Chat
                      </Link>
                      <button
                        onClick={() => address && loadScore(address)}
                        className="w-full px-4 py-3 glass-hover rounded-lg text-sm font-medium text-white transition-all"
                      >
                        Refresh Score
                      </button>
                    </div>
                  </div>

                  {/* Staking Status */}
                  {stakingTier > 0 && (
                    <div className="glass rounded-xl p-6 animate-fade-in">
                      <h3 className="font-semibold mb-4 text-white">Staking Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary text-sm">Tier</span>
                          <span className={`font-semibold bg-gradient-to-r ${getTierInfo(stakingTier).color} bg-clip-text text-transparent`}>
                            {getTierInfo(stakingTier).name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-text-secondary text-sm">Staked</span>
                          <span className="font-mono font-semibold text-white">
                            {stakedAmount > 0 ? (stakedAmount / 1e18).toFixed(2) : '0'} NCRD
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-text-secondary text-sm">Boost</span>
                          <span className="font-semibold text-green-400">+{stakingBoost} pts</span>
                        </div>
                      </div>
                      <Link
                        href="/stake"
                        className="mt-4 block w-full px-4 py-2 btn-gradient rounded-lg text-center text-sm font-semibold"
                      >
                        Manage Staking
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center animate-fade-in">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
              <p className="text-text-secondary mb-8">
                Please connect your wallet to view your dashboard
              </p>
              <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
