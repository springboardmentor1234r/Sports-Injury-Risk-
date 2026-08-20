import React, { useState } from 'react';
import { Lightbulb, Dumbbell, Award, Flame, RefreshCcw } from 'lucide-react';

const RecommendationSummary = ({ recommendations }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  if (!recommendations || recommendations.length === 0) return null;

  // Filter keys
  const categories = ['ALL', ...new Set(recommendations.map(r => r.recommendation_type || 'Exercise'))];

  const getFilteredRecs = () => {
    if (activeTab === 'ALL') return recommendations;
    return recommendations.filter(r => r.recommendation_type === activeTab);
  };

  const getPriorityColor = (priority) => {
    if (priority?.toUpperCase() === 'HIGH') return 'text-hud-danger border-hud-danger/25 bg-hud-danger/5';
    if (priority?.toUpperCase() === 'MEDIUM') return 'text-hud-warning border-hud-warning/25 bg-hud-warning/5';
    return 'text-hud-green border-hud-green/25 bg-hud-green/5';
  };

  const getTabIcon = (type) => {
    switch (type.toUpperCase()) {
      case 'STRENGTHENING': return <Dumbbell className="w-3.5 h-3.5" />;
      case 'MOBILITY': return <Award className="w-3.5 h-3.5" />;
      case 'RECOVERY': return <Flame className="w-3.5 h-3.5" />;
      default: return <Lightbulb className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="hud-glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-hud-border pb-3">
        <Lightbulb className="w-4.5 h-4.5 text-hud-blue" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Suggested Corrective Actions & Recommendations
        </h3>
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-hud-border/40 pb-2 no-print">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === cat 
                ? 'bg-hud-blue border-hud-blue text-white' 
                : 'border-hud-border bg-hud-dark/35 text-gray-400 hover:text-white'
            }`}
          >
            {cat !== 'ALL' && getTabIcon(cat)}
            <span className="capitalize">{cat.toLowerCase()}</span>
          </button>
        ))}
      </div>

      {/* Recs Cards List */}
      <div className="space-y-3">
        {getFilteredRecs().map((rec, idx) => (
          <div 
            key={idx} 
            className={`border rounded-lg p-4 text-xs space-y-2 print-break-inside-avoid ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-white uppercase tracking-wider">{rec.title}</h4>
              <span className="text-[9px] uppercase tracking-widest font-hud-mono px-2 py-0.5 border rounded">
                Priority: {rec.priority || 'Low'}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">{rec.description}</p>
            <div className="text-[9px] text-gray-500 font-hud-mono uppercase">
              Routine Class: {rec.recommendation_type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationSummary;
