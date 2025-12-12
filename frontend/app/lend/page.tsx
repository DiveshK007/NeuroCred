'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import WalletConnect from '../components/WalletConnect';
import ChatConsole from '../components/ChatConsole';
import ScoreDisplay from '../components/ScoreDisplay';

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

  const handleConnect = (addr: string, prov: ethers.BrowserProvider) => {
    setAddress(addr);
    setProvider(prov);
    loadScore(addr);
    loadActiveLoans(addr, prov);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setProvider(null);
    setScore(null);
    setRiskBand(null);
    setExplanation('');
    setActiveLoans([]);
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
      
      // Convert signature to bytes
      const signatureBytes = ethers.getBytes(signature);
      
      // Execute loan
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Q-Loan: AI-Negotiated Lending
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Chat with AI to get personalized loan terms based on your NeuroCred score
          </p>
          <WalletConnect onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {address ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* Left Column: Score & Active Loans */}
            <div className="space-y-6">
              {/* Score Display */}
              {score !== null && (
                <div>
                  <ScoreDisplay
                    score={score}
                    riskBand={riskBand || 0}
                    explanation={explanation}
                  />
                </div>
              )}

              {/* Active Loans */}
              {activeLoans.length > 0 && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <h2 className="text-xl font-bold mb-4">Active Loans</h2>
                  <div className="space-y-3">
                    {activeLoans.map((loan) => (
                      <div key={loan.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Loan #{loan.id}
                          </span>
                          <span className="font-semibold">
                            {loan.totalOwed} QIE owed
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
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your wallet to start chatting with Q-Loan AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

