import React from 'react';
import { formatRiskScore, getRiskBadgeClass } from './analysisFormatters';

const RiskPredictionCard = ({ prediction }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold text-white">Risk Prediction</h2><p className="mt-1 text-sm text-slate-400">Explainable movement-pattern indicator.</p></div><span className={`rounded-full border px-3 py-1 text-xs font-bold ${getRiskBadgeClass(prediction?.riskLevel)}`}>{prediction?.riskLevel || 'Unknown'}</span></div>
    <p className="mt-5 text-2xl font-bold text-white">{formatRiskScore(prediction?.riskScore)}</p>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contributing Joints</h3><div className="mt-3 flex flex-wrap gap-2">{prediction?.contributingJoints?.length ? prediction.contributingJoints.map((joint) => <span key={joint.joint} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300">{joint.label || joint.joint}</span>) : <span className="text-sm text-slate-400">None reported</span>}</div></div>
      <div><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contributing Factors</h3><ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">{prediction?.contributingFactors?.length ? prediction.contributingFactors.map((factor, index) => <li key={`${factor}-${index}`} className="flex gap-2"><span className="text-brand-400">•</span>{factor}</li>) : <li className="text-slate-400">No contributing factors reported.</li>}</ul></div>
    </div>
  </section>
);

export default RiskPredictionCard;

