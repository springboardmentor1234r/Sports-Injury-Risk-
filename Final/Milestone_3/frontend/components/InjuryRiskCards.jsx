import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import RiskCategoryBadge from './RiskCategoryBadge';

const InjuryRiskCards = ({ predictions }) => {
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
        return 'border-hud-danger/30 hover:border-hud-danger/60';
      case 'high':
        return 'border-hud-warning/30 hover:border-hud-warning/60';
      case 'moderate':
      case 'medium':
        return 'border-amber-500/30 hover:border-amber-500/60';
      case 'low':
      default:
        return 'border-hud-green/30 hover:border-hud-green/60';
    }
  };

  const getPercentageColor = (prob) => {
    if (prob >= 75) return 'text-hud-danger';
    if (prob >= 50) return 'text-hud-warning';
    if (prob >= 25) return 'text-amber-400';
    return 'text-hud-green';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-hud-border pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block">Prediction Models</span>
          <h3 className="text-sm font-bold text-white uppercase">Joint Group Risk Profiles</h3>
        </div>
        <div className="flex items-center gap-1 bg-hud-blue/10 border border-hud-blue/20 px-2 py-0.5 rounded text-[9px] text-hud-blue uppercase font-bold tracking-wider">
          <Sparkles className="w-3 h-3" />
          <span>Injury-Risk Predictions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.map((p, idx) => (
          <div 
            key={idx}
            className={`hud-glass-panel p-5 space-y-4 flex flex-col justify-between transition-all duration-300 ${getRiskColor(p.risk_level)}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Type</span>
                <h4 className="text-md font-bold text-white uppercase mt-0.5">
                  Elevated {p.injury_type} Risk
                </h4>
              </div>
              <RiskCategoryBadge category={p.risk_level} />
            </div>

            <div className="space-y-1">
              <span className="text-3xl font-black block tracking-tight leading-none">
                <span className={getPercentageColor(p.probability)}>{p.probability.toFixed(1)}</span>
                <span className="text-xs text-gray-500 font-normal"> %</span>
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest block mt-1">Probability Status</span>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed min-h-[48px]">
              {p.explanation || `Elevated stress indicators mapped on the ${p.injury_type.toLowerCase()} structures.`}
            </p>

            {/* Contributing Metrics tags */}
            {p.contributing_metrics && p.contributing_metrics.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-hud-border/40">
                <span className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider block">Key Contributors:</span>
                <div className="flex flex-wrap gap-1">
                  {p.contributing_metrics.map((m, mIdx) => (
                    <span 
                      key={mIdx}
                      className="px-1.5 py-0.5 rounded bg-hud-dark border border-hud-border/60 text-[8px] text-gray-400 font-hud-mono"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Safety tag for shoulder data missing */}
            {p.injury_type === 'Shoulder' && !p.evidence?.tracking_active && (
              <div className="flex items-center gap-1.5 p-2 rounded bg-hud-dark/40 border border-hud-border/60 text-[9px] text-gray-500">
                <AlertCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                <span>Upper body tracking was inactive. Metric falls to low baseline.</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Medical safety notice */}
      <div className="flex items-center gap-2 p-3.5 rounded-lg bg-hud-dark/20 border border-hud-border/60 text-xs text-gray-400 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-hud-blue flex-shrink-0" />
        <p>
          <span className="font-bold text-white">Advisory Notice:</span> This is an automated motion-intelligence screening and does <span className="underline">NOT</span> constitute a clinical medical diagnosis. Consult a qualified sports doctor or physiotherapist before implementing training load adjustments.
        </p>
      </div>
    </div>
  );
};

export default InjuryRiskCards;
