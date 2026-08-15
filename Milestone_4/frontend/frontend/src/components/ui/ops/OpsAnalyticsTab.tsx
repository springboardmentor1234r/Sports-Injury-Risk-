'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Activity, Video } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface OpsAnalyticsTabProps {
  token: string;
}

const ROLE_PALETTE: Record<string, string> = {
  athlete: '#6366f1',
  coach: '#a855f7',
  admin: '#f59e0b',
};

export const OpsAnalyticsTab: React.FC<OpsAnalyticsTabProps> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ops/analytics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  if (!data) return <div className="text-center py-20 text-slate-400 font-semibold">Analytics data unavailable.</div>;

  const pieData = Object.entries(data.roles_breakdown || {}).map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts', value: data.total_users, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active Accounts', value: data.active_users, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Coaches', value: data.roles_breakdown?.coach || 0, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Total Sessions', value: data.total_sessions, icon: Video, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${color}`}>{value?.toLocaleString() ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Daily Registrations (Last 30 Days)</h3>
          </div>
          {data.daily_registrations?.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.daily_registrations} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Registrations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No registration data in the last 30 days.</div>
          )}
        </div>

        {/* Role Breakdown Pie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-slate-800 text-sm">Role Distribution</h3>
          </div>
          {pieData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_PALETTE[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No role data available.</div>
          )}
        </div>

        {/* Video Session Status Pie */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Video className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-sm">Video Processing Status</h3>
          </div>
          {data.session_breakdown && Object.keys(data.session_breakdown).length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={Object.entries(data.session_breakdown).map(([name, value]) => ({ name, value: Number(value) }))} 
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" 
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                  >
                    {Object.entries(data.session_breakdown).map((entry, index) => {
                      const statusColors: Record<string, string> = {
                        completed: '#10b981',
                        failed: '#ef4444',
                        pending: '#f59e0b',
                        'Processing Biomechanics': '#3b82f6'
                      };
                      return <Cell key={`cell-${index}`} fill={statusColors[entry[0]] || '#94a3b8'} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No session data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Temporary inline — avoids unused import warning
const UserCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11l2 2 4-4" /></svg>
);
