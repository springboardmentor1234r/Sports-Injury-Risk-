import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Cpu, Database, Server, Users, Activity, CheckCircle, AlertTriangle, RefreshCw, Check } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export const AdminDashboard = () => {
  const { authFetch } = useAuth();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [statusNotice, setStatusNotice] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (e) {
      console.error('Error fetching admin users list:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const res = await authFetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setStatusNotice(`Updated role for user ID ${userId} to '${newRole}'`);
        setTimeout(() => setStatusNotice(''), 3500);
      }
    } catch (e) {
      console.error('Role update error:', e);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-rose-500 shadow-xl">
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
          <span className="text-slate-300 font-medium">RBAC Security Engine Healthy</span>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {statusNotice}
          </span>
        </div>
      )}

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
          <p className="text-xl font-extrabold text-white">{users.length} Registered Users</p>
          <p className="text-[10px] text-slate-500">Live PostgreSQL Table Sync</p>
        </div>

        {/* Card 2: MongoDB Cluster */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Server className="w-4 h-4 text-emerald-400" /> MongoDB Store
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Healthy
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">Videos & Kinematics</p>
          <p className="text-[10px] text-slate-500">Document Metadata Collections</p>
        </div>

        {/* Card 3: RBAC Engine */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> RBAC Security
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Enforced
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">5 Active Roles</p>
          <p className="text-[10px] text-slate-500">JWT Token Verification Active</p>
        </div>

        {/* Card 4: API Throughput */}
        <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
              <Activity className="w-4 h-4 text-rose-400" /> API Status
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              99.9% Uptime
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">FastAPI Async</p>
          <p className="text-[10px] text-slate-500">JWT Bearer Protected</p>
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
            RBAC Enforcement: STRICT ACTIVE
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400" />
            <p className="text-xs font-medium">Loading user identity table from PostgreSQL database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs italic bg-slate-950/60 rounded-xl border border-slate-800">
            No registered users found in system database.
          </div>
        ) : (
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
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          disabled={updatingUserId === u.id}
                          onChange={(e) => handleRoleToggle(u.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-xs text-slate-100 rounded-lg px-2.5 py-1 outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="Athlete">Athlete</option>
                          <option value="Coach">Coach</option>
                          <option value="Physiotherapist">Physiotherapist</option>
                          <option value="Sports Scientist">Sports Scientist</option>
                          <option value="Administrator">Administrator</option>
                        </select>
                        {updatingUserId === u.id && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
