import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from '../components/LogoutModal';
import ThemeToggle from '../components/ThemeToggle';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutRequest = () => setShowLogoutModal(true);
  const handleLogoutCancel  = () => setShowLogoutModal(false);
  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Injury Risk Analysis', path: '/risk-analysis' },
    { name: 'Athletes & Profiles', path: '/athletes' },
    { name: 'Analysis History', path: '/analysis-history' },
    { name: 'System Diagnostics', path: '/diagnostics' },
  ];

  return (
    <div className="flex h-screen bg-brand-50 text-slate-600 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-brand-300 flex flex-col justify-between p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-brand-500/20">
              K
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-700 leading-none">
                KineGuard <span className="text-brand-600 font-extrabold text-sm uppercase tracking-wider block">AI</span>
              </h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-500 text-white font-medium shadow-lg shadow-brand-500/20'
                      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-brand-200 pt-4 mt-auto">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center font-medium text-brand-700 border border-brand-200">
                  {user.name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-700">{user.name}</h4>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogoutRequest}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium border border-transparent hover:border-red-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center w-full py-2.5 rounded-xl bg-white text-brand-600 font-semibold border border-brand-500 hover:bg-brand-50 transition-all text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 border-b border-brand-700 flex items-center justify-between px-8 bg-gradient-to-r from-brand-500 to-brand-600 sticky top-0 z-10 shadow-md shadow-brand-900/15">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-white font-medium tracking-wide uppercase">AI Engines Online</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/90">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <ThemeToggle />
          </div>
        </header>

        <main className="p-8 max-w-6xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>

      {/* Logout confirmation modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onCancel={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default DashboardLayout;
