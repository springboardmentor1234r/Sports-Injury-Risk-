/**
 * ExerciseRecsTab.jsx
 * Athlete → "Exercise Recommendations" tab
 */
import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { API_BASE } from '../../hooks/useApi';

export default function ExerciseRecsTab({ token, recommendationsData }) {
  const [aiStatus, setAiStatus] = useState(null);

  const testGeminiAgent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/system/test-gemini`);
      const data = await res.json();
      setAiStatus(data);
    } catch { /* ignore */ }
  };

  const { automated = [], coach_custom = [] } = recommendationsData || {};

  return (
    <div className="content-hero-card animate-fade-in">
      <div className="hero-accent-strip" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="workspace-title">Corrective AI Exercise Prescriptions</h2>
          <p className="workspace-desc">Automated Gemini AI Agent exercise prescriptions and custom practitioner modifications.</p>
        </div>
        <button onClick={testGeminiAgent} className="form-submit-btn"
          style={{ width: 'auto', padding: '8px 16px', margin: 0, backgroundColor: '#8b5cf6', fontSize: '0.85rem' }}>
          <Cpu size={16} /><span>Test AI Agent Status</span>
        </button>
      </div>

      {aiStatus && (
        <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: 8, border: aiStatus.status === 'success' ? '1px solid #bbf7d0' : '1px solid #fca5a5', backgroundColor: aiStatus.status === 'success' ? '#f0fdf4' : '#fef2f2', fontSize: '0.85rem' }}>
          <strong>AI Agent Status:</strong> {aiStatus.ai_agent_status || aiStatus.message}
          {aiStatus.working_model && <span> | <strong>Active Model:</strong> {aiStatus.working_model}</span>}
        </div>
      )}

      <div className="recommendations-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Coach Custom Prescriptions */}
        {coach_custom.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12, color: '#2563eb' }}>Prescribed Practitioner Routines</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {coach_custom.map((rec) => (
                <div key={rec.rec_id || rec._id} style={{ padding: 16, borderRadius: 8, border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>{rec.title}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                      By: {rec.prescribed_by} ({rec.author_role})
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: '0.9rem', color: '#1e3a8a' }}>{rec.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
                    <span>Target: {rec.body_region}</span>
                    <span>Duration: {rec.duration}</span>
                    <span>Frequency: {rec.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automated AI Recommendations */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Automated AI Biomechanical Routines</h3>
          {automated.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {automated.map((rec, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 8, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>{rec.title}</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: rec.priority === 'High' ? '#fef2f2' : '#f0fdf4', color: rec.priority === 'High' ? '#dc2626' : '#16a34a' }}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rec.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Category: {rec.category}</span>
                    <span>Frequency: {rec.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="placeholder-tab-text">Upload a movement video to generate custom AI recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
}
