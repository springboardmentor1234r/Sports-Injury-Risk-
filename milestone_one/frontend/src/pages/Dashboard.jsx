import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import athleteApi from '../services/athleteApi';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State for creating a new profile
  const [targetUserId, setTargetUserId] = useState('');
  const [sportType, setSportType] = useState('');
  const [position, setPosition] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAthletes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await athleteApi.listAthletes();
      setAthletes(data);
    } catch (err) {
      setError('Failed to load athlete profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!targetUserId) {
      setFormError('User ID is required.');
      setFormLoading(false);
      return;
    }

    try {
      await athleteApi.createAthlete({
        user_id: targetUserId,
        sport_type: sportType,
        position,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      });
      // Reset Form
      setTargetUserId('');
      setSportType('');
      setPosition('');
      setAge('');
      setHeight('');
      setWeight('');
      // Refresh list
      await fetchAthletes();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create profile.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isStaff = user?.role === 'coach' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Aegis Motion Dashboard
          </span>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400 hidden sm:block">
              Logged in as: <strong className="text-slate-200">{user?.email}</strong> ({user?.role})
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: List of athletes */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {isStaff ? 'Manage Athletes' : 'My Profile Dashboard'}
          </h2>

          {loading ? (
            <div className="py-10 text-slate-500 text-sm">Loading athlete records...</div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 rounded-xl text-sm mb-6">{error}</div>
          ) : athletes.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 border border-slate-850 rounded-2xl">
              <p className="text-slate-500 text-sm mb-2">No athlete profiles found.</p>
              {!isStaff && (
                <p className="text-xs text-slate-500">
                  Ask your coach or administrator to create your Athlete Profile using your User ID: <strong className="text-slate-300 select-all">{user?.id}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {athletes.map((athlete) => (
                <Link
                  key={athlete.id}
                  to={`/athlete-dashboard/${athlete.id}`}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-6 rounded-2xl transition-all shadow-lg hover:shadow-indigo-600/5 block group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {athlete.sport_type || 'Unknown Sport'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">{athlete.position || 'No Position'}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Profile Active
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-850">
                    <div>Age: <strong className="text-slate-300">{athlete.age || '—'}</strong></div>
                    <div>Height: <strong className="text-slate-300">{athlete.height ? `${athlete.height}cm` : '—'}</strong></div>
                    <div>Weight: <strong className="text-slate-300">{athlete.weight ? `${athlete.weight}kg` : '—'}</strong></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Tools (e.g. Create Profile form) */}
        {isStaff && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Create Athlete Profile
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">User ID</label>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="Athlete User UUID"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Copy user ID from registration or DB. Current user: {user?.id}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Sport Type</label>
                <input
                  type="text"
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="e.g. Football"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Position</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  placeholder="e.g. Goalkeeper"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 mt-4 cursor-pointer"
              >
                {formLoading ? 'Creating...' : 'Create Profile'}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        © 2026 Aegis Motion. All rights reserved.
      </footer>
    </div>
  );
}
