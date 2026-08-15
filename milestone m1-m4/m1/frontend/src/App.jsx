import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// Main App component wrapper containing navigation links and layout
const AppContent = () => {
  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginRegister />} />
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
