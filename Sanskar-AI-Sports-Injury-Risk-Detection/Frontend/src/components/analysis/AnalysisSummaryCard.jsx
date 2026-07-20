import React from 'react';
import { formatRiskScore, getRiskBadgeClass } from './analysisFormatters';

const AnalysisSummaryCard = ({ report }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analysis Summary</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{report?.overallMovementQuality || 'Unavailable'}</h2>
      </div>
      <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeClass(report?.riskLevel)}`}>{report?.riskLevel || 'Unknown'} Risk</span>
    </div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs text-slate-500">Risk Score</p><p className="mt-1 text-lg font-semibold text-white">{formatRiskScore(report?.riskScore)}</p></div>
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs text-slate-500">Overall Conclusion</p><p className="mt-1 text-sm leading-relaxed text-slate-300">{report?.overallConclusion || 'No conclusion was returned.'}</p></div>
    </div>
  </section>
);

export default AnalysisSummaryCard;

