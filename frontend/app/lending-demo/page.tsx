'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import DeFiDemo from '../components/DeFiDemo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LendingDemoPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
    setScore(null);
    setRiskBand(null);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            DeFi Lending Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            See how your credit score affects borrowing terms
          </p>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {address && (
          <div className="max-w-4xl mx-auto">
            {score === null ? (
              <div className="text-center">
                <button
                  onClick={generateScore}
                  disabled={isLoading}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                >
                  {isLoading ? 'Generating Score...' : 'Generate Credit Score First'}
                </button>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Generate your credit score to see personalized lending terms
                </p>
              </div>
            ) : (
              <DeFiDemo address={address} provider={provider} score={score} riskBand={riskBand} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

