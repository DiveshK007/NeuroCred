'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import DeFiDemo from '../components/DeFiDemo';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LendingDemoPage() {
  const { address, provider, isConnected, connect } = useWallet();
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <Layout>
      <div className="min-h-screen px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-2">DeFi Lending Demo</h1>
            <p className="text-muted-foreground">See how your credit score affects borrowing terms</p>
          </div>

          {!isConnected ? (
            <div className="max-w-md mx-auto">
              <GlassCard className="text-center p-12">
                <div className="text-6xl mb-6">🔐</div>
                <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8">
                  Connect your wallet to view personalized lending terms
                </p>
                <Button onClick={connect} variant="glow" size="lg">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
              </GlassCard>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              {score === null ? (
                <GlassCard className="text-center p-12">
                  <div className="text-6xl mb-6">💳</div>
                  <h2 className="text-2xl font-bold mb-4 gradient-text">Generate Credit Score First</h2>
                  <p className="text-muted-foreground mb-8">
                    Generate your credit score to see personalized lending terms
                  </p>
                  <Button
                    onClick={generateScore}
                    disabled={isLoading}
                    variant="glow"
                    size="lg"
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
                  </Button>
                </GlassCard>
              ) : (
                <DeFiDemo address={address} provider={provider} score={score} riskBand={riskBand} />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
