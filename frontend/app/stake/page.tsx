'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import QIEStaking from '../components/QIEStaking';

export default function StakePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const handleConnect = (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            NCRD Staking
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Stake NCRD tokens to boost your credit score
          </p>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        <div className="max-w-2xl mx-auto">
          <QIEStaking address={address} provider={provider} />
        </div>
      </div>
    </div>
  );
}

