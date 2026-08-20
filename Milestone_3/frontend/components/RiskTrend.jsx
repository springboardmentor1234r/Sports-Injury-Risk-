import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

const RiskTrend = () => {
  return (
    <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center border-b border-hud-border pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block">Historical Telemetry</span>
          <h3 className="text-sm font-bold text-white uppercase">Injury Risk Trend</h3>
        </div>
        <TrendingUp className="w-4 h-4 text-gray-500" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-gray-500 space-y-2">
        <BarChart2 className="w-10 h-10 text-gray-600 animate-pulse" />
        <span className="text-xs text-gray-400 font-semibold block uppercase">Trend telemetry inactive</span>
        <p className="text-[10px] text-gray-500 max-w-[200px] leading-relaxed">
          Risk trend requires multiple analysis sessions. Record and process more video files to chart over-time fatigue patterns.
        </p>
      </div>
    </div>
  );
};

export default RiskTrend;
