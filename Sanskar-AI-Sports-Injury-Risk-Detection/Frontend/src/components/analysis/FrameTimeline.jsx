import React from 'react';
import { formatConfidence } from './analysisFormatters';

const FrameTimeline = ({ frames }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <h2 className="text-lg font-bold text-white">Frame Timeline</h2><p className="mt-1 text-sm text-slate-400">Existing movement status and analysis quality for each frame.</p>
    <div className="mt-5 space-y-3">{frames?.length ? frames.map((frame, index) => <article key={frame.framePath || index} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-[110px_1fr_auto] md:items-center"><p className="font-semibold text-white">Frame {index + 1}</p><p className="text-sm text-slate-300">{frame?.movementAnalysis?.overallStatus || 'Unavailable'}</p><p className="text-xs font-medium text-slate-400">Quality: {formatConfidence(frame?.analysisQuality?.confidence)}</p></article>) : <p className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">No frame timeline returned.</p>}</div>
  </section>
);

export default FrameTimeline;

