import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export const JointAngleCard = ({ title, current, min, max, threshold, isValgus = false }) => {
  const romValue = max - min;
  const isDeviating = isValgus ? current > threshold : current < threshold;

  return (
    <div className={`hud-glass-panel p-4 rounded-xl border transition-all ${
      isDeviating 
        ? 'border-hud-danger/40 bg-hud-danger/5 shadow-md shadow-hud-danger/10' 
        : 'border-hud-border hover:border-hud-blue/30 bg-hud-dark/15'
    }`}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        {isDeviating ? (
          <div className="flex items-center gap-1 text-hud-danger text-[9px] font-hud-mono font-bold animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>EXCEEDS LIMIT</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-hud-green text-[9px] font-hud-mono font-bold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>NORMAL</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-white">{current.toFixed(1)}°</span>
        <span className="text-[10px] text-gray-500 font-hud-mono">VAL</span>
      </div>

      <div className="mt-4 pt-3 border-t border-hud-border/40 grid grid-cols-3 gap-2 text-[9px] font-hud-mono text-gray-400">
        <div>
          <span className="text-gray-500 block">ROM MIN</span>
          <span className="text-white font-bold">{min.toFixed(1)}°</span>
        </div>
        <div>
          <span className="text-gray-500 block">ROM MAX</span>
          <span className="text-white font-bold">{max.toFixed(1)}°</span>
        </div>
        <div>
          <span className="text-gray-500 block">ROM AMP</span>
          <span className="text-hud-blue font-bold">{romValue.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};

export default JointAngleCard;
