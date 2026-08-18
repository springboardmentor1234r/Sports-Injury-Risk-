import React from 'react';

const RecentAnalyses = ({ limit = 5 }) => {
  const analyses = [
    { id: 1, athlete: 'John Doe', date: '2023-10-25', status: 'Completed', risk: 'Low' },
    { id: 2, athlete: 'Jane Smith', date: '2023-10-24', status: 'Completed', risk: 'High' },
    { id: 3, athlete: 'Mike Johnson', date: '2023-10-24', status: 'Processing', risk: 'Unknown' },
  ];

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Low': return 'bg-emerald-500/20 text-emerald-400';
      case 'High': return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Recent Analyses</h2>
      <div className="space-y-4">
        {analyses.slice(0, limit).map(a => (
          <div key={a.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-medium">{a.athlete}</p>
              <p className="text-gray-400 text-sm">{a.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-300">{a.status}</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(a.risk)}`}>
                {a.risk} Risk
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAnalyses;
