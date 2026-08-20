import React, { useState } from 'react';
import { ShieldAlert, Users, Flame, Activity, Filter, Bell, AlertTriangle, ArrowUpRight } from 'lucide-react';

export const CoachDashboard = () => {
  const [filterSport, setFilterSport] = useState('All');

  const roster = [
    { id: 1, name: 'Marcus Rashford', position: 'Forward', riskScore: 24, load: 1.18, status: 'Low Risk', alert: None => null },
    { id: 2, name: 'Erling Haaland', position: 'Striker', riskScore: 78, load: 1.62, status: 'High Risk', alert: 'ACWR Spike > 1.5 (Overload)' },
    { id: 3, name: 'Kevin De Bruyne', position: 'Midfielder', riskScore: 62, load: 1.48, status: 'Moderate Risk', alert: 'Right Hamstring Fatigue' },
    { id: 4, name: 'Bukayo Saka', position: 'Winger', riskScore: 18, load: 1.05, status: 'Low Risk', alert: null },
    { id: 5, name: 'Virgil van Dijk', position: 'Defender', riskScore: 35, load: 1.22, status: 'Low Risk', alert: null },
    { id: 6, name: 'Jude Bellingham', position: 'Midfielder', riskScore: 71, load: 1.59, status: 'High Risk', alert: 'Knee Valgus Asymmetry (14.2°)' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-emerald-400">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Coach Command Dashboard</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
              Soccer Squad (24 Athletes)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ACWR Fatigue Alerts, Team Injury Risk Matrix & Squad Readiness Overview
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
            High Risk Alerts: <span className="font-bold text-rose-400">2 Athletes</span>
          </div>
          <div className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
            Squad ACWR Avg: <span className="font-bold text-emerald-400">1.21 (Optimal)</span>
          </div>
        </div>
      </div>

      {/* TRAINING LOAD WARNING ALERTS CONTAINER */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-900/40 bg-rose-950/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Critical Training Load & Injury Warnings</h3>
          </div>
          <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
            Immediate Action Required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-rose-900/60 rounded-xl flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-rose-950 text-rose-400 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-100">Erling Haaland</h4>
                <span className="text-xs font-bold text-rose-400">Score: 78/100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Acute:Chronic Workload Ratio = 1.62 (Spike threshold &gt; 1.50)</p>
              <div className="mt-2 text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded inline-block">
                Recommendation: Reduce match minutes by 35% in upcoming fixture.
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950 border border-amber-900/60 rounded-xl flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-100">Jude Bellingham</h4>
                <span className="text-xs font-bold text-amber-400">Score: 71/100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Biomechanical Knee Valgus asymmetry detected during cutting drills.</p>
              <div className="mt-2 text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded inline-block">
                Recommendation: Referred to Physiotherapist for joint alignment review.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEAM INJURY RISK MATRIX & ROSTER TABLE */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Team Injury Risk Matrix</h3>
            <p className="text-xs text-slate-400">Live roster biomechanical evaluation scores</p>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="All">All Squad Positions</option>
              <option value="Forwards">Forwards / Attackers</option>
              <option value="Midfielders">Midfielders</option>
              <option value="Defenders">Defenders</option>
            </select>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Athlete Name</th>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">ACWR Load</th>
                <th className="py-3 px-4">Injury Risk Score</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Active Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roster.map((player) => (
                <tr key={player.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                      {player.name.charAt(0)}
                    </div>
                    {player.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{player.position}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">{player.load}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">{player.riskScore} / 100</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      player.status === 'High Risk'
                        ? 'bg-rose-950 text-rose-400 border-rose-800'
                        : player.status === 'Moderate Risk'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {player.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400">
                    {player.alert ? (
                      <span className="text-rose-400 font-medium">{player.alert}</span>
                    ) : (
                      <span className="text-slate-600">Nominal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
