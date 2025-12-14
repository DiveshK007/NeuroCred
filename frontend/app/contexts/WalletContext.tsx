'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_STORAGE_KEY = 'neurocred_wallet_address';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);

  // Restore connection from localStorage on mount (but don't auto-connect)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
      if (savedAddress && window.ethereum) {
        // Check if wallet is still connected (without requesting)
        const checkConnection = async () => {
          try {
            // Use eth_accounts which doesn't prompt, only returns already connected accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
              // Wallet is still connected, restore state
              const prov = new ethers.BrowserProvider(window.ethereum);
              setAddress(savedAddress);
              setProvider(prov);
              const bal = await prov.getBalance(savedAddress);
              setBalance(ethers.formatEther(bal));
            } else {
              // Wallet not connected, clear saved address
              localStorage.removeItem(WALLET_STORAGE_KEY);
            }
          } catch (error) {
            console.error('Error checking wallet connection:', error);
            localStorage.removeItem(WALLET_STORAGE_KEY);
          }
        };
        checkConnection();
      }
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnect();
        } else if (accounts[0].toLowerCase() !== address?.toLowerCase()) {
          // Account changed
          setAddress(accounts[0]);
          localStorage.setItem(WALLET_STORAGE_KEY, accounts[0]);
          if (provider) {
            refreshBalance();
          }
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [address, provider]);

  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('Please install MetaMask or QIE Wallet!');
      return;
    }

    setIsConnecting(true);
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      // This will prompt MetaMask for permission
      await prov.send('eth_requestAccounts', []);
      const signer = await prov.getSigner();
      const addr = await signer.getAddress();
      
      setAddress(addr);
      setProvider(prov);
      
      // Save to localStorage
      localStorage.setItem(WALLET_STORAGE_KEY, addr);
      
      // Fetch balance
      const bal = await prov.getBalance(addr);
      setBalance(ethers.formatEther(bal));
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if ((error as any).code === 4001) {
        alert('Please approve the connection request in MetaMask');
      } else {
        alert('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setProvider(null);
    setBalance('0');
    localStorage.removeItem(WALLET_STORAGE_KEY);
  };

  const refreshBalance = async () => {
    if (address && provider) {
      try {
        const bal = await provider.getBalance(address);
        setBalance(ethers.formatEther(bal));
      } catch (error) {
        console.error('Error refreshing balance:', error);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        provider,
        balance,
        isConnected: address !== null,
        isConnecting,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

