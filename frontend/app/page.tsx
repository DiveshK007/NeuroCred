'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from './components/WalletConnect';
import ScoreDisplay from './components/ScoreDisplay';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleConnect = (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
    setScore(null);
    setRiskBand(null);
    setExplanation('');
    setTxHash(null);
  };

  const generateScore = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      // Call backend API to generate score
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
      setExplanation(data.explanation);

      // If txHash is returned, use it (backend automatically updated on-chain)
      if (data.transactionHash) {
        setTxHash(data.transactionHash);
      } else {
        // Fallback: manually update on-chain if txHash not in response
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
      // Don't show error to user, score was still generated
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            NeuroCred
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            AI-Powered Credit Passport on QIE Blockchain
          </p>
          <div className="flex justify-center">
            <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
          </div>
        </div>

        {/* Main Content */}
        {address && (
          <div className="max-w-4xl mx-auto">
            {score !== null ? (
              <div>
                <ScoreDisplay
                  score={score}
                  riskBand={riskBand || 0}
                  explanation={explanation}
                />
                {txHash && (
                  <div className="mt-4 text-center">
                    <a
                      href={`https://testnet.qie.digital/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      View Transaction on Explorer
                    </a>
                  </div>
                )}
                <div className="mt-6 text-center">
                  <button
                    onClick={generateScore}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Refresh Score
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={generateScore}
                  disabled={isLoading}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-semibold"
                >
                  {isLoading ? 'Generating Score...' : 'Generate My Credit Passport'}
                </button>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Get your AI-powered credit score stored as a soulbound NFT on QIE
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {!address && (
          <div className="max-w-2xl mx-auto mt-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-2">1️⃣</div>
                <h3 className="font-semibold mb-2">Connect Wallet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect your QIE Wallet or MetaMask
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-2">2️⃣</div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI analyzes your on-chain activity
                </p>
              </div>
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="text-3xl mb-2">3️⃣</div>
                <h3 className="font-semibold mb-2">Get Score</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive your credit passport NFT
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
