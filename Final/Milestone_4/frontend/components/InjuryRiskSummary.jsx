import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

const InjuryRiskSummary = ({ risks }) => {
  if (!risks || Object.keys(risks).length === 0) return null;

  const getRiskColor = (prob) => {
    if (prob >= 75) return 'text-hud-danger';
    if (prob >= 40) return 'text-hud-warning';
    return 'text-hud-green';
  };

  return (
    <div className="hud-glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-hud-border pb-3">
        <Target className="w-4.5 h-4.5 text-hud-blue" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Joint Injury Susceptibility Analysis
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Object.entries(risks).map(([label, probability]) => (
          <div 
            key={label} 
            className="bg-hud-dark/30 border border-hud-border/40 p-4 rounded-lg flex flex-col justify-between h-24"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                {label}
              </span>
              <span className="text-[8px] text-gray-500 block">Probability Index</span>
            </div>
            
            <div className="flex justify-between items-baseline mt-2">
              <span className={`text-xl font-hud-mono font-black ${getRiskColor(probability)}`}>
                {probability.toFixed(1)}%
              </span>
              {probability >= 40 && (
                <AlertCircle className={`w-3.5 h-3.5 ${getRiskColor(probability)} animate-pulse`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InjuryRiskSummary;
