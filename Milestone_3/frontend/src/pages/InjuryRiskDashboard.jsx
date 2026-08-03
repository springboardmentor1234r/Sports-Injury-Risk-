import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  riskStyle,
  recommendationMeta,
  severityColor,
  RISK_SUBSCORE_FIELDS,
  INJURY_TYPE_EMOJI,
} from "../lib/risk";

const API_BASE = "http://localhost:8000";

export default function InjuryRiskDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);

  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [expandedAssessment, setExpandedAssessment] = useState(null);
  const [expandLoading, setExpandLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE}/videos/risk/overview`, { headers });
        setOverview(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Couldn't load your injury risk overview.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = async (videoId) => {
    if (expandedVideoId === videoId) {
      setExpandedVideoId(null);
      setExpandedAssessment(null);
      return;
    }
    setExpandedVideoId(videoId);
    setExpandedAssessment(null);
    setExpandLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/videos/${videoId}/risk-assessment`, { headers });
      setExpandedAssessment(res.data);
    } catch {
      setExpandedAssessment(null);
    } finally {
      setExpandLoading(false);
    }
  };

  const latest = overview?.latest_assessment;
  const rs = latest ? riskStyle(latest.risk_category) : null;

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.topRow}>
          <h2 style={styles.title}>🛡️ Injury Risk Dashboard</h2>
          <button style={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>

        {loading && (
          <div style={styles.spinnerBox}>
            <div style={styles.spinner} />
          </div>
        )}

        {!loading && error && <p style={styles.error}>⚠️ {error}</p>}

        {!loading && !error && !latest && (
          <div style={styles.emptyState}>
            <p style={{ fontSize: 40, margin: 0 }}>📹</p>
            <p style={styles.emptyTitle}>No risk assessment yet</p>
            <p style={styles.emptyDesc}>
              Upload and analyze a movement video to generate your first injury risk assessment.
            </p>
            <button style={styles.button} onClick={() => navigate("/video-analysis")}>
              🚀 Analyze a Video
            </button>
          </div>
        )}

        {!loading && !error && latest && (
          <>
            {/* Latest overall risk summary */}
            <div style={{ ...styles.summaryCard, background: rs.bg, border: `2px solid ${rs.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <p style={styles.summaryLabel}>Overall Injury Risk</p>
                  <p style={{ ...styles.summaryValue, color: rs.text }}>
                    {latest.risk_category} ({latest.overall_injury_risk_score}/100)
                  </p>
                  <p style={styles.summaryHint}>
                    Overall athlete health score: {latest.overall_athlete_health_score}/100
                  </p>
                </div>

                <div style={{ minWidth: 260, flex: 1 }}>
                  {RISK_SUBSCORE_FIELDS.map((f) => (
                    <div key={f.key} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                        <span>{f.label} ({f.weight})</span>
                        <span>{latest[f.key] ?? "—"}</span>
                      </div>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${Math.min(100, latest[f.key] ?? 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Injury category breakdown + recommendations */}
            <div style={styles.twoCol}>
              <div style={styles.panel}>
                <p style={styles.panelTitle}>Risk by Injury Category</p>
                {latest.injury_type_risks &&
                  Object.entries(latest.injury_type_risks).map(([type, val]) => (
                    <div key={type} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4c1d95", fontWeight: 600 }}>
                        <span>{INJURY_TYPE_EMOJI[type] || "•"} {type}</span>
                        <span>{val}/100</span>
                      </div>
                      <div style={styles.barTrack}>
                        <div style={{ ...styles.barFill, width: `${Math.min(100, val)}%` }} />
                      </div>
                    </div>
                  ))}

                {latest.anomalies_detected && latest.anomalies_detected.length > 0 && (
                  <>
                    <p style={{ ...styles.panelTitle, marginTop: 20 }}>Movement Anomalies</p>
                    {latest.anomalies_detected.map((a, i) => (
                      <p key={i} style={{ fontSize: 13, color: severityColor(a.severity), margin: "4px 0" }}>
                        • {a.description}
                      </p>
                    ))}
                  </>
                )}
              </div>

              <div style={styles.panel}>
                <p style={styles.panelTitle}>Corrective Recommendations</p>
                {latest.recommendations && latest.recommendations.length > 0 ? (
                  latest.recommendations.map((rec, i) => {
                    const meta = recommendationMeta(rec.category);
                    return (
                      <div key={i} style={styles.recCard}>
                        <p style={{ margin: 0, fontWeight: 700, color: "#4c1d95", fontSize: 14 }}>
                          {meta.emoji} {rec.title}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>{rec.description}</p>
                        <span style={styles.recTag}>{meta.label}</span>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>No recommendations yet.</p>
                )}
              </div>
            </div>

            {/* History */}
            <div style={styles.panel}>
              <p style={styles.panelTitle}>Risk History ({overview.history.length} video{overview.history.length === 1 ? "" : "s"} analyzed)</p>
              {overview.history.map((h) => {
                const hStyle = riskStyle(h.risk_category);
                const isOpen = expandedVideoId === h.video_id;
                return (
                  <div key={h.video_id} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        ...styles.historyRow,
                        background: hStyle.bg,
                        border: `1px solid ${hStyle.border}`,
                      }}
                      onClick={() => toggleExpand(h.video_id)}
                    >
                      <span style={{ fontWeight: 700, color: "#4c1d95" }}>
                        {h.activity_type.replace("_", " ")}
                      </span>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date(h.uploaded_at).toLocaleDateString()}
                      </span>
                      <span style={{ fontWeight: 700, color: hStyle.text }}>
                        {h.risk_category} ({h.overall_injury_risk_score}/100)
                      </span>
                      <span style={{ color: "#9ca3af" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div style={styles.expandBox}>
                        {expandLoading && <p style={{ fontSize: 13, color: "#6b7280" }}>Loading…</p>}
                        {!expandLoading && expandedAssessment && (
                          <>
                            {expandedAssessment.recommendations?.map((rec, i) => {
                              const meta = recommendationMeta(rec.category);
                              return (
                                <p key={i} style={{ fontSize: 12, color: "#4c1d95", margin: "3px 0" }}>
                                  {meta.emoji} <strong>{rec.title}</strong> — {rec.description}
                                </p>
                              );
                            })}
                            {expandedAssessment.anomalies_detected?.map((a, i) => (
                              <p key={i} style={{ fontSize: 12, color: severityColor(a.severity), margin: "3px 0" }}>
                                • {a.description}
                              </p>
                            ))}
                          </>
                        )}
                        {!expandLoading && !expandedAssessment && (
                          <p style={{ fontSize: 13, color: "#6b7280" }}>Couldn't load details for this video.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fff5f5 0%,#ffe4e4 35%,#fce7f3 70%,#ede9fe 100%)",
    display: "flex",
    justifyContent: "center",
    padding: "60px",
    fontFamily: "'Poppins', sans-serif",
  },
  card: {
    width: "1000px",
    maxWidth: "95vw",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(18px)",
    borderRadius: "32px",
    padding: "48px",
    boxShadow: "0 20px 60px rgba(239,68,68,0.15),0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    height: "fit-content",
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, fontSize: "32px", fontWeight: "700", color: "#b91c1c", letterSpacing: ".5px" },
  back: {
    background: "#fee2e2", color: "#b91c1c", border: "none", padding: "12px 22px",
    borderRadius: "16px", cursor: "pointer", fontWeight: "600", fontSize: "15px",
  },
  error: { color: "#ef4444", textAlign: "center", fontSize: "14px", fontWeight: 600 },
  spinnerBox: { display: "flex", justifyContent: "center", padding: "30px" },
  spinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "4px solid #fee2e2", borderTopColor: "#ef4444",
    animation: "spin 1s linear infinite",
  },
  emptyState: { textAlign: "center", padding: "40px 20px" },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#4c1d95", margin: "12px 0 6px" },
  emptyDesc: { fontSize: 14, color: "#6b7280", margin: "0 0 20px" },
  button: {
    background: "linear-gradient(135deg,#d946ef,#ec4899,#8b5cf6)",
    color: "white", padding: "16px 28px", border: "none", borderRadius: "18px",
    cursor: "pointer", fontWeight: "700", fontSize: "16px",
  },
  summaryCard: { borderRadius: "20px", padding: "24px" },
  summaryLabel: { fontSize: 13, color: "#6b7280", margin: 0, textTransform: "uppercase", letterSpacing: ".5px" },
  summaryValue: { fontSize: 32, fontWeight: 800, margin: "6px 0" },
  summaryHint: { fontSize: 13, color: "#6b7280", margin: 0 },
  barTrack: { height: 8, borderRadius: 999, background: "#f3e8ff", overflow: "hidden" },
  barFill: { height: "100%", background: "linear-gradient(90deg,#ef4444,#ec4899)" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  panel: {
    background: "#ffffff", borderRadius: "20px", padding: "22px",
    border: "2px solid #fce7f3", boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },
  panelTitle: { fontSize: 15, fontWeight: 700, color: "#4c1d95", margin: "0 0 14px" },
  recCard: {
    background: "#faf5ff", borderRadius: "14px", padding: "14px", marginBottom: 10,
    border: "1px solid #f3e8ff", position: "relative",
  },
  recTag: {
    display: "inline-block", marginTop: 8, fontSize: 10, fontWeight: 700,
    color: "#7c3aed", background: "#ede9fe", padding: "3px 10px", borderRadius: 999,
  },
  historyRow: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", alignItems: "center",
    padding: "14px 18px", borderRadius: "14px", cursor: "pointer", gap: 10,
  },
  expandBox: {
    background: "#fafafa", borderRadius: "0 0 14px 14px", padding: "14px 18px",
    border: "1px solid #f3f4f6", borderTop: "none", marginTop: -4,
  },
};
