'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import ChatConsole from '../components/ChatConsole';
import ScoreDisplay from '../components/ScoreDisplay';
import Sidebar from '../components/Sidebar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const LENDING_VAULT_ADDRESS = process.env.NEXT_PUBLIC_LENDING_VAULT_ADDRESS;

const LENDING_VAULT_ABI = [
  "function createLoan(tuple(address borrower,uint256 amount,uint256 collateralAmount,uint256 interestRate,uint256 duration,uint256 nonce,uint256 expiry) offer, bytes aiSignature) payable returns (uint256)",
  "function getBorrowerLoans(address borrower) view returns (uint256[])",
  "function calculateTotalOwed(uint256 loanId) view returns (uint256)",
  "function repayLoan(uint256 loanId) payable",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 collateralAmount, uint256 interestRate)"
];

export default function LendPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  const handleConnect = async (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
    loadScore(addr);
    loadActiveLoans(addr, prov);
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
    setScore(null);
    setRiskBand(null);
    setExplanation('');
    setActiveLoans([]);
    setBalance('0');
  };

  const loadScore = async (addr: string) => {
    try {
      const response = await fetch(`${API_URL}/api/score/${addr}`);
      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setRiskBand(data.riskBand);
        setExplanation(data.explanation);
      }
    } catch (error) {
      console.error('Error loading score:', error);
    }
  };

  const loadActiveLoans = async (addr: string, prov: ethers.BrowserProvider) => {
    if (!LENDING_VAULT_ADDRESS || !prov) return;
    
    try {
      const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LENDING_VAULT_ABI, prov);
      const loanIds = await contract.getBorrowerLoans(addr);
      
      const loans = await Promise.all(
        loanIds.map(async (id: bigint) => {
          const totalOwed = await contract.calculateTotalOwed(id);
          return {
            id: Number(id),
            totalOwed: ethers.formatEther(totalOwed),
          };
        })
      );
      
      setActiveLoans(loans);
    } catch (error) {
      console.error('Error loading loans:', error);
    }
  };

  const handleAcceptOffer = async (event: CustomEvent) => {
    const { offer, signature } = event.detail;
    if (!address || !provider || !LENDING_VAULT_ADDRESS) {
      alert('Please connect wallet and ensure LendingVault is configured');
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LENDING_VAULT_ADDRESS, LENDING_VAULT_ABI, signer);
      
      const signatureBytes = ethers.getBytes(signature);
      
      const tx = await contract.createLoan(offer, signatureBytes, {
        value: offer.collateralAmount,
      });
      
      await tx.wait();
      
      alert('Loan created successfully! Check your wallet.');
      await loadActiveLoans(address, provider);
    } catch (error: any) {
      console.error('Error creating loan:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleAccept = (e: Event) => handleAcceptOffer(e as CustomEvent);
    window.addEventListener('acceptOffer', handleAccept);
    return () => window.removeEventListener('acceptOffer', handleAccept);
  }, [address, provider]);

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
              Q-Loan: AI-Negotiated Lending
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Chat with AI to get personalized loan terms based on your NeuroCred score
            </p>
            {!address && (
              <div className="flex justify-center">
                <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
              </div>
            )}
          </div>

          {address ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {/* Left Column: Score & Active Loans */}
              <div className="space-y-6">
                {/* Score Display */}
                {score !== null && (
                  <div className="animate-fade-in">
                    <ScoreDisplay
                      score={score}
                      riskBand={riskBand || 0}
                      explanation={explanation}
                    />
                  </div>
                )}

                {/* Active Loans */}
                {activeLoans.length > 0 && (
                  <div className="glass rounded-xl p-6 animate-fade-in">
                    <h2 className="text-xl font-bold mb-4 text-white">Active Loans</h2>
                    <div className="space-y-3">
                      {activeLoans.map((loan) => (
                        <div key={loan.id} className="glass-hover rounded-lg p-4 border border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary">
                              Loan #{loan.id}
                            </span>
                            <span className="font-mono font-semibold text-white">
                              {loan.totalOwed} QIE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Chat Console */}
              <div className="lg:col-span-2">
                <div className="h-[600px]">
                  <ChatConsole address={address} />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center max-w-md mx-auto animate-fade-in">
              <div className="text-6xl mb-6">💬</div>
              <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
              <p className="text-text-secondary mb-8">
                Connect your wallet to start chatting with Q-Loan AI
              </p>
              <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
