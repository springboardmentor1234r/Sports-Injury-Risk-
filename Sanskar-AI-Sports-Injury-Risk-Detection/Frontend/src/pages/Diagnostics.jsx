import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';

const Diagnostics = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/health');
      setHealthData(response.data);
    } catch (err) {
      setError(err.message || 'Could not reach server API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white font-sans">System Diagnostics</h2>
        <p className="text-sm text-slate-400">Verifying Vite dev server, Axios endpoints, and Express backend routing.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-300">API Health Status</h3>
            <p className="text-xs text-slate-500">Fetches live status from `/api/health` via Axios</p>
          </div>
          <button 
            onClick={fetchHealth}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs rounded-xl font-semibold transition-all text-slate-305 text-slate-300"
          >
            Refresh Status
          </button>
        </div>

        {loading && (
          <div className="text-slate-400 text-sm animate-pulse">Querying backend API...</div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 space-y-2">
            <p className="text-red-400 text-sm font-medium">Connection Error</p>
            <p className="text-xs text-slate-400">
              The Vite proxy is configured to route `/api` requests to `http://localhost:5000`. Ensure that you have run `npm install` and launched the backend server on port 5000.
            </p>
            <pre className="text-xs text-red-300 p-2.5 bg-slate-950 rounded-lg overflow-x-auto border border-red-950">{error}</pre>
          </div>
        )}

        {healthData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-emerald-400 font-bold text-sm">HEALTHY & CONNECTED</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Status Message</span>
                <span className="text-sm text-slate-200 mt-1 font-medium block">{healthData.message}</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850">
                <span className="text-[10px] uppercase font-bold text-slate-550 block">Server Uptime</span>
                <span className="text-sm text-slate-200 mt-1 font-medium block">{Math.floor(healthData.uptime)} seconds</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-850 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-550 block">Server Timestamp</span>
                <span className="text-sm text-slate-200 mt-1 font-medium block">{healthData.timestamp}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Diagnostics;
