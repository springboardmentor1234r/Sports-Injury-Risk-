import React, { useState, useEffect } from 'react';
import { Save, User, Loader2, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

interface ProfileFormProps {
    token: string;
    onProfileSaved: () => void;
}

export const ProfileForm = ({ token, onProfileSaved }: ProfileFormProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [latestRisk, setLatestRisk] = useState<{score: number, category: string} | null>(null);

    const [formData, setFormData] = useState({
        has_previous_injury: 'No',
        injury_recency: 'None',
        previous_injury_type: 'None',
        training_intensity: 'Medium',
        weekly_training_sessions: 3,
        age: 20,
        gender: 'Male',
        height: 175,
        weight: 70,
        sport: 'Basketball'
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/profile', {
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
                        age: data.age || 20,
                        gender: data.gender || 'Male',
                        height: data.height || 175,
                        weight: data.weight || 70,
                        sport: data.sport || 'Basketball'
                    });
                }

                // Fetch latest session for risk score
                const historyRes = await fetch('http://localhost:8000/api/sessions/history', {
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
            const res = await fetch('http://localhost:8000/api/profile', {
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
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto w-full">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                    <User className="w-8 h-8 text-cyan-400" />
                    Athlete Profile
                </h1>
                <p className="text-slate-400">Complete your biomechanical profile to unlock personalized analysis.</p>
            </div>

            {latestRisk && (
                <div className="mb-8 bg-slate-900/50 border border-slate-700 p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                            latestRisk.category === 'High Risk' ? 'bg-rose-500/20 text-rose-400' :
                            latestRisk.category === 'Moderate Risk' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-emerald-500/20 text-emerald-400'
                        }`}>
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Latest Health Risk Score</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-white">{latestRisk.score}<span className="text-lg text-slate-500 font-medium">/100</span></h3>
                                <span className={`text-sm font-bold ${
                                    latestRisk.category === 'High Risk' ? 'text-rose-400' :
                                    latestRisk.category === 'Moderate Risk' ? 'text-amber-400' :
                                    'text-emerald-400'
                                }`}>{latestRisk.category}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                
                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">Profile saved successfully! Dashboard unlocked.</p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Demographics & Anthropometrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Age</label>
                            <input 
                                type="number"
                                min="5"
                                max="100"
                                value={formData.age}
                                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Gender</label>
                            <select 
                                value={formData.gender}
                                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Primary Sport</label>
                            <select 
                                value={formData.sport}
                                onChange={(e) => setFormData({...formData, sport: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="Basketball">Basketball</option>
                                <option value="Soccer">Soccer</option>
                                <option value="Football">Football</option>
                                <option value="Tennis">Tennis</option>
                                <option value="Gymnastics">Gymnastics</option>
                                <option value="Track">Track / Running</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Height (cm)</label>
                            <input 
                                type="number"
                                min="50"
                                max="250"
                                value={formData.height}
                                onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Weight (kg)</label>
                            <input 
                                type="number"
                                min="20"
                                max="200"
                                value={formData.weight}
                                onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-700/50 w-full my-6"></div>

                    {/* Training Load */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Training Intensity</label>
                            <select 
                                value={formData.training_intensity}
                                onChange={(e) => setFormData({...formData, training_intensity: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Professional">Professional</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Weekly Training Sessions</label>
                            <input 
                                type="number"
                                min="1"
                                max="14"
                                value={formData.weekly_training_sessions}
                                onChange={(e) => setFormData({...formData, weekly_training_sessions: parseInt(e.target.value)})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-700/50 w-full my-6"></div>

                    {/* Injury History */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Have you had a previous injury?</label>
                            <div className="flex gap-4">
                                <label className="flex-1 flex items-center gap-3 p-4 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-500/10">
                                    <input 
                                        type="radio" 
                                        name="has_injury" 
                                        value="Yes"
                                        checked={formData.has_previous_injury === 'Yes'}
                                        onChange={(e) => setFormData({...formData, has_previous_injury: e.target.value})}
                                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                                    />
                                    <span className="text-slate-200 font-medium">Yes</span>
                                </label>
                                <label className="flex-1 flex items-center gap-3 p-4 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-500/10">
                                    <input 
                                        type="radio" 
                                        name="has_injury" 
                                        value="No"
                                        checked={formData.has_previous_injury === 'No'}
                                        onChange={(e) => setFormData({
                                            ...formData, 
                                            has_previous_injury: e.target.value,
                                            injury_recency: 'None',
                                            previous_injury_type: 'None'
                                        })}
                                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700"
                                    />
                                    <span className="text-slate-200 font-medium">No</span>
                                </label>
                            </div>
                        </div>

                        {formData.has_previous_injury === 'Yes' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Injury Recency</label>
                                    <select 
                                        value={formData.injury_recency}
                                        onChange={(e) => setFormData({...formData, injury_recency: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="None">Select Recency...</option>
                                        <option value="Under 3 Months">Under 3 Months</option>
                                        <option value="Under 6 Months">Under 6 Months</option>
                                        <option value="Under 12 Months">Under 12 Months</option>
                                        <option value="Over a Year">Over a Year</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-300">Injury Type / Location</label>
                                    <select 
                                        value={formData.previous_injury_type}
                                        onChange={(e) => setFormData({...formData, previous_injury_type: e.target.value})}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="None">Select Type...</option>
                                        <option value="Knee / ACL">Knee / ACL</option>
                                        <option value="Ankle Sprain">Ankle Sprain</option>
                                        <option value="Hip / Groin">Hip / Groin</option>
                                        <option value="Lower Back">Lower Back</option>
                                        <option value="Shoulder">Shoulder</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-700/50">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Saving Profile...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" /> Save Athlete Profile
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
