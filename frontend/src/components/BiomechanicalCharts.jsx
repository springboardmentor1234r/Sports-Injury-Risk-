import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

export const BiomechanicalRadarChart = ({ biomechanics }) => {
  const data = [
    { subject: 'Knee Stability', score: biomechanics?.knee_valgus?.includes('Valgus') ? 65 : 90 },
    { subject: 'Hip Stability', score: biomechanics?.hip_stability === 'Excellent' ? 95 : 82 },
    { subject: 'Balance', score: biomechanics?.balance_score || 80 },
    { subject: 'Symmetry', score: biomechanics?.movement_symmetry || 82 },
    { subject: 'Mobility', score: biomechanics?.range_of_motion || 85 },
    { subject: 'Posture', score: Math.max(50, 100 - (biomechanics?.trunk_lean || 12) * 3) }
  ];

  return (
    <div className="card" style={{ height: '340px' }}>
      <h3 className="card-title">Biomechanical Metric Distribution</h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4B5563', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#15803D"
            fill="#DCFCE7"
            fillOpacity={0.7}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const InjuryPredictionsBarChart = ({ predictions }) => {
  const data = [
    { name: 'ACL', risk: predictions?.acl_risk || 37.5 },
    { name: 'Hamstring', risk: predictions?.hamstring_risk || 21.4 },
    { name: 'Ankle', risk: predictions?.ankle_sprain_risk || 18.7 },
    { name: 'Shoulder', risk: predictions?.shoulder_risk || 28.2 },
    { name: 'Lower Back', risk: predictions?.lower_back_risk || 24.1 },
    { name: 'Overuse', risk: predictions?.overuse_risk || 41.3 }
  ];

  return (
    <div className="card" style={{ height: '340px' }}>
      <h3 className="card-title">Injury Prediction Probabilities (%)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
          <Tooltip formatter={(value) => [`${value}%`, 'Risk Level']} />
          <Bar dataKey="risk" fill="#15803D" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskTrendLineChart = ({ historyData }) => {
  const defaultData = [
    { session: 'S1', risk: 22.0 },
    { session: 'S2', risk: 28.5 },
    { session: 'S3', risk: 42.0 },
    { session: 'S4', risk: 37.0 },
    { session: 'S5', risk: 31.0 }
  ];

  const data = historyData && historyData.length > 0 ? historyData : defaultData;

  return (
    <div className="card" style={{ height: '340px' }}>
      <h3 className="card-title">Recent Injury Risk Trend</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#6B7280' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6B7280' }} />
          <Tooltip formatter={(value) => [`${value}/100`, 'Injury Risk Score']} />
          <Line
            type="monotone"
            dataKey="risk"
            stroke="#15803D"
            strokeWidth={3}
            dot={{ r: 5, fill: '#15803D' }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
