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
      <div className="rounded-2xl border border-brand-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading athletes...
      </div>
    );
  }

  if (!athletes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-8 text-center text-sm text-slate-500">
        No athletes yet. Add your first athlete profile to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-200 bg-white shadow-[0_10px_30px_rgba(234,88,12,0.08)]">
      <table className="min-w-full text-left text-sm text-slate-600">
        <thead className="bg-gradient-to-r from-brand-500 to-brand-600 text-xs uppercase tracking-wider text-white">
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
            <tr key={athlete._id} className="border-b border-brand-100 last:border-b-0 hover:bg-brand-50/70">
              <td className="px-4 py-3 font-semibold text-slate-800">{athlete.fullName}</td>
              <td className="px-4 py-3">{athlete.sport}</td>
              <td className="px-4 py-3">{athlete.playingPosition}</td>
              <td className="px-4 py-3">{calculateAgeFromDob(athlete.dateOfBirth)}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
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
                    className="rounded-lg border border-brand-400 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:-translate-y-0.5 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(athlete)}
                    disabled={deletingId === athlete._id}
                    className="rounded-lg border border-red-400 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
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
