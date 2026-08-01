import React from 'react';

const MovementComparison = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-4">Movement Comparison</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center">
          <div className="w-full aspect-video bg-slate-800 rounded-lg mb-2 flex items-center justify-center border border-slate-700">
            <span className="text-gray-500">Baseline Video</span>
          </div>
          <span className="text-sm text-gray-400">Previous (2 months ago)</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-full aspect-video bg-slate-800 rounded-lg mb-2 flex items-center justify-center border border-indigo-500/50">
            <span className="text-gray-500">Current Video</span>
          </div>
          <span className="text-sm text-indigo-400">Current Analysis</span>
        </div>
      </div>
    </div>
  );
};

export default MovementComparison;
