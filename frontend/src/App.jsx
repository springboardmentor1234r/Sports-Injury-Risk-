import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import AthleteDashboard from './pages/AthleteDashboard';
import CoachDashboard from './pages/CoachDashboard';
import PhysiotherapistDashboard from './pages/PhysiotherapistDashboard';
import SportsScientistDashboard from './pages/SportsScientistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InjuryRiskAnalysis from './pages/InjuryRiskAnalysis';
import AthleteProfiles from './pages/AthleteProfiles';
import AnalysisHistory from './pages/AnalysisHistory';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('athletiq_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="state-box" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="spinner" />
        <p>Initializing Athletiq AI Intelligence Platform...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register setUser={setUser} />} />

        {/* Protected Application Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute user={user}>
              <div className="app-container">
                <Sidebar user={user} />
                <div className="main-content">
                  <Topbar user={user} />
                  <Routes>
                    {/* Role Dashboards */}
                    <Route
                      path="/athlete/dashboard"
                      element={
                        <RoleBasedRoute allowedRoles={['athlete']} user={user}>
                          <AthleteDashboard user={user} />
                        </RoleBasedRoute>
                      }
                    />
                    <Route
                      path="/coach/dashboard"
                      element={
                        <RoleBasedRoute allowedRoles={['coach']} user={user}>
                          <CoachDashboard user={user} />
                        </RoleBasedRoute>
                      }
                    />
                    <Route
                      path="/physiotherapist/dashboard"
                      element={
                        <RoleBasedRoute allowedRoles={['physiotherapist']} user={user}>
                          <PhysiotherapistDashboard user={user} />
                        </RoleBasedRoute>
                      }
                    />
                    <Route
                      path="/scientist/dashboard"
                      element={
                        <RoleBasedRoute allowedRoles={['scientist']} user={user}>
                          <SportsScientistDashboard user={user} />
                        </RoleBasedRoute>
                      }
                    />
                    <Route
                      path="/admin/dashboard"
                      element={
                        <RoleBasedRoute allowedRoles={['admin']} user={user}>
                          <AdminDashboard user={user} />
                        </RoleBasedRoute>
                      }
                    />

                    {/* Shared Platform Features */}
                    <Route path="/analysis" element={<InjuryRiskAnalysis user={user} />} />
                    <Route path="/athletes" element={<AthleteProfiles user={user} />} />
                    <Route path="/history" element={<AnalysisHistory user={user} />} />
                    <Route path="/recommendations" element={<Recommendations user={user} />} />
                    <Route path="/reports" element={<Reports user={user} />} />
                    <Route path="/notifications" element={<Notifications user={user} />} />
                    <Route path="/profile" element={<Profile user={user} />} />
                    <Route path="/settings" element={<Settings user={user} />} />

                    {/* Default Catch-all */}
                    <Route
                      path="*"
                      element={
                        <Navigate
                          to={
                            user?.role === 'coach'
                              ? '/coach/dashboard'
                              : user?.role === 'physiotherapist'
                              ? '/physiotherapist/dashboard'
                              : user?.role === 'scientist'
                              ? '/scientist/dashboard'
                              : user?.role === 'admin'
                              ? '/admin/dashboard'
                              : '/athlete/dashboard'
                          }
                          replace
                        />
                      }
                    />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
