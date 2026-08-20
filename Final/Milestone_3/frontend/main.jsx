import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AthleteIntelligence from './pages/AthleteIntelligence';
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
            Milestone 3 Intelligence
          </h2>
        </div>

        <div className="space-y-3 pt-2">
          <button 
            onClick={() => navigate('/milestone3/intelligence/6a804f77a9818c34c76e4ff3')}
            className="w-full py-2.5 bg-hud-blue hover:bg-hud-blue/85 text-white rounded font-bold cursor-pointer text-xs uppercase tracking-wider transition-all"
          >
            Run Active Session (Aug 15)
          </button>
          <button 
            onClick={() => navigate('/milestone3/intelligence/6a620027d25fb16dbb54d4ee')}
            className="w-full py-2.5 bg-hud-dark/50 border border-hud-border hover:border-hud-blue text-white rounded font-bold cursor-pointer text-xs uppercase tracking-wider transition-all"
          >
            View Session (Jul 23 - A)
          </button>
          <button 
            onClick={() => navigate('/milestone3/intelligence/6a61eb368b27743ced2b52f0')}
            className="w-full py-2.5 bg-hud-dark/50 border border-hud-border hover:border-hud-blue text-white rounded font-bold cursor-pointer text-xs uppercase tracking-wider transition-all"
          >
            View Session (Jul 23 - B)
          </button>
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
        <Route path="/milestone3/intelligence/:sessionId" element={<AthleteIntelligence />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
