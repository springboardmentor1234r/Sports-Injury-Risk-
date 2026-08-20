import React from 'react';

export const ConfidenceIndicator = ({ value }) => {
  const percent = Math.round(value * 100);
  
  const getColorClass = () => {
    if (percent >= 80) return 'text-hud-green bg-hud-green-glow/5 border-hud-green/30';
    if (percent >= 50) return 'text-hud-warning bg-hud-warning/5 border-hud-warning/30';
    return 'text-hud-danger bg-hud-danger/5 border-hud-danger/30';
  };

  return (
    <div className={`px-2.5 py-1 rounded-lg border font-hud-mono text-[10px] font-bold flex items-center gap-1.5 ${getColorClass()}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>CONFIDENCE: {percent}%</span>
    </div>
  );
};

export default ConfidenceIndicator;
