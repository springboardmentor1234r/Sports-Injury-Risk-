import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const LoginRegister = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('athlete');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Simple client-side password strength checker
  const checkPasswordStrength = (pw) => {
    if (!pw) return { level: 'None', color: 'transparent' };
    if (pw.length < 6) return { level: 'Too Short', color: 'var(--color-danger)', desc: 'Must contain at least 6 characters.' };
    if (pw.length < 8) return { level: 'Moderate', color: 'var(--color-warning)', desc: 'Good password.' };
    return { level: 'Strong', color: 'var(--color-success)', desc: 'Valid password configuration.' };
  };

  const strength = checkPasswordStrength(isLoginTab ? '' : password);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (isForgotPassword) {
        // Forgot password request
        const res = await authAPI.forgotPassword(email);
        setSuccessMsg(res.data.message);
        
        // If debug token exists in mock response, display in UI for developer testing
        if (res.data.debug_token) {
          setSuccessMsg(prev => prev + ` [DEBUG: Reset Token is ${res.data.debug_token}]`);
        }
        
        setEmail('');
      } else if (isLoginTab) {
        // Normal login flow
        await login(email, password);
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
        } else {
          localStorage.removeItem('remember_me');
        }
        navigate('/');
      } else {
        // Registration flow
        await register({
          email,
          password,
          full_name: fullName,
          role,
        });
        setSuccessMsg('Account registered successfully! You can now sign in.');
        setTimeout(() => {
          setIsLoginTab(true);
          setPassword('');
          setErrorMsg('');
          setSuccessMsg('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      let detail = err.response?.data?.detail || 'Authentication failed. Please verify credentials.';
      if (Array.isArray(detail)) {
        detail = detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ');
      } else if (typeof detail !== 'string') {
        detail = JSON.stringify(detail);
      }
      setErrorMsg(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          ATHLETE PERFORMANCE HUB
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2.0rem' }}>
          Biomechanical Injury & Training Management System
        </p>

        {/* Tab Selector (Hidden during Forgot Password flow) */}
        {!isForgotPassword ? (
          <div className="auth-switch">
            <button
              type="button"
              className={`auth-switch-btn ${isLoginTab ? 'active' : ''}`}
              onClick={() => {
                setIsLoginTab(true);
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-switch-btn ${!isLoginTab ? 'active' : ''}`}
              onClick={() => {
                setIsLoginTab(false);
                setErrorMsg('');
              }}
            >
              Register
            </button>
          </div>
        ) : (
          <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--color-primary)', textAlign: 'center', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>
            Account Password Recovery
          </h3>
        )}

        {/* Feedback Alerts */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(255, 75, 75, 0.1)',
            border: '1px solid rgba(255, 75, 75, 0.2)',
            color: 'var(--color-danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: 'rgba(14, 219, 137, 0.1)',
            border: '1px solid rgba(14, 219, 137, 0.2)',
            color: 'var(--color-success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Registration Extra Field */}
          {!isLoginTab && !isForgotPassword && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLoginTab}
              />
            </div>
          )}

          {/* Email input (used in all states) */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="athlete@performance.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input (Login and Register only) */}
          {!isForgotPassword && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
              {/* Password strength visualizer during registration */}
              {!isLoginTab && password && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                    <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.level}</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: strength.level === 'Weak' ? '30%' : strength.level === 'Moderate' ? '65%' : '100%', 
                      background: strength.color,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '0.2rem' }}>{strength.desc}</p>
                </div>
              )}
            </div>
          )}

          {/* Registration Role Dropdown */}
          {!isLoginTab && !isForgotPassword && (
            <div className="form-group">
              <label className="form-label">Organization Role</label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="athlete">Athlete / Competitor</option>
                <option value="coach">Head Coach</option>
                <option value="physiotherapist">Physiotherapist</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>
          )}

          {/* Session remember-me & Recovery Links during Login */}
          {isLoginTab && !isForgotPassword && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                Remember Me
              </label>
              <span
                onClick={() => {
                  setIsForgotPassword(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot Password?
              </span>
            </div>
          )}

          {/* Back link when in recovery flow */}
          {isForgotPassword && (
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{ color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Back to Sign In
              </span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: '1rem', width: '100%' }}
          >
            {submitting ? 'Processing...' : isForgotPassword ? 'Send Recovery Code' : isLoginTab ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginRegister;
