import React from 'react';

const calculateAgeFromDob = (dateOfBirth) => {
  if (!dateOfBirth) return '—';

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasHadBirthday = today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (hasHadBirthday) {
    age -= 1;
  }

  return age >= 0 ? age : '—';
};

const AthleteTable = ({ athletes, loading, onEdit, onDelete, deletingId }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        Loading athletes...
      </div>
    );
  }

  if (!athletes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
        No athletes yet. Add your first athlete profile to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
      <table className="min-w-full text-left text-sm text-slate-300">
        <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3">Full Name</th>
            <th className="px-4 py-3">Sport</th>
            <th className="px-4 py-3">Position</th>
            <th className="px-4 py-3">Age</th>
            <th className="px-4 py-3">Training Load</th>
            <th className="px-4 py-3">Created Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {athletes.map((athlete) => (
            <tr key={athlete._id} className="border-b border-slate-800/70 last:border-b-0 hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium text-white">{athlete.fullName}</td>
              <td className="px-4 py-3">{athlete.sport}</td>
              <td className="px-4 py-3">{athlete.playingPosition}</td>
              <td className="px-4 py-3">{calculateAgeFromDob(athlete.dateOfBirth)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-slate-700 bg-slate-800/70 px-2.5 py-1 text-xs text-slate-300">
                  {athlete.trainingLoad}
                </span>
              </td>
              <td className="px-4 py-3">{new Date(athlete.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit?.(athlete)}
                    disabled={deletingId === athlete._id}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(athlete)}
                    disabled={deletingId === athlete._id}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === athlete._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AthleteTable;
