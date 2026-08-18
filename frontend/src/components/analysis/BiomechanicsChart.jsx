import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { subject: 'Knee Flexion', A: 120, fullMark: 150 },
  { subject: 'Hip Extension', A: 98, fullMark: 150 },
  { subject: 'Ankle Dorsiflexion', A: 86, fullMark: 150 },
  { subject: 'Trunk Lean', A: 99, fullMark: 150 },
  { subject: 'Pelvic Drop', A: 85, fullMark: 150 },
  { subject: 'Knee Valgus', A: 65, fullMark: 150 },
];

export default function BiomechanicsChart() {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1E293B', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#4F46E5' }}
          />
          <Radar name="Athlete Metrics" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
