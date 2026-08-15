'use client';
import React, { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2, KeyRound, User } from 'lucide-react';

interface OpsAccountTabProps {
  token: string;
  user: any;
  onUserUpdate: (newUser: any) => void;
}

export const OpsAccountTab: React.FC<OpsAccountTabProps> = ({ token, user, onUserUpdate }) => {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // --- Email Update State ---
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // --- Password Update State ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // --- Forgot Password State ---
  const [fpOtpSent, setFpOtpSent] = useState(false);
  const [fpOtp, setFpOtp] = useState('');
  const [fpNew, setFpNew] = useState('');
  const [fpConfirm, setFpConfirm] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const sendEmailOtp = async () => {
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setEmailOtpSent(true);
      setEmailMsg({ text: 'OTP sent to your current email.', ok: true });
    } catch (e: any) {
      setEmailMsg({ text: e.message, ok: false });
    } finally { setEmailLoading(false); }
  };

  const submitEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await fetch(`${API}/api/ops/me/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_email: newEmail, otp: emailOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update email');
      setEmailMsg({ text: 'Email updated successfully!', ok: true });
      onUserUpdate({ ...user, email: newEmail });
      setNewEmail(''); setEmailOtp(''); setEmailOtpSent(false);
    } catch (e: any) {
      setEmailMsg({ text: e.message, ok: false });
    } finally { setEmailLoading(false); }
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwdMsg({ text: 'Passwords do not match.', ok: false }); return; }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update password');
      setPwdMsg({ text: 'Password changed successfully!', ok: true });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (e: any) {
      setPwdMsg({ text: e.message, ok: false });
    } finally { setPwdLoading(false); }
  };

  const sendFpOtp = async () => {
    setFpLoading(true);
    setFpMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      setFpOtpSent(true);
      setFpMsg({ text: 'OTP sent to your email.', ok: true });
    } catch (e: any) {
      setFpMsg({ text: e.message, ok: false });
    } finally { setFpLoading(false); }
  };

  const submitFpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fpNew !== fpConfirm) { setFpMsg({ text: 'Passwords do not match.', ok: false }); return; }
    setFpLoading(true);
    setFpMsg(null);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, otp: fpOtp, new_password: fpNew })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to reset password');
      setFpMsg({ text: 'Password reset successfully!', ok: true });
      setFpOtpSent(false); setFpOtp(''); setFpNew(''); setFpConfirm('');
    } catch (e: any) {
      setFpMsg({ text: e.message, ok: false });
    } finally { setFpLoading(false); }
  };

  const Msg = ({ msg }: { msg: { text: string; ok: boolean } | null }) =>
    msg ? (
      <div className={`px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        {msg.ok && <CheckCircle2 className="w-4 h-4 shrink-0" />}
        {msg.text}
      </div>
    ) : null;

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Icon className="w-4 h-4 text-indigo-500" />
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current account info */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-indigo-200">
          {user?.profile_picture_url ? (
            <img src={user.profile_picture_url} alt={user.full_name || 'Admin'} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          ) : (
            user?.full_name?.charAt(0)?.toUpperCase() || 'A'
          )}
        </div>
        <div>
          <p className="font-bold text-slate-800">{user?.full_name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Platform Operations</span>
        </div>
      </div>

      {/* Update Email */}
      <Section title="Update Email Address" icon={Mail}>
        <form onSubmit={submitEmailUpdate} className="space-y-3">
          <Input label="New Email Address" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" required />
          {!emailOtpSent ? (
            <button type="button" onClick={sendEmailOtp} disabled={!newEmail || emailLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />} Send Verification OTP
            </button>
          ) : (
            <>
              <Input label="Verification OTP" type="text" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="4-digit code" maxLength={4} required />
              <button type="submit" disabled={!emailOtp || emailLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                {emailLoading && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Email Update
              </button>
            </>
          )}
          <Msg msg={emailMsg} />
        </form>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={submitPasswordChange} className="space-y-3">
          <div className="relative">
            <Input label="Current Password" type={showOld ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Input label="New Password" type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-8 text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          <button type="submit" disabled={!oldPassword || !newPassword || pwdLoading}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
            {pwdLoading && <Loader2 className="w-4 h-4 animate-spin" />} Update Password
          </button>
          <Msg msg={pwdMsg} />
        </form>
      </Section>

      {/* Forgot / Reset Password via OTP */}
      <Section title="Reset Password via OTP" icon={KeyRound}>
        <p className="text-xs text-slate-500">Use this if you have been locked out or forgot your current password. An OTP will be sent to <strong>{user?.email}</strong>.</p>
        {!fpOtpSent ? (
          <>
            <button type="button" onClick={sendFpOtp} disabled={fpLoading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {fpLoading && <Loader2 className="w-4 h-4 animate-spin" />} Send Password Reset OTP
            </button>
            <Msg msg={fpMsg} />
          </>
        ) : (
          <form onSubmit={submitFpReset} className="space-y-3">
            <Input label="OTP Code" type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value)} placeholder="4-digit code" maxLength={4} required />
            <Input label="New Password" type="password" value={fpNew} onChange={e => setFpNew(e.target.value)} required />
            <Input label="Confirm New Password" type="password" value={fpConfirm} onChange={e => setFpConfirm(e.target.value)} required />
            <button type="submit" disabled={!fpOtp || !fpNew || fpLoading}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {fpLoading && <Loader2 className="w-4 h-4 animate-spin" />} Reset Password
            </button>
            <Msg msg={fpMsg} />
          </form>
        )}
      </Section>
    </div>
  );
};
