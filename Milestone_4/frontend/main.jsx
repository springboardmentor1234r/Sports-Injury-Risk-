import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AthleteReport from './pages/AthleteReport';
import AnalysisHistory from './pages/AnalysisHistory';
import Notifications from './pages/Notifications';
import Login from '../../frontend/src/pages/Login';
import Register from '../../frontend/src/pages/Register';
import './index.css';

const StandaloneDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-hud-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="hud-glass-panel p-8 max-w-md w-full space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-widest text-hud-blue uppercase block">
            KineticGuard Diagnostics
          </span>
          <h2 className="text-xl font-black uppercase tracking-wider text-white">
            Milestone 4 intelligence
          </h2>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="bg-hud-dark/45 border border-hud-border/40 p-4 rounded-lg space-y-2">
            <span className="font-hud-mono font-bold text-hud-green uppercase tracking-wider block text-[10px]">
              Active Athlete ID: 6a54f0942294e19a14fb8d4c
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => navigate('/milestone4/history/6a54f0942294e19a14fb8d4c')}
                className="py-2 bg-hud-blue hover:bg-hud-blue/85 text-white font-bold rounded cursor-pointer transition-all"
              >
                View History
              </button>
              <button 
                onClick={() => navigate('/milestone4/notifications/6a54f0942294e19a14fb8d4c')}
                className="py-2 bg-hud-blue hover:bg-hud-blue/85 text-white font-bold rounded cursor-pointer transition-all"
              >
                View Alerts
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold block">
              Active Evaluation Sessions
            </span>
            <button 
              onClick={() => navigate('/milestone4/report/6a804f77a9818c34c76e4ff3')}
              className="w-full py-2 bg-hud-dark/50 border border-hud-border hover:border-hud-blue text-white rounded font-bold cursor-pointer transition-all text-left px-3 flex justify-between items-center"
            >
              <span>Session: Aug 15</span>
              <span className="text-[9px] font-hud-mono text-hud-blue">6a804f77...</span>
            </button>
            <button 
              onClick={() => navigate('/milestone4/report/6a620027d25fb16dbb54d4ee')}
              className="w-full py-2 bg-hud-dark/50 border border-hud-border hover:border-hud-blue text-white rounded font-bold cursor-pointer transition-all text-left px-3 flex justify-between items-center"
            >
              <span>Session: Jul 23 - A</span>
              <span className="text-[9px] font-hud-mono text-hud-blue">6a620027...</span>
            </button>
            <button 
              onClick={() => navigate('/milestone4/report/6a61eb368b27743ced2b52f0')}
              className="w-full py-2 bg-hud-dark/50 border border-hud-border hover:border-hud-blue text-white rounded font-bold cursor-pointer transition-all text-left px-3 flex justify-between items-center"
            >
              <span>Session: Jul 23 - B</span>
              <span className="text-[9px] font-hud-mono text-hud-blue">6a61eb36...</span>
            </button>
          </div>
        </div>

        <div className="border-t border-hud-border/40 pt-4">
          <button 
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-hud-danger font-bold uppercase transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<StandaloneDashboard />} />
        <Route path="/milestone4/report/:sessionId" element={<AthleteReport />} />
        <Route path="/milestone4/history/:athleteId" element={<AnalysisHistory />} />
        <Route path="/milestone4/notifications/:athleteId" element={<Notifications />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
