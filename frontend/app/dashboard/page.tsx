'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import ScoreDisplay from '../components/ScoreDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
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
        setRiskBand(data.riskBand);
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error loading score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {address ? (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading score...</p>
              </div>
            ) : score !== null ? (
              <ScoreDisplay
                score={score}
                riskBand={riskBand || 0}
                explanation={explanation}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No score found. Generate your credit passport first.
                </p>
                <a
                  href="/"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block"
                >
                  Go to Home
                </a>
              </div>
            )}
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

