import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

const RiskSummaryCard = ({ score, category }) => {
  const getCategoryColor = () => {
    switch (category?.toUpperCase()) {
      case 'CRITICAL': return 'text-hud-danger border-hud-danger/25 bg-hud-danger/10';
      case 'HIGH': return 'text-hud-warning border-hud-warning/25 bg-hud-warning/10';
      case 'MEDIUM':
      case 'MODERATE': return 'text-hud-blue border-hud-blue/25 bg-hud-blue/10';
      case 'LOW':
      default: return 'text-hud-green border-hud-green/25 bg-hud-green/10';
    }
  };

  const getGaugeColor = () => {
    if (category?.toUpperCase() === 'CRITICAL') return 'stroke-hud-danger';
    if (category?.toUpperCase() === 'HIGH') return 'stroke-hud-warning';
    return 'stroke-hud-blue';
  };

  // SVG Gauge computation
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((score || 0) / 100) * circumference;

  return (
    <div className={`hud-glass-panel p-6 border rounded-xl flex flex-col md:flex-row items-center gap-6 ${getCategoryColor()}`}>
      <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r={radius} className="stroke-hud-dark/45 fill-transparent" strokeWidth="10" />
          <circle 
            cx="64" 
            cy="64" 
            r={radius} 
            className={`fill-transparent transition-all duration-500 ${getGaugeColor()}`}
            strokeWidth="10" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-hud-mono font-black text-white">{score || 0}%</span>
          <span className="text-[8px] text-gray-400 block uppercase tracking-wider">Injury Risk</span>
        </div>
      </div>

      <div className="space-y-3 text-center md:text-left flex-1">
        <div className="flex flex-col md:flex-row items-center gap-2">
          {category?.toUpperCase() === 'CRITICAL' || category?.toUpperCase() === 'HIGH' ? (
            <ShieldAlert className="w-5 h-5 text-hud-danger animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-hud-green" />
          )}
          <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block">
            Overall Evaluation Risk Level
          </span>
        </div>
        <h3 className="text-xl font-extrabold uppercase text-white tracking-wide">
          Category: {category || 'Low'}
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          Notice: Higher values indicate elevated biomechanical strain and susceptibility to sports injury. 
          A low score indicates high alignment and movement control stability. This is an automated screening 
          reference and does not represent a medical diagnosis.
        </p>
      </div>
    </div>
  );
};

export default RiskSummaryCard;
