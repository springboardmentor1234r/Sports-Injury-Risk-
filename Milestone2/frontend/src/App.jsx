import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './components/auth/LoginPage';
import { RegisterModal } from './components/auth/RegisterModal';

import { AthleteDashboard } from './components/dashboards/AthleteDashboard';
import { CoachDashboard } from './components/dashboards/CoachDashboard';
import { PhysiotherapistDashboard } from './components/dashboards/PhysiotherapistDashboard';
import { SportsScientistDashboard } from './components/dashboards/SportsScientistDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';

const DashboardLayout = ({ children }) => {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Navbar onOpenAuth={() => setIsRegisterOpen(true)} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Kinematix AI • Sports Injury Risk Detection Platform • Production RBAC Enabled</p>
      </footer>
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => setIsRegisterOpen(false)}
      />
    </div>
  );
};

const RootRedirect = () => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center font-sans">
        <div className="text-slate-400 text-sm">Loading application state...</div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Athlete':
      return <Navigate to="/dashboard/athlete" replace />;
    case 'Coach':
      return <Navigate to="/dashboard/coach" replace />;
    case 'Physiotherapist':
      return <Navigate to="/dashboard/physio" replace />;
    case 'Sports Scientist':
      return <Navigate to="/dashboard/sports-scientist" replace />;
    case 'Administrator':
      return <Navigate to="/dashboard/admin" replace />;
    default:
      return <Navigate to="/dashboard/athlete" replace />;
  }
};

const AuthPage = () => {
  const { user, token } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  if (user && token) {
    return <RootRedirect />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans">
      <LoginPage onOpenRegister={() => setIsRegisterOpen(true)} />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => setIsRegisterOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<AuthPage />} />

          <Route
            path="/dashboard/athlete"
            element={
              <ProtectedRoute allowedRoles={['Athlete']}>
                <DashboardLayout>
                  <AthleteDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/coach"
            element={
              <ProtectedRoute allowedRoles={['Coach']}>
                <DashboardLayout>
                  <CoachDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/physio"
            element={
              <ProtectedRoute allowedRoles={['Physiotherapist']}>
                <DashboardLayout>
                  <PhysiotherapistDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/sports-scientist"
            element={
              <ProtectedRoute allowedRoles={['Sports Scientist']}>
                <DashboardLayout>
                  <SportsScientistDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['Administrator']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}