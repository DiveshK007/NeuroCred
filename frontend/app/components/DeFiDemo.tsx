'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const DEMO_LENDER_ABI = [
  "function getLTV(address user) view returns (uint256)",
  "function calculateMaxBorrow(address user, uint256 collateralValue) view returns (uint256)"
];

interface DeFiDemoProps {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  score: number | null;
  riskBand: number | null;
}

export default function DeFiDemo({ address, provider, score, riskBand }: DeFiDemoProps) {
  const [collateralValue, setCollateralValue] = useState<number>(1000);
  const [maxBorrow, setMaxBorrow] = useState<number>(0);
  const [ltvBps, setLtvBps] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const lenderAddress = process.env.NEXT_PUBLIC_DEMO_LENDER_ADDRESS;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (address && lenderAddress && provider) {
      loadLTV();
    } else if (score !== null && riskBand !== null) {
      calculateFromScore();
    }
  }, [address, lenderAddress, provider, score, riskBand, collateralValue]);

  const loadLTV = async () => {
    if (!address || !lenderAddress || !provider) return;

    setIsLoading(true);
    try {
      const lenderContract = new ethers.Contract(lenderAddress, DEMO_LENDER_ABI, provider);
      const ltv = await lenderContract.getLTV(address);
      const ltvValue = Number(ltv);
      setLtvBps(ltvValue);

      // Calculate max borrow
      const collateralWei = ethers.parseEther(collateralValue.toString());
      const maxBorrowWei = await lenderContract.calculateMaxBorrow(address, collateralWei);
      setMaxBorrow(Number(ethers.formatEther(maxBorrowWei)));

      // Calculate interest rate based on LTV
      calculateInterestRate(ltvValue);
    } catch (error) {
      console.error('Error loading LTV:', error);
      // Fallback to score-based calculation
      if (score !== null && riskBand !== null) {
        calculateFromScore();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFromScore = () => {
    if (score === null || riskBand === null) return;

    // Map risk band to LTV
    const ltvMap: { [key: number]: number } = {
      1: 7000, // 70%
      2: 5000, // 50%
      3: 3000, // 30%
      0: 0
    };

    const ltv = ltvMap[riskBand] || 0;
    setLtvBps(ltv);
    setMaxBorrow((collateralValue * ltv) / 10000);
    calculateInterestRate(ltv);
  };

  const calculateInterestRate = (ltv: number) => {
    // Interest rate inversely correlated with LTV (higher LTV = lower rate for good scores)
    // Risk band 1: 5-8% APY, Risk band 2: 8-12% APY, Risk band 3: 12-18% APY
    if (riskBand === 1) {
      setInterestRate(5 + (7000 - ltv) / 1000); // 5-8%
    } else if (riskBand === 2) {
      setInterestRate(8 + (5000 - ltv) / 1000); // 8-12%
    } else if (riskBand === 3) {
      setInterestRate(12 + (3000 - ltv) / 1000); // 12-18%
    } else {
      setInterestRate(20); // Default high rate
    }
  };

  const riskBandNames: { [key: number]: string } = {
    1: 'Low Risk',
    2: 'Medium Risk',
    3: 'High Risk',
    0: 'Unknown'
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">DeFi Lending Demo</h2>

      {/* Score Display */}
      {score !== null && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
            <span className="font-bold text-lg">{score}/1000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Risk Band:</span>
            <span className={`font-semibold ${
              riskBand === 1 ? 'text-green-600' : 
              riskBand === 2 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {riskBand !== null ? riskBandNames[riskBand] : 'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Collateral Slider */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Collateral Value: ${collateralValue.toLocaleString()}
        </label>
        <input
          type="range"
          min="100"
          max="100000"
          step="100"
          value={collateralValue}
          onChange={(e) => setCollateralValue(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$100</span>
          <span>$100,000</span>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 dark:text-gray-300">Loan-to-Value (LTV):</span>
              <span className="font-bold text-lg">{ltvBps / 100}%</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Based on your credit score and risk band
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 dark:text-gray-300">Max Borrowable:</span>
              <span className="font-bold text-lg text-green-700 dark:text-green-300">
                ${maxBorrow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Maximum amount you can borrow against ${collateralValue.toLocaleString()} collateral
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 dark:text-gray-300">Interest Rate (APY):</span>
              <span className="font-bold text-lg text-purple-700 dark:text-purple-300">
                {interestRate.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Annual percentage yield based on your risk profile
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
          <li>• Higher credit scores = Higher LTV (up to 70%)</li>
          <li>• Lower risk bands = Lower interest rates</li>
          <li>• Staking NCRD can boost your score and improve terms</li>
          <li>• This is a demo - actual lending would require collateral deposit</li>
        </ul>
      </div>
    </div>
  );
}

