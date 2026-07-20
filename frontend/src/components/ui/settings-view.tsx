import React, { useState } from 'react';
import { User, Lock, Moon, Download, Info, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="mt-3 space-y-2 p-4 bg-slate-950/50 rounded-xl border border-slate-700/50">
      {requirements.map((req, idx) => {
        const isValid = req.test(password);
        return (
          <div key={idx} className="flex items-center justify-between">
            <span className={`text-xs ${isValid ? 'text-emerald-400' : 'text-slate-500'}`}>{req.label}</span>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
              isValid ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-slate-700 bg-transparent'
            }`}>
              {isValid && <CheckCircle2 className="w-3 h-3" />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface SettingsViewProps {
  token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    roles: string[];
  };
  onUserUpdate: (newUser: any) => void;
}

export const SettingsView = ({ token, user, onUserUpdate }: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'appearance' | 'downloads' | 'about'>('account');
  
  // Account State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Security Forgot Password State
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountLoading(true);
    setAccountStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/account`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: fullName, email: email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update account');
      
      setAccountStatus({ msg: 'Account updated successfully!', type: 'success' });
      onUserUpdate({ ...user, full_name: fullName, email: email });
      setTimeout(() => setAccountStatus(null), 3000);
    } catch (err: any) {
      setAccountStatus({ msg: err.message, type: 'error' });
    } finally {
      setAccountLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSecurityStatus({ msg: "New passwords don't match", type: 'error' });
      return;
    }
    setSecurityLoading(true);
    setSecurityStatus(null);
    try {
      if (isForgotMode && otpSent) {
        // Handle Reset with OTP
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email, otp, new_password: newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to reset password');
        
        setSecurityStatus({ msg: 'Password reset successfully!', type: 'success' });
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setIsForgotMode(false);
        setOtpSent(false);
      } else {
        // Handle Normal Change Password
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to update password');
        
        setSecurityStatus({ msg: 'Password changed successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      setTimeout(() => setSecurityStatus(null), 3000);
    } catch (err: any) {
      setSecurityStatus({ msg: err.message, type: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSendResetOTP = async () => {
    setSecurityLoading(true);
    setSecurityStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setOtpSent(true);
      setIsForgotMode(true);
      setSecurityStatus({ msg: "OTP sent to your email!", type: 'success' });
    } catch (err: any) {
      setSecurityStatus({ msg: err.message, type: 'error' });
    } finally {
      setSecurityLoading(false);
    }
  };


  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'downloads', label: 'Downloads Format', icon: Download },
    { id: 'about', label: 'About', icon: Info }
  ] as const;

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row gap-8">
      
      {/* Settings Navigation */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white mb-4 px-2">Settings</h2>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl min-h-[500px]">
        
        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-white mb-1">Account Settings</h3>
            <p className="text-slate-400 text-sm mb-8">Update your personal information and email address.</p>
            
            {accountStatus && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                accountStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {accountStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {accountStatus.msg}
              </div>
            )}

            <form onSubmit={handleAccountSubmit} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={accountLoading}
                className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {accountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-bold text-white">Security Settings</h3>
              {isForgotMode && (
                <button 
                  onClick={() => {
                    setIsForgotMode(false);
                    setOtpSent(false);
                    setSecurityStatus(null);
                  }}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel Reset
                </button>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-8">Update your password to keep your account secure.</p>
            
            {securityStatus && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                securityStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {securityStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {securityStatus.msg}
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} className="space-y-5 max-w-md">
              
              {!isForgotMode ? (
                <>
                  <div className="space-y-2 relative">
                    <label className="text-sm font-semibold text-slate-300">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleSendResetOTP}
                      className="absolute right-0 top-0 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">4-Digit OTP (Sent to Email)</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={4}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-center tracking-widest text-lg font-bold"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  required
                />
              </div>
              <PasswordRequirements password={newPassword} />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={securityLoading}
                className="mt-4 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {securityLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isForgotMode ? "Reset Password" : "Change Password"}
              </button>
            </form>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-white mb-1">Appearance</h3>
            <p className="text-slate-400 text-sm mb-8">Customize how MoveIQ looks on your device.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Dark', 'Light', 'System'].map((theme) => (
                <div key={theme} className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  theme === 'Dark' 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}>
                  <div className={`w-full h-24 rounded-lg mb-3 ${
                    theme === 'Dark' ? 'bg-slate-950' : theme === 'Light' ? 'bg-slate-100' : 'bg-gradient-to-r from-slate-950 to-slate-100'
                  }`}></div>
                  <p className="text-center font-medium text-slate-200">{theme}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-cyan-400 mt-6 bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20 inline-flex items-center gap-2">
              <Info className="w-4 h-4" /> Dark mode is currently locked as the default theme.
            </p>
          </div>
        )}

        {/* DOWNLOADS TAB */}
        {activeTab === 'downloads' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-white mb-1">Downloads Format</h3>
            <p className="text-slate-400 text-sm mb-8">Set your default format for saving AI recommendation reports.</p>
            
            <div className="space-y-4 max-w-md">
              <div className="p-4 border border-cyan-500 bg-cyan-500/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-slate-200">PDF Format</p>
                    <p className="text-xs text-slate-400">Default setting</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-4 border-cyan-500 bg-slate-900"></div>
              </div>
              
              <div className="p-4 border border-slate-700 bg-slate-800 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-200">TXT Format</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-slate-500"></div>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-white mb-1">About MoveIQ</h3>
            <p className="text-slate-400 text-sm mb-8">Version information and legal documents.</p>
            
            <div className="space-y-2 border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
                <span className="font-medium text-slate-300">Version</span>
                <span className="text-slate-400 text-sm">v1.0.0-beta</span>
              </div>
              <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors">
                <span className="font-medium text-slate-300">Documentation</span>
                <span className="text-cyan-400 text-sm">Read Docs &rarr;</span>
              </div>
              <div className="p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700 hover:bg-slate-800 cursor-pointer transition-colors">
                <span className="font-medium text-slate-300">Privacy Policy</span>
                <span className="text-cyan-400 text-sm">View Policy &rarr;</span>
              </div>
              <div className="p-4 bg-slate-800/50 flex justify-between items-center hover:bg-slate-800 cursor-pointer transition-colors">
                <span className="font-medium text-slate-300">Terms of Service</span>
                <span className="text-cyan-400 text-sm">View Terms &rarr;</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
