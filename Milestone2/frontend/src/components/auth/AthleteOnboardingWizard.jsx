import React, { useState } from 'react';
import { Shield, Activity, Plus, Trash2, CheckCircle2, ChevronRight, ChevronLeft, Dumbbell, AlertTriangle } from 'lucide-react';

export const AthleteOnboardingWizard = ({ initialUserData, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  
  // Step 1 & 2 State
  const [profileData, setProfileData] = useState({
    athlete_id: `ATH-${Math.floor(1000 + Math.random() * 9000)}`,
    sport_type: 'Soccer',
    position: 'Forward',
    age: 24,
    height: 178,
    weight: 74,
    training_load: 1.35,
  });

  // Step 3 State: Injury History List
  const [injuries, setInjuries] = useState([
    { injury_type: 'Left ACL Tear', recovery_status: 'Recovered', date_of_injury: '2023-11-10' }
  ]);
  const [newInjury, setNewInjury] = useState({ injury_type: '', recovery_status: 'Recovered', date_of_injury: '' });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'height' || name === 'weight' || name === 'training_load' ? Number(value) : value
    }));
  };

  const addInjury = () => {
    if (!newInjury.injury_type || !newInjury.date_of_injury) return;
    setInjuries(prev => [...prev, newInjury]);
    setNewInjury({ injury_type: '', recovery_status: 'Recovered', date_of_injury: '' });
  };

  const removeInjury = (index) => {
    setInjuries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = () => {
    const payload = {
      user: initialUserData,
      profile: {
        ...profileData,
        injury_history: injuries
      }
    };
    onComplete(payload);
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40">
      
      {/* Wizard Header & Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-cyan-400" />
              Athlete Biomechanical Onboarding
            </h2>
            <p className="text-xs text-slate-400">Step {step} of 3 — Setup your baseline physical profile</p>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full">
            {step === 1 ? '33% Completed' : step === 2 ? '66% Completed' : '100% Ready'}
          </span>
        </div>

        {/* Step Indicator Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
          <div className={`h-full bg-cyan-400 transition-all duration-300 ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>
      </div>

      {/* STEP 1: Athletic Profile & Sport Credentials */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">1. Sport & Identity Credentials</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Generated Athlete ID</label>
              <input
                type="text"
                name="athlete_id"
                value={profileData.athlete_id}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-cyan-400 font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Sport Type</label>
              <select
                name="sport_type"
                value={profileData.sport_type}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
              >
                <option value="Soccer">Soccer / Football</option>
                <option value="Basketball">Basketball</option>
                <option value="Track & Field">Track & Field / Sprinting</option>
                <option value="Tennis">Tennis</option>
                <option value="Rugby">Rugby</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Crossfit">Crossfit / Powerlifting</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Field Position / Role</label>
              <input
                type="text"
                name="position"
                placeholder="e.g. Winger / Guard / Point Guard"
                value={profileData.position}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Current Age (Years)</label>
              <input
                type="number"
                name="age"
                value={profileData.age}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Physical Metrics & Training Load */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">2. Biomechanical & Physical Measurements</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={profileData.height}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Body Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={profileData.weight}
                onChange={handleProfileChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300">Baseline Training Load (ACWR Index: 0.5 - 2.0)</label>
              <span className="text-xs font-bold text-cyan-400">{profileData.training_load} ACWR</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              name="training_load"
              value={profileData.training_load}
              onChange={handleProfileChange}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.5 (Under-training)</span>
              <span className="text-emerald-400 font-semibold">1.0 - 1.3 (Optimal Zone)</span>
              <span className="text-rose-400 font-semibold">1.5+ (High Fatigue Risk)</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Injury History Log */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">3. Previous Injury History Records</h3>
            <span className="text-xs text-slate-400">{injuries.length} record(s) listed</span>
          </div>

          {/* Add New Injury Inline Form */}
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Injury Type (e.g. Hamstring Strain)"
                value={newInjury.injury_type}
                onChange={(e) => setNewInjury({ ...newInjury, injury_type: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
              <select
                value={newInjury.recovery_status}
                onChange={(e) => setNewInjury({ ...newInjury, recovery_status: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              >
                <option value="Fully Recovered">Fully Recovered</option>
                <option value="Active Rehab">Active Rehab</option>
                <option value="Chronic / Monitored">Chronic / Monitored</option>
              </select>
              <input
                type="date"
                value={newInjury.date_of_injury}
                onChange={(e) => setNewInjury({ ...newInjury, date_of_injury: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 outline-none"
              />
            </div>
            <button
              onClick={addInjury}
              type="button"
              className="w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 font-medium text-xs rounded flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Injury Record
            </button>
          </div>

          {/* Injuries List Display */}
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {injuries.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-3">No past injuries logged. Clean medical record.</p>
            ) : (
              injuries.map((inj, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{inj.injury_type}</span>
                    <span className="ml-2 text-[10px] text-slate-400">({inj.date_of_injury})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                      inj.recovery_status.includes('Recovered') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {inj.recovery_status}
                    </span>
                    <button onClick={() => removeInjury(idx)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-lg transition-all shadow-md shadow-cyan-500/20"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmitAll}
            className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all shadow-lg shadow-emerald-500/25"
          >
            <CheckCircle2 className="w-4 h-4" /> Complete Onboarding & Save Profile
          </button>
        )}
      </div>

    </div>
  );
};
