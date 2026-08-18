import React from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Chart = ({ type = 'line', data, xKey, yKeys, height = 300, colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#f43f5e'] }) => {
  const commonProps = {
    data,
    margin: { top: 10, right: 10, left: 0, bottom: 0 }
  };

  const renderTooltip = () => (
    <Tooltip 
      contentStyle={{ 
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '0.5rem',
        color: '#f8fafc',
        backdropFilter: 'blur(12px)'
      }}
      itemStyle={{ color: '#e2e8f0' }}
    />
  );

  const renderLegend = () => (
    <Legend wrapperStyle={{ paddingTop: '20px' }} />
  );

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
        <p className="text-slate-400">No data available for chart</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {(() => {
          switch (type) {
            case 'line':
              return (
                <LineChart {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  {renderTooltip()}
                  {renderLegend()}
                  {yKeys.map((key, i) => (
                    <Line 
                      key={key} 
                      type="monotone" 
                      dataKey={key} 
                      stroke={colors[i % colors.length]} 
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      dot={{ r: 0 }}
                    />
                  ))}
                </LineChart>
              );
              
            case 'bar':
              return (
                <BarChart {...commonProps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  {renderTooltip()}
                  {renderLegend()}
                  {yKeys.map((key, i) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      fill={colors[i % colors.length]} 
                      radius={[4, 4, 0, 0]} 
                    />
                  ))}
                </BarChart>
              );
              
            case 'radar':
              return (
                <RadarChart outerRadius="70%" data={data}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  {renderTooltip()}
                  {renderLegend()}
                  {yKeys.map((key, i) => (
                    <Radar 
                      key={key}
                      name={key} 
                      dataKey={key} 
                      stroke={colors[i % colors.length]} 
                      fill={colors[i % colors.length]} 
                      fillOpacity={0.4} 
                    />
                  ))}
                </RadarChart>
              );

            case 'pie':
              return (
                <PieChart>
                  {renderTooltip()}
                  {renderLegend()}
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={5}
                    dataKey={yKeys[0]}
                    nameKey={xKey}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              );
              
            default:
              return <div>Unsupported chart type</div>;
          }
        })()}
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
