import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import api from '../api';
import './Analysis.css';

/*
  This page renders against a MOCK response shape for now.
  TODO (Milestone 2 backend, Day 8-9): replace mockAnalysis with a real call to
  GET /videos/{video_id}/analysis once the biomechanical analysis engine exists.
  Expected real response shape mirrors mockAnalysis below — keep field names
  consistent so this page needs zero changes when wired up.
*/
const mockAnalysis = {
  quality_score: 78,
  risk_category: 'moderate', // low | moderate | high | critical
  joint_angles: [
    { joint: 'Knee Flexion (L)', value: 62, max: 140 },
    { joint: 'Knee Flexion (R)', value: 71, max: 140 },
    { joint: 'Hip Flexion', value: 45, max: 120 },
    { joint: 'Ankle Dorsiflexion', value: 18, max: 40 },
    { joint: 'Trunk Lean', value: 12, max: 30 },
  ],
  symmetry: {
    left: [{ label: 'Knee angle', value: '62°' }, { label: 'Ground contact', value: '0.28s' }],
    right: [{ label: 'Knee angle', value: '71°' }, { label: 'Ground contact', value: '0.31s' }],
  },
  recommendations: [
    'Left knee shows reduced flexion vs. right — consider single-leg squats to build symmetry',
    'Landing mechanics indicate mild knee valgus risk — glute activation drills recommended',
    'Ankle dorsiflexion is within normal range — no action needed',
  ],
};

const RISK_LABELS = { low: 'Low Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Critical Risk' };

export default function Analysis() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const videoId = params.get('video');
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        // If no ?video= parameter, find the latest analyzed video
        if (!videoId) {
          const res = await api.get("/videos/mine");

          const analyzed = res.data
            .filter(v => v.status === "analyzed")
            .sort((a, b) => b.id - a.id);

          if (analyzed.length === 0) {
            return;
          }

          navigate(`/analysis?video=${analyzed[0].id}`, { replace: true });
          return;
        }

        // Load report
        const report = await api.get(`/videos/${videoId}/report`);
        setData(report.data);

      } catch (err) {
        console.error(err);
        setData(mockAnalysis);
      }
    };

    loadAnalysis();
  }, [videoId, navigate]);

  const circumference = 2 * Math.PI * 60;
  const scoreOffset = data ? circumference - (data.quality_score / 100) * circumference : circumference;

  return (
    <div className="analysis-page">
      <Topbar activePage="analysis" userName="Athlete" />

      <main className="analysis-main">
        <div className="analysis-header fade-in-up">
          <div>
            <h1>Movement Analysis {videoId ? `— Video #${videoId}` : ''}</h1>
            <p className="analysis-subtitle">
              Biomechanical breakdown of joint angles, symmetry, and movement quality.
            </p>
          </div>
        </div>

        <div className="mock-banner fade-in-up stagger" style={{ '--delay': '0.05s' }}>
          Showing placeholder data — this page is built ahead of the backend analysis
          engine (Milestone 2, Day 8-9) so the UI is ready the moment real data lands.
        </div>

        {!data ? (
          <div className="analysis-grid">
            <div className="score-card skeleton" style={{ height: 260 }} />
            <div className="analysis-panels">
              <div className="panel skeleton" style={{ height: 180 }} />
              <div className="panel skeleton" style={{ height: 140 }} />
            </div>
          </div>
        ) : (
          <div className="analysis-grid fade-in-up stagger" style={{ '--delay': '0.1s' }}>
            <div className="score-card">
              <div className="score-ring">
                <svg width="140" height="140">
                  <circle className="score-ring-bg" cx="70" cy="70" r="60" />
                  <circle
                    className="score-ring-fill"
                    cx="70" cy="70" r="60"
                    strokeDasharray={circumference}
                    strokeDashoffset={scoreOffset}
                  />
                </svg>
                <div className="score-ring-label">
                  <span className="score-ring-value">{data.quality_score}</span>
                  <span className="score-ring-unit">/ 100</span>
                </div>
              </div>
              <span className={`risk-badge risk-${data.risk_category}`}>
                {RISK_LABELS[data.risk_category]}
              </span>
              <p className="score-note">Movement quality score, based on joint angles and symmetry</p>
            </div>

            <div className="analysis-panels">
              <div className="panel">
                <h3>Joint Angles</h3>
                {data.joint_angles.map((j) => (
                  <div className="angle-row" key={j.joint}>
                    <div className="angle-row-labels">
                      <span className="joint-name">{j.joint}</span>
                      <span className="joint-value">{j.value}° / {j.max}°</span>
                    </div>
                    <div className="angle-track">
                      <div className="angle-fill" style={{ width: `${(j.value / j.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <h3>Left / Right Symmetry</h3>
                <div className="symmetry-compare">
                  <div className="symmetry-side">
                    <span className="symmetry-side-label">Left</span>
                    {data.symmetry.left.map((s) => (
                      <div className="angle-row-labels" key={s.label}>
                        <span className="joint-name">{s.label}</span>
                        <span className="joint-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="symmetry-side">
                    <span className="symmetry-side-label">Right</span>
                    {data.symmetry.right.map((s) => (
                      <div className="angle-row-labels" key={s.label}>
                        <span className="joint-name">{s.label}</span>
                        <span className="joint-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3>Recommendations</h3>
                <ul className="recommendation-list">
                  {data.recommendations.map((r, i) => (
                    <li className="recommendation-item" key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
