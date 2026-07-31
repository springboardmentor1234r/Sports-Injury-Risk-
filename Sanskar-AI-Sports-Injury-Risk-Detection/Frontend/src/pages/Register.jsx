import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';

const InputField = ({ id, label, type = 'text', value, onChange, placeholder, error, hint }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className={`w-full bg-slate-900/80 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
        error
          ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/40'
          : 'border-slate-800 focus:border-brand-500 focus:ring-brand-500'
      }`}
    />
    {error && (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-9.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5.5zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
        {error}
      </p>
    )}
    {hint && !error && (
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
    )}
  </div>
);

const PasswordStrengthBar = ({ password }) => {
  const getStrength = (pwd) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              strength >= step ? colors[strength] : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-semibold ${textColors[strength]}`}>
        {labels[strength]} password
      </p>
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
    }
  };

  const handleRoleChange = (value) => {
    setForm((prev) => ({ ...prev, role: value }));
    if (errors.role || errors.general) {
      setErrors((prev) => ({ ...prev, role: '', general: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      newErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!form.role) {
      newErrors.role = 'Please select a role.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post('/auth/register', {
        name: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      console.log('[Register] Registration successful:', response.data);
      setSuccess(true);
      setErrors({});
      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('[Register] Registration error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to register';
      setErrors({ general: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell font-sans">
      <section className="auth-visual">
        <div className="auth-visual__content"><span className="auth-visual__eyebrow">KineGuard Intelligence</span><h1>Move smarter.<br />Train safer.</h1><p>Transform every training clip into clear movement intelligence, personalized injury-risk predictions, and actionable recommendations.</p><svg className="auth-art" viewBox="0 0 560 310" role="img" aria-label="Digital athlete pose analysis illustration"><defs><linearGradient id="register-runner" x1="0" x2="1"><stop stopColor="#F97316" /><stop offset="1" stopColor="#EA580C" /></linearGradient><filter id="register-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><g fill="none" stroke="#F97316" opacity=".35"><path d="M35 260 120 110 210 218 305 72 412 190 530 42" /><path d="M36 70 120 142 230 55 345 132 490 82" /></g><g fill="#F97316" filter="url(#register-glow)">{[[35,260],[120,110],[210,218],[305,72],[412,190],[530,42],[36,70],[120,142],[230,55],[345,132],[490,82]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />)}</g><g stroke="url(#register-runner)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#register-glow)"><circle cx="287" cy="62" r="22" /><path d="M282 86 248 153 306 190 364 142M251 151l-72 39M307 189l-42 69M307 189l75 40" /></g><g fill="#F97316"><circle cx="287" cy="62" r="5" /><circle cx="248" cy="153" r="5" /><circle cx="306" cy="190" r="5" /><circle cx="179" cy="190" r="5" /><circle cx="364" cy="142" r="5" /><circle cx="265" cy="258" r="5" /><circle cx="382" cy="229" r="5" /></g><rect x="385" y="24" width="129" height="76" rx="13" fill="rgba(255,255,255,.74)" stroke="#FDBA74" /><text x="403" y="52" fill="#EA580C" fontSize="12" fontWeight="700">AI READOUT</text><path d="M402 77h18l10-21 12 33 10-18h40" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" /></svg></div>
      </section>
      <section className="auth-form-area"><div className="auth-form-card relative z-10">
        {/* Card */}
        <div className="bg-white border border-brand-200 p-8 rounded-2xl shadow-2xl shadow-brand-900/10">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-brand-500/30 mb-4 select-none">
              K
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-700">Create Account</h1>
            <p className="text-slate-500 mt-2 text-sm text-center leading-relaxed">
              Join KineGuard AI — your intelligent sports injury risk platform.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-3 animate-pulse-once">
              <svg className="w-5 h-5 shrink-0 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>Account created! Redirecting to login…</span>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <InputField
              id="fullName"
              label="Full Name"
              type="text"
              value={form.fullName}
              onChange={handleChange('fullName')}
              placeholder="Alex Johnson"
              error={errors.fullName}
            />

            <InputField
              id="email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              placeholder="alex@kineguard.com"
              error={errors.email}
            />

            <div>
              <InputField
                id="password"
                label="Password"
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="••••••••"
                error={errors.password}
                hint="Min. 8 characters with uppercase, number & symbol for best security."
              />
              <PasswordStrengthBar password={form.password} />
            </div>

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              placeholder="••••••••"
              error={errors.confirmPassword}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'athlete', label: 'Athlete', description: 'Training and performance tracking' },
                  { value: 'coach', label: 'Coach', description: 'Coaching and athlete oversight' },
                ].map((option) => {
                  const selected = form.role === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`relative flex cursor-pointer items-start rounded-xl border px-3 py-3 transition-all ${
                        selected
                          ? 'border-brand-500/60 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={selected}
                        onChange={() => handleRoleChange(option.value)}
                        className="sr-only"
                      />
                      <span
                        className={`mt-1 h-4 w-4 rounded-full border transition-all ${
                          selected ? 'border-brand-500 bg-brand-500' : 'border-slate-600 bg-transparent'
                        }`}
                      />
                      <span className="ml-3">
                        <span className="block text-sm font-semibold text-slate-100">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">{option.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.role && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-9.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5.5zm0 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                  </svg>
                  {errors.role}
                </p>
              )}
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="text-brand-400 hover:text-brand-300 cursor-pointer transition-colors">Terms of Service</span>
              {' '}and{' '}
              <span className="text-brand-400 hover:text-brand-300 cursor-pointer transition-colors">Privacy Policy</span>.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || success}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-1"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating Account…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003z" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Login Link */}
          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-400 font-semibold hover:text-brand-300 transition-colors underline-offset-2 hover:underline"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-xs text-slate-600">
          KineGuard AI &copy; {new Date().getFullYear()} — Sports Injury Risk Detection Platform
        </p>
      </div></section>
    </div>
  );
};

export default Register;
