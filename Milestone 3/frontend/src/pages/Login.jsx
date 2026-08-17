import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { authAPI } from '../services/api';

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user } = res.data;
      localStorage.setItem('athletiq_token', access_token);
      localStorage.setItem('athletiq_user', JSON.stringify(user));
      setUser(user);

      // Automatic Role-Based Dashboard Redirection
      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await authAPI.login({ email: demoEmail, password: 'Password123!' });
      const { access_token, user } = res.data;
      localStorage.setItem('athletiq_token', access_token);
      localStorage.setItem('athletiq_user', JSON.stringify(user));
      setUser(user);

      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Demo login failed.');
      setLoading(false);
    }
  };

  const redirectByRole = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'athlete') navigate('/athlete/dashboard');
    else if (r === 'coach') navigate('/coach/dashboard');
    else if (r === 'physiotherapist') navigate('/physiotherapist/dashboard');
    else if (r === 'scientist') navigate('/scientist/dashboard');
    else if (r === 'admin') navigate('/admin/dashboard');
    else navigate('/athlete/dashboard');
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.loginCard}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <div style={styles.logoBadge}>
            <Activity size={32} color="#FFFFFF" />
          </div>
          <h1 style={styles.brandName}>Athletiq AI</h1>
          <p style={styles.brandSlogan}>AI-Powered Sports Injury Intelligence</p>
          <p style={styles.brandDesc}>
            Analyze athlete movement, identify biomechanical risks, and prevent injuries before they happen.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#9CA3AF" />
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@athletiq.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#9CA3AF" />
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Create Account Link */}
        <div style={styles.footerRow}>
          <span>Don't have an account?</span>
          <Link to="/register" style={{ fontWeight: '700', color: '#15803D' }}>
            Create Account
          </Link>
        </div>

        {/* 1-Click Demo Accounts */}
        <div style={styles.demoSection}>
          <div style={styles.demoTitle}>
            <ShieldCheck size={16} color="#15803D" />
            <span>Quick Demo Role Sign-In (1-Click)</span>
          </div>

          <div style={styles.demoGrid}>
            <button onClick={() => handleDemoLogin('athlete@athletiq.ai', 'athlete')} style={styles.demoBtn}>
              <UserCheck size={14} color="#15803D" />
              <span>Athlete Demo</span>
            </button>
            <button onClick={() => handleDemoLogin('coach@athletiq.ai', 'coach')} style={styles.demoBtn}>
              <UserCheck size={14} color="#15803D" />
              <span>Coach Demo</span>
            </button>
            <button onClick={() => handleDemoLogin('physio@athletiq.ai', 'physiotherapist')} style={styles.demoBtn}>
              <UserCheck size={14} color="#15803D" />
              <span>Physio Demo</span>
            </button>
            <button onClick={() => handleDemoLogin('scientist@athletiq.ai', 'scientist')} style={styles.demoBtn}>
              <UserCheck size={14} color="#15803D" />
              <span>Scientist Demo</span>
            </button>
            <button onClick={() => handleDemoLogin('admin@athletiq.ai', 'admin')} style={styles.demoBtnFull}>
              <UserCheck size={14} color="#15803D" />
              <span>Administrator Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAF9',
    padding: '2rem 1rem',
  },
  loginCard: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    padding: '2.5rem 2rem',
  },
  brandHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    backgroundColor: '#15803D',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.75rem',
    boxShadow: '0 6px 16px rgba(21, 128, 61, 0.3)',
  },
  brandName: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: '-0.03em',
  },
  brandSlogan: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#1F2937',
    marginTop: '0.15rem',
  },
  brandDesc: {
    fontSize: '0.8rem',
    color: '#6B7280',
    marginTop: '0.5rem',
  },
  errorAlert: {
    padding: '0.75rem 1rem',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  footerRow: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    color: '#6B7280',
    display: 'flex',
    gap: '0.35rem',
    justifyContent: 'center',
  },
  demoSection: {
    marginTop: '2rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #E5E7EB',
  },
  demoTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#15803D',
    marginBottom: '0.75rem',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.5rem',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#15803D',
    cursor: 'pointer',
  },
  demoBtnFull: {
    gridColumn: 'span 2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    padding: '0.5rem',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#15803D',
    cursor: 'pointer',
  },
};

export default Login;
