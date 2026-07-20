import React from 'react';

const ExerciseRecommendationCard = ({ recommendations }) => (
  <section className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6">
    <h2 className="text-lg font-bold text-white">Exercise Recommendations</h2>
    <p className="mt-1 text-sm text-slate-400">Guidance returned by the existing rule-based recommendation engine.</p>
    <div className="mt-5"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Priority Areas</h3><div className="mt-3 flex flex-wrap gap-2">{recommendations?.priorityAreas?.length ? recommendations.priorityAreas.map((area) => <span key={area} className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-200">{area}</span>) : <span className="text-sm text-slate-400">General movement</span>}</div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">{recommendations?.recommendations?.length ? recommendations.recommendations.map((item, index) => <article key={`${item.exercise}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-brand-300">{item.category}</p><h3 className="mt-1 font-semibold text-white">{item.exercise}</h3><p className="mt-2 text-xs text-slate-400">{item.targetArea}</p><p className="mt-3 text-sm leading-relaxed text-slate-300">{item.guidance}</p></article>) : <p className="text-sm text-slate-400">No recommendations returned.</p>}</div>
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activity Guidance</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{recommendations?.activityGuidance || 'No activity guidance returned.'}</p></div>
  </section>
);

export default ExerciseRecommendationCard;

