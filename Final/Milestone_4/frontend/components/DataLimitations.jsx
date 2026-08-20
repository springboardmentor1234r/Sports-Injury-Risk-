import React from 'react';
import { AlertTriangle } from 'lucide-react';

const DataLimitations = ({ limitations }) => {
  if (!limitations || limitations.length === 0) return null;

  return (
    <div className="hud-glass-panel p-5 border border-hud-warning/25 bg-hud-warning/5 text-xs text-hud-warning space-y-2">
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-white">
        <AlertTriangle className="w-4 h-4 text-hud-warning animate-pulse" />
        <span>Telemetry Warnings & Exclusions</span>
      </div>
      
      <p className="text-gray-300 leading-relaxed text-[11px]">
        The overall risk scoring matrix contains neutral fallback metrics because the following history 
        registers or sensors are not linked to this athlete profile:
      </p>

      <ul className="list-disc pl-5 space-y-1 font-hud-mono text-[10px] text-gray-400">
        {limitations.map((limit, idx) => (
          <li key={idx}>{limit}</li>
        ))}
      </ul>
    </div>
  );
};

export default DataLimitations;
