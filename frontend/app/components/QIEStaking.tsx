'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const STAKING_ABI = [
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function integrationTier(address user) view returns (uint8)",
  "function stakedAmount(address user) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface QIEStakingProps {
  address: string | null;
  provider: ethers.BrowserProvider | null;
}

export default function QIEStaking({ address, provider }: QIEStakingProps) {
  const [stakedAmount, setStakedAmount] = useState<string>('0');
  const [tier, setTier] = useState<number>(0);
  const [ncrdBalance, setNcrdBalance] = useState<string>('0');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const stakingAddress = process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS;
  const ncrdTokenAddress = process.env.NEXT_PUBLIC_NCRD_TOKEN_ADDRESS;

  const tierNames: { [key: number]: string } = {
    0: 'None',
    1: 'Bronze',
    2: 'Silver',
    3: 'Gold'
  };

  const tierColors: { [key: number]: string } = {
    0: 'gray',
    1: 'orange',
    2: 'silver',
    3: 'gold'
  };

  useEffect(() => {
    if (address && provider && stakingAddress) {
      loadStakingInfo();
    }
  }, [address, provider, stakingAddress]);

  const loadStakingInfo = async () => {
    if (!address || !provider || !stakingAddress) return;

    try {
      const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, provider);
      const [staked, tierValue] = await Promise.all([
        stakingContract.stakedAmount(address),
        stakingContract.integrationTier(address)
      ]);

      setStakedAmount(ethers.formatEther(staked));
      setTier(Number(tierValue));

      // Load NCRD balance if token address is set
      if (ncrdTokenAddress) {
        const tokenContract = new ethers.Contract(ncrdTokenAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();
        setNcrdBalance(ethers.formatUnits(balance, decimals));
      }
    } catch (error) {
      console.error('Error loading staking info:', error);
    }
  };

  const handleStake = async () => {
    if (!address || !provider || !stakingAddress || !stakeAmount) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, signer);
      const amount = ethers.parseEther(stakeAmount);

      // Approve if needed
      if (ncrdTokenAddress) {
        const tokenContract = new ethers.Contract(ncrdTokenAddress, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(address, stakingAddress);
        if (allowance < amount) {
          const approveTx = await tokenContract.approve(stakingAddress, amount);
          await approveTx.wait();
        }
      }

      const tx = await stakingContract.stake(amount);
      setTxHash(tx.hash);
      await tx.wait();
      
      setStakeAmount('');
      await loadStakingInfo();
    } catch (error: any) {
      console.error('Error staking:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!address || !provider || !stakingAddress || !unstakeAmount) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(stakingAddress, STAKING_ABI, signer);
      const amount = ethers.parseEther(unstakeAmount);

      const tx = await stakingContract.unstake(amount);
      setTxHash(tx.hash);
      await tx.wait();
      
      setUnstakeAmount('');
      await loadStakingInfo();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address || !stakingAddress) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view staking options.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">NCRD Staking</h2>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Staked Amount:</span>
          <span className="font-semibold">{stakedAmount} NCRD</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600 dark:text-gray-400">Current Tier:</span>
          <span className={`font-bold text-${tierColors[tier]}-600`}>
            {tierNames[tier]} {tier > 0 && `(+${tier === 1 ? 50 : tier === 2 ? 150 : 300} score boost)`}
          </span>
        </div>
        {ncrdTokenAddress && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">NCRD Balance:</span>
            <span className="font-semibold">{ncrdBalance} NCRD</span>
          </div>
        )}
      </div>

      {/* Stake */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Stake NCRD</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            disabled={isLoading}
          />
          <button
            onClick={handleStake}
            disabled={isLoading || !stakeAmount}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Staking...' : 'Stake'}
          </button>
        </div>
      </div>

      {/* Unstake */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Unstake NCRD</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={unstakeAmount}
            onChange={(e) => setUnstakeAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            disabled={isLoading}
          />
          <button
            onClick={handleUnstake}
            disabled={isLoading || !unstakeAmount}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Unstaking...' : 'Unstake'}
          </button>
        </div>
      </div>

      {/* Transaction Hash */}
      {txHash && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900 rounded">
          <p className="text-sm text-green-800 dark:text-green-200">
            Transaction: <a href={`${process.env.NEXT_PUBLIC_EXPLORER_TX_URL_PREFIX || 'https://testnet.qie.digital/tx'}/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...{txHash.slice(-8)}</a>
          </p>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <h3 className="font-semibold mb-2">Tier Benefits:</h3>
        <ul className="text-sm space-y-1">
          <li>• Bronze (500+ NCRD): +50 score boost</li>
          <li>• Silver (2,000+ NCRD): +150 score boost</li>
          <li>• Gold (10,000+ NCRD): +300 score boost</li>
        </ul>
      </div>
    </div>
  );
}

