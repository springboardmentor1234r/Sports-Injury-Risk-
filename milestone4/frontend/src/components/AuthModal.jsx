import React, { useState } from 'react';
import { Mail, Lock, User, ShieldAlert, ArrowRight, X } from 'lucide-react';
import './AuthModal.css';

const ROLES = [
  { value: 'Athlete', label: 'Athlete' },
  { value: 'Coach', label: 'Coach / Trainer' },
  { value: 'Physiotherapist', label: 'Physiotherapist' },
  { value: 'Sports Scientist', label: 'Sports Scientist' },
  { value: 'Administrator', label: 'Administrator' }
];

const DEMO_ACCOUNTS = {
  Athlete: [
    { email: 'marcus.rashford@sird.com', label: 'Marcus Rashford (Soccer)' },
    { email: 'serena.williams@sird.com', label: 'Serena Williams (Tennis)' },
    { email: 'erling.haaland@sird.com', label: 'Erling Haaland (Soccer)' },
    { email: 'simone.biles@sird.com', label: 'Simone Biles (Gymnastics)' },
    { email: 'michael.phelps@sird.com', label: 'Michael Phelps (Swimming)' },
    { email: 'lebron.james@sird.com', label: 'LeBron James (Basketball)' },
    { email: 'katie.ledecky@sird.com', label: 'Katie Ledecky (Swimming)' },
    { email: 'novak.djokovic@sird.com', label: 'Novak Djokovic (Tennis)' },
    { email: 'yulimar.rojas@sird.com', label: 'Yulimar Rojas (Track & Field)' },
    { email: 'kylian.mbappe@sird.com', label: 'Kylian Mbappé (Soccer)' },
    { email: 'naomi.osaka@sird.com', label: 'Naomi Osaka (Tennis)' },
    { email: 'giannis.antetokounmpo@sird.com', label: 'Giannis Antetokounmpo (Basketball)' }
  ],
  Coach: [
    { email: 'coach.alex@sird.com', label: 'Alex Ferguson (Coach)' },
    { email: 'coach.pep@sird.com', label: 'Pep Guardiola (Coach)' },
    { email: 'coach.jurgen@sird.com', label: 'Jurgen Klopp (Coach)' },
    { email: 'coach.carlo@sird.com', label: 'Carlo Ancelotti (Coach)' },
    { email: 'coach.jose@sird.com', label: 'Jose Mourinho (Coach)' },
  ],
  Physiotherapist: [
    { email: 'physio.john@sird.com', label: 'John Carter (Physio)' },
    { email: 'physio.sarah@sird.com', label: 'Sarah Connor (Physio)' },
    { email: 'physio.emma@sird.com', label: 'Emma Watson (Physio)' },
    { email: 'physio.robert@sird.com', label: 'Robert Bruce (Physio)' },
    { email: 'physio.alice@sird.com', label: 'Alice Vance (Physio)' },
  ],
  'Sports Scientist': [
    { email: 'scientist.newton@sird.com', label: 'Newton Galileo (Scientist)' },
    { email: 'scientist.marie@sird.com', label: 'Marie Curie (Scientist)' },
  ],
  Administrator: [
    { email: 'admin.steve@sird.com', label: 'Steve Rogers (Admin)' }
  ]
};

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signin' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select your profile role first.');
      return;
    }

    setLoading(true);
    const endpoint = activeTab === 'signup' ? '/api/auth/register' : '/api/auth/login';
    const payload = activeTab === 'signup' 
      ? { email, password, fullname, role }
      : { email, password };

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed. Please try again.');
      }

      if (activeTab === 'signup') {
        // Automatically sign in after signup
        const loginResponse = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginResponse.json();
        if (!loginResponse.ok) throw new Error(loginData.detail);
        onAuthSuccess(loginData);
      } else {
        onAuthSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!role) {
      setError('Please select a role before signing in with Google.');
      return;
    }
    // Redirect to backend Google login route, sending the role as a query parameter
    window.location.href = `${apiBase}/api/auth/google/login?role=${role}`;
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <h2>{activeTab === 'signup' ? 'Create SIRD Account' : 'Welcome to SIRD'}</h2>
          <p>{activeTab === 'signup' ? 'Get started by setting up your profile' : 'Sign in to access your dashboard'}</p>
        </div>

        {error && (
          <div className="modal-error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Role Selection (Mandatory for both email and Google) */}
          <div className="input-group">
            <label htmlFor="role-select">Select Profile Role *</label>
            <select
              id="role-select"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError('');
              }}
              required
              className="form-select"
            >
              <option value="" disabled>-- Choose Your Role --</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {activeTab === 'signin' && DEMO_ACCOUNTS[role] && (
            <div className="input-group demo-select-group animate-fade-in">
              <label htmlFor="demo-select" style={{ color: 'var(--accent)', fontWeight: '700' }}>
                Quick Select Demo Account
              </label>
              <select
                id="demo-select"
                onChange={(e) => {
                  const selectedEmail = e.target.value;
                  if (selectedEmail) {
                    setEmail(selectedEmail);
                    setPassword('password123');
                  }
                }}
                className="form-select demo-select"
                style={{ borderColor: 'var(--accent)' }}
              >
                <option value="">-- Choose Seeded Demo User --</option>
                {DEMO_ACCOUNTS[role].map((demo) => (
                  <option key={demo.email} value={demo.email}>{demo.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="divider-text">
            <span>Authentication Method</span>
          </div>

          {activeTab === 'signup' && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : activeTab === 'signup' ? 'Register Now' : 'Sign In'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="divider-text">
          <span>Or Continue With</span>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="google-btn" 
          disabled={!role}
          title={!role ? "Please select a role first" : "Authenticate via Google"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="modal-footer">
          {activeTab === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => { setActiveTab('signin'); setError(''); }}>Sign In</button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button onClick={() => { setActiveTab('signup'); setError(''); }}>Sign Up</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
