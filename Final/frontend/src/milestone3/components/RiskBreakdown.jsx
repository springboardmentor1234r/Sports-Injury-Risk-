import React from 'react';
import { Percent, ShieldAlert } from 'lucide-react';

const RiskBreakdown = ({ scoreBreakdown, weightedFactors }) => {
  // Use default factors matching backend weighting splits
  const factors = [
    {
      key: 'biomechanical_deviations',
      label: 'Biomechanical Deviations',
      weight: (weightedFactors?.biomechanical_deviations ?? 0.35) * 100,
      score: scoreBreakdown?.biomechanical_score ?? 0.0
    },
    {
      key: 'historical_injury_factors',
      label: 'Historical Injury Factors',
      weight: (weightedFactors?.historical_injury_factors ?? 0.20) * 100,
      score: scoreBreakdown?.history_score ?? 0.0
    },
    {
      key: 'movement_asymmetry',
      label: 'Movement Asymmetry',
      weight: (weightedFactors?.movement_asymmetry ?? 0.20) * 100,
      score: scoreBreakdown?.asymmetry_score ?? 0.0
    },
    {
      key: 'training_load_indicators',
      label: 'Training Load Indicators',
      weight: (weightedFactors?.training_load_indicators ?? 0.15) * 100,
      score: scoreBreakdown?.load_score ?? 0.0
    },
    {
      key: 'fatigue_indicators',
      label: 'Fatigue Indicators',
      weight: (weightedFactors?.fatigue_indicators ?? 0.10) * 100,
      score: scoreBreakdown?.fatigue_score ?? 0.0
    }
  ];

  return (
    <div className="hud-glass-panel p-5 space-y-4 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center border-b border-hud-border pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block">Audit Breakdown</span>
          <h3 className="text-sm font-bold text-white uppercase">Weighted Risk Scoring Matrix</h3>
        </div>
        <Percent className="w-4.5 h-4.5 text-hud-blue" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse hud-table">
          <thead>
            <tr className="text-gray-500 font-semibold border-b border-hud-border">
              <th className="py-2.5">Category Factor</th>
              <th className="py-2.5 text-center">Factor Score</th>
              <th className="py-2.5 text-center">Weight</th>
              <th className="py-2.5 text-right">Weighted Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hud-border/40 text-gray-300">
            {factors.map((f, idx) => {
              const contribution = (f.score * (f.weight / 100)).toFixed(2);
              return (
                <tr key={idx} className="hover:bg-hud-blue/5 transition-colors">
                  <td className="py-3 font-medium text-white">{f.label}</td>
                  <td className="py-3 text-center font-hud-mono">{f.score.toFixed(1)}</td>
                  <td className="py-3 text-center font-hud-mono text-gray-500">{f.weight.toFixed(0)}%</td>
                  <td className="py-3 text-right font-hud-mono text-hud-blue font-bold">+{contribution}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskBreakdown;
