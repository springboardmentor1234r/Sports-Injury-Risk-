import React from 'react';
import { motion } from 'framer-motion';

const RiskScoreDisplay = ({ score }) => {
  let color = 'text-emerald-500';
  let bgColor = 'bg-emerald-500';
  let label = 'Low Risk';

  if (score > 30) {
    color = 'text-amber-500';
    bgColor = 'bg-amber-500';
    label = 'Medium Risk';
  }
  if (score > 70) {
    color = 'text-rose-500';
    bgColor = 'bg-rose-500';
    label = 'High Risk';
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col items-center justify-center">
      <h3 className="text-xl font-bold text-white mb-6">Overall Injury Risk</h3>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            className="text-slate-700 stroke-current"
            strokeWidth="12"
            fill="none"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            className={`${color} stroke-current`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 88}
            initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - score / 100) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-5xl font-bold ${color}`}>{score}</span>
          <span className="text-gray-400 text-sm mt-1">/ 100</span>
        </div>
      </div>
      <div className={`mt-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 ${color} font-medium`}>
        {label}
      </div>
    </div>
  );
};

export default RiskScoreDisplay;
