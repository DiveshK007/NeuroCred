'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import DeFiDemo from '../components/DeFiDemo';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LendingDemoPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      setRiskBand(data.riskBand);
    } catch (error) {
      console.error('Error generating score:', error);
      alert('Failed to generate score. Please try again.');
    } finally {
      setIsLoading(false);
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
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold gradient-text mb-4">
              DeFi Lending Demo
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              See how your credit score affects borrowing terms
            </p>
            {!address && (
              <div className="flex justify-center">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            )}
          </div>

          {address ? (
            <div className="max-w-5xl mx-auto">
              {score === null ? (
                <div className="glass rounded-2xl p-12 text-center animate-fade-in">
                  <div className="text-6xl mb-6 animate-float">💳</div>
                  <h2 className="text-2xl font-bold mb-4 gradient-text">Generate Credit Score First</h2>
                  <p className="text-text-secondary mb-8">
                    Generate your credit score to see personalized lending terms
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
                      'Generate Credit Score'
                    )}
                  </button>
                </div>
              ) : (
                <DeFiDemo address={address} provider={provider} score={score} riskBand={riskBand} />
              )}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto animate-fade-in">
              <div className="text-6xl mb-6">🔐</div>
              <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
              <p className="text-text-secondary mb-8">
                Connect your wallet to view personalized lending terms
              </p>
              <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
