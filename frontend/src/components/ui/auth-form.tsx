import React, { useState } from 'react';
import { Activity, Loader2, Mail, Lock, User, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

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
    <div className="mt-3 space-y-2 p-4 bg-black/20 rounded-xl border border-white/5">
      {requirements.map((req, idx) => {
        const isValid = req.test(password);
        return (
          <div key={idx} className="flex items-center justify-between">
            <span className={`text-xs ${isValid ? 'text-emerald-400' : 'text-gray-500'}`}>{req.label}</span>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
              isValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-gray-700 bg-transparent'
            }`}>
              {isValid && <CheckCircle2 className="w-3 h-3" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface AuthFormProps {
  onSuccess: (token: string, user: any) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password';

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP phases
  const [otpSent, setOtpSent] = useState(false);

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setOtp('');
    setOtpSent(false);
    setPassword('');
    setConfirmPassword('');
    // email and fullname can persist across modes if useful
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleSendSignupOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/auth/send-signup-otp', {
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
      const res = await fetch('http://localhost:8000/api/auth/forgot-password', {
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
        const res = await fetch('http://localhost:8000/api/auth/login', {
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
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, otp, role: 'athlete' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');
        
        // Auto login
        const loginRes = await fetch('http://localhost:8000/api/auth/login', {
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

        const res = await fetch('http://localhost:8000/api/auth/reset-password', {
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
    <div className="flex items-center justify-center min-h-screen bg-[#111111] p-4">
      <div className="w-full max-w-[400px] bg-[#1A1A1A] rounded-3xl p-10 shadow-2xl border border-white/5">
        
        {mode !== 'login' && (
          <button 
            onClick={() => switchMode('login')}
            className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            {mode === 'forgot_password' ? <KeyRound className="w-6 h-6 text-cyan-400" /> : <Activity className="w-6 h-6 text-cyan-400" />}
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            {mode === 'login' ? 'MoveIQ' : mode === 'register' ? 'Create Account' : 'Reset Password'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-medium">
              {successMsg}
            </div>
          )}

          {/* Email Input */}
          {(!otpSent || mode === 'login') && (
            <>
              {mode === 'register' && (
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner disabled:opacity-50"
                />
              </div>
              {mode !== 'forgot_password' && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                  {mode === 'register' && <PasswordRequirements password={password} />}
                </>
              )}
            </>
          )}

          {/* OTP Verification Phase */}
          {otpSent && (mode === 'register' || mode === 'forgot_password') && (
            <>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="4-Digit OTP"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={4}
                  className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner text-center tracking-widest text-lg font-bold"
                />
              </div>
              
              {mode === 'forgot_password' && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="New Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                  <PasswordRequirements password={password} />
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 pl-12 pr-4 py-3.5 rounded-xl border-none focus:ring-2 focus:ring-cyan-500/50 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode('forgot_password')}
                className="text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2A2A2A] hover:bg-[#333333] text-white font-semibold py-3.5 rounded-xl transition-colors duration-200 shadow flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
              {mode === 'login' ? 'Sign in' : 
               mode === 'register' && !otpSent ? 'Send OTP' : 
               mode === 'register' && otpSent ? 'Verify & Create Account' : 
               mode === 'forgot_password' && !otpSent ? 'Send OTP' : 
               'Reset Password'}
            </button>
          </div>
        </form>

        {mode === 'login' && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => switchMode('register')}
                className="text-white hover:underline focus:outline-none"
              >
                Sign up, it's free!
              </button>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
