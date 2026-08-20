import React from 'react';
import { Activity } from 'lucide-react';

const IntelligenceLoading = () => {
  return (
    <div className="min-h-[500px] flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Futuristic spinner rings */}
        <div className="w-16 h-16 rounded-full border-2 border-t-hud-blue border-r-transparent border-b-transparent border-l-transparent animate-spin absolute" />
        <div className="w-12 h-12 rounded-full border-2 border-b-hud-green border-r-transparent border-t-transparent border-l-transparent animate-spin-reverse absolute" />
        <Activity className="w-6 h-6 text-hud-blue animate-pulse" />
      </div>
      <div className="space-y-1">
        <span className="text-xs font-hud-mono tracking-widest text-hud-blue uppercase block animate-pulse">
          BOOTING ATHLETE INTELLIGENCE...
        </span>
        <span className="text-[10px] text-gray-500 block">
          Loading biomechanical files, anomalies logs, and training models.
        </span>
      </div>
    </div>
  );
};

export default IntelligenceLoading;
