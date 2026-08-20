import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import {
  AthleteOnboardingWizard
} from './AthleteOnboardingWizard';

import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  X,
  Activity
} from 'lucide-react';


export const RegisterModal = ({
  isOpen,
  onClose,
  onSwitchToLogin
}) => {

  const {
    register,
    saveAthleteProfile
  } = useAuth();


  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Athlete'
  });


  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [
    showAthleteWizard,
    setShowAthleteWizard
  ] = useState(false);


  if (!isOpen) return null;


  // --------------------------------------------------
  // HANDLE INPUT CHANGE
  // --------------------------------------------------
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value
    });
  };


  // --------------------------------------------------
  // INITIAL REGISTRATION
  // --------------------------------------------------
  const handleInitialSubmit = async (e) => {

    e.preventDefault();

    setError('');


    if (
      !formData.full_name.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {

      setError(
        'Please fill in all required fields.'
      );

      return;
    }


    if (formData.password.length < 6) {

      setError(
        'Password must be at least 6 characters.'
      );

      return;
    }


    // Athlete goes through onboarding wizard
    if (formData.role === 'Athlete') {

      setShowAthleteWizard(true);

      return;
    }


    // Other roles register directly
    setLoading(true);


    const res =
      await register(formData);


    setLoading(false);


    if (res.success) {

      // Registration completed.
      // Return to Login page.
      onClose();

      // Clear registration form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'Athlete'
      });

    } else {

      setError(
        res.error ||
        'Registration failed. Email may already exist.'
      );
    }
  };


  // --------------------------------------------------
  // ATHLETE WIZARD COMPLETE
  // --------------------------------------------------
  const handleWizardComplete = async (
    fullData
  ) => {

    setLoading(true);


    try {

      // Register the main account
      const regRes =
        await register(fullData.user);


      if (!regRes.success) {

        setError(
          regRes.error ||
          'Registration error during onboarding.'
        );

        setLoading(false);

        return;
      }


      // Save athlete profile
      await saveAthleteProfile(
        fullData.profile
      );


      setLoading(false);


      // Registration finished.
      // Return to Login page.
      onClose();


      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'Athlete'
      });

      setShowAthleteWizard(false);

    } catch (error) {

      console.error(
        'Athlete registration error:',
        error
      );

      setLoading(false);

      setError(
        'Registration error during onboarding.'
      );
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">

      {showAthleteWizard ? (

        <AthleteOnboardingWizard
          initialUserData={formData}

          onComplete={
            handleWizardComplete
          }

          onCancel={() =>
            setShowAthleteWizard(false)
          }
        />

      ) : (

        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/30">

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>


          {/* Header */}
          <div className="mb-6 text-center">

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 mb-3">

              <Activity className="w-6 h-6" />

            </div>


            <h2 className="text-xl font-bold text-white">
              Create Athletiq AI Account
            </h2>


            <p className="text-xs text-slate-400 mt-1">
              Join the AI Sports Injury Prevention Network
            </p>

          </div>


          {/* Error */}
          {error && (

            <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">

              {error}

            </div>

          )}


          {/* Registration Form */}
          <form
            onSubmit={handleInitialSubmit}
            className="space-y-4"
          >

            {/* Full Name */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Full Name
              </label>

              <div className="relative">

                <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />

                <input
                  type="text"
                  name="full_name"
                  placeholder="e.g. Dr. Alex Morgan"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />

              </div>

            </div>


            {/* Email */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Work / Professional Email
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />

                <input
                  type="email"
                  name="email"
                  placeholder="alex@sportsmed.io"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />

              </div>

            </div>


            {/* Password */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>

              <div className="relative">

                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />

                <input
                  type="password"
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />

              </div>

            </div>


            {/* Role */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select System Role (RBAC)
              </label>

              <div className="relative">

                <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-cyan-400" />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >

                  <option value="Athlete">
                    Athlete (Triggers Physical Onboarding)
                  </option>

                  <option value="Coach">
                    Coach / Athletic Director
                  </option>

                  <option value="Physiotherapist">
                    Physiotherapist / Sports Medic
                  </option>

                  <option value="Sports Scientist">
                    Sports Scientist / Biomechanist
                  </option>

                  <option value="Administrator">
                    System Administrator
                  </option>

                </select>

              </div>

            </div>


            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold text-black text-sm hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
            >

              {loading
                ? 'Processing...'
                : formData.role === 'Athlete'
                  ? 'Continue to Athlete Onboarding →'
                  : 'Complete Registration'
              }

            </button>

          </form>


          {/* Login */}
          <div className="mt-6 text-center text-xs text-slate-400">

            Already have an account?{' '}

            <button
              onClick={onSwitchToLogin}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Sign In
            </button>

          </div>

        </div>
      )}

    </div>
  );
};