'use client';
import React, { useState } from 'react';
import { Users, BarChart2, MonitorDot, FileSearch, Settings, LogOut, Shield } from 'lucide-react';
import { OpsUsersTab } from './OpsUsersTab';
import { OpsAnalyticsTab } from './OpsAnalyticsTab';
import { OpsDiagnosticsTab } from './OpsDiagnosticsTab';
import { OpsAuditTab } from './OpsAuditTab';
import { OpsAccountTab } from './OpsAccountTab';

interface OpsPortalProps {
  token: string;
  user: any;
  onLogout: () => void;
  onUserUpdate: (newUser: any) => void;
}

type Tab = 'users' | 'analytics' | 'diagnostics' | 'audit' | 'account';

const TABS: { id: Tab; label: string; icon: any; description: string }[] = [
  { id: 'users', label: 'User Management', icon: Users, description: 'Manage accounts and access control' },
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart2, description: 'Usage stats and growth metrics' },
  { id: 'diagnostics', label: 'System Diagnostics', icon: MonitorDot, description: 'Live health of all subsystems' },
  { id: 'audit', label: 'Session Audit', icon: FileSearch, description: 'Global session troubleshooting log' },
  { id: 'account', label: 'My Account', icon: Settings, description: 'Email, password, and profile settings' },
];

export const OpsPortal: React.FC<OpsPortalProps> = ({ token, user, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] flex flex-col shrink-0 shadow-xl">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm leading-tight">MoveIQ</p>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Operations Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="text-[13px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden border border-white/20">
              {user?.profile_picture_url ? (
                <img src={user.profile_picture_url} alt={user.full_name || 'Admin'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                user?.full_name?.charAt(0)?.toUpperCase() || 'A'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all text-[13px] font-semibold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{currentTab.label}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{currentTab.description}</p>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'users' && <OpsUsersTab token={token} />}
          {activeTab === 'analytics' && <OpsAnalyticsTab token={token} />}
          {activeTab === 'diagnostics' && <OpsDiagnosticsTab token={token} />}
          {activeTab === 'audit' && <OpsAuditTab token={token} />}
          {activeTab === 'account' && <OpsAccountTab token={token} user={user} onUserUpdate={onUserUpdate} />}
        </div>
      </main>
    </div>
  );
};
