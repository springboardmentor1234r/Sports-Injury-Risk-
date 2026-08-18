import React from 'react';
import { User, Activity } from 'lucide-react';

const AthleteCard = ({ athlete }) => {
  const getRiskColor = (score) => {
    if (score < 30) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (score < 70) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
          {athlete.avatar ? (
            <img src={athlete.avatar} alt={athlete.name} className="w-full h-full object-cover" />
          ) : (
            <User className="text-gray-400 w-6 h-6" />
          )}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold border ${getRiskColor(athlete.riskScore)}`}>
          {athlete.riskScore} Risk
        </div>
      </div>
      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{athlete.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{athlete.sport}</p>
      <div className="flex items-center text-sm text-gray-500">
        <Activity className="w-4 h-4 mr-1" />
        <span>Last analysis: 2 days ago</span>
      </div>
    </div>
  );
};

export default AthleteCard;
