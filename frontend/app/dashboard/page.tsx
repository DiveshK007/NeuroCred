'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import ScoreDisplay from '../components/ScoreDisplay';
import Link from 'next/link';

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
  const [tokenId, setTokenId] = useState<number | null>(null);

  const handleConnect = (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
    loadScore(addr);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
    setScore(null);
    setRiskBand(null);
    setExplanation('');
    setTokenId(null);
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
    loadOraclePrice();
    const interval = setInterval(loadOraclePrice, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {address ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Score Card */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading score...</p>
                </div>
              ) : score !== null ? (
                <div>
                  <ScoreDisplay
                    score={score}
                    riskBand={riskBand || 0}
                    explanation={explanation}
                  />
                  {/* Score Breakdown */}
                  {(stakingBoost > 0 || oraclePenalty > 0) && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                      <h3 className="font-semibold mb-2">Score Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Score:</span>
                          <span className="font-semibold">{baseScore || score}</span>
                        </div>
                        {oraclePenalty > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Oracle Penalty:</span>
                            <span>-{oraclePenalty}</span>
                          </div>
                        )}
                        {stakingBoost > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Staking Boost:</span>
                            <span>+{stakingBoost}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Final Score:</span>
                          <span>{score}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No score found. Generate your credit passport first.
                  </p>
                  <Link
                    href="/"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                  >
                    Go to Home
                  </Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Oracle Price */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="font-semibold mb-2">Oracle Price</h3>
                {oraclePrice !== null ? (
                  <div>
                    <p className="text-2xl font-bold">${oraclePrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">QIE/USD</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Loading...</p>
                )}
              </div>

              {/* Staking Info */}
              {stakingTier > 0 && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <h3 className="font-semibold mb-2">Staking Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tier:</span>
                      <span className="font-semibold">
                        {stakingTier === 1 ? 'Bronze' : stakingTier === 2 ? 'Silver' : 'Gold'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staked:</span>
                      <span className="font-semibold">
                        {ethers.formatEther(stakedAmount.toString())} NCRD
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Boost:</span>
                      <span>+{stakingBoost} points</span>
                    </div>
                  </div>
                  <Link
                    href="/stake"
                    className="mt-3 block text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    Manage Staking
                  </Link>
                </div>
              )}

              {/* Quick Links */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/stake"
                    className="block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center text-sm"
                  >
                    Stake NCRD
                  </Link>
                  <Link
                    href="/lending-demo"
                    className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center text-sm"
                  >
                    DeFi Demo
                  </Link>
                  <button
                    onClick={() => address && loadScore(address)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    Refresh Score
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please connect your wallet to view your dashboard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

