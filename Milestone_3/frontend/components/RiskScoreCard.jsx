import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import RiskCategoryBadge from './RiskCategoryBadge';

const RiskScoreCard = ({ score, category }) => {
  const roundedScore = typeof score === 'number' ? Math.round(score) : 0;
  
  // Custom descriptions based on overall risk category
  const getDescription = () => {
    switch (category?.toLowerCase()) {
      case 'critical':
        return 'Critical alignment abnormalities and high loading detected. Immediate training suspension recommended until evaluated by medical staff.';
      case 'high':
        return 'Substantial biomechanical deviations detected. Training modification is advised to prevent prospective injury.';
      case 'moderate':
      case 'medium':
        return 'Moderate movement markers detected. Keep track of specific joints and perform dynamic stability warmups.';
      case 'low':
      default:
        return 'Movement patterns look stable and within standard physiological ranges. Maintain current loading progression.';
    }
  };

  const getProgressColor = () => {
    if (roundedScore >= 75) return 'bg-hud-danger';
    if (roundedScore >= 50) return 'bg-hud-warning';
    if (roundedScore >= 25) return 'bg-amber-400';
    return 'bg-hud-green';
  };

  return (
    <div className="hud-glass-panel p-6 space-y-6 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Decorative pulse border for high danger */}
      {roundedScore >= 75 && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-hud-danger animate-pulse" />
      )}
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase block">Risk Assessment</span>
          <h2 className="text-lg font-bold text-white uppercase">Overall Injury Risk</h2>
        </div>
        <div className="p-2 rounded-lg bg-hud-blue/10 border border-hud-blue/20">
          <Shield className="w-5 h-5 text-hud-blue" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-hud-border flex-shrink-0">
          <div className="text-center">
            <span className="text-3xl font-extrabold tracking-tight text-white block leading-none">
              {roundedScore}
            </span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest block mt-0.5">
              / 100
            </span>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Risk Class:</span>
            <RiskCategoryBadge category={category} />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {getDescription()}
          </p>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1.5">
        <div className="w-full bg-hud-dark h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${getProgressColor()}`}
            style={{ width: `${roundedScore}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-gray-500 font-hud-mono">
          <span>0% (LOW)</span>
          <span className="text-hud-danger font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            HIGHER VALUE = GREATER RISK
          </span>
          <span>100% (CRITICAL)</span>
        </div>
      </div>
    </div>
  );
};

export default RiskScoreCard;
