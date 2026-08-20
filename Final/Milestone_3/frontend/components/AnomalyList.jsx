import React, { useState } from 'react';
import { Eye, AlertCircle, RefreshCw } from 'lucide-react';
import RiskCategoryBadge from './RiskCategoryBadge';

const AnomalyList = ({ anomalies }) => {
  const [severityFilter, setSeverityFilter] = useState('All');

  const filteredAnomalies = anomalies.filter((a) => {
    if (severityFilter === 'All') return true;
    return a.severity?.toLowerCase() === severityFilter.toLowerCase();
  });

  const getSeverityStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical':
        return 'text-hud-danger font-bold';
      case 'high':
        return 'text-hud-warning font-semibold';
      case 'moderate':
      case 'medium':
        return 'text-amber-400';
      case 'low':
      default:
        return 'text-hud-green';
    }
  };

  return (
    <div className="hud-glass-panel p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hud-border pb-3">
        <div className="space-y-1">
          <span className="text-[9px] font-bold tracking-widest text-gray-400 uppercase block">Telemetry Logs</span>
          <h3 className="text-sm font-bold text-white uppercase">Detected Movement Anomalies</h3>
        </div>
        
        {/* Severity Filters buttons */}
        <div className="flex flex-wrap gap-1">
          {['All', 'Critical', 'High', 'Moderate', 'Low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded text-[10px] font-semibold tracking-wider transition-colors cursor-pointer border ${
                severityFilter === sev
                  ? 'bg-hud-blue border-hud-blue text-white'
                  : 'bg-hud-dark border-hud-border text-gray-400 hover:text-white'
              }`}
            >
              {sev.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredAnomalies.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse hud-table">
            <thead>
              <tr className="text-gray-500 font-semibold border-b border-hud-border">
                <th className="py-2.5">Joint / Area</th>
                <th className="py-2.5">Anomaly Type</th>
                <th className="py-2.5 text-center">Severity</th>
                <th className="py-2.5 text-center">Observed Value</th>
                <th className="py-2.5 text-center">Expected Limit</th>
                <th className="py-2.5 text-center">Frame</th>
                <th className="py-2.5 text-right">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hud-border/45 text-gray-300">
              {filteredAnomalies.map((a, idx) => (
                <tr key={idx} className="hover:bg-hud-blue/5 transition-colors">
                  <td className="py-3 font-semibold text-white uppercase">{a.affected_joint || 'N/A'}</td>
                  <td className="py-3 font-hud-mono text-hud-blue">{a.anomaly_type || 'N/A'}</td>
                  <td className="py-3 text-center">
                    <span className={getSeverityStyle(a.severity)}>{a.severity}</span>
                  </td>
                  <td className="py-3 text-center font-hud-mono">
                    {typeof a.observed_value === 'number' ? a.observed_value.toFixed(1) : a.observed_value}°
                  </td>
                  <td className="py-3 text-center font-hud-mono text-gray-500">
                    {typeof a.expected_value === 'number' ? a.expected_value.toFixed(1) : a.expected_value}°
                  </td>
                  <td className="py-3 text-center font-hud-mono text-gray-500">#{a.frame_number}</td>
                  <td className="py-3 text-right text-gray-400">{a.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-gray-500 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-xs">No technique anomalies detected matching filter "{severityFilter}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyList;
