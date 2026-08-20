import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Hip', left: 45, right: 42 },
  { name: 'Knee', left: 90, right: 85 },
  { name: 'Ankle', left: 20, right: 25 },
  { name: 'Shoulder', left: 110, right: 115 },
];

const SymmetryChart = () => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-full">
      <h3 className="text-lg font-bold text-white mb-4">Left vs Right Symmetry (Max Angles)</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" stroke="#94A3B8" />
          <YAxis stroke="#94A3B8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155' }}
            cursor={{ fill: '#334155', opacity: 0.4 }}
          />
          <Legend />
          <Bar dataKey="left" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="right" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SymmetryChart;
