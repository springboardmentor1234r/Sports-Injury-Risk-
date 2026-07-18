import React, { useState, useEffect } from 'react';
import { Loader2, Activity, Calendar, ExternalLink, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalysisHistoryProps {
    token: string;
    onOpenSession: (sessionId: string) => void;
}

export const AnalysisHistory = ({ token, onOpenSession }: AnalysisHistoryProps) => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/sessions/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch history');
                const data = await res.json();
                setSessions(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [token]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <p className="text-rose-400">{error}</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-xl max-w-2xl mx-auto w-full mt-12">
                <Activity className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Analysis History</h2>
                <p className="text-slate-400">Upload and analyze a video on the Dashboard to see your history here.</p>
            </div>
        );
    }

    const getTrendData = () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        // Filter last 7 days and sort newest to oldest
        const recent = sessions
            .filter(s => new Date(s.created_at) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
        // Group by day, keeping only the first (latest) session per day
        const dailyMap = new Map();
        for (const s of recent) {
            const dateStr = new Date(s.created_at).toLocaleDateString(undefined, { weekday: 'short' });
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, {
                    date: dateStr,
                    score: s.risk_data?.overall_health_score || 0
                });
            }
        }
        
        // Convert back to array and reverse to chronological order (oldest to newest)
        return Array.from(dailyMap.values()).reverse();
    };

    return (
        <div className="max-w-6xl mx-auto w-full space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-cyan-400" />
                    Analysis History
                </h1>
                <p className="text-slate-400">View past biomechanical analyses and risk scores.</p>
            </div>

            {sessions.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-xl font-bold text-white">7-Day Health Score Trend</h2>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getTrendData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                                />
                                <Line type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <div key={session.session_id} className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors rounded-2xl p-6 backdrop-blur-xl flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-white text-lg line-clamp-1">{session.video_name || "Unknown Video"}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(session.created_at).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                session.risk_data?.risk_category === 'Low Risk' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                session.risk_data?.risk_category === 'Moderate Risk' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                                {session.risk_data?.risk_category || "Unknown"}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 mt-2">
                            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">Health Score</p>
                                <p className="text-xl font-bold text-white">{session.risk_data?.overall_health_score || 0}/100</p>
                            </div>
                            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">Efficiency</p>
                                <p className="text-xl font-bold text-white">{session.risk_data?.biomechanical_efficiency_score || 0}/100</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-800">
                            <button
                                onClick={() => onOpenSession(session.session_id)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
                            >
                                <ExternalLink className="w-4 h-4" /> Open in Dashboard
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
