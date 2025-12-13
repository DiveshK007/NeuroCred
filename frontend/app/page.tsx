'use client';

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [score, setScore] = useState<number>();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or QIE Wallet!');
      return;
    }

    try {
      const { ethers } = await import('ethers');
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      
      setIsConnected(true);
      setWalletAddress(addr);
      
      // Generate score
      await generateScore(addr);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

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

declare global {
  interface Window {
    ethereum?: any;
  }
}
