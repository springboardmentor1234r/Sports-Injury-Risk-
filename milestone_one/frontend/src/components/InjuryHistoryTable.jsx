import React from 'react';

export default function InjuryHistoryTable({ injuries }) {
  // Sort by date_occurred (most recent first)
  const sortedInjuries = [...injuries].sort((a, b) => {
    return new Date(b.date_occurred) - new Date(a.date_occurred);
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'mild':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Mild
          </span>
        );
      case 'moderate':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            Moderate
          </span>
        );
      case 'severe':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            Severe
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            {severity}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
        Injury History Log
      </h3>

      {sortedInjuries.length === 0 ? (
        <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-850">
          <p className="text-slate-500 text-sm">No injury records found for this athlete.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-4">Injury Type</th>
                <th className="py-4 px-4">Body Part</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Severity</th>
                <th className="py-4 px-4">Recovery Status</th>
                <th className="py-4 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/50">
              {sortedInjuries.map((injury) => (
                <tr key={injury.id} className="hover:bg-slate-850/30 transition-colors">
                  <td className="py-4 px-4 font-semibold text-slate-200">{injury.injury_type}</td>
                  <td className="py-4 px-4">{injury.body_part}</td>
                  <td className="py-4 px-4">{formatDate(injury.date_occurred)}</td>
                  <td className="py-4 px-4">{getSeverityBadge(injury.severity)}</td>
                  <td className="py-4 px-4">
                    <span className="text-slate-400 capitalize">{injury.recovery_status}</span>
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-400 max-w-xs truncate">{injury.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
