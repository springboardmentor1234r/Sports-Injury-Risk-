import React, { useState } from 'react';
import { Lightbulb, Info, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import RiskCategoryBadge from './RiskCategoryBadge';

const RecommendationCards = ({ recommendations }) => {
  const [activeTab, setActiveTab] = useState('All');

  // Groups/tabs filters
  const tabs = [
    'All',
    'Corrective Exercises',
    'Mobility',
    'Strengthening',
    'Recovery',
    'Training/Load Modification'
  ];

  const getFilteredRecs = () => {
    if (activeTab === 'All') return recommendations;
    return recommendations.filter(r => r.recommendation_type === activeTab);
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'bg-hud-danger/10 border-hud-danger/30 text-hud-danger';
      case 'high':
        return 'bg-hud-warning/10 border-hud-warning/30 text-hud-warning';
      case 'medium':
      case 'moderate':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'low':
      default:
        return 'bg-hud-green/10 border-hud-green/30 text-hud-green';
    }
  };

  const filtered = getFilteredRecs();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hud-border pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block">Guidance System</span>
          <h3 className="text-sm font-bold text-white uppercase">Suggested Actionable Interventions</h3>
        </div>
        <div className="flex items-center gap-1.5 text-hud-green bg-hud-green-glow border border-hud-green/20 px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-widest">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Recommendations active</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map((tab) => {
          const count = tab === 'All' ? recommendations.length : recommendations.filter(r => r.recommendation_type === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-hud-blue border-hud-blue text-white shadow-md'
                  : 'bg-hud-dark/50 border-hud-border text-gray-400 hover:text-white hover:border-hud-blue/50'
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab ? 'bg-white/20 text-white' : 'bg-hud-dark text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((r, idx) => (
            <div 
              key={idx}
              className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between hover:border-hud-blue/30 transition-all duration-300"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-bold text-hud-blue uppercase tracking-wider bg-hud-blue/10 px-2 py-0.5 rounded border border-hud-blue/10">
                    {r.recommendation_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${getPriorityStyle(r.priority)}`}>
                    Priority: {r.priority}
                  </span>
                </div>
                
                <h4 className="text-sm font-bold text-white uppercase">{r.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{r.description}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-hud-border/40 text-xs">
                {/* Related elements */}
                <div className="flex flex-wrap gap-2 text-[9px]">
                  {r.related_risk && (
                    <span className="text-gray-400 flex items-center gap-1 bg-hud-dark px-2 py-0.5 rounded">
                      <Target className="w-3 h-3 text-hud-blue" />
                      Risk: {r.related_risk}
                    </span>
                  )}
                  {r.related_anomaly && (
                    <span className="text-gray-400 flex items-center gap-1 bg-hud-dark px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-hud-warning" />
                      Anomaly: {r.related_anomaly}
                    </span>
                  )}
                </div>
                
                {/* Evidence Reasoning */}
                <div className="p-2.5 rounded bg-hud-dark/50 border border-hud-border/50 text-[10px] text-gray-400 flex items-start gap-2 leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-hud-blue flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-bold text-white uppercase tracking-wider block text-[8px] mb-0.5">Evidence Logic:</span>
                    {r.reason_evidence}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-8 text-center text-gray-500 space-y-2">
            <ShieldCheck className="w-8 h-8 text-hud-green mx-auto mb-2" />
            <p className="text-xs">No active recommendations in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCards;
