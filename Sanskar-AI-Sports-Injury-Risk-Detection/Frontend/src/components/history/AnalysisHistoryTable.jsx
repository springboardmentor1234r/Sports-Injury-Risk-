import React from 'react';
import { formatRiskScore, formatTimestamp, getRiskBadgeClass } from '../analysis/analysisFormatters';

const AnalysisHistoryTable = ({ items, onView, onDelete, deletingId }) => (
  <div className="overflow-x-auto rounded-2xl border border-slate-800">
    <table className="min-w-full text-left text-sm"><thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Athlete</th><th className="px-4 py-3">Video</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Frames</th><th className="px-4 py-3">Analyzed</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-slate-800 bg-slate-900/30">{items.length ? items.map((item) => <tr key={item._id} className="text-slate-300"><td className="px-4 py-3"><p className="font-medium text-white">{item.athleteId?.fullName || 'Unknown athlete'}</p><p className="text-xs text-slate-500">{item.athleteId?.sport || ''}</p></td><td className="max-w-48 truncate px-4 py-3">{item.video?.originalFileName}</td><td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getRiskBadgeClass(item.riskLevel)}`}>{item.riskLevel} · {formatRiskScore(item.riskScore)}</span></td><td className="px-4 py-3">{item.frameCount}</td><td className="px-4 py-3 text-xs text-slate-400">{formatTimestamp(item.createdAt)}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => onView(item._id)} className="rounded-lg border border-brand-500/40 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:bg-brand-500/10">View</button><button onClick={() => onDelete(item)} disabled={deletingId === item._id} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60">{deletingId === item._id ? 'Deleting…' : 'Delete'}</button></div></td></tr>) : <tr><td colSpan="6" className="px-4 py-10 text-center text-slate-400">No saved analyses match these filters.</td></tr>}</tbody></table>
  </div>
);

export default AnalysisHistoryTable;

