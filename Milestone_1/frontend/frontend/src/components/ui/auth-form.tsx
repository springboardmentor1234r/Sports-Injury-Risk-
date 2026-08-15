import React, { useState, useEffect } from 'react';
import { Loader2, Mail, Lock, User, ArrowLeft, KeyRound, CheckCircle2, ChevronRight, Eye, EyeOff } from 'lucide-react';

const PasswordRequirements = ({ password }: { password: string }) => {
  const requirements = [
    { label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
    { label: "Maximum 64 characters", test: (p: string) => p.length > 0 && p.length <= 64 },
    { label: "At least 1 uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
    { label: "At least 1 lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
    { label: "At least 1 number (0-9)", test: (p: string) => /\d/.test(p) },
    { label: "At least 1 special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(p) },
    { label: "No leading or trailing spaces", test: (p: string) => p.length > 0 && !p.startsWith(' ') && !p.endsWith(' ') },
  ];

  return (
    <div className="mt-3 space-y-1.5 p-4 bg-[#f2f4f6] rounded-xl border border-[#c3c6d7]">
      {requirements.map((req, idx) => {
        const isValid = req.test(password);
        return (
          <div key={idx} className="flex items-center justify-between text-left">
            <span className={`text-[11px] font-medium ${isValid ? 'text-[#11801c]' : 'text-gray-500'}`}>{req.label}</span>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-colors ${isValid ? 'bg-[#c4f2c7]/30 border-[#11801c] text-[#11801c]' : 'border-gray-300 bg-transparent'}`}>
              {isValid && <CheckCircle2 className="w-2.5 h-2.5" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface AuthFormProps {
  onSuccess: (token: string, user: any) => void;
  onBack?: () => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess, onBack, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete');

  // Show/hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP phases
  const [otpSent, setOtpSent] = useState(false);

  // Check for reset_token in URL (for coach-created accounts)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('reset_token');
      const urlEmail = params.get('email');
      
      if (resetToken && urlEmail) {
        setMode('forgot_password');
        setEmail(urlEmail);
        setOtp(resetToken);
        setOtpSent(true);
        
        // Clean up URL so they don't accidentally reuse it on refresh
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setOtp('');
    setOtpSent(false);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSendSignupOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/send-signup-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setOtpSent(true);
      setSuccessMsg("An OTP has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setOtpSent(true);
      setSuccessMsg("An OTP has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');
        onSuccess(data.access_token, data.user);

      } else if (mode === 'register') {
        if (!otpSent) {
          await handleSendSignupOTP();
          return;
        }

        // Verify OTP and Register
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, otp, role: role })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        // Auto login
        const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) onSuccess(loginData.access_token, loginData.user);
        else switchMode('login');

      } else if (mode === 'forgot_password') {
        if (!otpSent) {
          await handleSendResetOTP();
          return;
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp, new_password: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Password reset failed');

        setSuccessMsg("Password reset successfully! You can now log in.");
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* Left Panel: Branding & Biomechanics Visual (45%) */}
      <div className="hidden lg:flex w-[45%] h-full flex-col justify-start gap-6 p-12 relative overflow-hidden bg-gradient-to-b from-[#EFF6FF] to-white border-r border-[#c3c6d7]/30">
        
        {/* Header Title */}
        <div className="z-10 flex items-center gap-3">
          <img 
            alt="MoveIQ Logo" 
            className="h-10 w-auto object-contain drop-shadow-sm" 
            src="/logo.png"
          />
          <div className="flex items-baseline gap-2">
            <span className="text-[#c3c6d7] text-lg font-bold ml-2">—</span>
            <span className="font-semibold text-[18px] text-[#475569] tracking-tight">See risk before it becomes an injury</span>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative w-full flex-1 min-h-0 flex items-center justify-center p-4 z-0 group">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>
          <div className="absolute w-[80%] h-[80%] bg-[#004ccd]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <img 
            alt="Biomechanics Visualization" 
            className="max-h-[52vh] object-contain rounded-xl shadow-lg border border-[#c3c6d7]/20 relative z-0 transition-transform duration-700 ease-out group-hover:scale-[1.01]" 
            src="/images/biomechanics_visualization.png"
          />
        </div>

        {/* Bullet List */}
        <div className="z-10 pt-4">
          <ul className="flex flex-col gap-3 text-[15px] text-[#475569] text-left">
            <li className="flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-[#004ccd]" />
              Real-time form analysis
            </li>
            <li className="flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-[#004ccd]" />
              Kinematic risk scoring
            </li>
            <li className="flex items-center gap-2.5 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-[#004ccd]" />
              Interactive team dashboards
            </li>
          </ul>
        </div>
      </div>

      {/* Right Panel: Form Area (55%) */}
      <div className="w-full lg:w-[55%] h-full flex flex-col justify-center items-center px-6 py-8 lg:p-12 overflow-y-auto relative bg-white">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-[#475569] hover:text-[#004ccd] bg-[#f2f4f8] hover:bg-[#e2e8f0] px-3.5 py-2 rounded-xl transition-all shadow-xs z-20 cursor-pointer"
            style={{ cursor: 'pointer' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="w-full max-w-[440px] flex lg:hidden items-center gap-2.5 mb-8">
          <img 
            alt="MoveIQ Logo" 
            className="h-10 w-auto object-contain drop-shadow-sm" 
            src="/logo.png"
          />
        </div>

        <div className="w-full max-w-[440px] flex flex-col">
          {mode !== 'login' && (
            <button
              onClick={() => switchMode('login')}
              className="mb-6 flex items-center gap-2 text-sm text-[#475569] hover:text-[#004ccd] transition-colors self-start cursor-pointer"
              style={{ cursor: 'pointer' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>
          )}

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-[28px] lg:text-[32px] font-bold text-[#0F172A] mb-1">
              {mode === 'login' 
                ? 'Welcome back' 
                : mode === 'register' 
                ? 'Create your account' 
                : 'Reset your password'}
            </h1>
            <p className="text-[15px] text-[#475569] mt-1 font-medium">
              {mode === 'login' 
                ? 'Sign in to access your biomechanics dashboard.' 
                : mode === 'register'
                ? 'Get started with professional biomechanics tracking.'
                : 'Enter your email to request a secure password reset.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-sm text-center font-semibold border border-red-200">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 text-[#11801c] text-sm text-center font-semibold border border-[#c4f2c7]">
                {successMsg}
              </div>
            )}

            {/* Google Authentication Buttons */}
            {mode === 'login' && (
              <>
                <button 
                  type="button" 
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google/login?role=athlete`;
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#c3c6d7] rounded-xl hover:bg-[#f2f4f8] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004ccd] focus:ring-offset-1 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-bold text-[14px] text-[#0f172a]">Continue with Google</span>
                </button>

                <div className="flex items-center my-1">
                  <div className="flex-grow border-t border-[#c3c6d7]/60"></div>
                  <span className="px-3 text-xs text-gray-400 uppercase tracking-widest font-bold">or</span>
                  <div className="flex-grow border-t border-[#c3c6d7]/60"></div>
                </div>
              </>
            )}

            {mode === 'register' && !otpSent && (
              <div className="flex flex-col gap-4">
                <button 
                  type="button" 
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google/login?role=${role}`;
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#c3c6d7] rounded-xl hover:bg-[#f2f4f8] transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#004ccd] focus:ring-offset-1 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="font-bold text-[14px] text-[#0f172a]">Sign up with Google</span>
                </button>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[#0F172A]">Choose Workspace Role</label>
                  <div className="flex gap-2 p-1.5 bg-[#f2f4f8] rounded-xl border border-[#c3c6d8]">
                    <button
                      type="button"
                      onClick={() => setRole('athlete')}
                      className={`flex-1 py-2.5 px-3 text-[13px] font-bold rounded-lg transition-all cursor-pointer ${
                        role === 'athlete' ? 'bg-white text-[#004ccd] shadow-sm' : 'text-[#475569] hover:text-[#004ccd]'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      Athlete
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('coach')}
                      className={`flex-1 py-2.5 px-3 text-[13px] font-bold rounded-lg transition-all cursor-pointer ${
                        role === 'coach' ? 'bg-white text-[#004ccd] shadow-sm' : 'text-[#475569] hover:text-[#004ccd]'
                      }`}
                      style={{ cursor: 'pointer' }}
                    >
                      Coach
                    </button>
                  </div>
                </div>

                <div className="flex items-center my-1">
                  <div className="flex-grow border-t border-[#c3c6d7]/60"></div>
                  <span className="px-3 text-xs text-gray-400 uppercase tracking-widest font-bold">or</span>
                  <div className="flex-grow border-t border-[#c3c6d7]/60"></div>
                </div>
              </div>
            )}

            {mode === 'register' && !otpSent && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#0F172A]" htmlFor="fullName">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-4 py-3 font-medium text-[15px] text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="fullName" 
                    required
                    name="fullName" 
                    placeholder="Jane Smith" 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
            )}



            {(!otpSent || mode === 'login') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#0F172A]" htmlFor="email">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-4 py-3 font-medium text-[15px] text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="email" 
                    required
                    name="email" 
                    placeholder="name@example.com" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot_password' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-bold text-[#0F172A]" htmlFor="password">Password</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_password')}
                      className="text-xs font-bold text-[#004ccd] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-11 py-3 font-medium text-[15px] text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="password" 
                    required
                    name="password" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {mode === 'register' && <PasswordRequirements password={password} />}
              </div>
            )}

            {/* OTP Verification Phase */}
            {otpSent && (mode === 'register' || mode === 'forgot_password') && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#0F172A]" htmlFor="otp">4-Digit Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-4 py-3 font-bold text-center text-lg tracking-widest text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="otp" 
                    required
                    name="otp" 
                    placeholder="••••" 
                    maxLength={4}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
              </div>
            )}

            {otpSent && mode === 'forgot_password' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#0F172A]" htmlFor="newPassword">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-11 py-3 font-medium text-[15px] text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="newPassword" 
                    required
                    name="newPassword" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <PasswordRequirements password={password} />

                <label className="text-[13px] font-bold text-[#0F172A] mt-2" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <input 
                    className="w-full rounded-xl border border-[#c3c6d7] bg-white pl-11 pr-11 py-3 font-medium text-[15px] text-[#191c1f] placeholder-gray-400 focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                    id="confirmPassword" 
                    required
                    name="confirmPassword" 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            )}

            <button 
              className="w-full bg-[#004ccd] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:bg-[#003da9] active:scale-[0.99] transition-all focus:outline-none focus:ring-2 focus:ring-[#004ccd] focus:ring-offset-2 flex items-center justify-center gap-2 mt-2 cursor-pointer" 
              type="submit"
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'login' ? 'Sign in' :
                mode === 'register' && !otpSent ? 'Send Verification OTP' :
                  mode === 'register' && otpSent ? 'Verify & Create Account' :
                    mode === 'forgot_password' && !otpSent ? 'Send OTP' :
                      'Reset Password'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 text-center">
            {mode === 'login' ? (
              <p className="text-[15px] text-[#475569] font-medium">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('register')}
                  className="text-[#004ccd] font-bold hover:underline focus:outline-none cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  Sign up, it's free
                </button>
              </p>
            ) : (
              <p className="text-[15px] text-[#475569] font-medium">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="text-[#004ccd] font-bold hover:underline focus:outline-none cursor-pointer"
                  style={{ cursor: 'pointer' }}
                >
                  Log in
                </button>
              </p>
            )}
          </div>
          {/* Footer */}
          <footer className="mt-8 pb-4 text-center">
            <span className="text-[12px] text-gray-400 font-medium">© 2026 MoveIQ Biomechanics. All rights reserved.</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
