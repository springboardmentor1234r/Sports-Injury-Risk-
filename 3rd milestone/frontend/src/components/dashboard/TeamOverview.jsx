import React from 'react';
import { User } from 'lucide-react';

const TeamOverview = ({ isPhysio }) => {
  const team = [
    { id: 1, name: 'Alex Johnson', sport: 'Basketball', riskScore: 12 },
    { id: 2, name: 'Sarah Williams', sport: 'Soccer', riskScore: 45 },
    { id: 3, name: 'Mike Brown', sport: 'Tennis', riskScore: 88 },
    { id: 4, name: 'Emily Davis', sport: 'Track', riskScore: 5 },
  ];

  const getRiskColor = (score) => {
    if (score < 30) return 'text-emerald-400';
    if (score < 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">
        {isPhysio ? 'Patient List' : 'Team Overview'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {team.map(member => (
          <div key={member.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-3">
              <User className="text-gray-400 w-8 h-8" />
            </div>
            <h3 className="text-white font-medium">{member.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{member.sport}</p>
            <div className={`text-2xl font-bold ${getRiskColor(member.riskScore)}`}>
              {member.riskScore}
              <span className="text-sm font-normal text-gray-400 ml-1">Risk</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamOverview;
