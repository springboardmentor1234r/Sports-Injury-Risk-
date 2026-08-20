import React from 'react';
import { Heart, Activity, Zap, Compass } from 'lucide-react';

const AthleteHealthSummary = ({ healthScore, movementQuality, efficiencyScore, fatigueRisk }) => {
  const roundedHealth = typeof healthScore === 'number' ? Math.round(healthScore) : 100;
  const roundedMQ = typeof movementQuality === 'number' ? Math.round(movementQuality) : 100;
  const roundedEfficiency = typeof efficiencyScore === 'number' ? Math.round(efficiencyScore) : 100;
  const roundedFatigue = typeof fatigueRisk === 'number' ? Math.round(fatigueRisk) : 0;

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-hud-green';
    if (score >= 50) return 'text-hud-warning';
    return 'text-hud-danger';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
      {/* 1. Overall Health Score */}
      <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Health Matrix</span>
          <Heart className="w-4 h-4 text-hud-green" />
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-black block tracking-tight">
            {roundedHealth}<span className="text-[10px] text-gray-500 font-normal"> / 100</span>
          </span>
          <span className="text-xs font-bold text-white uppercase block">Athlete Health Index</span>
          <span className="text-[10px] text-gray-500 block leading-tight">
            Higher values indicate excellent range symmetry and dynamic stability.
          </span>
        </div>
        <div className="w-full bg-hud-dark h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-hud-green rounded-full"
            style={{ width: `${roundedHealth}%` }}
          />
        </div>
      </div>

      {/* 2. Movement Quality */}
      <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Kinematics</span>
          <Compass className="w-4 h-4 text-hud-blue" />
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-black block tracking-tight">
            {roundedMQ}<span className="text-[10px] text-gray-500 font-normal"> %</span>
          </span>
          <span className="text-xs font-bold text-white uppercase block">Movement Quality</span>
          <span className="text-[10px] text-gray-500 block leading-tight">
            Indicates joint alignment control and minimal valgus/lean deviations.
          </span>
        </div>
        <div className="w-full bg-hud-dark h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-hud-blue rounded-full"
            style={{ width: `${roundedMQ}%` }}
          />
        </div>
      </div>

      {/* 3. Biomechanical Efficiency */}
      <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Performance</span>
          <Zap className="w-4 h-4 text-hud-blue" />
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-black block tracking-tight">
            {roundedEfficiency}<span className="text-[10px] text-gray-500 font-normal"> %</span>
          </span>
          <span className="text-xs font-bold text-white uppercase block">Biomechanical Efficiency</span>
          <span className="text-[10px] text-gray-500 block leading-tight">
            Reflects force absorption balance and landing flexions.
          </span>
        </div>
        <div className="w-full bg-hud-dark h-1.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-hud-blue rounded-full"
            style={{ width: `${roundedEfficiency}%` }}
          />
        </div>
      </div>

      {/* 4. Fatigue Risk */}
      <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">Load & Drift</span>
          <Activity className="w-4 h-4 text-hud-warning" />
        </div>
        <div className="space-y-1">
          <span className="text-2xl font-black block tracking-tight">
            {roundedFatigue}<span className="text-[10px] text-gray-500 font-normal"> %</span>
          </span>
          <span className="text-xs font-bold text-white uppercase block">Fatigue Indicator</span>
          <span className="text-[10px] text-gray-500 block leading-tight">
            Higher values indicate joint range decay and alignment drift over time.
          </span>
        </div>
        <div className="w-full bg-hud-dark h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${roundedFatigue >= 50 ? 'bg-hud-danger' : 'bg-hud-warning'}`}
            style={{ width: `${roundedFatigue}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AthleteHealthSummary;
