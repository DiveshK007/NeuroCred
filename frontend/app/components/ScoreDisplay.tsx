'use client';

interface ScoreDisplayProps {
  score: number;
  riskBand: number;
  explanation: string;
}

export default function ScoreDisplay({ score, riskBand, explanation }: ScoreDisplayProps) {
  const getRiskColor = (band: number) => {
    switch (band) {
      case 1: return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 2: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 3: return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRiskLabel = (band: number) => {
    switch (band) {
      case 1: return 'Low Risk';
      case 2: return 'Medium Risk';
      case 3: return 'High Risk';
      default: return 'Unknown';
    }
  };

  // Calculate angle for gauge (0-180 degrees, where 0 = 0 score, 180 = 1000 score)
  const angle = (score / 1000) * 180;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        Your Credit Score
      </h2>
      
      {/* Score Gauge */}
      <div className="relative w-64 h-32 mx-auto mb-8">
        <svg className="w-full h-full" viewBox="0 0 200 100">
          {/* Background arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          {/* Score arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke={score >= 750 ? '#10b981' : score >= 500 ? '#f59e0b' : '#ef4444'}
            strokeWidth="12"
            strokeDasharray={`${(angle / 180) * 251.2} 251.2`}
            strokeLinecap="round"
            transform="rotate(180 100 100)"
          />
          {/* Score text */}
          <text
            x="100"
            y="70"
            textAnchor="middle"
            className="text-4xl font-bold fill-gray-900 dark:fill-gray-100"
          >
            {score}
          </text>
          <text
            x="100"
            y="90"
            textAnchor="middle"
            className="text-sm fill-gray-500 dark:fill-gray-400"
          >
            / 1000
          </text>
        </svg>
      </div>

      {/* Risk Band */}
      <div className="text-center mb-6">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(riskBand)}`}>
          {getRiskLabel(riskBand)}
        </span>
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">{explanation}</p>
      </div>
    </div>
  );
}

