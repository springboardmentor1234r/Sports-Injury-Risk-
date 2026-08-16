import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import {
  Mail,
  Lock,
  LogIn,
  Activity,
  ShieldAlert,
  Sparkles,
  Check
} from 'lucide-react';


export const LoginPage = ({
  onOpenRegister
}) => {

  const { login } = useAuth();


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);


  // --------------------------------------------------
  // NORMAL LOGIN
  // --------------------------------------------------
  const handleSubmit = async (e) => {

    e.preventDefault();

    setError('');


    if (!email.trim() || !password) {

      setError(
        'Please enter email and password.'
      );

      return;
    }


    setLoading(true);


    const res =
      await login(
        email,
        password
      );


    setLoading(false);


    if (!res.success) {

      setError(
        'Invalid email or password. Please check the credentials you used when creating your account.'
      );

      return;
    }


    // Successful login is handled by AuthContext.
    // App.jsx will automatically switch to dashboard.
  };


  // --------------------------------------------------
  // DEMO QUICK LOGIN
  // --------------------------------------------------
  const handleQuickPreset = async (
    presetEmail
  ) => {

    setError('');

    setEmail(presetEmail);

    setPassword('password123');

    setLoading(true);


    const res =
      await login(
        presetEmail,
        'password123'
      );


    setLoading(false);


    if (!res.success) {

      setError(
        'Demo login failed.'
      );
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 glass-panel border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/40">


        {/* --------------------------------------------------
            LEFT SIDE
        -------------------------------------------------- */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative overflow-hidden">

          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>


          <div>

            <div className="flex items-center space-x-2 text-cyan-400 font-bold mb-6">

              <Activity className="w-6 h-6 stroke-[2.5]" />

              <span className="text-xl tracking-wider">
                ATHLETIQ AI
              </span>

            </div>


            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-4">
              Precision Biomechanics & Injury Prevention
            </h1>


            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Computer-vision pose estimation algorithms detecting ACL, hamstring, and joint overload risks directly from standard video feeds.
            </p>

          </div>


          <div className="space-y-3 pt-6 border-t border-slate-800/80 text-xs">

            <div className="flex items-center space-x-2 text-emerald-400 font-medium">

              <Check className="w-4 h-4 text-emerald-400 shrink-0" />

              <span>
                Multi-Camera Joint Trajectory Logging
              </span>

            </div>


            <div className="flex items-center space-x-2 text-cyan-400 font-medium">

              <Check className="w-4 h-4 text-cyan-400 shrink-0" />

              <span>
                Role-Based Analytics (5 Custom Dashboards)
              </span>

            </div>


            <div className="flex items-center space-x-2 text-purple-400 font-medium">

              <Check className="w-4 h-4 text-purple-400 shrink-0" />

              <span>
                Automated ACWR Fatigue & Risk Warnings
              </span>

            </div>

          </div>

        </div>


        {/* --------------------------------------------------
            RIGHT SIDE
        -------------------------------------------------- */}
        <div className="lg:col-span-7 p-6 sm:p-10 bg-slate-900/90 flex flex-col justify-center">


          <div className="mb-6">

            <h2 className="text-xl font-bold text-white">
              Sign In to Dashboard
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Enter your registered email and password
            </p>

          </div>


          {/* Error */}
          {error && (

            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">

              <ShieldAlert className="w-4 h-4 shrink-0" />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* --------------------------------------------------
              DEMO QUICK LOGIN
          -------------------------------------------------- */}
          <div className="mb-6 bg-slate-950/80 border border-slate-800 rounded-xl p-3">

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">

              <span className="flex items-center gap-1.5 text-cyan-400">

                <Sparkles className="w-3.5 h-3.5" />

                Instant Evaluator Quick-Login:

              </span>

            </div>


            <div className="flex flex-wrap gap-1.5">

              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'athlete@sportsmed.io'
                  )
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-800/60 rounded-lg transition-colors"
              >
                🏃 Athlete
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'coach@sportsmed.io'
                  )
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-lg transition-colors"
              >
                📋 Coach
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'physio@sportsmed.io'
                  )
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-amber-950 text-amber-300 border border-amber-800/60 rounded-lg transition-colors"
              >
                🩺 Physio
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'scientist@sportsmed.io'
                  )
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-800/60 rounded-lg transition-colors"
              >
                🔬 Scientist
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'admin@sportsmed.io'
                  )
                }
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-800/60 rounded-lg transition-colors"
              >
                ⚙️ Admin
              </button>

            </div>

          </div>


          {/* --------------------------------------------------
              LOGIN FORM
          -------------------------------------------------- */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>


              <div className="relative">

                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="your@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />

              </div>

            </div>


            {/* Password */}
            <div>

              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>


              <div className="relative">

                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />

              </div>

            </div>


            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >

              <LogIn className="w-4 h-4 stroke-[2.5]" />

              {loading
                ? 'Authenticating...'
                : 'Sign In'
              }

            </button>

          </form>


          {/* --------------------------------------------------
              SOCIAL / DEMO BUTTONS
          -------------------------------------------------- */}
          <div className="mt-6 pt-4 border-t border-slate-800">

            <p className="text-[11px] text-center text-slate-500 mb-3 uppercase tracking-wider font-semibold">
              Or continue with Social Identity
            </p>


            <div className="grid grid-cols-3 gap-2">

              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'athlete@sportsmed.io'
                  )
                }
                className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-medium transition-colors"
              >
                Google
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'coach@sportsmed.io'
                  )
                }
                className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-medium transition-colors"
              >
                Microsoft
              </button>


              <button
                type="button"
                onClick={() =>
                  handleQuickPreset(
                    'physio@sportsmed.io'
                  )
                }
                className="py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-medium transition-colors"
              >
                Apple ID
              </button>

            </div>

          </div>


          {/* --------------------------------------------------
              REGISTER
          -------------------------------------------------- */}
          <div className="mt-6 text-center text-xs text-slate-400">

            Need a new account?{' '}

            <button
              onClick={onOpenRegister}
              className="text-cyan-400 font-semibold hover:underline"
            >
              Register & Onboard
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};