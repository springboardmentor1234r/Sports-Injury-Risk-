import React, { useState, useEffect } from 'react';
import { Save, User, Loader2, AlertCircle, CheckCircle2, Shield, Eye, Lock, Camera } from 'lucide-react';

interface ProfileFormProps {
    token: string;
    onProfileSaved: () => void;
    user?: any;
    onUserUpdate?: (user: any) => void;
}

export const ProfileForm = ({ token, onProfileSaved, user, onUserUpdate }: ProfileFormProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [latestRisk, setLatestRisk] = useState<{score: number, category: string} | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const handleSendResetOTP = async () => {
        setPasswordLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user?.email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
            setOtpSent(true);
            setIsForgotMode(true);
            setPasswordSuccess(true);
            setPasswordError(null);
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters long.");
            return;
        }

        setPasswordLoading(true);

        try {
            if (isForgotMode && otpSent) {
                // Reset with OTP
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user?.email, otp, new_password: newPassword })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to reset password');

                setPasswordSuccess(true);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setIsForgotMode(false);
                setOtpSent(false);
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setPasswordSuccess(false);
                }, 2000);
            } else {
                // Normal change password
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.detail || "Failed to change password");
                }

                setPasswordSuccess(true);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setPasswordSuccess(false);
                }, 2000);
            }
        } catch (err: any) {
            setPasswordError(err.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/cloudinary/upload-avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: uploadData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to upload avatar image');
            }

            const data = await res.json();
            if (data.profile_picture_url) {
                if (user && onUserUpdate) {
                    const updatedUser = { ...user, profile_picture_url: data.profile_picture_url };
                    onUserUpdate(updatedUser);
                }
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const [formData, setFormData] = useState({
        has_previous_injury: 'No',
        injury_recency: 'None',
        previous_injury_type: 'None',
        training_intensity: 'Medium',
        weekly_training_sessions: 3,
        age: 24,
        gender: 'Male',
        height: 180,
        weight: 75,
        sport: 'Football'
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        has_previous_injury: data.has_previous_injury || 'No',
                        injury_recency: data.injury_recency || 'None',
                        previous_injury_type: data.previous_injury_type || 'None',
                        training_intensity: data.training_intensity || 'Medium',
                        weekly_training_sessions: data.weekly_training_sessions || 3,
                        age: data.age || 24,
                        gender: data.gender || 'Male',
                        height: data.height || 180,
                        weight: data.weight || 75,
                        sport: data.sport || 'Football'
                    });
                }

                // Fetch latest session for risk score
                const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    if (historyData.length > 0 && historyData[0].risk_data && historyData[0].risk_data.overall_health_score !== undefined) {
                        setLatestRisk({
                            score: historyData[0].risk_data.overall_health_score,
                            category: historyData[0].risk_data.risk_category || 'Unknown'
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Failed to save profile');
            }

            setSuccess(true);
            onProfileSaved(); // Unlock dashboard!
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#004ccd] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-[1280px] mx-auto w-full px-4 md:px-8 py-8 animate-fadeIn text-[#191c1f]">
            {/* Page Header */}
            <header className="mb-8 text-left">
                <h1 className="text-[32px] leading-[40px] font-extrabold text-[#191c1f] tracking-tight">My Profile</h1>
                <p className="text-[15px] text-[#424656] mt-2 font-normal">
                    Manage your athletic profile and biometric data for accurate injury risk analysis.
                </p>
            </header>

            {/* Layout Grid */}
            <div className="grid grid-cols-12 gap-8">
                {/* Left Side: Identity Column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    {/* User Identity Card */}
                    <div className="bg-white rounded-2xl border border-[#c3c6d7] p-6 flex flex-col items-center text-center shadow-sm">
                        <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                disabled={isUploading}
                            />
                            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#c3c6d7] group-hover:border-[#004ccd] transition-colors relative">
                                {isUploading ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/85">
                                        <Loader2 className="w-6 h-6 text-[#004ccd] animate-spin" />
                                    </div>
                                ) : (
                                    <img 
                                        alt="User Profile Image" 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover" 
                                        src={user?.profile_picture_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBSlC5xgPUQCFTlMeBh8leEYsm4Qacqtn_NURfgqzwGPeR3aQGcIFGjLRxts0_qlavcgnJglKU2vIw97zhPW2jE4mcOFYQSrBWTaDlUQQeN6XXVW9qNY8Ni6MJ7kuJ7p14Zo1D6SZ2IzNxndGjB-5btaMMjnPziBivCCt3Kh_tkXHy32d86mmE_jK_JX6v-4jg73tU7xzmh0O1UEWxFWPtDTqpc3AKRprZHJh0woV4G9QuiIEKdLYl9YuQfG18Dv-pqtVLDFyHJhhh4"}
                                    />
                                )}
                            </div>
                            <div className="absolute inset-0 bg-[#0f172a]/55 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-[20px] font-bold text-[#191c1f] mb-1">{user?.full_name || 'Alex Mercer'}</h2>
                        <p className="text-[14px] text-[#424656] mb-4">{user?.email || 'alex.mercer@example.com'}</p>
                        
                        <div className="w-full h-[1px] bg-[#c3c6d7]/50 my-4"></div>
                        
                        <div className="w-full text-left">
                            <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider block mb-1.5">Current Status</span>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#c4f2c7] text-[#11801c] font-bold text-[12px] border border-[#11801c]/15">
                                <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                                Cleared for Play
                            </div>
                        </div>
                    </div>

                    {/* Account Security Widget */}
                    <div className="bg-white rounded-2xl border border-[#c3c6d7] p-6 shadow-sm text-left">
                        <h3 className="text-[16px] font-bold text-[#191c1f] mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-[#004ccd]" />
                            Account Security
                        </h3>
                        <div className="space-y-3">
                            <button 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="w-full py-2.5 px-4 rounded-xl border border-[#c3c6d7] text-[#004ccd] text-[14px] font-bold hover:bg-[#faf8ff] transition-colors text-center"
                            >
                                Change Password
                            </button>
                            <button className="w-full py-2.5 px-4 rounded-xl border border-[#c3c6d7] text-[#004ccd] text-[14px] font-bold hover:bg-[#faf8ff] transition-colors text-center">
                                Two-Factor Authentication
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Edit Form Grid */}
                <div className="col-span-12 lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-[#c3c6d7] p-8 shadow-sm">
                        <h2 className="text-[20px] font-bold text-[#191c1f] mb-6 pb-2 border-b border-[#c3c6d7]/50 text-left">
                            Biometric &amp; Athletic Data
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-semibold">{error}</p>
                                </div>
                            )}
                            
                            {success && (
                                <div className="p-4 bg-emerald-50 border border-[#c4f2c7] rounded-xl flex items-center gap-3 text-[#11801c]">
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-semibold">Profile saved successfully! Dashboard unlocked.</p>
                                </div>
                            )}

                            {/* Forms Columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Age */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="age">Age</label>
                                    <input 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="age" 
                                        type="number" 
                                        min="5"
                                        max="100"
                                        value={formData.age}
                                        onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                                    />
                                </div>

                                {/* Gender */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="gender">Gender</label>
                                    <select 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="gender"
                                        value={formData.gender}
                                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Height */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="height">Height (cm)</label>
                                    <input 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="height" 
                                        type="number"
                                        min="50"
                                        max="250"
                                        value={formData.height}
                                        onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})}
                                    />
                                </div>

                                {/* Weight */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="weight">Weight (kg)</label>
                                    <input 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="weight" 
                                        type="number"
                                        min="20"
                                        max="200"
                                        value={formData.weight}
                                        onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 0})}
                                    />
                                </div>

                                {/* Sport */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="sport">Primary Sport</label>
                                    <select 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="sport"
                                        value={formData.sport}
                                        onChange={(e) => setFormData({...formData, sport: e.target.value})}
                                    >
                                        <option value="Football">Football</option>
                                        <option value="Basketball">Basketball</option>
                                        <option value="Soccer">Soccer</option>
                                        <option value="Tennis">Tennis</option>
                                        <option value="Gymnastics">Gymnastics</option>
                                        <option value="Track">Track / Running</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Training Intensity */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="intensity">Training Intensity</label>
                                    <select 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="intensity"
                                        value={formData.training_intensity}
                                        onChange={(e) => setFormData({...formData, training_intensity: e.target.value})}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Professional">Professional</option>
                                    </select>
                                </div>

                                {/* Sessions */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="sessions">Weekly Sessions</label>
                                    <input 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="sessions" 
                                        type="number"
                                        min="1"
                                        max="14"
                                        value={formData.weekly_training_sessions}
                                        onChange={(e) => setFormData({...formData, weekly_training_sessions: parseInt(e.target.value) || 1})}
                                    />
                                </div>

                                {/* Has Previous Injury */}
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="has_injury">Has Previous Injury?</label>
                                    <select 
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                        id="has_injury"
                                        value={formData.has_previous_injury}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'No') {
                                                setFormData({
                                                    ...formData,
                                                    has_previous_injury: 'No',
                                                    previous_injury_type: 'None',
                                                    injury_recency: 'None'
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    has_previous_injury: 'Yes',
                                                    previous_injury_type: formData.previous_injury_type === 'None' ? '' : formData.previous_injury_type,
                                                    injury_recency: formData.injury_recency === 'None' ? 'Recent' : formData.injury_recency
                                                });
                                            }
                                        }}
                                    >
                                        <option value="No">No Previous Injury</option>
                                        <option value="Yes">Yes, I have a previous injury</option>
                                    </select>
                                </div>

                                {formData.has_previous_injury === 'Yes' && (
                                    <>
                                        {/* Injury Type */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="injury_type">Previous Injury Type</label>
                                            <input 
                                                className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                                id="injury_type" 
                                                type="text" 
                                                required
                                                value={formData.previous_injury_type === 'None' ? '' : formData.previous_injury_type}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    previous_injury_type: e.target.value || 'None'
                                                })}
                                                placeholder="e.g. ACL Tear, Ankle Sprain"
                                            />
                                        </div>

                                        {/* Injury Recency */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[13px] font-bold text-[#191c1f]" htmlFor="recency">Injury Recency</label>
                                            <select 
                                                className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2.5 text-[15px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none" 
                                                id="recency"
                                                value={formData.injury_recency === 'None' ? 'Recent' : formData.injury_recency}
                                                onChange={(e) => setFormData({...formData, injury_recency: e.target.value})}
                                            >
                                                <option value="Recent">Recent (Last 6 months)</option>
                                                <option value="Moderate">Moderate (6 - 24 months ago)</option>
                                                <option value="Old">Old (&gt; 2 years ago)</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Action Button Area */}
                            <div className="mt-4 flex justify-end gap-4 border-t border-[#c3c6d7]/50 pt-6">
                                <button 
                                    className="py-2.5 px-6 rounded-xl border border-[#c3c6d7] text-[#004ccd] text-[14px] font-bold hover:bg-[#faf8ff] transition-colors" 
                                    type="button"
                                    onClick={() => window.location.reload()}
                                >
                                    Discard
                                </button>
                                <button 
                                    className="py-2.5 px-6 rounded-xl bg-[#004ccd] text-white text-[14px] font-bold hover:bg-[#003da9] active:scale-[0.99] transition-all flex items-center gap-2" 
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                                    ) : (
                                        <Save className="w-4.5 h-4.5" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl border border-[#c3c6d7] max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left text-[#191c1f]">
                        <div className="bg-[#191b23] text-white p-5 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-[#004ccd]" />
                                <h3 className="text-[18px] font-bold">Change Password</h3>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        
                        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm font-semibold">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="p-3 bg-emerald-50 border border-[#c4f2c7] rounded-xl flex items-center gap-2 text-[#11801c] text-sm font-semibold">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>Password updated successfully!</span>
                                </div>
                            )}

                            {!isForgotMode ? (
                                <div className="flex flex-col gap-1 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[13px] font-bold text-[#191c1f]">Current Password</label>
                                        <button
                                            type="button"
                                            onClick={handleSendResetOTP}
                                            className="text-xs font-bold text-[#004ccd] hover:underline"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={oldPassword}
                                        onChange={(e) => setOldPassword(e.target.value)}
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2 text-[14px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none"
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[13px] font-bold text-[#191c1f]">4-Digit OTP (Sent to Email)</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsForgotMode(false);
                                                setOtpSent(false);
                                                setPasswordError(null);
                                            }}
                                            className="text-xs font-bold text-red-500 hover:underline"
                                        >
                                            Cancel Reset
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={4}
                                        className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2 text-[16px] font-bold text-center tracking-widest text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <label className="text-[13px] font-bold text-[#191c1f]">New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2 text-[14px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-[13px] font-bold text-[#191c1f]">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border border-[#c3c6d7] bg-white px-3 py-2 text-[14px] text-[#191c1f] focus:border-[#004ccd] focus:ring-2 focus:ring-[#004ccd]/20 transition-all outline-none"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsPasswordModalOpen(false);
                                        setIsForgotMode(false);
                                        setOtpSent(false);
                                    }}
                                    className="px-4 py-2 rounded-xl border border-[#c3c6d7] text-[#434654] text-[13px] font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="px-4 py-2 rounded-xl bg-[#004ccd] text-white text-[13px] font-semibold hover:bg-[#003da9] transition-colors flex items-center gap-1.5"
                                >
                                    {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isForgotMode ? "Reset Password" : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
