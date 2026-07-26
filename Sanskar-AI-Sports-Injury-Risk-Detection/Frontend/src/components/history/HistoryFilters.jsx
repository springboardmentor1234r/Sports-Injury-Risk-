import React from 'react';

const RISK_LEVELS = ['Very Low', 'Low', 'Moderate', 'High', 'Critical'];

const HistoryFilters = ({ filters, athletes, onChange }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-4">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input value={filters.search} onChange={(event) => onChange({ ...filters, search: event.target.value, page: 1 })} placeholder="Search athlete or video" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500" />
      <select value={filters.athleteId} onChange={(event) => onChange({ ...filters, athleteId: event.target.value, page: 1 })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500"><option value="">All athletes</option>{athletes.map((athlete) => <option key={athlete._id} value={athlete._id}>{athlete.fullName}</option>)}</select>
      <select value={filters.riskLevel} onChange={(event) => onChange({ ...filters, riskLevel: event.target.value, page: 1 })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500"><option value="">All risk levels</option>{RISK_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}</select>
      <select value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value, page: 1 })} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-500"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
    </div>
  </section>
);

export default HistoryFilters;

