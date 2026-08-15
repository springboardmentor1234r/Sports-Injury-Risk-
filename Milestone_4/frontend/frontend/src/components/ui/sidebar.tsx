import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, Settings, LogOut, Activity, FileText, Bell, Users, UserPlus, UploadCloud, FolderOpen, Inbox, Menu, BrainCircuit } from 'lucide-react';

export type ViewType = 
    | 'dashboard' 
    | 'profile' 
    | 'settings' 
    | 'analysis_history' 
    | 'recommendations_history' 
    | 'reports'
    | 'notifications'
    | 'my_athletes'
    | 'add_athlete'
    | 'upload_video'
    | 'teams';

interface SidebarProps {
    activeView: ViewType;
    onViewChange: (view: ViewType) => void;
    onLogout: () => void;
    userName?: string;
    profilePictureUrl?: string | null;
    isLockedToProfile?: boolean;
    token?: string;
    activeDashboard?: 'athlete' | 'coach';
    onSwitchDashboard?: (role: 'athlete' | 'coach') => void;
    userRoles?: string[];
    latestRisk?: { score: number; category: string } | null;
}

export const Sidebar = ({ 
    activeView, 
    onViewChange, 
    onLogout, 
    userName, 
    profilePictureUrl, 
    isLockedToProfile,
    token,
    activeDashboard = 'athlete',
    onSwitchDashboard,
    userRoles,
    latestRisk = null
}: SidebarProps) => {
    
    const [isCollapsed, setIsCollapsed] = useState(false);

    const athleteNavItems: { id: ViewType; label: string; icon: any }[] = [
        { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'analysis_history' as ViewType, label: 'Analysis History', icon: Activity },
        ...(latestRisk ? [
            { id: 'recommendations_history' as ViewType, label: 'Recommendations', icon: BrainCircuit },
            { id: 'reports' as ViewType, label: 'Reports', icon: FileText }
        ] : []),
        { id: 'profile' as ViewType, label: 'Profile', icon: User },
        { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
    ];

    const coachNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_athletes', label: 'My Athletes', icon: Users },
        { id: 'teams', label: 'Teams', icon: FolderOpen },
        { id: 'notifications', label: 'Requests', icon: Inbox },
        { id: 'add_athlete', label: 'Add Athlete', icon: UserPlus },
        { id: 'upload_video', label: 'Upload Video', icon: UploadCloud },
        { id: 'settings', label: 'Settings', icon: Settings },
    ] as const;

    const navItems = activeDashboard === 'coach' ? coachNavItems : athleteNavItems;

    return (
        <div className={`h-full bg-white border-r border-[#c3c6d8] flex flex-col transition-all duration-300 shrink-0 justify-between select-none ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div>
                {/* Logo Area */}
                <div className={`p-6 border-b border-[#c3c6d8] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {!isCollapsed && (
                        <img 
                            src="/logo.png" 
                            alt="MoveIQ Logo" 
                            className="h-8 w-auto object-contain drop-shadow-sm" 
                        />
                    )}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="py-4">
                    <ul className="flex flex-col gap-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            const isDisabled = isLockedToProfile && item.id !== 'profile';

                            return (
                                <li key={item.id}>
                                    <button
                                        disabled={isDisabled}
                                        onClick={() => onViewChange(item.id)}
                                        title={isCollapsed ? item.label : undefined}
                                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                                            isActive 
                                                ? 'text-[#004ccd] font-bold border-r-4 border-[#004ccd] bg-[#dbe1ff] scale-[0.99]' 
                                                : isDisabled
                                                    ? 'text-slate-300 cursor-not-allowed opacity-50'
                                                    : 'text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8]'
                                        }`}
                                    >
                                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                                            <Icon className={`w-5 h-5 ${isActive ? 'text-[#004ccd]' : 'text-[#737687]'}`} />
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </div>
                                        {!isCollapsed && item.id === 'notifications' && latestRisk && latestRisk.score > 0 && (
                                            <span className="bg-[#0f62fe] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                !
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Logout & User Area */}
            <div className={`p-3 border-t border-[#c3c6d8] bg-slate-50 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                {userRoles && userRoles.includes('athlete') && userRoles.includes('coach') && (
                    <button
                        onClick={() => onSwitchDashboard?.(activeDashboard === 'coach' ? 'athlete' : 'coach')}
                        title={`Switch to ${activeDashboard === 'coach' ? 'Athlete' : 'Coach'} View`}
                        className={`w-full flex items-center justify-center gap-2 mb-2 font-bold text-blue-600 border border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm ${isCollapsed ? 'p-2 text-lg' : 'px-4 py-2 text-xs'}`}
                    >
                        {isCollapsed ? (activeDashboard === 'coach' ? 'A' : 'C') : `Switch to ${activeDashboard === 'coach' ? 'Athlete View' : 'Coach View'}`}
                    </button>
                )}

                <button
                    onClick={onLogout}
                    title="Logout"
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-4 py-3'} rounded-lg text-sm font-medium text-[#424656] hover:text-red-600 hover:bg-red-50 transition-all duration-150 group mb-2`}
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>

                {activeDashboard === 'athlete' && userName && (
                    <div className={`flex items-center ${isCollapsed ? 'justify-center p-1' : 'gap-3 px-2 py-2'} border-t border-[#c3c6d8]/50 mt-2`}>
                        {profilePictureUrl ? (
                            <img 
                                src={profilePictureUrl} 
                                alt="Profile Avatar" 
                                referrerPolicy="no-referrer"
                                title={isCollapsed ? userName : undefined}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm flex-shrink-0"
                            />
                        ) : (
                            <div title={isCollapsed ? userName : undefined} className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {!isCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-[#191c1f] line-clamp-1">{userName}</span>
                                <span className="text-xs text-[#737687] font-medium">Athlete</span>
                                
                                {latestRisk && (
                                    <div className="mt-1">
                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider ${
                                            latestRisk.category === 'High Risk' ? 'text-red-600 border-red-200 bg-red-50' :
                                            latestRisk.category === 'Moderate Risk' ? 'text-amber-600 border-amber-200 bg-amber-50' :
                                            'text-emerald-600 border-emerald-200 bg-emerald-50'
                                        }`}>
                                            <Activity className="w-2.5 h-2.5" />
                                            <span>Health: {Math.round(latestRisk.score)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
