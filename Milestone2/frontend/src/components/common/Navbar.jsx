import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Activity, Shield, LogOut, User, Cpu, Sparkles } from 'lucide-react';

export const Navbar = ({ onOpenAuth }) => {
  const { user, switchRole, logout } = useAuth();

  const roles = [
    "Athlete",
    "Coach",
    "Physiotherapist",
    "Sports Scientist",
    "Administrator"
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-black stroke-[2.5]" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                ATHLETIQ <span className="text-cyan-400 font-light">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Sports Injury Risk Detection Platform from Video
            </p>
          </div>
        </div>

        {/* Right Header Navigation & Role Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Active User Role Badge */}
          {user && (
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 font-medium hidden md:inline">Authenticated Role:</span>
              <span className="text-cyan-300 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/80">
                {user.role}
              </span>
            </div>
          )}

          {/* User Account Controls */}
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.full_name || user.email}</span>
                <span className="text-[10px] text-cyan-400 font-medium">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20"
            >
              Sign In / Register
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
