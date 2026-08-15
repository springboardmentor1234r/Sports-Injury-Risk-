import React, { useState, useEffect } from 'react';
import { User, Lock, Moon, Download, Info, CheckCircle2, AlertCircle, Loader2, Webhook } from 'lucide-react';
import toast from 'react-hot-toast';
import { CoachWebhooks } from './coach-webhooks';

interface SettingsViewProps {
  token: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    roles: string[];
    profile_picture_url?: string | null;
    coach_code?: string | null;
  };
  onUserUpdate: (newUser: any) => void;
}

export const SettingsView = ({ token, user, onUserUpdate }: SettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'downloads' | 'about' | 'webhooks'>('account');
  
  // Account State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(user?.profile_picture_url || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'txt'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem("downloadFormat") as 'pdf' | 'txt') || 'pdf';
    }
    return 'pdf';
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'light';
    }
    return 'light';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setProfilePictureUrl(user?.profile_picture_url || null);
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAccountStatus({ msg: 'Please select a valid image file.', type: 'error' });
      return;
    }

    setAvatarUploading(true);
    setAccountStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cloudinary/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Avatar upload failed');

      setProfilePictureUrl(data.profile_picture_url);
      setAccountStatus({ msg: 'Profile picture updated successfully!', type: 'success' });
      onUserUpdate({ ...user, full_name: fullName, email: email, profile_picture_url: data.profile_picture_url });
    } catch (err: any) {
      setAccountStatus({ msg: err.message, type: 'error' });
    } finally {
      setAvatarUploading(false);
    }
  };

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
      onUserUpdate({ ...user, full_name: fullName, email: email, profile_picture_url: profilePictureUrl });
      setTimeout(() => setAccountStatus(null), 3000);
    } catch (err: any) {
      setAccountStatus({ msg: err.message, type: 'error' });
    } finally {
      setAccountLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'downloads', label: 'Downloads Format', icon: Download },
    ...(user.roles?.includes('coach') ? [{ id: 'webhooks', label: 'Webhooks', icon: Webhook }] as const : []),
    { id: 'about', label: 'About', icon: Info }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col md:flex-row gap-8 text-[#191c1f] text-left animate-fadeIn">
      
      {/* Settings Navigation */}
      <div className="w-full md:w-64 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[#191c1f] mb-4 px-2">Settings</h2>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold border ${
                isActive 
                  ? 'bg-[#dbe1ff] text-[#004ccd] border-[#004ccd]/20 shadow-sm' 
                  : 'text-[#424656] hover:text-[#004ccd] hover:bg-[#f2f4f8] border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-white border border-[#c3c6d7] rounded-2xl p-8 shadow-sm min-h-[500px]">
        
        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-[#191c1f] mb-1">Account Settings</h3>
            <p className="text-[#424656] text-sm mb-8">Update your personal information and email address.</p>
            
            {accountStatus && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border ${
                accountStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {accountStatus.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {accountStatus.msg}
              </div>
            )}

            <div className="mb-8 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#c3c6d7]/50">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border border-[#c3c6d7] bg-[#faf8ff] flex items-center justify-center">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-extrabold text-2xl">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center animate-pulse">
                    <Loader2 className="w-6 h-6 text-[#004ccd] animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center sm:items-start gap-2">
                <h4 className="text-sm font-bold text-[#191c1f]">Profile Photo</h4>
                <p className="text-[11px] text-[#737687]">JPG, PNG or WEBP. Max size 5MB.</p>
                
                <label className="cursor-pointer px-4 py-2 bg-[#f3f3fe] hover:bg-[#e2e6ff] border border-[#c3c6d7] text-[#004ccd] text-xs font-bold rounded-lg shadow-sm transition-all">
                  {avatarUploading ? 'Uploading...' : 'Upload New Photo'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-5 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191c1f]">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-[#c3c6d7] rounded-xl px-4 py-3 text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 outline-none transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#191c1f]">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-[#c3c6d7] rounded-xl px-4 py-3 text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={accountLoading}
                className="mt-4 px-6 py-3 bg-[#004ccd] hover:bg-[#003da9] text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                {accountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </form>

            {user.roles?.includes('coach') && user.coach_code && (
              <div className="mt-8 pt-8 border-t border-[#c3c6d7] space-y-3">
                <h4 className="text-sm font-extrabold text-[#191c1f] uppercase tracking-wider">Coach Invite Code</h4>
                <p className="text-xs text-[#424656]">
                  Share this code with your athletes so they can quickly search for and assign you as their coach.
                </p>
                <div className="flex gap-2 items-center max-w-sm">
                  <div className="bg-[#f3f3fe] border border-[#c3c6d7] px-4 py-3 rounded-xl font-mono font-bold text-lg text-[#004ccd] tracking-widest text-center select-all flex-1">
                    {user.coach_code}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user.coach_code || '');
                      toast.success("Coach Invite Code copied to clipboard!");
                    }}
                    className="px-4 py-3 bg-[#f3f3fe] border border-[#c3c6d7] hover:bg-[#e2e6ff] text-[#004ccd] text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-[#191c1f] mb-1">Appearance</h3>
            <p className="text-[#424656] text-sm mb-8">Customize how MoveIQ looks on your device.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['Dark', 'Light', 'System'].map((t) => {
                const themeKey = t.toLowerCase() as 'dark' | 'light' | 'system';
                const isSelected = theme === themeKey;
                return (
                  <div 
                    key={t} 
                    onClick={() => handleThemeChange(themeKey)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#004ccd] bg-[#f3f3fe] shadow-md ring-2 ring-[#004ccd]/20' 
                        : 'border-[#c3c6d7] bg-white hover:border-[#004ccd]'
                    }`}
                  >
                    <div className={`w-full h-24 rounded-lg mb-3 ${
                      t === 'Dark' ? 'bg-slate-950 border border-slate-800' : t === 'Light' ? 'bg-[#faf8ff] border border-[#c3c6d7]' : 'bg-gradient-to-r from-slate-950 to-[#faf8ff] border border-slate-300'
                    }`}></div>
                    <p className="text-center font-bold text-[#191c1f]">{t}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-[#004ccd] mt-6 bg-[#f3f3fe] p-3 rounded-lg border border-[#004ccd]/20 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Theme preferences are applied instantly and saved across all sessions.
            </p>
          </div>
        )}

        {/* DOWNLOADS TAB */}
        {activeTab === 'downloads' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-[#191c1f] mb-1">Downloads Format</h3>
            <p className="text-[#424656] text-sm mb-8">Set your default format for saving AI recommendation reports.</p>
            
            <div className="space-y-4 max-w-md">
              <div 
                onClick={() => {
                  setDownloadFormat('pdf');
                  localStorage.setItem("downloadFormat", "pdf");
                }}
                className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  downloadFormat === 'pdf'
                    ? 'border-[#004ccd] bg-[#f3f3fe]'
                    : 'border-[#c3c6d7] bg-white hover:border-[#004ccd]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Download className={`w-5 h-5 ${downloadFormat === 'pdf' ? 'text-[#004ccd]' : 'text-[#737687]'}`} />
                  <div>
                    <p className={`font-bold ${downloadFormat === 'pdf' ? 'text-[#191c1f]' : 'text-[#424656]'}`}>PDF Format</p>
                    <p className="text-xs text-[#737687]">Highly structured visual format</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-4 flex items-center justify-center ${
                  downloadFormat === 'pdf' ? 'border-[#004ccd] bg-white' : 'border-slate-300 bg-transparent'
                }`}></div>
              </div>
              
              <div 
                onClick={() => {
                  setDownloadFormat('txt');
                  localStorage.setItem("downloadFormat", "txt");
                }}
                className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  downloadFormat === 'txt'
                    ? 'border-[#004ccd] bg-[#f3f3fe]'
                    : 'border-[#c3c6d7] bg-white hover:border-[#004ccd]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Download className={`w-5 h-5 ${downloadFormat === 'txt' ? 'text-[#004ccd]' : 'text-[#737687]'}`} />
                  <div>
                    <p className={`font-bold ${downloadFormat === 'txt' ? 'text-[#191c1f]' : 'text-[#424656]'}`}>TXT Format</p>
                    <p className="text-xs text-[#737687]">Clean text-based corrective plan</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-4 flex items-center justify-center ${
                  downloadFormat === 'txt' ? 'border-[#004ccd] bg-white' : 'border-slate-300 bg-transparent'
                }`}></div>
              </div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xl font-bold text-[#191c1f] mb-1">About MoveIQ</h3>
            <p className="text-[#424656] text-sm mb-8">Version information and legal documents.</p>
            
            <div className="space-y-2 border border-[#c3c6d7] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-white flex justify-between items-center border-b border-[#c3c6d7]">
                <span className="font-semibold text-[#191c1f]">Version</span>
                <span className="text-[#424656] text-sm font-medium">v1.0.0-beta</span>
              </div>
              <div className="p-4 bg-white flex justify-between items-center border-b border-[#c3c6d7] hover:bg-[#faf8ff] cursor-pointer transition-colors">
                <span className="font-semibold text-[#191c1f]">Documentation</span>
                <span className="text-[#004ccd] text-sm font-bold">Read Docs &rarr;</span>
              </div>
              <div className="p-4 bg-white flex justify-between items-center border-b border-[#c3c6d7] hover:bg-[#faf8ff] cursor-pointer transition-colors">
                <span className="font-semibold text-[#191c1f]">Privacy Policy</span>
                <span className="text-[#004ccd] text-sm font-bold">View Policy &rarr;</span>
              </div>
              <div className="p-4 bg-white flex justify-between items-center hover:bg-[#faf8ff] cursor-pointer transition-colors">
                <span className="font-semibold text-[#191c1f]">Terms of Service</span>
                <span className="text-[#004ccd] text-sm font-bold">View Terms &rarr;</span>
              </div>
            </div>
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {activeTab === 'webhooks' && user.roles?.includes('coach') && (
          <CoachWebhooks token={token} />
        )}

      </div>
    </div>
  );
};
