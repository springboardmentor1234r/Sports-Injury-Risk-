import React, { useState } from 'react';
import { ShieldCheck, Cpu, Database, Server, Users, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Marcus Rashford', email: 'athlete@sportsmed.io', role: 'Athlete', status: 'Active' },
    { id: 2, name: 'Coach Jurgen', email: 'coach@sportsmed.io', role: 'Coach', status: 'Active' },
    { id: 3, name: 'Dr. Sarah Jenkins', email: 'physio@sportsmed.io', role: 'Physiotherapist', status: 'Active' },
    { id: 4, name: 'Dr. Aris Thorne', email: 'scientist@sportsmed.io', role: 'Sports Scientist', status: 'Active' },
    { id: 5, name: 'System Administrator', email: 'admin@sportsmed.io', role: 'Administrator', status: 'Active' },
  ]);

  const handleRoleToggle = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-rose-500">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">System Administration & Health Operations</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800 rounded-full">
              Super Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Role-Based Access Control (RBAC) Management, Database Cluster Health & API Microservices
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-300 font-medium">All Microservices Healthy</span>
        </div>
      </div>

      {/* SYSTEM HEALTH MONITORING CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: PostgreSQL Relational DB */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Database className="w-4 h-4 text-cyan-400" /> PostgreSQL DB
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Online
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">124 Tables</p>
          <p className="text-[10px] text-slate-500">Latency: 1.2ms • Auth & Profiles Pool</p>
        </div>

        {/* Card 2: MongoDB Unstructured DB */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Server className="w-4 h-4 text-emerald-400" /> MongoDB Cluster
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Healthy
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">1,840 Logs</p>
          <p className="text-[10px] text-slate-500">Video & Movement Keypoint Store</p>
        </div>

        {/* Card 3: Redis Queue */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4 text-purple-400" /> Redis Task Queue
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Active
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">0 Backlog</p>
          <p className="text-[10px] text-slate-500">Video Inference Pipeline Ready</p>
        </div>

        {/* Card 4: API Throughput */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Activity className="w-4 h-4 text-rose-400" /> API Throughput
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              99.9% Uptime
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">280 req/s</p>
          <p className="text-[10px] text-slate-500">FastAPI Async Worker Threads</p>
        </div>

      </div>

      {/* USER MANAGEMENT & RBAC TOGGLES TABLE */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">User Identity & RBAC Role Management</h3>
            <p className="text-xs text-slate-400">Modify user role permissions dynamically across the platform</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            RBAC Enforcement: ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Current RBAC Role</th>
                <th className="py-3 px-4">Instant Role Toggle</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3.5 px-4 font-semibold text-cyan-400">{u.role}</td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleToggle(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-xs text-slate-100 rounded-lg px-2.5 py-1 outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Athlete">Athlete</option>
                      <option value="Coach">Coach</option>
                      <option value="Physiotherapist">Physiotherapist</option>
                      <option value="Sports Scientist">Sports Scientist</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                      {u.status}
                    </span>
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
