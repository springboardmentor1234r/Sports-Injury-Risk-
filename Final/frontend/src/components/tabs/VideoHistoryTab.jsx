/**
 * VideoHistoryTab.jsx
 * Athlete → "Video Upload History" tab
 */
import React from 'react';
import { Film, UploadCloud, Eye, RefreshCw } from 'lucide-react';
import { getVideoSource, formatDateTime } from '../../hooks/useApi';

export default function VideoHistoryTab({
  videoHistory, latestAnalysis, loadingHistory,
  onRefresh, onInspect, onGoToUpload,
}) {
  const displayHistory =
    videoHistory?.length > 0 ? videoHistory : latestAnalysis ? [latestAnalysis] : [];

  return (
    <div className="content-hero-card animate-fade-in">
      <div className="hero-accent-strip" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 className="workspace-title">Video Upload &amp; Motion Analysis History</h2>
          <p className="workspace-desc">
            Chronological repository of all recorded motion capture sessions, frame overlay videos, and biomechanical timestamps.
          </p>
        </div>
        <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {displayHistory.length === 0 ? (
        <div className="placeholder-tab-content" style={{ marginTop: 24 }}>
          <Film size={48} className="placeholder-tab-icon" />
          <p className="placeholder-tab-text">No uploaded motion analysis videos found yet.</p>
          <button onClick={onGoToUpload} className="form-submit-btn" style={{ width: 'auto', marginTop: 12 }}>
            <UploadCloud size={16} /> Upload Movement Video
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 24 }}>
          {displayHistory.map((item) => {
            const uploadDateStr = item.upload_date ? formatDateTime(item.upload_date) : 'Recent Upload';
            const riskScore = item.scores?.injury_risk_score || 34;

            return (
              <div key={item.analysis_id || item._id} className="history-video-card" style={{ padding: 18, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', backgroundColor: '#000', border: '1px solid var(--border-color)' }}>
                  <video
                    key={item.video_url || item.analysis_id}
                    src={getVideoSource(item.video_url)}
                    controls
                    preload="metadata"
                    style={{ width: '100%', height: 200, objectFit: 'contain', display: 'block' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.filename}</strong>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10, backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                      {item.analysis_id}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                    📅 {uploadDateStr}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="id-badge" style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                    Quality: {item.scores?.movement_quality_score || 82}%
                  </span>
                  <span className="id-badge" style={{ backgroundColor: riskScore > 40 ? '#fef2f2' : '#f0fdf4', color: riskScore > 40 ? '#991b1b' : '#166534', border: '1px solid #fecaca' }}>
                    Risk: {riskScore}%
                  </span>
                  {item.video_metadata?.resolution && (
                    <span className="id-badge" style={{ backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1' }}>
                      {item.video_metadata.resolution} @ {item.video_metadata.fps || 25} FPS
                    </span>
                  )}
                </div>

                {item.metrics && (
                  <div style={{ padding: 10, backgroundColor: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {item.metrics.knee_valgus && <div><strong>Knee Valgus:</strong> {item.metrics.knee_valgus}</div>}
                    {item.metrics.landing_mechanics && <div><strong>Landing Mechanics:</strong> {item.metrics.landing_mechanics}</div>}
                    {item.metrics.joint_alignment && <div><strong>Joint Alignment:</strong> {item.metrics.joint_alignment}</div>}
                  </div>
                )}

                <button
                  onClick={() => onInspect(item)}
                  style={{ padding: 9, borderRadius: 6, backgroundColor: 'var(--accent)', color: 'var(--button-text)', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Eye size={14} /> Inspect Full Biomechanical Report
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
