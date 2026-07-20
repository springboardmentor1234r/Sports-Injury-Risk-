import React from 'react';

const AnalysisReportCard = ({ report }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <h2 className="text-lg font-bold text-white">Analysis Report</h2>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Movement Summary</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{report?.movementSummary || 'No movement summary returned.'}</p></article>
      <article className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recommendation Summary</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{report?.recommendationSummary || 'No recommendation summary returned.'}</p></article>
    </div>
    <div className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Key Findings</h3><ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">{report?.keyFindings?.length ? report.keyFindings.map((finding, index) => <li key={`${finding}-${index}`} className="flex gap-2"><span className="text-brand-400">•</span>{finding}</li>) : <li className="text-slate-400">No key findings returned.</li>}</ul></div>
  </section>
);

export default AnalysisReportCard;

