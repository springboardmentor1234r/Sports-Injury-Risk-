import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Activity, TrendingUp, Scale, Zap, Info } from 'lucide-react';

export default function BiomechanicsReport({ reportData, onSelectFrame }) {
  const [activeTab, setActiveTab] = useState('valgus'); // 'valgus' | 'flexion' | 'trunk'
  const [hoveredFrame, setHoveredFrame] = useState(null);

  if (!reportData || !reportData.summary_metrics) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-medium text-slate-200">No Biomechanical Data Loaded</h3>
        <p className="text-sm text-slate-500 mt-1">Select or analyze a video clip to generate kinematic reports.</p>
      </div>
    );
  }

  const { summary_metrics, risk_badges, risk_alerts = [], time_series = [] } = reportData;

  // Color mapping helper
  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'RED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'YELLOW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const getRiskLevelBadge = (level) => {
    if (level === 'HIGH_RISK') {
      return {
        label: 'HIGH INJURY RISK',
        bg: 'bg-red-500/20 text-red-400 border-red-500/40',
        icon: <ShieldAlert className="w-5 h-5 text-red-400" />
      };
    } else if (level === 'MODERATE_RISK') {
      return {
        label: 'MODERATE RISK',
        bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
      };
    }
    return {
      label: 'OPTIMAL ALIGNMENT',
      bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    };
  };

  const riskInfo = getRiskLevelBadge(summary_metrics.risk_level);

  // SVG Chart rendering helper
  const renderJointAngleChart = () => {
    if (!time_series || time_series.length === 0) return null;

    const width = 600;
    const height = 220;
    const padding = 35;

    let key1 = 'left_knee_valgus';
    let key2 = 'right_knee_valgus';
    let label1 = 'Left Knee Valgus';
    let label2 = 'Right Knee Valgus';
    let color1 = '#EF4444'; // Red
    let color2 = '#F59E0B'; // Amber
    let yMax = 30;

    if (activeTab === 'flexion') {
      key1 = 'left_knee_flexion';
      key2 = 'right_knee_flexion';
      label1 = 'Left Knee Flexion';
      label2 = 'Right Knee Flexion';
      color1 = '#3B82F6'; // Blue
      color2 = '#10B981'; // Green
      yMax = 180;
    } else if (activeTab === 'trunk') {
      key1 = 'sagittal_trunk_lean';
      key2 = 'hip_tilt';
      label1 = 'Trunk Sagittal Lean';
      label2 = 'Pelvic Hip Tilt';
      color1 = '#8B5CF6'; // Purple
      color2 = '#EC4899'; // Pink
      yMax = 50;
    }

    const maxFrame = time_series.length - 1 || 1;

    // Map frame index & value to (x, y) coordinates
    const getX = (fIdx) => padding + (fIdx / maxFrame) * (width - 2 * padding);
    const getY = (val) => height - padding - (val / yMax) * (height - 2 * padding);

    // Build SVG path string
    const points1 = time_series.map((d) => `${getX(d.frame)},${getY(d[key1] || 0)}`).join(' L ');
    const points2 = time_series.map((d) => `${getX(d.frame)},${getY(d[key2] || 0)}`).join(' L ');

    const pathD1 = `M ${points1}`;
    const pathD2 = `M ${points2}`;

    return (
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-400 select-none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - padding - ratio * (height - 2 * padding);
            const val = Math.round(ratio * yMax);
            return (
              <g key={i}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1E293B" strokeDasharray="3,3" />
                <text x={padding - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-500 font-mono">
                  {val}°
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <path d={pathD1} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" />
          <path d={pathD2} fill="none" stroke={color2} strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive dots / frame hover */}
          {time_series.map((d) => {
            const x = getX(d.frame);
            const y1 = getY(d[key1] || 0);
            const isSelected = hoveredFrame === d.frame;
            return (
              <circle
                key={d.frame}
                cx={x}
                cy={y1}
                r={isSelected ? 5 : 2.5}
                fill={color1}
                className="cursor-pointer transition-all"
                onMouseEnter={() => {
                  setHoveredFrame(d.frame);
                  if (onSelectFrame) onSelectFrame(d.frame);
                }}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 pt-2 pb-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color1 }} />
            <span className="text-xs text-slate-300 font-medium">{label1}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color2 }} />
            <span className="text-xs text-slate-300 font-medium">{label2}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Risk Header & Overall Assessment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Biomechanical Kinematics Engine
            </span>
            <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <span>Assessment Report</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {reportData.movement_type || 'Dynamic Movement'}
              </span>
            </h2>
          </div>

          <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2.5 ${riskInfo.bg}`}>
            {riskInfo.icon}
            <span className="font-bold text-sm tracking-wide">{riskInfo.label}</span>
          </div>
        </div>

        {/* Core KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Peak Valgus */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Peak Knee Valgus</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(risk_badges.knee_valgus)}`}>
                {risk_badges.knee_valgus}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">
              {summary_metrics.max_knee_valgus.toFixed(1)}°
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              L: {summary_metrics.peak_knee_valgus_left.toFixed(1)}° | R: {summary_metrics.peak_knee_valgus_right.toFixed(1)}°
            </p>
          </div>

          {/* Symmetry Index */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Symmetry Asymmetry</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(risk_badges.symmetry)}`}>
                {risk_badges.symmetry}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">
              {summary_metrics.overall_asymmetry_pct.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Bilateral L/R deviation</p>
          </div>

          {/* Landing Impact Duration */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Landing Impact Phase</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">
              {summary_metrics.impact_phase_duration_ms.toFixed(0)} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ground contact impact</p>
          </div>

          {/* Peak Knee Flexion */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Max Knee Flexion</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2 font-mono">
              {summary_metrics.peak_flexion_depth.toFixed(1)}°
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Peak squat/landing depth</p>
          </div>
        </div>
      </div>

      {/* Joint Angle Curves Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Dynamic Kinematic Time Series</h3>
            <p className="text-xs text-slate-400">Real-time joint angle trajectories parsed frame-by-frame</p>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('valgus')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'valgus' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Knee Valgus
            </button>
            <button
              onClick={() => setActiveTab('flexion')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'flexion' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Knee Flexion
            </button>
            <button
              onClick={() => setActiveTab('trunk')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'trunk' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trunk & Pelvis
            </button>
          </div>
        </div>

        {/* Chart View */}
        {renderJointAngleChart()}
      </div>

      {/* Clinical Risk Alert Badges List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span>Clinical Joint Alignment Badges & Recommendations</span>
        </h3>

        <div className="space-y-3">
          {risk_alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
                alert.severity === 'RED'
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : alert.severity === 'YELLOW'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              {alert.severity === 'RED' ? (
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              ) : alert.severity === 'YELLOW' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-semibold text-white">{alert.metric}</h4>
                <p className="text-xs mt-0.5 leading-relaxed opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
