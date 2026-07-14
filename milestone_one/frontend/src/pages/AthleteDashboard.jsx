import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import athleteApi from '../services/athleteApi';
import AthleteProfileCard from '../components/AthleteProfileCard';
import InjuryHistoryTable from '../components/InjuryHistoryTable';

export default function AthleteDashboard() {
  const { athleteId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [athlete, setAthlete] = useState(null);
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [injuryType, setInjuryType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [severity, setSeverity] = useState('mild');
  const [recoveryStatus, setRecoveryStatus] = useState('recovering');
  const [notes, setNotes] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // In a real app, we check if athleteId is available, otherwise show placeholder or fallback
      let activeId = athleteId;
      if (!activeId) {
        setError('No athlete ID specified in the URL.');
        setLoading(false);
        return;
      }

      const athleteData = await athleteApi.getAthlete(activeId);
      setAthlete(athleteData);
      setInjuries(athleteData.injury_history || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load athlete profile. Please verify the ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [athleteId]);

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    if (!injuryType || !bodyPart || !dateOccurred || !severity || !recoveryStatus) {
      setModalError('All fields except notes are required.');
      setModalLoading(false);
      return;
    }

    try {
      await athleteApi.addInjury(athlete.id, {
        injury_type: injuryType,
        body_part: bodyPart,
        date_occurred: new Date(dateOccurred).toISOString(),
        severity,
        recovery_status: recoveryStatus,
        notes,
      });

      // Clear fields and close
      setInjuryType('');
      setBodyPart('');
      setDateOccurred('');
      setSeverity('mild');
      setRecoveryStatus('recovering');
      setNotes('');
      setShowModal(false);

      // Refresh data
      await fetchData();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to save injury entry.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Athlete Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-900 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:text-white transition-colors text-slate-400 text-sm font-semibold">
            ← Back to Home
          </button>
          <span className="font-bold text-lg text-slate-200">
            Athlete Management
          </span>
          <div className="text-sm text-slate-400">
            User: <strong className="text-slate-200">{user?.email}</strong>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 flex-grow w-full">
        {error ? (
          <div className="p-6 bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-2xl text-center">
            {error}
          </div>
        ) : (
          <>
            {athlete && (
              <AthleteProfileCard athlete={athlete} onUpdate={(updated) => setAthlete(updated)} />
            )}

            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-sm"
              >
                + Add Injury Record
              </button>
            </div>

            <InjuryHistoryTable injuries={injuries} />
          </>
        )}
      </main>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Add New Injury Record
            </h3>

            {modalError && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Injury Type</label>
                <input
                  type="text"
                  value={injuryType}
                  onChange={(e) => setInjuryType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Hamstring Strain"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Body Part</label>
                  <input
                    type="text"
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Left Thigh"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={dateOccurred}
                    onChange={(e) => setDateOccurred(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Recovery Status</label>
                  <input
                    type="text"
                    value={recoveryStatus}
                    onChange={(e) => setRecoveryStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Recovering"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors h-24"
                  placeholder="Additional details regarding the event or treatment plan..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-xl text-slate-400 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                >
                  {modalLoading ? 'Saving...' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        © 2026 Aegis Motion. All rights reserved.
      </footer>
    </div>
  );
}
