import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

const DataLimitations = ({ limitations }) => {
  if (!limitations || limitations.length === 0) return null;

  return (
    <div className="hud-glass-panel p-5 space-y-3 border-hud-warning/20">
      <div className="flex items-center gap-2 text-hud-warning">
        <AlertCircle className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-widest uppercase">Telemetry Warnings</span>
        <span className="text-xs font-bold text-white uppercase ml-auto">Data Limitations Audit</span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        The following data sources were unavailable or unlinked for this analysis session. Risk calculation algorithms defaulted to conservative baseline weights where marked:
      </p>

      <ul className="space-y-2 text-xs">
        {limitations.map((limit, idx) => (
          <li key={idx} className="flex items-start gap-2 p-2 rounded bg-hud-dark/40 border border-hud-border text-gray-300">
            <HelpCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white uppercase block text-[8px] tracking-wider text-hud-warning">Sensor / Registry Missing</span>
              {limit}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataLimitations;
