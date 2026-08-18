import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, loginSuccess } from '../store/slices/authSlice';
import { authService } from '../services/authService';
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
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </NavLink>
          <NavLink
            to="/athletes"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Users className="w-5 h-5" /> Athletes
          </NavLink>
          <NavLink
            to="/videos"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Video className="w-5 h-5" /> Videos
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <FileText className="w-5 h-5" /> Reports
          </NavLink>
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Settings className="w-5 h-5" /> Settings
          </NavLink>
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

            {/* Auth buttons */}
            <AuthButtons />
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

const AuthButtons = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleLogout = () => {
    authService.logout().catch(() => {});
    localStorage.removeItem('user');
    localStorage.removeItem('savedCredentials');
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <button onClick={() => navigate('/login')} className="px-3 py-1 bg-indigo-600 text-white rounded-md">
        Login
      </button>
    );
  }

  const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : (user?.name || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">{initials}</div>
        <div className="hidden sm:block text-sm text-white">{user?.full_name || user?.name}</div>
      </div>
      <button onClick={handleLogout} className="px-3 py-1 bg-rose-500 text-white rounded-md">Logout</button>
    </div>
  );
};
