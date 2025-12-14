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
const QIE_TESTNET_CHAIN_ID = 1983n; // QIE Testnet chain ID
const QIE_TESTNET_RPC_URL = 'https://rpc1testnet.qie.digital/';
const QIE_TESTNET_NAME = 'QIE Testnet';
const QIE_TESTNET_CURRENCY = 'QIE';

// QIE Testnet network configuration
const QIE_TESTNET_CONFIG = {
  chainId: `0x${QIE_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: QIE_TESTNET_NAME,
  nativeCurrency: {
    name: QIE_TESTNET_CURRENCY,
    symbol: QIE_TESTNET_CURRENCY,
    decimals: 18,
  },
  rpcUrls: [QIE_TESTNET_RPC_URL],
  blockExplorerUrls: ['https://testnet.qie.digital'],
};

// Helper function to switch to QIE Testnet
const switchToQieTestnet = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    // Try to switch to the network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: QIE_TESTNET_CONFIG.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [QIE_TESTNET_CONFIG],
        });
        return true;
      } catch (addError) {
        console.error('Error adding QIE Testnet:', addError);
        alert('Failed to add QIE Testnet. Please add it manually in your wallet.');
        return false;
      }
    } else {
      console.error('Error switching to QIE Testnet:', switchError);
      return false;
    }
  }
};

// Helper function to check if connected to correct network
const checkNetwork = async (provider: ethers.BrowserProvider): Promise<boolean> => {
  try {
    const network = await provider.getNetwork();
    return network.chainId === QIE_TESTNET_CHAIN_ID;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

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
              // Use the refreshBalanceForAddress function (defined below)
              // We'll call it after the function is defined
              setTimeout(async () => {
                try {
                  const network = await prov.getNetwork();
                  console.log('Restored connection to network:', network.chainId.toString());
                  
                  // Check if on correct network
                  if (network.chainId !== QIE_TESTNET_CHAIN_ID) {
                    console.warn('Not connected to QIE Testnet. Current chain ID:', network.chainId.toString());
                    const shouldSwitch = confirm(
                      `You are not connected to QIE Testnet (Chain ID: ${QIE_TESTNET_CHAIN_ID}). ` +
                      `Would you like to switch to QIE Testnet now?`
                    );
                    if (shouldSwitch) {
                      await switchToQieTestnet();
                      // Reload to get updated provider
                      window.location.reload();
                      return;
                    }
                  }
                  
                  const bal = await prov.getBalance(savedAddress);
                  const formattedBalance = ethers.formatEther(bal);
                  console.log('Restored balance:', formattedBalance, 'QIE');
                  setBalance(formattedBalance);
                } catch (balanceError) {
                  console.error('Error fetching balance on restore:', balanceError);
                  // Try fallback
                  if (window.ethereum) {
                    try {
                      const balanceHex = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [savedAddress, 'latest'],
                      });
                      const balanceWei = BigInt(balanceHex);
                      setBalance(ethers.formatEther(balanceWei.toString()));
                    } catch (fallbackError) {
                      console.error('Fallback balance fetch failed:', fallbackError);
                      setBalance('0');
                    }
                  } else {
                    setBalance('0');
                  }
                }
              }, 100);
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

  // Helper function to fetch balance with fallback
  const refreshBalanceForAddress = async (prov: ethers.BrowserProvider, addr: string) => {
    try {
      // Get the current network to ensure we're on the right chain
      const network = await prov.getNetwork();
      console.log('Current network:', network.chainId.toString());
      
      const bal = await prov.getBalance(addr);
      const formattedBalance = ethers.formatEther(bal);
      console.log('Balance fetched:', formattedBalance, 'QIE');
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance via provider:', error);
      // Try to get balance using direct RPC call as fallback
      if (window.ethereum) {
        try {
          console.log('Trying fallback balance fetch for address:', addr);
          const balanceHex = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [addr, 'latest'],
          });
          const balanceWei = BigInt(balanceHex);
          const formattedBalance = ethers.formatEther(balanceWei.toString());
          console.log('Fallback balance fetched:', formattedBalance, 'QIE');
          setBalance(formattedBalance);
        } catch (fallbackError) {
          console.error('Fallback balance fetch failed:', fallbackError);
          setBalance('0');
        }
      } else {
        setBalance('0');
      }
    }
  };

  const refreshBalance = async () => {
    if (address && provider) {
      await refreshBalanceForAddress(provider, address);
    }
  };

  // Listen for account changes and chain changes
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

      const handleChainChanged = async (chainId: string) => {
        console.log('Chain changed to:', chainId);
        const chainIdNum = BigInt(chainId);
        
        // Check if switched to correct network
        if (chainIdNum === QIE_TESTNET_CHAIN_ID) {
          console.log('Switched to QIE Testnet successfully');
          // Refresh balance if connected
          if (address && provider) {
            await refreshBalance();
          }
        } else {
          console.warn('Switched to wrong network. Expected QIE Testnet (1983), got:', chainIdNum.toString());
          const shouldSwitch = confirm(
            `You switched to a different network (Chain ID: ${chainIdNum}). ` +
            `NeuroCred requires QIE Testnet (Chain ID: ${QIE_TESTNET_CHAIN_ID}). ` +
            `Would you like to switch back to QIE Testnet?`
          );
          if (shouldSwitch) {
            await switchToQieTestnet();
          }
        }
        
        // Reload the page when chain changes to ensure provider is updated
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
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
      
      // Check if on correct network
      const isCorrectNetwork = await checkNetwork(prov);
      if (!isCorrectNetwork) {
        const network = await prov.getNetwork();
        const shouldSwitch = confirm(
          `You are not connected to QIE Testnet (Chain ID: ${QIE_TESTNET_CHAIN_ID}). ` +
          `Current network: Chain ID ${network.chainId}. ` +
          `Would you like to switch to QIE Testnet now?`
        );
        if (shouldSwitch) {
          const switched = await switchToQieTestnet();
          if (switched) {
            // Reload to get updated provider
            window.location.reload();
            return;
          } else {
            alert('Failed to switch network. Please switch manually to QIE Testnet.');
            setIsConnecting(false);
            return;
          }
        } else {
          alert('Please switch to QIE Testnet to use NeuroCred.');
          setIsConnecting(false);
          return;
        }
      }
      
      setAddress(addr);
      setProvider(prov);
      
      // Save to localStorage
      localStorage.setItem(WALLET_STORAGE_KEY, addr);
      
      // Fetch balance with error handling and retry
      await refreshBalanceForAddress(prov, addr);
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

