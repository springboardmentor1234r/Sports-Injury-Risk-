import React from 'react';
import { Activity, ShieldAlert, Award, Footprints, Flame } from 'lucide-react';

export const MetricsDashboard = ({ summary }) => {
  const getSymmetryClass = (score) => {
    if (score >= 90) return 'text-hud-green bg-hud-green-glow/5 border-hud-green/30';
    if (score >= 75) return 'text-hud-warning bg-hud-warning/5 border-hud-warning/30';
    return 'text-hud-danger bg-hud-danger/5 border-hud-danger/30';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      
      {/* 1. Symmetry Index */}
      <div className={`hud-glass-panel p-4 rounded-xl border flex flex-col justify-between ${getSymmetryClass(summary?.mean_symmetry_index || 100)}`}>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
          <span>Limbs Symmetry</span>
          <Activity className="w-4 h-4" />
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-white">{(summary?.mean_symmetry_index || 100.0).toFixed(1)}%</span>
          <span className="text-[9px] block text-gray-500 font-hud-mono mt-1">L/R MATCH INDEX</span>
        </div>
      </div>

      {/* 2. Peak Stride Length */}
      <div className="hud-glass-panel p-4 rounded-xl border border-hud-border bg-hud-dark/15 flex flex-col justify-between hover:border-hud-blue/30 transition-all">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <span>Peak Stride</span>
          <Footprints className="w-4 h-4 text-hud-blue" />
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-white">{(summary?.peak_stride_length || 0.0).toFixed(2)}</span>
          <span className="text-[9px] block text-gray-500 font-hud-mono mt-1">ANKLE SPAN (NORM)</span>
        </div>
      </div>

      {/* 3. Landing Flexion */}
      <div className="hud-glass-panel p-4 rounded-xl border border-hud-border bg-hud-dark/15 flex flex-col justify-between hover:border-hud-blue/30 transition-all">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <span>Landing Flexion</span>
          <Flame className="w-4 h-4 text-hud-blue" />
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-white">{(summary?.landing_flexion_at_impact || 0.0).toFixed(1)}°</span>
          <span className="text-[9px] block text-gray-500 font-hud-mono mt-1">KNEE ANGLE AT IMPACT</span>
        </div>
      </div>

      {/* 4. Trunk Lean */}
      <div className="hud-glass-panel p-4 rounded-xl border border-hud-border bg-hud-dark/15 flex flex-col justify-between hover:border-hud-blue/30 transition-all">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <span>Avg Trunk Lean</span>
          <Award className="w-4 h-4 text-hud-blue" />
        </div>
        <div className="mt-3">
          <span className="text-2xl font-extrabold text-white">{(summary?.average_trunk_lean || 0.0).toFixed(1)}°</span>
          <span className="text-[9px] block text-gray-500 font-hud-mono mt-1">LATERAL/FORWARD TILT</span>
        </div>
      </div>

    </div>
  );
};

export default MetricsDashboard;
