import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, 
  Eye, EyeOff, Check, AlertCircle, Sparkles, TrendingUp, Zap, CheckCircle 
} from 'lucide-react';
import { authAPI } from '../services/api';

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Email Regex Validation
  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  useEffect(() => {
    // Check if user is already authenticated -> redirect to their role dashboard
    const storedUser = localStorage.getItem('athletiq_user');
    const token = localStorage.getItem('athletiq_token');
    if (storedUser && token) {
      try {
        const u = JSON.parse(storedUser);
        if (u && u.role) {
          redirectByRole(u.role);
        }
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (!emailTouched) setEmailTouched(true);
    setIsEmailValid(validateEmail(val));
    if (errorMsg) setErrorMsg('');
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user } = res.data;

      localStorage.setItem('athletiq_token', access_token);
      localStorage.setItem('athletiq_user', JSON.stringify(user));
      setUser(user);

      setSuccessMsg(`Welcome back, ${user.full_name || 'User'}! Redirecting to dashboard...`);

      setTimeout(() => {
        redirectByRole(user.role);
      }, 900);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setEmailTouched(true);
    setIsEmailValid(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.login({ email: demoEmail, password: 'Password123!' });
      const { access_token, user } = res.data;

      localStorage.setItem('athletiq_token', access_token);
      localStorage.setItem('athletiq_user', JSON.stringify(user));
      setUser(user);

      setSuccessMsg(`Logging in as ${demoRole.toUpperCase()} demo...`);
      setTimeout(() => {
        redirectByRole(user.role);
      }, 700);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Demo sign-in failed. Please verify backend is running.');
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* ================= LEFT SIDE: BRANDING & INTERACTIVE VISUAL AREA ================= */}
      <div className="login-left-brand">
        {/* Background glowing particle circles */}
        <div style={styles.bgGlow1} className="anim-pulse-glow" />
        <div style={styles.bgGlow2} className="anim-pulse-glow" />

        {/* Top Brand Header */}
        <div style={{ zIndex: 2 }}>
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>
              <Activity size={32} color="#15803D" />
            </div>
            <div>
              <h1 style={styles.brandTitle}>ATHLETIQ AI</h1>
              <span style={styles.brandTagline}>AI-Powered Sports Injury Risk Intelligence</span>
            </div>
          </div>

          <h2 style={styles.headline}>
            Predict Smarter.<br />
            Train Safer.<br />
            <span style={{ color: '#86EFAC' }}>Perform Better.</span>
          </h2>
          <p style={styles.subHeadline}>
            Empowering athletes, coaches, and sports medical teams with real-time pose estimation,
            biomechanical joint analytics, dynamic anomaly detection, and automated injury prevention insights.
          </p>
        </div>

        {/* Interactive Floating AI Visual Section */}
        <div style={styles.interactiveArea}>
          <div style={styles.floatingGrid}>
            <div style={styles.floatCard1} className="anim-float-slow">
              <Activity size={20} color="#22C55E" />
              <div>
                <strong style={styles.floatCardTitle}>AI Risk Analysis</strong>
                <span style={styles.floatCardSub}>33 Keypoint Tracking</span>
              </div>
            </div>

            <div style={styles.floatCard2} className="anim-float-reverse">
              <Zap size={20} color="#86EFAC" />
              <div>
                <strong style={styles.floatCardTitle}>Movement Tracking</strong>
                <span style={styles.floatCardSub}>Joint Angle Detection</span>
              </div>
            </div>

            <div style={styles.floatCard3} className="anim-float-slow">
              <Sparkles size={20} color="#FACC15" />
              <div>
                <strong style={styles.floatCardTitle}>Smart Recommendations</strong>
                <span style={styles.floatCardSub}>Automated Corrective Plans</span>
              </div>
            </div>

            <div style={styles.floatCard4} className="anim-float-reverse">
              <TrendingUp size={20} color="#6EE7B7" />
              <div>
                <strong style={styles.floatCardTitle}>Real-Time Insights</strong>
                <span style={styles.floatCardSub}>Live Injury Risk Scoring</span>
              </div>
            </div>
          </div>

          {/* Interactive AI Insight Demo Panel */}
          <div style={styles.insightPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={styles.livePulseDot} className="anim-pulse-dot" />
                <span style={{ fontSize: '0.85rem', fontWeight: '700', letterSpacing: '0.03em', textTransform: 'uppercase', color: '#86EFAC' }}>
                  Today's AI Insight
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                Live Biomechanics
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Athlete Risk Status</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFFFFF' }}>
                  Ready to Train <CheckCircle size={16} color="#86EFAC" style={{ inlineSize: 'auto', display: 'inline', marginLeft: '4px' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Injury Risk Score</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#86EFAC' }}>
                  18 <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>/ 100</span>
                </div>
              </div>
            </div>

            {/* Animated mini-progress bar */}
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.85 }}>
              <span>Risk Level: LOW (18%)</span>
              <span>Biomechanical Efficiency: 92%</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ zIndex: 2, fontSize: '0.78rem', opacity: 0.75 }}>
          © 2026 Athletiq AI Inc. All rights reserved. • Next-Gen Sports Health AI
        </div>
      </div>

      {/* ================= RIGHT SIDE: PREMIUM LOGIN CARD ================= */}
      <div className="login-right-form">
        <div style={styles.loginCard} className="anim-fade-in">
          {/* Card Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.6rem' }}>👋</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1F2937', letterSpacing: '-0.02em' }}>
                Welcome Back
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#6B7280' }}>
              Sign in to continue your Athletiq AI journey.
            </p>
          </div>

          {/* Animated Error Alert */}
          {errorMsg && (
            <div style={styles.errorBanner} className="anim-fade-in">
              <AlertCircle size={18} color="#B91C1C" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Animated Success Alert */}
          {successMsg && (
            <div style={styles.successBanner} className="anim-fade-in">
              <CheckCircle size={18} color="#15803D" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="email-input">
                Email Address
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} color="#9CA3AF" style={styles.inputIcon} />
                <input
                  id="email-input"
                  type="email"
                  required
                  autoFocus
                  className="form-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: emailTouched && isEmailValid ? '2.5rem' : '1rem',
                    borderColor: emailTouched ? (isEmailValid ? '#22C55E' : '#EF4444') : '#E5E7EB',
                  }}
                />
                {emailTouched && isEmailValid && (
                  <Check size={18} color="#22C55E" style={styles.validCheckIcon} />
                )}
              </div>
              {emailTouched && !isEmailValid && email.length > 0 && (
                <span style={styles.fieldError}>Please enter a valid email format (e.g. user@domain.com)</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="password-input">
                Password
              </label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" style={styles.inputIcon} />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.6rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={styles.metaRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#15803D', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Remember me</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link sent to your registered email if account exists.');
                }}
                style={styles.forgotLink}
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', margin: 0, borderTopColor: '#FFFFFF' }} />
                  <span>Signing you in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Athletiq AI</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div style={styles.registerPrompt}>
            <span style={{ color: '#6B7280' }}>New to Athletiq AI?</span>
            <Link to="/register" style={styles.registerBtnLink}>
              Create an Account
            </Link>
          </div>

          {/* 1-Click Demo Accounts Section */}
          <div style={styles.demoBox}>
            <div style={styles.demoTitleRow}>
              <ShieldCheck size={16} color="#15803D" />
              <span>Try a Demo Account (1-Click Sign In)</span>
            </div>

            <div style={styles.demoGrid}>
              <button
                type="button"
                onClick={() => handleDemoLogin('athlete@athletiq.ai', 'athlete')}
                style={styles.demoBtn}
              >
                <UserCheck size={14} color="#15803D" />
                <span>Athlete Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('coach@athletiq.ai', 'coach')}
                style={styles.demoBtn}
              >
                <UserCheck size={14} color="#15803D" />
                <span>Coach Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('physio@athletiq.ai', 'physiotherapist')}
                style={styles.demoBtn}
              >
                <UserCheck size={14} color="#15803D" />
                <span>Physio Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@athletiq.ai', 'admin')}
                style={styles.demoBtn}
              >
                <UserCheck size={14} color="#15803D" />
                <span>Admin Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  bgGlow1: {
    position: 'absolute',
    top: '-80px',
    left: '-80px',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(0,0,0,0) 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-100px',
    right: '-100px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(134, 239, 172, 0.2) 0%, rgba(0,0,0,0) 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    marginBottom: '1.75rem',
  },
  logoBadge: {
    width: '52px',
    height: '52px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  },
  brandTitle: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  brandTagline: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#86EFAC',
    letterSpacing: '0.02em',
  },
  headline: {
    fontSize: '2.4rem',
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 1.2,
    marginBottom: '1rem',
    letterSpacing: '-0.03em',
  },
  subHeadline: {
    fontSize: '0.92rem',
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 1.6,
    maxWidth: '520px',
  },
  interactiveArea: {
    margin: '2rem 0',
    zIndex: 2,
  },
  floatingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.85rem',
    marginBottom: '1.25rem',
  },
  floatCard1: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  floatCard2: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  floatCard3: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  floatCard4: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    padding: '0.85rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  floatCardTitle: {
    display: 'block',
    fontSize: '0.85rem',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatCardSub: {
    fontSize: '0.72rem',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  insightPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    borderRadius: '14px',
    padding: '1.15rem 1.25rem',
  },
  livePulseDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#22C55E',
    borderRadius: '50%',
    boxShadow: '0 0 8px #22C55E',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '18%',
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: '3px',
    boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
  },
  loginCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.07)',
    padding: '2.5rem 2.25rem',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.85rem 1rem',
    backgroundColor: '#FEE2E2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '1.25rem',
  },
  successBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.85rem 1rem',
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    color: '#166534',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '1.25rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '0.85rem',
    pointerEvents: 'none',
  },
  validCheckIcon: {
    position: 'absolute',
    right: '0.85rem',
    pointerEvents: 'none',
  },
  fieldError: {
    fontSize: '0.75rem',
    color: '#EF4444',
    marginTop: '0.35rem',
    display: 'block',
    fontWeight: '500',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.2rem',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    marginBottom: '1.25rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    color: '#4B5563',
    cursor: 'pointer',
    userSelect: 'none',
  },
  forgotLink: {
    color: '#15803D',
    fontWeight: '600',
  },
  submitBtn: {
    width: '100%',
    padding: '0.9rem',
    fontSize: '0.95rem',
    borderRadius: '10px',
    boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
  },
  registerPrompt: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.875rem',
    display: 'flex',
    gap: '0.4rem',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnLink: {
    fontWeight: '700',
    color: '#15803D',
    cursor: 'pointer',
  },
  demoBox: {
    marginTop: '1.75rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #E5E7EB',
  },
  demoTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#15803D',
    marginBottom: '0.85rem',
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.6rem',
  },
  demoBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.6rem 0.5rem',
    backgroundColor: '#F0FDF4',
    border: '1px solid #DCFCE7',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#15803D',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};

export default Login;
