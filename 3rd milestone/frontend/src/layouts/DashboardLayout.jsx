import React from 'react';
import { Outlet } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, Video, FileText, Settings, Bell } from 'lucide-react';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-2">
          <Activity className="text-indigo-500 w-8 h-8" />
          <span className="text-white font-bold text-xl">SportRisk AI</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-white bg-indigo-600/10 text-indigo-400 rounded-lg">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="/athletes" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Users className="w-5 h-5" /> Athletes
          </a>
          <a href="/videos" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Video className="w-5 h-5" /> Videos
          </a>
          <a href="/reports" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <FileText className="w-5 h-5" /> Reports
          </a>
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <a href="/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shrink-0">
          <div className="text-white font-medium">Overview</div>
          <div className="flex items-center gap-4">
            <a href="/notifications" className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            </a>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
              JD
            </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
