import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './components/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AthleteDashboard from './pages/AthleteDashboard';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // If auth state is still loading (e.g. validating token on refresh), show simple loader
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Hook to check for token redirect parameter in the URL (used for Google OAuth callback)
function OAuthCallbackHandler() {
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      // Decode user or fetch user info using api and then login
      import('./services/authApi').then(({ authApi }) => {
        authApi.getMe(token).then((user) => {
          login(token, user);
          navigate('/dashboard');
        }).catch(() => {
          navigate('/login');
        });
      });
    } else {
      navigate('/login');
    }
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Authenticating with Google...
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<HomePage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackHandler />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/athlete-dashboard/:athleteId"
            element={
              <ProtectedRoute>
                <AthleteDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
