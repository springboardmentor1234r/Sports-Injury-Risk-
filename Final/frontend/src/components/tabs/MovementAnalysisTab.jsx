/**
 * MovementAnalysisTab.jsx
 * Shared by Athlete ("MovementAnalysis") and Coach ("MovementQuality") tabs.
 * Shows: pose overlay video, detected anomaly banners, kinematic angle bars.
 */
import React from 'react';
import { Video, AlertTriangle } from 'lucide-react';
import PoseOverlayVideo from '../PoseOverlayVideo';
import { getVideoSource } from '../../hooks/useApi';

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

  const angleItems = [
    { label: 'Knee Valgus', value: metrics.knee_valgus, width: '82%', cls: 'optimal' },
    { label: 'Hip Stability', value: metrics.hip_stability, width: '75%', cls: 'optimal' },
    { label: 'Trunk Lean', value: metrics.trunk_lean, width: '80%', cls: 'optimal' },
    { label: 'Landing Mechanics', value: metrics.landing_mechanics, width: '65%', cls: 'optimal' },
    { label: 'Joint Alignment', value: metrics.joint_alignment, width: '72%', cls: 'optimal' },
  ];

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
            <h3 style={{ marginBottom: 16, fontSize: '1.15rem', fontWeight: 800 }}>Biomechanical Pose Tracking Video</h3>
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
          <h3>Pose Estimation Kinematic Angles ({latestAnalysis.filename})</h3>
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
