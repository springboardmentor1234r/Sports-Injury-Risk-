import React from 'react';
import { AlertCircle, Footprints } from 'lucide-react';

const AnomalySummary = ({ anomalies }) => {
  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="hud-glass-panel p-6 text-center text-gray-500 text-xs py-10">
        No significant movement anomalies identified in this session.
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-hud-danger/10 text-hud-danger border-hud-danger/25';
      case 'HIGH': return 'bg-hud-warning/10 text-hud-warning border-hud-warning/25';
      case 'MEDIUM': return 'bg-hud-blue/10 text-hud-blue border-hud-blue/25';
      default: return 'bg-hud-green/10 text-hud-green border-hud-green/25';
    }
  };

  return (
    <div className="hud-glass-panel p-6 space-y-4">
      <div className="flex items-center gap-2 border-b border-hud-border pb-3">
        <Footprints className="w-4.5 h-4.5 text-hud-blue" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Detected Technique Anomalies
        </h3>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {anomalies.map((anom, idx) => (
          <div 
            key={idx} 
            className="flex items-start justify-between gap-4 bg-hud-dark/30 border border-hud-border/40 p-3 rounded-lg text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white capitalize">{anom.anomaly_type?.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-gray-500 font-hud-mono">({anom.joint || 'General'})</span>
              </div>
              <p className="text-gray-400 leading-relaxed">{anom.message}</p>
            </div>
            
            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${getSeverityBadge(anom.severity)}`}>
              {anom.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnomalySummary;
