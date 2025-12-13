'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Layout } from '@/components/layout/Layout';
import QIEStaking from '../components/QIEStaking';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Wallet } from 'lucide-react';

export default function StakePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    // Auto-connect wallet if available
    const connectWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const { ethers } = await import('ethers');
          const prov = new ethers.BrowserProvider(window.ethereum);
          await prov.send('eth_requestAccounts', []);
          const signer = await prov.getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          setProvider(prov);
          const bal = await prov.getBalance(addr);
          setBalance(ethers.formatEther(bal));
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      }
    };
    connectWallet();
  }, []);

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or QIE Wallet!');
      return;
    }

    try {
      const { ethers } = await import('ethers');
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send('eth_requestAccounts', []);
      const signer = await prov.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      setProvider(prov);
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-2">NCRD Staking</h1>
            <p className="text-muted-foreground">Stake NCRD tokens to boost your credit score</p>
          </div>

          {!address ? (
            <div className="max-w-md mx-auto">
              <GlassCard className="text-center p-12">
                <div className="text-6xl mb-6">🔒</div>
                <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8">
                  Connect your wallet to start staking NCRD tokens
                </p>
                <Button onClick={handleConnect} variant="glow" size="lg">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
              </GlassCard>
            </div>
          ) : (
            <QIEStaking address={address} provider={provider} />
          )}
        </div>
      </div>
    </Layout>
  );
}
