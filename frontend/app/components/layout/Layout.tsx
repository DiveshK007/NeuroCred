'use client';

import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { ethers } from "ethers";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [balance, setBalance] = useState<string>();

  const handleConnect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or QIE Wallet!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const bal = await provider.getBalance(addr);
      
      setIsConnected(true);
      setWalletAddress(addr);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress(undefined);
    setBalance(undefined);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[800px] h-[800px] opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, hsl(190, 70%, 35%, 0.08) 0%, transparent 70%)",
          }}
        />
        <motion.div
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-0 w-[800px] h-[800px] opacity-20"
          style={{
            background: "radial-gradient(ellipse at center, hsl(262, 60%, 45%, 0.08) 0%, transparent 70%)",
          }}
        />
        
        {/* Enhanced Grid overlay with multiple layers */}
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 grid-pattern-dense opacity-20" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 noise" />
      </div>

      <Sidebar
        isConnected={isConnected}
        walletAddress={walletAddress}
        balance={balance}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Main content */}
      <main className="ml-[72px] min-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
