import React from 'react';
import './BiomechanicalCharts.css';

// 1. Anatomical Body Silhouette Heatmap SVG Component with Side-by-Side Diagnostics
export function BodyHeatmapGraphic({ heatmapData, athleteName = "Current Athlete", metrics }) {
  const data = heatmapData || {
    knee_right: 45,
    knee_left: 30,
    hamstring: 25,
    ankle: 20,
    shoulder: 15,
    lower_back: 35
  };

  const getColor = (val) => {
    if (val > 50) return '#ef4444'; // High risk red
    if (val > 30) return '#f59e0b'; // Moderate risk yellow
    return '#22c55e'; // Low risk green
  };

  return (
    <div className="body-heatmap-graphic-card">
      <h4 className="chart-title">Graphical Anatomical Risk Heatmap</h4>
      
      <div className="side-by-side-chart-layout">
        {/* Left Column: Interactive Body SVG */}
        <div className="heatmap-container">
          <svg viewBox="0 0 200 400" className="human-body-svg">
            {/* Head & Neck */}
            <circle cx="100" cy="40" r="22" fill="#94a3b8" opacity="0.6" />
            <line x1="100" y1="62" x2="100" y2="78" stroke="#94a3b8" strokeWidth="12" />

            {/* Shoulders & Torso */}
            <path d="M 60,80 L 140,80 L 125,200 L 75,200 Z" fill="#64748b" opacity="0.4" />
            
            {/* Spine & Core Line */}
            <line x1="100" y1="80" x2="100" y2="200" stroke="#cbd5e1" strokeWidth="4" />

            {/* Legs */}
            <line x1="85" y1="200" x2="80" y2="300" stroke="#64748b" strokeWidth="16" opacity="0.5" />
            <line x1="80" y1="300" x2="75" y2="370" stroke="#64748b" strokeWidth="12" opacity="0.5" />

            <line x1="115" y1="200" x2="120" y2="300" stroke="#64748b" strokeWidth="16" opacity="0.5" />
            <line x1="120" y1="300" x2="125" y2="370" stroke="#64748b" strokeWidth="12" opacity="0.5" />

            {/* Glowing Risk Hotspot Nodes */}
            <circle cx="65" cy="88" r="10" fill={getColor(data.shoulder)} className="glowing-node" />
            <circle cx="135" cy="88" r="10" fill={getColor(data.shoulder)} className="glowing-node" />
            <circle cx="100" cy="170" r="12" fill={getColor(data.lower_back)} className="glowing-node" />
            <circle cx="100" cy="240" r="12" fill={getColor(data.hamstring)} className="glowing-node" />
            <circle cx="120" cy="300" r="14" fill={getColor(data.knee_right)} className="glowing-node pulse-high" />
            <circle cx="80" cy="300" r="12" fill={getColor(data.knee_left)} className="glowing-node" />
            <circle cx="75" cy="365" r="9" fill={getColor(data.ankle)} className="glowing-node" />
            <circle cx="125" cy="365" r="9" fill={getColor(data.ankle)} className="glowing-node" />
          </svg>

          <div className="heatmap-legend">
            <div className="legend-item"><span className="dot red" /> High Risk (&gt;50%)</div>
            <div className="legend-item"><span className="dot yellow" /> Moderate Risk (30-50%)</div>
            <div className="legend-item"><span className="dot green" /> Low Risk (&lt;30%)</div>
          </div>
        </div>

        {/* Right Column: Detailed Side Panel (Visible Simultaneously, No Overlap) */}
        <div className="chart-side-panel">
          <div className="side-panel-header">
            <span className="side-panel-title">Anatomical Diagnostics ({athleteName})</span>
          </div>
          <div className="side-panel-metrics-list">
            <div className="side-metric-row">
              <span className="side-label">Right Knee Stress:</span>
              <span className="side-value font-bold">{data.knee_right}% <span className="sub-val">(Valgus: 8.5°)</span></span>
            </div>
            <div className="side-metric-row">
              <span className="side-label">Left Knee Stress:</span>
              <span className="side-value font-bold">{data.knee_left}% <span className="sub-val">(Valgus: 4.2°)</span></span>
            </div>
            <div className="side-metric-row">
              <span className="side-label">Lumbar Back Load:</span>
              <span className="side-value font-bold">{data.lower_back}% <span className="sub-val">(Trunk Lean: 14.2°)</span></span>
            </div>
            <div className="side-metric-row">
              <span className="side-label">Hamstring Strain:</span>
              <span className="side-value font-bold">{data.hamstring}% <span className="sub-val">(Asymmetry: 8.6%)</span></span>
            </div>
            <div className="side-metric-row">
              <span className="side-label">Ankle Deceleration:</span>
              <span className="side-value font-bold">{data.ankle}% <span className="sub-val">(Flexion: 30.0°)</span></span>
            </div>
          </div>
          <div className="side-panel-footer">
            Derived from MediaPipe 3D Pose Keypoints & ML Random Forest Classifier inference.
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Multiaxial Biomechanical Radar Profile Component with Side Panel
export function JointAngleRadarChart({ metrics, athleteName = "Current Athlete" }) {
  const valgus = Math.min(100, Math.max(10, ((metrics?.knee_valgus_deg || 8.5) / 25.0) * 100));
  const asymmetry = Math.min(100, Math.max(10, ((metrics?.asymmetry_ratio || 8.6) / 30.0) * 100));
  const landing = Math.min(100, Math.max(10, (1.0 - (metrics?.landing_flexion_deg || 30.0) / 70.0) * 100));
  const trunk = Math.min(100, Math.max(10, ((metrics?.trunk_lean_deg || 14.2) / 30.0) * 100));
  const drift = Math.min(100, Math.max(10, ((metrics?.com_drift_cm || 0.95) / 4.0) * 100));
  const load = Math.min(100, Math.max(10, ((metrics?.training_load_hrs || 14.0) / 35.0) * 100));

  const center = 150;
  const radius = 100;

  const points = [
    { label: 'Knee Valgus', val: valgus, angle: 0, raw: `${metrics?.knee_valgus_deg || 8.5}°` },
    { label: 'Asymmetry', val: asymmetry, angle: 60, raw: `${metrics?.asymmetry_ratio || 8.6}%` },
    { label: 'Stiff Landing', val: landing, angle: 120, raw: `${metrics?.landing_flexion_deg || 30.0}°` },
    { label: 'Trunk Lean', val: trunk, angle: 180, raw: `${metrics?.trunk_lean_deg || 14.2}°` },
    { label: 'COM Sway', val: drift, angle: 240, raw: `${metrics?.com_drift_cm || 0.95} cm` },
    { label: 'Training Load', val: load, angle: 300, raw: `${metrics?.training_load_hrs || 14.0} hrs/wk` }
  ];

  const getCoordinates = (val, angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    const r = (val / 100) * radius;
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad)
    };
  };

  const polyPoints = points.map(p => {
    const { x, y } = getCoordinates(p.val, p.angle);
    return `${x},${y}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="radar-chart-card">
      <h4 className="chart-title">Multiaxial Biomechanical Radar Profile</h4>
      
      <div className="side-by-side-chart-layout">
        {/* Left Column: Radar SVG */}
        <div className="radar-container">
          <svg viewBox="0 0 300 300" className="radar-svg">
            {gridLevels.map((lvl, idx) => {
              const gridPts = points.map(p => {
                const { x, y } = getCoordinates(lvl * 100, p.angle);
                return `${x},${y}`;
              }).join(' ');
              return <polygon key={idx} points={gridPts} fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />;
            })}

            {points.map((p, idx) => {
              const { x, y } = getCoordinates(100, p.angle);
              return <line key={idx} x1={center} y1={center} x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1" />;
            })}

            <polygon points={polyPoints} fill="rgba(37, 99, 235, 0.35)" stroke="#2563eb" strokeWidth="2.5" />

            {points.map((p, idx) => {
              const { x, y } = getCoordinates(p.val, p.angle);
              const labelCoords = getCoordinates(122, p.angle);
              return (
                <g key={idx}>
                  <circle cx={x} cy={y} r="4" fill="#1d4ed8" />
                  <text 
                    x={labelCoords.x} 
                    y={labelCoords.y} 
                    textAnchor="middle" 
                    fontSize="9" 
                    fontWeight="700" 
                    fill="var(--text-primary)"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Column: Detailed Side Panel */}
        <div className="chart-side-panel">
          <div className="side-panel-header">
            <span className="side-panel-title">Kinematic Axis Measurements ({athleteName})</span>
          </div>
          <div className="side-panel-metrics-list">
            {points.map((pt, i) => (
              <div key={i} className="side-metric-row">
                <span className="side-label">{pt.label}:</span>
                <span className="side-value font-bold">{pt.raw}</span>
              </div>
            ))}
          </div>
          <div className="side-panel-footer">
            Calculated by 6-axis spatial joint angle vectors mapped against cohort baseline tolerances.
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Historical Risk Trend Area Chart Component with Side Panel
export function RiskTrendAreaChart({ history, athleteName = "Current Athlete" }) {
  const data = history && history.length > 0 ? history : [
    { date: 'Session 1', risk: 42, quality: 78 },
    { date: 'Session 2', risk: 38, quality: 82 },
    { date: 'Session 3', risk: 31, quality: 85 },
    { date: 'Session 4', risk: 24, quality: 91 },
    { date: 'Session 5', risk: 18, quality: 94 }
  ];

  const width = 360;
  const height = 180;
  const padding = 30;

  const getX = (idx) => padding + (idx * ((width - 2 * padding) / (data.length - 1 || 1)));
  const getY = (val) => height - padding - ((val / 100) * (height - 2 * padding));

  const riskPoints = data.map((d, i) => `${getX(i)},${getY(d.risk)}`).join(' ');
  const areaPoints = `${getX(0)},${height - padding} ${riskPoints} ${getX(data.length - 1)},${height - padding}`;
  const qualityPoints = data.map((d, i) => `${getX(i)},${getY(d.quality)}`).join(' ');

  return (
    <div className="trend-area-chart-card">
      <h4 className="chart-title">Historical Risk & Movement Quality Trajectory</h4>
      
      <div className="side-by-side-chart-layout">
        {/* Left Column: Trend SVG */}
        <div className="trend-container">
          <svg viewBox={`0 0 ${width} ${height}`} className="trend-svg">
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

            <polygon points={areaPoints} fill="rgba(239, 68, 68, 0.15)" />
            <polyline points={riskPoints} fill="none" stroke="#ef4444" strokeWidth="2.5" />
            <polyline points={qualityPoints} fill="none" stroke="#22c55e" strokeWidth="2.5" />

            {data.map((d, i) => (
              <g key={i}>
                <circle cx={getX(i)} cy={getY(d.risk)} r="4" fill="#dc2626" />
                <circle cx={getX(i)} cy={getY(d.quality)} r="4" fill="#16a34a" />
                <text x={getX(i)} y={height - 10} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
                  {d.date}
                </text>
              </g>
            ))}
          </svg>

          <div className="trend-legend">
            <span className="legend-line red">—— Injury Risk (%)</span>
            <span className="legend-line green">—— Movement Quality (%)</span>
          </div>
        </div>


        {/* Right Column: Trajectory Session Table */}
        <div className="chart-side-panel">
          <div className="side-panel-header">
            <span className="side-panel-title">Longitudinal Trajectory Log ({athleteName})</span>
          </div>
          <div className="side-panel-metrics-list">
            {data.map((d, i) => (
              <div key={i} className="side-metric-row">
                <span className="side-label">{d.date}:</span>
                <span className="side-value">
                  <span style={{ color: '#dc2626', fontWeight: '700' }}>Risk: {d.risk}%</span> | <span style={{ color: '#16a34a', fontWeight: '700' }}>Quality: {d.quality}%</span>
                </span>
              </div>
            ))}
          </div>
          <div className="side-panel-footer">
            Tracks movement recovery and risk reduction over consecutive training sessions.
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Interactive Roster Cohort Scatter Matrix Chart SVG Component
export function CohortScatterMatrixChart({ athletesList }) {

  const [selectedAthlete, setSelectedAthlete] = React.useState(null);

  const defaultAthletes = [
    { id: 'ATH-1001', name: 'Marcus Rashford', sport: 'Soccer', quality: 85.0, risk: 30, valgus: 8.5, x: 220, y: 160, color: '#22c55e' },
    { id: 'ATH-1002', name: 'Serena Williams', sport: 'Tennis', quality: 92.4, risk: 18, valgus: 4.2, x: 310, y: 200, color: '#22c55e' },
    { id: 'ATH-1003', name: 'Simone Biles', sport: 'Gymnastics', quality: 96.2, risk: 12, valgus: 3.1, x: 350, y: 220, color: '#22c55e' },
    { id: 'ATH-1004', name: 'Erling Haaland', sport: 'Soccer', quality: 88.0, risk: 95, valgus: 15.2, x: 250, y: 40, color: '#ef4444' },
    { id: 'ATH-1005', name: 'LeBron James', sport: 'Basketball', quality: 91.5, risk: 95, valgus: 14.8, x: 300, y: 40, color: '#ef4444' },
    { id: 'ATH-1006', name: 'Katie Ledecky', sport: 'Swimming', quality: 94.8, risk: 15, valgus: 3.5, x: 335, y: 210, color: '#22c55e' },
    { id: 'ATH-1007', name: 'Novak Djokovic', sport: 'Tennis', quality: 95.1, risk: 14, valgus: 3.8, x: 340, y: 215, color: '#22c55e' },
    { id: 'ATH-1008', name: 'Yulimar Rojas', sport: 'Track & Field', quality: 89.3, risk: 52, valgus: 9.8, x: 270, y: 110, color: '#f59e0b' },
    { id: 'ATH-1009', name: 'Kylian Mbappé', sport: 'Soccer', quality: 87.6, risk: 26, valgus: 7.2, x: 245, y: 170, color: '#22c55e' },
    { id: 'ATH-1010', name: 'Naomi Osaka', sport: 'Tennis', quality: 90.2, risk: 22, valgus: 5.5, x: 285, y: 185, color: '#22c55e' },
    { id: 'ATH-1011', name: 'Giannis Antetokounmpo', sport: 'Basketball', quality: 93.0, risk: 95, valgus: 16.1, x: 320, y: 40, color: '#ef4444' },
    { id: 'ATH-1012', name: 'Alex Morgan', sport: 'Soccer', quality: 89.0, risk: 35, valgus: 8.9, x: 265, y: 150, color: '#f59e0b' },
    { id: 'ATH-1013', name: 'Caeleb Dressel', sport: 'Swimming', quality: 92.0, risk: 20, valgus: 4.8, x: 305, y: 195, color: '#22c55e' }
  ];

  const data = athletesList && athletesList.length > 0 ? athletesList : defaultAthletes;

  return (
    <div className="cohort-scatter-card" style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            🎯 13-Athlete Roster Kinematic Cohort Matrix
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Interactive scatter plot mapping Movement Quality vs. Injury Risk probability across the 13 roster profiles.
          </p>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 12px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
          13 Active Athletes Synced
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'center' }}>
        {/* SVG Scatter Plot Grid */}
        <div style={{ position: 'relative', width: '100%' }}>
          <svg viewBox="0 0 400 260" style={{ width: '100%', height: 'auto', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            {/* Quadrant Background Colors */}
            <rect x="40" y="20" width="170" height="110" fill="rgba(239, 68, 68, 0.06)" />
            <rect x="210" y="20" width="170" height="110" fill="rgba(245, 158, 11, 0.08)" />
            <rect x="40" y="130" width="170" height="100" fill="rgba(245, 158, 11, 0.06)" />
            <rect x="210" y="130" width="170" height="100" fill="rgba(34, 197, 94, 0.08)" />

            {/* Grid Axes */}
            <line x1="40" y1="230" x2="380" y2="230" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="230" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Quadrant Divider Dotted Lines */}
            <line x1="210" y1="20" x2="210" y2="230" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="40" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />

            {/* Axis Labels */}
            <text x="210" y="252" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">
              Movement Quality Index Score (%) →
            </text>
            <text x="18" y="135" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569" transform="rotate(-90 18 135)">
              ← Injury Risk Index (%)
            </text>

            {/* Quadrant Labels */}
            <text x="50" y="36" fontSize="9" fontWeight="800" fill="#dc2626">High Risk Alert Zone</text>
            <text x="370" y="36" textAnchor="end" fontSize="9" fontWeight="800" fill="#d97706">Overuse Caution Zone</text>
            <text x="370" y="222" textAnchor="end" fontSize="9" fontWeight="800" fill="#16a34a">Optimal Performance Zone</text>

            {/* Athlete Scatter Bubbles */}
            {data.map((ath, idx) => (
              <g 
                key={ath.id || idx} 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedAthlete(ath)}
                onMouseEnter={() => setSelectedAthlete(ath)}
              >
                <circle 
                  cx={ath.x} 
                  cy={ath.y} 
                  r="8" 
                  fill={ath.color} 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  style={{ transition: 'all 0.2s ease', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                />
                <text 
                  x={ath.x} 
                  y={ath.y - 11} 
                  textAnchor="middle" 
                  fontSize="8" 
                  fontWeight="700" 
                  fill="#1e293b"
                >
                  {ath.name.split(' ')[0]}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Right Side Info Box for Hovered/Selected Athlete */}
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedAthlete ? (
            <>
              <div style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#1e40af' }}>{selectedAthlete.name}</strong>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{selectedAthlete.sport} | ID: {selectedAthlete.id}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Movement Quality:</span> <strong>{selectedAthlete.quality}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Injury Risk Score:</span> <strong style={{ color: selectedAthlete.risk > 40 ? '#dc2626' : '#16a34a' }}>{selectedAthlete.risk}%</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Knee Valgus Angle:</span> <strong>{selectedAthlete.valgus}°</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                ⚡ Hover over any bubble to inspect individual athlete kinematics within the 13-roster cohort.
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.82rem', padding: '12px 0' }}>
              👆 Hover over or click any athlete node on the scatter matrix to view individual kinematics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

