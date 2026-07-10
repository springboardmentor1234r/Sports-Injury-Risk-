import React from 'react';

const RiskAnalysis = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-sans">Injury Risk Analysis</h2>
        <p className="text-sm text-slate-400">Process high-speed training footage to detect joints and evaluate movement risks.</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-900 flex flex-col items-center justify-center min-h-[350px] text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold text-white">No Analysis Active</h3>
          <p className="text-slate-400 text-sm">
            Once backend integration and video uploading is enabled, you'll be able to select and analyze athlete movement metrics.
          </p>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-all">
          Upload Video (Standby)
        </button>
      </div>
    </div>
  );
};

export default RiskAnalysis;
