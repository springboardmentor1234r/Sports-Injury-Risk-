import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, User, Users, HeartPulse, BarChart2, Shield, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { authAPI } from '../services/api';

const ROLES = [
  {
    id: 'athlete',
    title: 'Athlete',
    icon: User,
    desc: 'Upload movement videos, track personal injury risk, view recommendations & reports.'
  },
  {
    id: 'coach',
    title: 'Coach',
    icon: Users,
    desc: 'Monitor team injury risks, view all registered athletes, manage training recommendations.'
  },
  {
    id: 'physiotherapist',
    title: 'Physiotherapist',
    icon: HeartPulse,
    desc: 'Track athlete rehabilitation, movement corrections, injury recovery & corrective plans.'
  },
  {
    id: 'scientist',
    title: 'Sports Scientist',
    icon: BarChart2,
    desc: 'Access deep biomechanical analytics, joint angle trends, research data & anomaly insights.'
  },
  {
    id: 'admin',
    title: 'Administrator',
    icon: Shield,
    desc: 'Platform management, user controls, system activity monitoring & platform diagnostics.'
  }
];

const Register = ({ setUser }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState('athlete');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        full_name: fullName,
        email: email,
        password: password,
        confirm_password: confirmPassword,
        role: selectedRole,
        phone_number: phoneNumber
      };

      const res = await authAPI.register(payload);
      const { access_token, user } = res.data;
      
      localStorage.setItem('athletiq_token', access_token);
      localStorage.setItem('athletiq_user', JSON.stringify(user));
      setUser(user);

      // Auto Redirect to Role Dashboard
      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Registration failed. Please check inputs.');
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
      <div style={styles.registerCard}>
        {/* Brand Header */}
        <div style={styles.brandHeader}>
          <div style={styles.logoBadge}>
            <Activity size={32} color="#FFFFFF" />
          </div>
          <h1 style={styles.brandName}>Athletiq AI</h1>
          <p style={styles.brandSlogan}>Create Your Platform Account</p>
        </div>

        {errorMsg && <div style={styles.errorAlert}>{errorMsg}</div>}

        <form onSubmit={handleRegisterSubmit}>
          {/* Role Selection Grid */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Select Platform Role *</label>
            <div style={styles.roleGrid}>
              {ROLES.map((r) => {
                const IconComp = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    style={{
                      ...styles.roleCard,
                      ...(isSelected ? styles.selectedRoleCard : {}),
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <IconComp size={18} color={isSelected ? '#15803D' : '#6B7280'} />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: isSelected ? '#15803D' : '#1F2937' }}>
                        {r.title}
                      </span>
                    </div>
                    <p style={styles.roleDesc}>{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.inputGrid}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={styles.inputWrapper}>
                <User size={18} color="#9CA3AF" />
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Virat Kohli"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
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
              <label className="form-label">Password *</label>
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

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} color="#9CA3AF" />
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', marginTop: '1rem' }}
          >
            {loading ? 'Creating Account...' : 'Complete Registration & Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={styles.footerRow}>
          <span>Already have an account?</span>
          <Link to="/login" style={{ fontWeight: '700', color: '#15803D' }}>
            Sign In
          </Link>
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
  registerCard: {
    width: '100%',
    maxWidth: '620px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    padding: '2.5rem 2rem',
  },
  brandHeader: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  logoBadge: {
    width: '52px',
    height: '52px',
    backgroundColor: '#15803D',
    borderRadius: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  brandName: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#15803D',
  },
  brandSlogan: {
    fontSize: '0.85rem',
    color: '#6B7280',
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
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  roleCard: {
    padding: '0.85rem',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.15s ease',
  },
  selectedRoleCard: {
    borderColor: '#15803D',
    backgroundColor: '#F0FDF4',
    boxShadow: '0 0 0 2px rgba(21, 128, 61, 0.2)',
  },
  roleDesc: {
    fontSize: '0.75rem',
    color: '#6B7280',
    lineHeight: 1.3,
  },
  inputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
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
};

export default Register;
