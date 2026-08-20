/**
 * MovementAnalysisTab.jsx
 * Shared by Athlete ("MovementAnalysis") and Coach ("MovementQuality") tabs.
 * Shows: pose overlay video, detected anomaly banners, kinematic angle bars.
 */
import React from 'react';
import { Video, AlertTriangle } from 'lucide-react';
import PoseOverlayVideo from '../PoseOverlayVideo';
import { getVideoSource, formatDateTime } from '../../hooks/useApi';

export default function MovementAnalysisTab({ latestAnalysis, predictionReport, athleteName }) {
  if (!latestAnalysis) {
    return (
      <div className="content-hero-card animate-fade-in">
        <div className="hero-accent-strip" />
        <h2 className="workspace-title">Movement Anomaly Detection</h2>
        <div className="placeholder-tab-content">
          <Video size={48} className="placeholder-tab-icon" />
          <p className="placeholder-tab-text">
            No video upload found. Upload a video in the Overview tab to view your movement parameters.
          </p>
        </div>
      </div>
    );
  }

  const metrics = latestAnalysis.metrics || {};

  // Extract numerical values to calculate dynamic bar widths and colors
  const parseVal = (str, fallback) => {
    if (!str) return fallback;
    const match = String(str).match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : fallback;
  };

  const valgusDeg = parseVal(metrics.knee_valgus, 5.2);
  const hipDeg = parseVal(metrics.hip_stability, 1.8);
  const trunkDeg = parseVal(metrics.trunk_lean, 8.5);
  const flexDeg = parseVal(metrics.landing_mechanics, 42.0);
  const alignPct = parseVal(metrics.joint_alignment, 93.6);

  const angleItems = [
    {
      label: 'Knee Valgus',
      value: metrics.knee_valgus,
      width: `${Math.min(100, Math.max(25, (valgusDeg / 25) * 100))}%`,
      cls: valgusDeg > 12 ? 'warning' : 'optimal',
    },
    {
      label: 'Hip Stability',
      value: metrics.hip_stability,
      width: `${Math.min(100, Math.max(30, (hipDeg / 15) * 100))}%`,
      cls: hipDeg > 6 ? 'warning' : 'optimal',
    },
    {
      label: 'Trunk Lean',
      value: metrics.trunk_lean,
      width: `${Math.min(100, Math.max(30, (trunkDeg / 25) * 100))}%`,
      cls: trunkDeg > 15 ? 'warning' : 'optimal',
    },
    {
      label: 'Landing Mechanics',
      value: metrics.landing_mechanics,
      width: `${Math.min(100, Math.max(30, (flexDeg / 90) * 100))}%`,
      cls: flexDeg < 35 ? 'warning' : 'optimal',
    },
    {
      label: 'Joint Alignment',
      value: metrics.joint_alignment,
      width: `${Math.min(100, Math.max(40, alignPct))}%`,
      cls: alignPct < 85 ? 'warning' : 'optimal',
    },
  ];

  const processedDateStr = formatDateTime(latestAnalysis.upload_date || latestAnalysis.created_at);

  return (
    <div className="content-hero-card animate-fade-in">
      <div className="hero-accent-strip" />
      <h2 className="workspace-title">Movement Anomaly Detection</h2>
      <p className="workspace-desc">
        Computer vision joint angle tracking feedback &amp; anomaly detection engine output.
      </p>

      <div className="athlete-detail-view animate-scale-in">
        {/* Pose overlay video */}
        {latestAnalysis.video_url && (
          <div className="video-player-card" style={{ marginBottom: 20, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Biomechanical Pose Tracking Video</h3>
              {processedDateStr && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  📅 Processed: {processedDateStr}
                </span>
              )}
            </div>
            <PoseOverlayVideo
              key={latestAnalysis.video_url || latestAnalysis.analysis_id}
              src={getVideoSource(latestAnalysis.video_url)}
              style={{ maxWidth: 720, borderRadius: 8, border: '1px solid var(--border-color)' }}
            />
          </div>
        )}

        {/* Anomaly banners */}
        {predictionReport?.anomalies?.length > 0 && (
          <div className="anomalies-section" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Detected Movement Flaws &amp; Anomalies</h3>
            <div className="anomalies-grid" style={{ display: 'grid', gap: 12 }}>
              {predictionReport.anomalies.map((anom, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={20} color={anom.severity === 'Critical' ? '#ef4444' : '#f59e0b'} style={{ marginTop: 2 }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                      {anom.title}{' '}
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, backgroundColor: anom.severity === 'Critical' ? '#fef2f2' : '#fffbeb', color: anom.severity === 'Critical' ? '#dc2626' : '#d97706', marginLeft: 8 }}>
                        {anom.severity}
                      </span>
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{anom.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kinematic angle bars */}
        <div className="joint-angles-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ margin: 0 }}>Pose Estimation Kinematic Angles ({latestAnalysis.filename})</h3>
            {processedDateStr && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                📅 {processedDateStr}
              </span>
            )}
          </div>
          <div className="angles-list">
            {angleItems.map(({ label, value, width, cls }) => value ? (
              <div key={label} className="angle-item">
                <span className="angle-name">{label}</span>
                <div className="angle-bar-container">
                  <div className={`angle-bar ${cls}`} style={{ width }}>{value}</div>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    </div>
  );
}
