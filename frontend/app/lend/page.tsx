'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Layout } from '@/components/layout/Layout';
import ChatConsole from '../components/ChatConsole';
import ScoreDisplay from '../components/ScoreDisplay';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

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
  const { address, provider, isConnected, connect } = useWallet();
  const [score, setScore] = useState<number | null>(null);
  const [riskBand, setRiskBand] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const loadActiveLoans = async (addr: string, prov: any) => {
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

  // Load score and loans when wallet is connected
  useEffect(() => {
    if (address && provider) {
      loadScore(address);
      loadActiveLoans(address, provider);
    }
  }, [address, provider]);

  return (
    <Layout>
      <div className="min-h-screen px-8 lg:px-16 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gradient mb-2">NeuroLend: AI-Negotiated Lending</h1>
            <p className="text-muted-foreground">Chat with AI to get personalized loan terms based on your NeuroCred score</p>
          </div>

          {!isConnected ? (
            <div className="max-w-md mx-auto">
              <GlassCard className="text-center p-12">
                <div className="text-6xl mb-6">💬</div>
                <h2 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8">
                  Connect your wallet to start chatting with NeuroLend AI
                </p>
                <Button onClick={connect} variant="glow" size="lg">
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </Button>
              </GlassCard>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Score & Active Loans */}
              <div className="space-y-6">
                {/* Score Display */}
                {score !== null && (
                  <ScoreDisplay
                    score={score}
                    riskBand={riskBand || 0}
                    explanation={explanation}
                  />
                )}

                {/* Active Loans */}
                {activeLoans.length > 0 && (
                  <GlassCard>
                    <h2 className="text-xl font-bold mb-4">Active Loans</h2>
                    <div className="space-y-3">
                      {activeLoans.map((loan) => (
                        <div key={loan.id} className="glass-hover rounded-lg p-4 border border-border/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Loan #{loan.id}
                            </span>
                            <span className="font-mono font-semibold">
                              {loan.totalOwed} QIE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* Right Column: Chat Console */}
              <div className="lg:col-span-2">
                <div className="h-[600px]">
                  <ChatConsole address={address} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
