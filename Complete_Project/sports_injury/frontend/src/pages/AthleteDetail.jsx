import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { riskStyle, recommendationMeta, severityColor, RISK_SUBSCORE_FIELDS, INJURY_TYPE_EMOJI } from "../lib/risk";
import { API_BASE } from "../lib/config";
import { downloadFile } from "../lib/download";

const CONNECTIONS = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"], ["left_knee", "left_ankle"], ["left_ankle", "left_foot_index"],
  ["right_hip", "right_knee"], ["right_knee", "right_ankle"], ["right_ankle", "right_foot_index"],
];

const STATUS_BADGE = {
  uploaded: { label: "⏳ Queued", color: "#f59e0b" },
  processing: { label: "⚙️ Processing", color: "#3b82f6" },
  completed: { label: "✅ Completed", color: "#22c55e" },
  failed: { label: "❌ Failed", color: "#ef4444" },
};

export default function AthleteDetail() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const headers = { Authorization: `Bearer ${token}` };

  const [athlete, setAthlete] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [frames, setFrames] = useState([]);
  const [report, setReport] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [downloading, setDownloading] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!role || role === "athlete") return navigate("/login", { replace: true });

    Promise.all([
      axios.get(`${API_BASE}/staff/athlete/${athleteId}`, { headers }),
      axios.get(`${API_BASE}/staff/athlete/${athleteId}/videos`, { headers }),
    ])
      .then(([profileRes, videosRes]) => {
        setAthlete(profileRes.data);
        setVideos(videosRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Couldn't load this athlete.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  const handleDownloadAthleteReport = async (format) => {
    setDownloading(format);
    try {
      const ext = format === "pdf" ? "pdf" : "xlsx";
      await downloadFile(
        `${API_BASE}/reports/staff/athlete/${athleteId}/${format}`,
        headers,
        `athlete_${athleteId}_performance_report.${ext}`
      );
    } catch {
      setError("Couldn't generate the report — try again.");
    } finally {
      setDownloading("");
    }
  };

  const openVideo = async (video) => {
    setSelectedVideo(video);
    setFrames([]);
    setReport(null);
    setRiskAssessment(null);
    try {
      const [framesRes, reportRes] = await Promise.all([
        axios.get(`${API_BASE}/staff/athlete/${athleteId}/videos/${video.id}/pose-frames`, { headers }),
        axios.get(`${API_BASE}/staff/athlete/${athleteId}/videos/${video.id}/biomechanics`, { headers }),
      ]);
      setFrames(framesRes.data);
      setReport(reportRes.data);
    } catch {
      // If frames/report aren't ready this will just show the video without overlay/report.
    }

    // Milestone 3 — Injury Risk Prediction Engine result (fetched
    // separately: allowed to lag behind biomechanics briefly).
    try {
      const riskRes = await axios.get(
        `${API_BASE}/staff/athlete/${athleteId}/videos/${video.id}/risk-assessment`,
        { headers }
      );
      setRiskAssessment(riskRes.data);
    } catch {
      setRiskAssessment(null);
    }
  };

  // Skeleton overlay in sync with video playback (same logic as VideoAnalysis.jsx)
  useEffect(() => {
    const vid = videoRef.current;
    const canvas = canvasRef.current;
    if (!vid || !canvas || frames.length === 0) return;

    const ctx = canvas.getContext("2d");
    let rafId;

    const findNearestFrame = (timeMs) => {
      let lo = 0, hi = frames.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (frames[mid].timestamp_ms < timeMs) lo = mid + 1;
        else hi = mid;
      }
      return frames[lo];
    };

    const draw = () => {
      if (vid.videoWidth && canvas.width !== vid.clientWidth) {
        canvas.width = vid.clientWidth;
        canvas.height = vid.clientHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const frame = findNearestFrame(vid.currentTime * 1000);
      if (frame) {
        const kp = frame.keypoints;
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 3;
        CONNECTIONS.forEach(([a, b]) => {
          if (kp[a] && kp[b]) {
            ctx.beginPath();
            ctx.moveTo(kp[a].x * canvas.width, kp[a].y * canvas.height);
            ctx.lineTo(kp[b].x * canvas.width, kp[b].y * canvas.height);
            ctx.stroke();
          }
        });
        ctx.fillStyle = "#ec4899";
        Object.values(kp).forEach((pt) => {
          if (pt.visibility > 0.5) {
            ctx.beginPath();
            ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [frames]);

  const rs = riskAssessment ? riskStyle(riskAssessment.risk_category) : null;
  const reportCards = report
    ? [
        { label: "Knee Valgus Asymmetry", value: report.knee_valgus_asymmetry, hint: "Left vs. right deviation" },
        { label: "Movement Symmetry", value: report.movement_symmetry_score, suffix: " / 100", hint: "Left/right knee angle match" },
        { label: "Movement Quality", value: report.movement_quality_score, suffix: " / 100", hint: "Combined score" },
        { label: "Avg. Trunk Lean", value: report.avg_trunk_lean, suffix: "°", hint: "Deviation from vertical" },
      ]
    : [];

  if (loading) return <div style={styles.page}><p style={styles.msg}>Loading athlete…</p></div>;
  if (error) return <div style={styles.page}><p style={styles.error}>⚠️ {error}</p></div>;

  return (
    <div style={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={styles.downloadBtn}
            onClick={() => handleDownloadAthleteReport("pdf")}
            disabled={downloading === "pdf"}
          >
            {downloading === "pdf" ? "Generating…" : "📄 PDF Report"}
          </button>
          <button
            style={styles.downloadBtn}
            onClick={() => handleDownloadAthleteReport("excel")}
            disabled={downloading === "excel"}
          >
            {downloading === "excel" ? "Generating…" : "📊 Excel Report"}
          </button>
        </div>
      </div>

      {/* Profile header */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>🏃</div>
        <div>
          <h1 style={styles.name}>{athlete.owner_name}</h1>
          <p style={styles.email}>{athlete.owner_email}</p>
          <div style={styles.tags}>
            <span style={styles.tag}>⚽ {athlete.sport}</span>
            <span style={styles.tag}>📍 {athlete.position}</span>
            <span style={styles.tag}>🎂 {athlete.age}y</span>
            <span style={styles.tag}>📏 {athlete.height}cm</span>
            <span style={styles.tag}>⚖️ {athlete.weight}kg</span>
          </div>
          {athlete.injury_history && (
            <p style={styles.infoLine}>🩹 Injury history: {athlete.injury_history}</p>
          )}
          {athlete.training_load && (
            <p style={styles.infoLine}>📊 Training load: {athlete.training_load}</p>
          )}
        </div>
      </div>

      {/* Video list */}
      <h2 style={styles.sectionTitle}>🎥 Uploaded Videos ({videos.length})</h2>
      {videos.length === 0 ? (
        <p style={styles.emptyText}>This athlete hasn't uploaded any movement videos yet.</p>
      ) : (
        <div style={styles.videoGrid}>
          {videos.map((v) => {
            const badge = STATUS_BADGE[v.status] || STATUS_BADGE.uploaded;
            return (
              <div
                key={v.id}
                style={{
                  ...styles.videoCard,
                  outline: selectedVideo?.id === v.id ? "3px solid #a855f7" : "none",
                }}
                onClick={() => v.status === "completed" && openVideo(v)}
              >
                <p style={styles.videoActivity}>{v.activity_type.replace("_", " ")}</p>
                <p style={{ ...styles.videoStatus, color: badge.color }}>{badge.label}</p>
                <p style={styles.videoDate}>{new Date(v.uploaded_at).toLocaleDateString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected video: skeleton overlay + report */}
     {selectedVideo && (
  <div style={styles.resultsGrid}>
    {riskAssessment && (
      <div style={{
        ...styles.reportCard,
        background: rs.bg,
        border: `2px solid ${rs.border}`,
      }}>
        <p style={styles.reportLabel}>Injury Risk Prediction</p>
        <p style={{ ...styles.reportValue, color: rs.text }}>
          {riskAssessment.risk_category} Risk ({riskAssessment.overall_injury_risk_score}/100)
        </p>
        <p style={styles.reportHint}>
          Athlete health score: {riskAssessment.overall_athlete_health_score}/100
        </p>

        <div style={{ marginTop: 14 }}>
          {RISK_SUBSCORE_FIELDS.map((f) => (
            <div key={f.key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                <span>{f.label} ({f.weight})</span>
                <span>{riskAssessment[f.key] ?? "—"}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "#f3e8ff", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(100, riskAssessment[f.key] ?? 0)}%`,
                  background: "linear-gradient(90deg,#d946ef,#8b5cf6)",
                }} />
              </div>
            </div>
          ))}
        </div>

        {riskAssessment.injury_type_risks && (
          <div style={{ marginTop: 14 }}>
            <p style={{ ...styles.reportLabel, marginBottom: 8 }}>By Injury Category</p>
            {Object.entries(riskAssessment.injury_type_risks).map(([type, val]) => (
              <p key={type} style={{ fontSize: 12, color: "#4c1d95", margin: "3px 0" }}>
                {INJURY_TYPE_EMOJI[type] || "•"} {type}: <strong>{val}</strong>/100
              </p>
            ))}
          </div>
        )}

        {riskAssessment.anomalies_detected && riskAssessment.anomalies_detected.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ ...styles.reportLabel, marginBottom: 8 }}>Movement Anomalies Detected</p>
            {riskAssessment.anomalies_detected.map((a, i) => (
              <p key={i} style={{ fontSize: 12, color: severityColor(a.severity), margin: "3px 0" }}>
                • {a.description}
              </p>
            ))}
          </div>
        )}

        {riskAssessment.recommendations && riskAssessment.recommendations.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ ...styles.reportLabel, marginBottom: 8 }}>Corrective Recommendations</p>
            {riskAssessment.recommendations.map((rec, i) => {
              const meta = recommendationMeta(rec.category);
              return (
                <p key={i} style={{ fontSize: 12, color: "#4c1d95", margin: "3px 0" }}>
                  {meta.emoji} <strong>{rec.title}</strong> — {rec.description}
                </p>
              );
            })}
          </div>
        )}
      </div>
    )}

    <div style={styles.reportGrid}>
            {reportCards.map((c) => (
              <div key={c.label} style={styles.reportCard}>
                <p style={styles.reportLabel}>{c.label}</p>
                <p style={styles.reportValue}>
                  {c.value ?? "—"}{c.value != null ? c.suffix || "" : ""}
                </p>
                <p style={styles.reportHint}>{c.hint}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fdf4ff 0%,#f8e8ff 35%,#fce7f3 70%,#ede9fe 100%)",
    fontFamily: "'Poppins', sans-serif",
    padding: "48px 60px",
  },
  msg: { color: "#6d28d9", fontWeight: 600 },
  error: { color: "#ef4444", fontWeight: 600 },
  back: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "10px 20px",
    borderRadius: "14px", cursor: "pointer", fontWeight: 600, marginBottom: "24px",
  },
  downloadBtn: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "10px 18px",
    borderRadius: "14px", cursor: "pointer", fontWeight: 600, marginBottom: "24px", fontSize: "14px",
  },
  profileCard: {
    display: "flex", gap: "24px", alignItems: "flex-start",
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(14px)", borderRadius: "24px",
    padding: "32px", border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 10px 30px rgba(168,85,247,0.12)", marginBottom: "36px",
  },
  avatar: {
    width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg,#d946ef,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
  },
  name: { margin: 0, fontSize: 26, fontWeight: 800, color: "#1e1b4b" },
  email: { margin: "4px 0 12px", color: "#6b7280", fontSize: 14 },
  tags: { display: "flex", gap: "10px", flexWrap: "wrap" },
  tag: {
    background: "#f3e8ff", color: "#6d28d9", padding: "6px 14px", borderRadius: "999px",
    fontSize: 13, fontWeight: 600,
  },
  infoLine: { fontSize: 14, color: "#374151", marginTop: "10px" },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: "#4c1d95", marginBottom: "16px" },
  emptyText: { color: "#9ca3af", fontSize: 14 },
  videoGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "16px", marginBottom: "36px",
  },
  videoCard: {
    background: "#ffffff", borderRadius: "16px", padding: "18px",
    border: "2px solid #f3e8ff", cursor: "pointer",
    boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },
  videoActivity: { margin: 0, fontWeight: 700, color: "#4c1d95", textTransform: "capitalize" },
  videoStatus: { margin: "8px 0 0", fontSize: 13, fontWeight: 700 },
  videoDate: { margin: "4px 0 0", fontSize: 12, color: "#9ca3af" },
  resultsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  reportGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  reportCard: {
    background: "#ffffff", borderRadius: "16px", padding: "18px",
    border: "2px solid #f3e8ff", boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },
  reportLabel: { fontSize: 13, color: "#6b7280", margin: 0 },
  reportValue: { fontSize: 26, fontWeight: 800, color: "#6d28d9", margin: "6px 0" },
  reportHint: { fontSize: 11, color: "#9ca3af", margin: 0 },
};
