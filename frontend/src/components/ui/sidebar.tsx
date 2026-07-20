import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, Settings, LogOut, Activity, FileText } from 'lucide-react';

export type ViewType = 'dashboard' | 'profile' | 'settings' | 'analysis_history' | 'recommendations_history' | 'reports';

interface SidebarProps {
    activeView: ViewType;
    onViewChange: (view: ViewType) => void;
    onLogout: () => void;
    userName?: string;
    isLockedToProfile?: boolean;
    token?: string;
}

export const Sidebar = ({ activeView, onViewChange, onLogout, userName, isLockedToProfile, token }: SidebarProps) => {
    const [latestRisk, setLatestRisk] = useState<{score: number, category: string} | null>(null);

    useEffect(() => {
        if (!token) return;
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0 && data[0].risk_data && data[0].risk_data.overall_health_score !== undefined) {
                        setLatestRisk({
                            score: data[0].risk_data.overall_health_score,
                            category: data[0].risk_data.risk_category || 'Unknown'
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch history for sidebar", err);
            }
        };
        fetchHistory();
    }, [token]);
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analysis_history', label: 'Analysis History', icon: Activity },
        { id: 'recommendations_history', label: 'Recommendations', icon: FileText },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    return (
        <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 flex-shrink-0">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">MoveIQ</span>
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    const isDisabled = isLockedToProfile && item.id !== 'profile';

                    return (
                        <button
                            key={item.id}
                            disabled={isDisabled}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                isActive 
                                    ? 'bg-slate-800/80 text-white shadow-sm' 
                                    : isDisabled
                                        ? 'text-slate-600 cursor-not-allowed opacity-50'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                            }`}
                        >
                            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : isDisabled ? 'text-slate-600' : 'group-hover:text-cyan-400/70'}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                            
                            {isDisabled && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-rose-500/50"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Logout & User Area */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group mb-4"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
                
                {userName && (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-200 line-clamp-1">{userName}</span>
                            <span className="text-xs text-slate-500 mb-1">Athlete</span>
                            
                            {latestRisk && (
                                <div className="mt-1">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border bg-slate-900 shadow-sm text-[10px] font-bold uppercase tracking-wider ${
                                        latestRisk.category === 'High Risk' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                                        latestRisk.category === 'Moderate Risk' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                        'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                                    }`}>
                                        <Activity className="w-3 h-3" />
                                        <span>Health Score: {Math.round(latestRisk.score)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
