import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock statistics data for stunning visual presentation
  const stats = [
    { name: 'Active Athletes', value: '28', change: '+4 this month', color: 'border-l-4 border-brand-500' },
    { name: 'Videos Uploaded', value: '142', change: '12 pending AI run', color: 'border-l-4 border-emerald-500' },
    { name: 'High Risk Detected', value: '3', change: 'Immediate review required', color: 'border-l-4 border-rose-500' },
    { name: 'Processing Latency', value: '1.4s', change: 'GPU cluster online', color: 'border-l-4 border-amber-500' },
  ];

  const recentAnalyses = [
    { id: 'AN-892', athlete: 'Sarah Connor', sport: 'Track & Field', risk: 'High', joint: 'Left Knee Valgus', date: 'Just now' },
    { id: 'AN-891', athlete: 'Marcus Wright', sport: 'Basketball', risk: 'Low', joint: 'Ankle Dorsiflexion', date: '2 hours ago' },
    { id: 'AN-890', athlete: 'John Connor', sport: 'Soccer', risk: 'Medium', joint: 'Hip Extension asymmetry', date: 'Yesterday' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 to-slate-900 p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-brand-500/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Hello, <span className="text-brand-300">{user?.name || 'Coach'}</span>
          </h2>
          <p className="text-slate-300 max-w-xl text-sm leading-relaxed">
            Welcome to KineGuard AI. Upload high-frame-rate training videos to analyze joint angles, posture, and identify potential injury risks before they occur.
          </p>
          <div className="pt-2 flex gap-3">
            <button className="px-5 py-2.5 rounded-xl bg-brand-650 hover:bg-brand-600 text-white font-semibold text-xs shadow-md transition-all">
              Upload Action Video
            </button>
            <button className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-750">
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`glass-card p-6 rounded-2xl ${stat.color} shadow-sm`}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.name}</p>
            <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{stat.value}</h3>
            <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table of analyses */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Analyses</h3>
              <p className="text-xs text-slate-400">Latest completed video processing queue items</p>
            </div>
            <button className="text-brand-400 hover:text-brand-300 text-xs font-semibold">View all</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-850">
                <tr>
                  <th className="pb-3 font-semibold">Athlete</th>
                  <th className="pb-3 font-semibold">Risk Level</th>
                  <th className="pb-3 font-semibold">Key Finding</th>
                  <th className="pb-3 font-semibold">Processed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {recentAnalyses.map((item, idx) => (
                  <tr key={idx} className="group hover:bg-slate-900/40 transition-colors">
                    <td className="py-4">
                      <div className="font-semibold text-slate-200">{item.athlete}</div>
                      <div className="text-xs text-slate-400">{item.sport}</div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.risk === 'High' 
                          ? 'bg-rose-950/30 border-rose-900/50 text-rose-400' 
                          : item.risk === 'Medium' 
                          ? 'bg-amber-950/30 border-amber-900/50 text-amber-400' 
                          : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                      }`}>
                        {item.risk} Risk
                      </span>
                    </td>
                    <td className="py-4 text-slate-300">{item.joint}</td>
                    <td className="py-4 text-slate-400 text-xs">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engine Telemetry & Pipeline */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-900 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">System Diagnostics</h3>
            <p className="text-xs text-slate-400">Server status and database integrations</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Express API Service</h4>
                  <p className="text-[10px] text-slate-400">Proxied via port 3000</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400">ONLINE</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">MongoDB Datastore</h4>
                  <p className="text-[10px] text-slate-400">Connecting from config</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400">PENDING</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-slate-650"></span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Computer Vision Module</h4>
                  <p className="text-[10px] text-slate-400">OpenCV/PyTorch wrappers</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">STANDBY</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-900/20">
              <h4 className="text-xs font-semibold text-brand-300 uppercase tracking-wider">Developer Notice</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The folder structure has been prepared with scalable React context, hooks, layout files, and Express backend routing. Run the projects side-by-side to begin building out the ML pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
