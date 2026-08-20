import React from 'react';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

const AthleteHealthCard = ({ healthScore, qualityScore, biomechSummary }) => {
  return (
    <div className="hud-glass-panel p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-hud-border pb-3">
        <HeartPulse className="w-4.5 h-4.5 text-hud-blue" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Athlete Health & Movement Quality
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* HEALTH SCORE */}
        <div className="bg-hud-dark/35 border border-hud-border/40 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Athlete Health Index</span>
            <span className="text-xs text-hud-green block mt-0.5">Higher values represent optimal state</span>
          </div>
          <span className="text-2xl font-hud-mono font-black text-white">{healthScore || 0}%</span>
        </div>

        {/* MOVEMENT QUALITY */}
        <div className="bg-hud-dark/35 border border-hud-border/40 p-4 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Movement Quality Index</span>
            <span className="text-xs text-hud-green block mt-0.5">Reflects limb symmetry & control</span>
          </div>
          <span className="text-2xl font-hud-mono font-black text-white">{qualityScore || 0}%</span>
        </div>

      </div>

      {/* BIOMECHANICAL SUMMARY PARAMETERS */}
      {biomechSummary && Object.keys(biomechSummary).length > 0 && (
        <div className="space-y-3 bg-hud-black/35 p-4 rounded border border-hud-border/40">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
            Observed Biomechanical Telemetry:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {Object.entries(biomechSummary).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <span className="text-gray-500 capitalize block text-[10px]">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-hud-mono text-white text-sm font-bold block">
                  {typeof val === 'number' ? val.toFixed(1) : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteHealthCard;
