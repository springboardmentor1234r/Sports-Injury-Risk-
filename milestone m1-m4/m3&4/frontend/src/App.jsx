import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { authAPI } from './services/api';
import LoginRegister from './pages/LoginRegister';
import Dashboard from './pages/Dashboard';
import VideoUpload from './pages/VideoUpload';
import Datasets from './pages/Datasets';

// Sub-component representing the Navigation Bar
const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span>⚡</span> ATHLETE HUB
      </div>
      
      {user && (
        <ul className="nav-links">
          <li>
            <Link to="/" className="nav-link">Dashboard</Link>
          </li>
          <li>
            <Link to="/videos" className="nav-link">Video Vault</Link>
          </li>
          <li>
            <Link to="/datasets" className="nav-link">Pose Datasets</Link>
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name}</span>
            <span className="nav-role-badge">{user.role}</span>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '30px' }}
            >
              Sign Out
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};

// Route protection component (Redirects to Login if unauthenticated)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{
          width: '35px',
          height: '35px',
          border: '3px solid var(--border-glass)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Verification landing component
const VerifyLanding = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing, verified, error
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const triggerVerify = async () => {
      const email = searchParams.get('email');
      const token = searchParams.get('token');
      if (!email || !token) {
        setStatus('error');
        setMsg('Invalid verification request links.');
        return;
      }
      try {
        await authAPI.verifyEmail(email, token);
        setStatus('verified');
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMsg(err.response?.data?.detail || 'Verification request token has expired or is invalid.');
      }
    };
    triggerVerify();
  }, [searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', textAlign: 'center' }}>
        {status === 'processing' && (
          <div>
            <div style={{ display: 'inline-block', width: '30px', height: '30px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ marginTop: '1rem' }}>Verifying Account...</h3>
          </div>
        )}
        {status === 'verified' && (
          <div>
            <div style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: '1rem' }}>✓</div>
            <h3 style={{ marginBottom: '1rem' }}>Verification Completed!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Your email profile has been activated. You can now login to your dashboard.</p>
            <button className="btn btn-primary" onClick={() => navigate('/login')} style={{ width: '100%' }}>Proceed to Sign In</button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div style={{ fontSize: '3rem', color: 'var(--color-danger)', marginBottom: '1rem' }}>⚠</div>
            <h3 style={{ marginBottom: '1rem' }}>Verification Failed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{msg}</p>
            <button className="btn btn-secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>Back to Sign In</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Password Reset Landing Component
const ResetPasswordLanding = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    // Password strength check
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg("Password must contain at least one digit, one uppercase and one lowercase letter.");
      return;
    }

    setSubmitting(true);
    const token = searchParams.get('token');
    if (!token) {
      setErrorMsg("Missing reset token from URL link.");
      setSubmitting(false);
      return;
    }

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Could not reset password. Link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Reset Password</h3>
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: '0.5rem' }}>✓</div>
            <h4 style={{ marginBottom: '0.5rem' }}>Password Updated!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Redirecting to sign in page...</p>
          </div>
        ) : (
          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--color-danger)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                {errorMsg}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 digit"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? "Updating..." : "Save Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Main App component wrapper containing navigation links and layout
const AppContent = () => {
  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/verify" element={<VerifyLanding />} />
          <Route path="/reset-password" element={<ResetPasswordLanding />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/videos" element={
            <ProtectedRoute>
              <VideoUpload />
            </ProtectedRoute>
          } />
          <Route path="/datasets" element={
            <ProtectedRoute>
              <Datasets />
            </ProtectedRoute>
          } />
          {/* Wildcard redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Athlete Performance Hub. Designed for biomechanical kinematics & recovery tracking.</p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
