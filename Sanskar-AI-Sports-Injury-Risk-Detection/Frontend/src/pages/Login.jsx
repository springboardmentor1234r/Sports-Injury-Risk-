import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell font-sans">
      <section className="auth-visual">
        <div className="auth-visual__content"><span className="auth-visual__eyebrow">KineGuard Intelligence</span><h1>AI Sports Injury<br />Risk Detection System</h1><p>Real-time Pose Detection, Movement Analysis, Risk Prediction, Exercise Recommendation using Artificial Intelligence.</p><svg className="auth-art" viewBox="0 0 560 310" role="img" aria-label="AI athlete motion analysis illustration"><defs><linearGradient id="runner" x1="0" x2="1"><stop stopColor="#F97316" /><stop offset="1" stopColor="#EA580C" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><g fill="none" stroke="#F97316" opacity=".35"><path d="M30 230 128 140 210 210 310 92 430 180 530 52" /><path d="M50 75 145 120 250 45 355 115 480 68" /></g><g fill="#F97316" filter="url(#glow)">{[[30,230],[128,140],[210,210],[310,92],[430,180],[530,52],[50,75],[145,120],[250,45],[355,115],[480,68]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />)}</g><g stroke="url(#runner)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"><circle cx="285" cy="62" r="22" /><path d="M280 86 251 151 309 188 360 140M255 150l-75 34M309 188l-38 72M307 188l73 45" /></g><g fill="#F97316"><circle cx="285" cy="62" r="5" /><circle cx="251" cy="151" r="5" /><circle cx="309" cy="188" r="5" /><circle cx="180" cy="184" r="5" /><circle cx="360" cy="140" r="5" /><circle cx="271" cy="260" r="5" /><circle cx="380" cy="233" r="5" /></g><rect x="374" y="30" width="135" height="72" rx="13" fill="rgba(255,255,255,.74)" stroke="#FDBA74" /><path d="M394 76h17l10-22 13 34 10-19h38" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" /><text x="393" y="53" fill="#EA580C" fontSize="12" fontWeight="700">MOTION ANALYSIS</text></svg></div>
      </section>
      <section className="auth-form-area"><div className="auth-form-card glass-panel p-8 rounded-[20px] shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-brand-500/20 mb-4">
            K
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-700">Welcome back</h2>
          <p className="text-slate-500 mt-2 text-sm text-center">
            Access KineGuard AI analytics and injury risk tracking suite.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach.alex@kineguard.com"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition-all duration-200 hover:text-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
                    <path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a14.2 14.2 0 0 1-2.95 3.37" />
                    <path d="M6.61 6.61A14.2 14.2 0 0 0 2 12s3.5 7 10 7a10.9 10.9 0 0 0 4.04-.82" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-brand-400 font-semibold hover:text-brand-300 transition-colors underline-offset-2 hover:underline"
          >
            Register
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          <p>Demo: Any email & password will trigger mock authentication success.</p>
        </div>
      </div></section>
    </div>
  );
};

export default Login;
