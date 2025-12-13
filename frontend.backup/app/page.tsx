'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import WalletConnect from './components/WalletConnect';
import ScoreDisplay from './components/ScoreDisplay';
import Sidebar from './components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [baseScore, setBaseScore] = useState<number | null>(null);
  const [stakingBoost, setStakingBoost] = useState<number>(0);
  const [oraclePenalty, setOraclePenalty] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');

  const handleConnect = async (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
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
    setTxHash(null);
    setBalance('0');
  };

  const generateScore = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate score');
      }

      const data = await response.json();
      setScore(data.score);
      setBaseScore(data.baseScore || data.score);
      setRiskBand(data.riskBand);
      setExplanation(data.explanation);
      setStakingBoost(data.stakingBoost || 0);
      setOraclePenalty(data.oraclePenalty || 0);

      if (data.transactionHash) {
        setTxHash(data.transactionHash);
      } else {
        await updateOnChain(data.score, data.riskBand);
      }
    } catch (error) {
      console.error('Error generating score:', error);
      alert('Failed to generate score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOnChain = async (scoreValue: number, riskBandValue: number) => {
    if (!address) return;

    try {
      const response = await fetch(`${API_URL}/api/update-on-chain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          score: scoreValue,
          riskBand: riskBandValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update on-chain');
      }

      const data = await response.json();
      setTxHash(data.transactionHash);
    } catch (error) {
      console.error('Error updating on-chain:', error);
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
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          {!address && (
            <div className="text-center mb-16 animate-fade-in">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 gradient-text text-shadow-glow">
                NeuroCred
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
                AI-Powered Credit Passport on QIE Blockchain
              </p>
              <p className="text-base text-text-muted mb-12 max-w-xl mx-auto">
                Get your on-chain credit score stored as a soulbound NFT. 
                Enable safer DeFi lending with portable reputation.
              </p>
              <div className="flex justify-center mb-16">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            </div>
          )}

          {/* Score Generation Section */}
          {address && (
            <div className="max-w-4xl mx-auto mb-16">
              {score !== null ? (
                <div className="space-y-6 animate-fade-in">
                  <ScoreDisplay
                    score={score}
                    riskBand={riskBand || 0}
                    explanation={explanation}
                    baseScore={baseScore || undefined}
                    stakingBoost={stakingBoost}
                    oraclePenalty={oraclePenalty}
                  />
                  {txHash && (
                    <div className="glass rounded-lg p-4 text-center">
                      <a
                        href={`${process.env.NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX || 'https://testnet.qie.digital/tx'}/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2"
                      >
                        <span>View Transaction on Explorer</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                      href="/lend"
                      className="glass-hover rounded-lg p-4 text-center group"
                    >
                      <div className="text-3xl mb-2">💬</div>
                      <div className="text-sm font-semibold text-white group-hover:gradient-text transition-all">
                        Q-Loan AI
                      </div>
                    </Link>
                    <Link
                      href="/stake"
                      className="glass-hover rounded-lg p-4 text-center group"
                    >
                      <div className="text-3xl mb-2">🔒</div>
                      <div className="text-sm font-semibold text-white group-hover:gradient-text transition-all">
                        Stake NCRD
                      </div>
                    </Link>
                    <Link
                      href="/lending-demo"
                      className="glass-hover rounded-lg p-4 text-center group"
                    >
                      <div className="text-3xl mb-2">💰</div>
                      <div className="text-sm font-semibold text-white group-hover:gradient-text transition-all">
                        DeFi Demo
                      </div>
                    </Link>
                    <Link
                      href="/dashboard"
                      className="glass-hover rounded-lg p-4 text-center group"
                    >
                      <div className="text-3xl mb-2">📊</div>
                      <div className="text-sm font-semibold text-white group-hover:gradient-text transition-all">
                        Dashboard
                      </div>
                    </Link>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={generateScore}
                      className="btn-gradient px-8 py-3 rounded-lg font-semibold"
                    >
                      Refresh Score
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-fade-in">
                  <div className="glass rounded-2xl p-12 max-w-md mx-auto">
                    <div className="text-6xl mb-6 animate-float">🚀</div>
                    <h2 className="text-2xl font-bold mb-4 gradient-text">Generate Your Credit Passport</h2>
                    <p className="text-text-secondary mb-8">
                      Get your AI-powered credit score stored as a soulbound NFT on QIE
                    </p>
                    <button
                      onClick={generateScore}
                      disabled={isLoading}
                      className="btn-gradient px-8 py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </span>
                      ) : (
                        'Generate My Credit Passport'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* How It Works Section */}
          {!address && (
            <div className="max-w-6xl mx-auto mt-32">
              <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: '1',
                    icon: '🔗',
                    title: 'Connect Wallet',
                    description: 'Connect your QIE Wallet or MetaMask to get started',
                    delay: '0.1s'
                  },
                  {
                    step: '2',
                    icon: '🤖',
                    title: 'AI Analysis',
                    description: 'Our AI analyzes your on-chain activity, transaction history, and wallet behavior',
                    delay: '0.2s'
                  },
                  {
                    step: '3',
                    icon: '🎫',
                    title: 'Get Score',
                    description: 'Receive your credit passport NFT with a score from 0-1000 stored on-chain',
                    delay: '0.3s'
                  }
                ].map((feature, index) => (
                  <div
                    key={feature.step}
                    className="glass-hover rounded-2xl p-8 text-center animate-slide-up"
                    style={{ animationDelay: feature.delay }}
                  >
                    <div className="text-5xl mb-4 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      {feature.icon}
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-sm mb-4">
                      {feature.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                    <p className="text-text-secondary leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Grid */}
          {!address && (
            <div className="max-w-6xl mx-auto mt-32">
              <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
                Features
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: '🛡️', title: 'Soulbound NFT', desc: 'Non-transferable credit passport tied to your wallet' },
                  { icon: '📊', title: 'AI-Powered', desc: 'Advanced ML models analyze on-chain behavior' },
                  { icon: '🔒', title: 'Staking Boost', desc: 'Stake NCRD tokens to increase your credit tier' },
                  { icon: '📡', title: 'Oracle Integration', desc: 'Real-time market data influences scoring' },
                  { icon: '💰', title: 'DeFi Ready', desc: 'Use your score for better lending terms' },
                  { icon: '⚡', title: 'QIE Native', desc: 'Built on QIE with 3s finality and near-zero fees' }
                ].map((feature, index) => (
                  <div
                    key={feature.title}
                    className="glass-hover rounded-xl p-6 animate-slide-up"
                    style={{ animationDelay: `${(index + 1) * 0.1}s` }}
                  >
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-sm text-text-secondary">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
