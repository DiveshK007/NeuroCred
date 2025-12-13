'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { 
  Radio, 
  TrendingUp, 
  Lock, 
  Wallet, 
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Coins
} from "lucide-react";
import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { CreditScoreOrb } from "@/components/credit/CreditScoreOrb";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const statsData = [
  {
    icon: Radio,
    label: "Oracle Price",
    value: "$2.45",
    subtext: "QIE/USD",
    live: true,
  },
  {
    icon: TrendingUp,
    label: "Staking Tier",
    value: "Silver",
    subtext: "+5% Boost",
    color: "text-primary",
  },
  {
    icon: Lock,
    label: "Staked Amount",
    value: "5,000",
    subtext: "NCRD",
  },
  {
    icon: Wallet,
    label: "Wallet Balance",
    value: "1,234.56",
    subtext: "QIE",
  },
];

const quickActions = [
  { icon: Lock, label: "Stake NCRD", path: "/stake" },
  { icon: Coins, label: "DeFi Demo", path: "/lending-demo" },
  { icon: MessageSquare, label: "Q-Loan Chat", path: "/lend" },
];

export default function Dashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [baseScore, setBaseScore] = useState<number>(0);
  const [stakingBoost, setStakingBoost] = useState<number>(0);
  const [oraclePenalty, setOraclePenalty] = useState<number>(0);
  const [riskBand, setRiskBand] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [oraclePrice, setOraclePrice] = useState<string>('$2.45');
  const [stakingTier, setStakingTier] = useState<string>('None');
  const [stakedAmount, setStakedAmount] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-connect wallet
    const connectWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await provider.send('eth_requestAccounts', []);
          const signer = await provider.getSigner();
          const addr = await signer.getAddress();
          setAddress(addr);
          
          // Fetch balance
          const bal = await provider.getBalance(addr);
          setWalletBalance(ethers.formatEther(bal));
          
          // Load dashboard data
          loadDashboardData(addr);
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      }
    };
    connectWallet();
  }, []);

  const loadDashboardData = async (addr: string) => {
    setIsLoading(true);
    try {
      // Fetch score
      const scoreRes = await fetch(`${API_URL}/api/score/${addr}`);
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setScore(scoreData.score);
        setBaseScore(scoreData.baseScore || scoreData.score);
        setStakingBoost(scoreData.stakingBoost || 0);
        setOraclePenalty(scoreData.oraclePenalty || 0);
        setRiskBand(scoreData.riskBand || 0);
      }

      // Fetch oracle price
      try {
        const oracleRes = await fetch(`${API_URL}/api/oracle/price`);
        if (oracleRes.ok) {
          const oracleData = await oracleRes.json();
          if (oracleData.price) {
            setOraclePrice(`$${oracleData.price.toFixed(2)}`);
          }
        }
      } catch (e) {
        console.error('Error fetching oracle price:', e);
      }

      // Fetch staking info
      try {
        const stakingRes = await fetch(`${API_URL}/api/staking/${addr}`);
        if (stakingRes.ok) {
          const stakingData = await stakingRes.json();
          setStakingTier(stakingData.tierName || 'None');
          setStakedAmount(stakingData.stakedAmount ? ethers.formatEther(stakingData.stakedAmount.toString()) : '0');
          setStakingBoost(stakingData.scoreBoost || 0);
        }
      } catch (e) {
        console.error('Error fetching staking info:', e);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (address) {
      await loadDashboardData(address);
    }
  };

  const statsData = [
    {
      icon: Radio,
      label: "Oracle Price",
      value: oraclePrice,
      subtext: "QIE/USD",
      live: true,
    },
    {
      icon: TrendingUp,
      label: "Staking Tier",
      value: stakingTier,
      subtext: stakingBoost > 0 ? `+${stakingBoost} Boost` : "No boost",
      color: "text-primary",
    },
    {
      icon: Lock,
      label: "Staked Amount",
      value: parseFloat(stakedAmount).toLocaleString(),
      subtext: "NCRD",
    },
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: parseFloat(walletBalance).toFixed(2),
      subtext: "QIE",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Your NeuroCred overview</p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          >
            {statsData.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <GlassCard className="h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    {stat.live && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs text-success">Live</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold font-mono ${stat.color || "text-foreground"}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Score Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard variant="glow" className="h-full">
                <div className="flex flex-col items-center py-8">
                  <h2 className="text-xl font-semibold mb-8">Your Credit Score</h2>
                  {score !== null ? (
                    <>
                      <CreditScoreOrb score={score} size="lg" />
                      
                      <div className="mt-12 w-full max-w-md">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Score Breakdown</h3>
                        <div className="space-y-4">
                          <ScoreBreakdownItem label="Base Score" value={baseScore} max={1000} color="from-primary to-secondary" />
                          <ScoreBreakdownItem label="Staking Boost" value={stakingBoost} max={300} color="from-success to-primary" isBoost />
                          <ScoreBreakdownItem label="Oracle Penalty" value={oraclePenalty} max={100} color="from-destructive to-warning" isPenalty />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No score available</p>
                      <p className="text-sm text-muted-foreground">Connect wallet and generate score to view</p>
                    </div>
                  )}

                  <Button variant="glass" size="lg" className="mt-8" onClick={handleRefresh} disabled={isLoading || !address}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Score
                  </Button>
                </div>
              </GlassCard>
            </motion.div>

            {/* Quick Actions Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <GlassCard>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link key={action.label} href={action.path}>
                      <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <action.icon className="w-5 h-5 text-primary" />
                          <span className="font-medium">{action.label}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </GlassCard>

              {stakingTier !== 'None' && parseFloat(stakedAmount) > 0 ? (
                <GlassCard variant="gradient-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">Staking Active</p>
                      <p className="text-xs text-muted-foreground">{stakingTier} tier benefits</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Staked</span>
                      <span className="font-mono">{parseFloat(stakedAmount).toLocaleString()} NCRD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score Boost</span>
                      <span className="font-mono text-success">+{stakingBoost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Tier</span>
                      <span className="font-mono text-primary">{stakingTier}</span>
                    </div>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard>
                  <div className="text-center py-6">
                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-2">No Active Staking</p>
                    <p className="text-xs text-muted-foreground mb-4">Stake NCRD to boost your score</p>
                    <Link href="/stake">
                      <Button variant="glass" size="sm">
                        Start Staking
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface ScoreBreakdownItemProps {
  label: string;
  value: number;
  max: number;
  color: string;
  isBoost?: boolean;
  isPenalty?: boolean;
}

function ScoreBreakdownItem({ label, value, max, color, isBoost, isPenalty }: ScoreBreakdownItemProps) {
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono ${isBoost ? "text-success" : isPenalty ? "text-destructive" : ""}`}>
          {isBoost && "+"}{isPenalty && value > 0 && "-"}{value}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
        />
      </div>
    </div>
  );
}
