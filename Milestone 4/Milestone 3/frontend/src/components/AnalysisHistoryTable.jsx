import React, { useState } from 'react';
import { Eye, Trash2, FileText, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnalysisHistoryTable = ({ analyses = [], onDelete }) => {
  const navigate = useNavigate();

  const getBadgeClass = (riskLevel) => {
    const l = (riskLevel || '').toLowerCase();
    if (l.includes('low')) return 'badge-low';
    if (l.includes('mod')) return 'badge-moderate';
    if (l.includes('high')) return 'badge-high';
    return 'badge-critical';
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Athlete Name</th>
            <th>Video Session</th>
            <th>Frames</th>
            <th>Risk Score</th>
            <th>Risk Level</th>
            <th>Analysis Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {analyses.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                No analysis records found. Upload a video to start your first biomechanics analysis.
              </td>
            </tr>
          ) : (
            analyses.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong style={{ color: '#1F2937' }}>{item.athlete_name}</strong>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Video size={14} color="#15803D" />
                    <span>{item.video_name}</span>
                  </div>
                </td>
                <td>{item.frames_analyzed || 120} frames</td>
                <td>
                  <span style={{ fontWeight: '800', color: item.overall_risk_score > 50 ? '#C2410C' : '#15803D' }}>
                    {item.overall_risk_score} / 100
                  </span>
                </td>
                <td>
                  <span className={`badge ${getBadgeClass(item.risk_level)}`}>
                    {item.risk_level}
                  </span>
                </td>
                <td>
                  {new Date(item.analysis_date).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => navigate(`/analysis?id=${item.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      title="View Report Details"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', color: '#EF4444' }}
                        title="Delete Analysis"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisHistoryTable;
