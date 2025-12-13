'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import QIEStaking from '../components/QIEStaking';
import Sidebar from '../components/Sidebar';

export default function StakePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
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
    setBalance('0');
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
              NCRD Staking
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Stake NCRD tokens to boost your credit score
            </p>
            {!address && (
              <div className="flex justify-center">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            )}
          </div>

          <div className="max-w-4xl mx-auto">
            <QIEStaking address={address} provider={provider} />
          </div>
        </div>
      </main>
    </div>
  );
}
