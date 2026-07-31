import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyResetOtp } from '../services/passwordResetService';

const VerifyOtp = () => {
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const response = await verifyResetOtp(email, otp);
      setMessage(response.message || 'OTP verified successfully!');
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell font-sans">
      <section className="auth-visual">
        <div className="auth-visual__content">
          <span className="auth-visual__eyebrow">KineGuard Intelligence</span>
          <h1>AI Sports Injury<br />Risk Detection System</h1>
          <p>Real-time Pose Detection, Movement Analysis, Risk Prediction, Exercise Recommendation using Artificial Intelligence.</p>
          <svg className="auth-art" viewBox="0 0 560 310" role="img" aria-label="AI athlete motion analysis illustration">
            <defs>
              <linearGradient id="runner" x1="0" x2="1">
                <stop stopColor="#F97316" />
                <stop offset="1" stopColor="#EA580C" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g fill="none" stroke="#F97316" opacity=".35">
              <path d="M30 230 128 140 210 210 310 92 430 180 530 52" />
              <path d="M50 75 145 120 250 45 355 115 480 68" />
            </g>
            <g fill="#F97316" filter="url(#glow)">
              {[[30,230],[128,140],[210,210],[310,92],[430,180],[530,52],[50,75],[145,120],[250,45],[355,115],[480,68]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />)}
            </g>
            <g stroke="url(#runner)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
              <circle cx="285" cy="62" r="22" />
              <path d="M280 86 251 151 309 188 360 140M255 150l-75 34M309 188l-38 72M307 188l73 45" />
            </g>
            <g fill="#F97316">
              <circle cx="285" cy="62" r="5" /><circle cx="251" cy="151" r="5" /><circle cx="309" cy="188" r="5" /><circle cx="180" cy="184" r="5" /><circle cx="360" cy="140" r="5" /><circle cx="271" cy="260" r="5" /><circle cx="380" cy="233" r="5" />
            </g>
            <rect x="374" y="30" width="135" height="72" rx="13" fill="rgba(255,255,255,.74)" stroke="#FDBA74" />
            <path d="M394 76h17l10-22 13 34 10-19h38" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
            <text x="393" y="53" fill="#EA580C" fontSize="12" fontWeight="700">MOTION ANALYSIS</text>
          </svg>
        </div>
      </section>
      <section className="auth-form-area">
        <div className="auth-form-card glass-panel p-8 rounded-[20px] shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-brand-500/20 mb-4">
              K
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-700">Verify OTP</h2>
            <p className="text-slate-500 mt-2 text-sm text-center">
              We sent a 6-digit verification code to <span className="font-semibold text-brand-600">{email}</span>.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all text-center tracking-widest text-lg font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {submitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 flex flex-col gap-2">
            <div>
              Didn't receive code?{' '}
              <Link
                to={`/forgot-password?email=${encodeURIComponent(email)}`}
                className="text-brand-400 font-semibold hover:text-brand-300 transition-colors underline-offset-2 hover:underline"
              >
                Resend Code
              </Link>
            </div>
            <div>
              <Link
                to="/login"
                className="text-slate-400 font-medium hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VerifyOtp;
