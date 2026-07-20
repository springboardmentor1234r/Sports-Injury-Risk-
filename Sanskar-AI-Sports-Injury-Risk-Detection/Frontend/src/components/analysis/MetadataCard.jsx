import React from 'react';
import { formatConfidence, formatTimestamp } from './analysisFormatters';

const MetadataCard = ({ metadata }) => {
  const items = [
    ['Frames Analyzed', metadata?.framesAnalyzed ?? 'Unavailable'],
    ['Analysis Confidence', formatConfidence(metadata?.analysisConfidence)],
    ['Report Version', metadata?.reportVersion || 'Unavailable'],
    ['Generated Time', formatTimestamp(metadata?.generatedAt)],
  ];

  return <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6"><h2 className="text-lg font-bold text-white">Analysis Metadata</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{items.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-200">{value}</p></div>)}</div></section>;
};

export default MetadataCard;

