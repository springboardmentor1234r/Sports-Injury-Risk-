import React, { useState } from 'react';
import athleteApi from '../services/athleteApi';

export default function AthleteProfileCard({ athlete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [sportType, setSportType] = useState(athlete.sport_type || '');
  const [position, setPosition] = useState(athlete.position || '');
  const [age, setAge] = useState(athlete.age || '');
  const [height, setHeight] = useState(athlete.height || '');
  const [weight, setWeight] = useState(athlete.weight || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const updated = await athleteApi.updateAthlete(athlete.id, {
        sport_type: sportType,
        position,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
      });
      setIsEditing(false);
      onUpdate(updated);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update athlete profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Athlete Profile Card
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Sport Type</label>
            <input
              type="text"
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Football"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Midfielder"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. 23"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Height (cm)</label>
            <input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. 182.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. 78.4"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-400 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Sport</span>
            <span className="text-lg font-bold text-slate-200">{athlete.sport_type || '—'}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Position</span>
            <span className="text-lg font-bold text-slate-200">{athlete.position || '—'}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Age</span>
            <span className="text-lg font-bold text-slate-200">{athlete.age || '—'}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Height</span>
            <span className="text-lg font-bold text-slate-200">{athlete.height ? `${athlete.height} cm` : '—'}</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/50">
            <span className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-semibold">Weight</span>
            <span className="text-lg font-bold text-slate-200">{athlete.weight ? `${athlete.weight} kg` : '—'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
