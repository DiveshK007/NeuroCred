'use client';

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { useWallet } from "@/contexts/WalletContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const { address, isConnected, connect } = useWallet();
  const [score, setScore] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    await connect();
  };

  // Generate score when wallet is connected (but only once)
  useEffect(() => {
    if (address && isConnected && score === undefined) {
      generateScore(address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  const generateScore = async (address: string) => {
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
    } catch (error) {
      console.error('Error generating score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <HeroSection 
        isConnected={isConnected} 
        onConnect={handleConnect}
        score={score}
      />
    </Layout>
  );
}

