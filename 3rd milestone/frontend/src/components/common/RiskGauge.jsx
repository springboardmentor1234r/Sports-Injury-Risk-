import React from 'react';

export default function RiskGauge({ score, size = 120 }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = (size - 20) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let color = '#10B981'; // success
  if (normalizedScore > 75) color = '#F43F5E'; // danger
  else if (normalizedScore > 40) color = '#F59E0B'; // warning

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{normalizedScore}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Risk Score</span>
      </div>
    </div>
  );
}
