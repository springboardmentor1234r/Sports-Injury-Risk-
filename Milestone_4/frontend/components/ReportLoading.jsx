import React from 'react';
import { RefreshCw } from 'lucide-react';

const ReportLoading = ({ message = "Compiling Athlete Intelligence Datasets..." }) => {
  return (
    <div className="min-h-screen bg-hud-black flex items-center justify-center p-6 text-white font-sans">
      <div className="hud-glass-panel p-8 max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center">
          <RefreshCw className="w-8 h-8 text-hud-blue animate-spin" />
        </div>
        
        <div className="space-y-1.5">
          <h4 className="text-sm font-hud-mono font-bold tracking-widest text-white uppercase">
            Loading...
          </h4>
          <p className="text-xs text-gray-500">{message}</p>
        </div>

        {/* Loading progress bars */}
        <div className="w-full bg-hud-dark h-1.5 rounded-full overflow-hidden border border-hud-border">
          <div className="bg-hud-blue h-full w-2/3 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default ReportLoading;
