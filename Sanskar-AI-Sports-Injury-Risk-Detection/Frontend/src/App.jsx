import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import RiskAnalysis from './pages/RiskAnalysis';
import Athletes from './pages/Athletes';
import Diagnostics from './pages/Diagnostics';
import AnalysisHistory from './pages/AnalysisHistory';
import AnalysisDetails from './pages/AnalysisDetails';

// Simple Route Guard to protect athletic risk dashboard routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center text-slate-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></span>
          <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Loading Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Secured Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/risk-analysis"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <RiskAnalysis />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/athletes"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Athletes />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/diagnostics"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Diagnostics />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/analysis-history" element={<ProtectedRoute><DashboardLayout><AnalysisHistory /></DashboardLayout></ProtectedRoute>} />
          <Route path="/analysis-history/:id" element={<ProtectedRoute><DashboardLayout><AnalysisDetails /></DashboardLayout></ProtectedRoute>} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
