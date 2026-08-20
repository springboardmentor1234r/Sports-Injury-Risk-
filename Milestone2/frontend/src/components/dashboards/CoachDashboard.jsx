import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert, Users, Flame, Activity, Filter, RefreshCw, UserPlus, Trash2, CheckCircle2, AlertTriangle, Search, X
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export const CoachDashboard = () => {
  const { authFetch } = useAuth();

  const [roster, setRoster] = useState([]);
  const [filterPosition, setFilterPosition] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Enroll modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableAthletes, setAvailableAthletes] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchRoster = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/coach/roster`);
      if (res.ok) {
        const data = await res.json();
        setRoster(data || []);
      }
    } catch (err) {
      console.error('Error fetching coach roster:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAthletes = async () => {
    setEnrollLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/coach/available-athletes`);
      if (res.ok) {
        const data = await res.json();
        setAvailableAthletes(data || []);
      }
    } catch (err) {
      console.error('Error fetching available athletes:', err);
    } finally {
      setEnrollLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const handleOpenEnrollModal = () => {
    setShowEnrollModal(true);
    fetchAvailableAthletes();
  };

  const handleEnrollAthlete = async (athleteId) => {
    try {
      const res = await authFetch(`${API_BASE}/coach/enroll/${athleteId}`, { method: 'POST' });
      if (res.ok) {
        setActionNotice(`Athlete ID ${athleteId} successfully enrolled.`);
        fetchRoster();
        fetchAvailableAthletes();
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Enroll error:', err);
    }
  };

  const handleUnenrollAthlete = async (athleteId) => {
    try {
      const res = await authFetch(`${API_BASE}/coach/enroll/${athleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setActionNotice(`Athlete ID ${athleteId} removed from roster.`);
        fetchRoster();
        fetchAvailableAthletes();
        setTimeout(() => setActionNotice(''), 3000);
      }
    } catch (err) {
      console.error('Unenroll error:', err);
    }
  };

  // Dynamic Metrics derived from real roster
  const highRiskCount = roster.filter(p => p.status === 'High Risk').length;
  const avgACWR = roster.length > 0
    ? (roster.reduce((acc, curr) => acc + (curr.load || 0), 0) / roster.length).toFixed(2)
    : '0.00';

  const filteredRoster = roster.filter(player => {
    if (filterPosition === 'All') return true;
    return player.position?.toLowerCase().includes(filterPosition.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-emerald-400 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">Coach Command Dashboard</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
              Live Squad ({roster.length} Enrolled)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ACWR Fatigue Alerts, Team Injury Risk Matrix & Squad Readiness Overview
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
            High Risk Alerts: <span className="font-bold text-rose-400">{highRiskCount} Athletes</span>
          </div>
          <div className="px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
            Squad ACWR Avg: <span className="font-bold text-emerald-400">{avgACWR}</span>
          </div>
          <button
            onClick={handleOpenEnrollModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Athlete</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TRAINING LOAD WARNING ALERTS CONTAINER */}
      {roster.some(p => p.alert) && (
        <div className="glass-panel p-6 rounded-2xl border border-rose-900/40 bg-rose-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Critical Training Load & Injury Warnings</h3>
            </div>
            <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
              Action Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roster.filter(p => p.alert).map(player => (
              <div key={player.id} className="p-4 bg-slate-950 border border-rose-900/60 rounded-xl flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-rose-950 text-rose-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-100">{player.name}</h4>
                    <span className="text-xs font-bold text-rose-400">Score: {player.riskScore}/100</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">ACWR Load = {player.load}</p>
                  <div className="mt-2 text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded inline-block">
                    Alert: {player.alert}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="All">All Squad Positions</option>
              <option value="Forward">Forwards / Attackers</option>
              <option value="Midfielder">Midfielders</option>
              <option value="Defender">Defenders</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p className="text-xs font-medium">Fetching real team roster from database...</p>
          </div>
        ) : filteredRoster.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-4 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">No athletes currently enrolled in your roster</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Invite or assign registered athletes to begin tracking workload, fatigue, and biomechanical injury risk.
              </p>
            </div>
            <button
              onClick={handleOpenEnrollModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll First Athlete</span>
            </button>
          </div>
        ) : (
          /* Roster Table */
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
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRoster.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div>{player.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{player.email}</div>
                      </div>
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
                    <td className="py-3.5 px-4 text-[11px]">
                      {player.alert ? (
                        <span className="text-rose-400 font-medium">{player.alert}</span>
                      ) : (
                        <span className="text-slate-600">Nominal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleUnenrollAthlete(player.id)}
                        title="Unenroll Athlete"
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ENROLL ATHLETE MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Enroll Athlete to Coach Roster</span>
              </h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {enrollLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Fetching registered athletes...</span>
              </div>
            ) : availableAthletes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400 italic">
                No registered athletes found in system. Register a user as an Athlete first.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {availableAthletes.map(ath => (
                  <div key={ath.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-100">{ath.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{ath.email} • {ath.sport_type}</span>
                    </div>
                    {ath.is_enrolled ? (
                      <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnrollAthlete(ath.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
