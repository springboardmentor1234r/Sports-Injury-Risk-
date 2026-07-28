import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

const ACTIVITIES = [
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "sprinting", label: "Sprinting", emoji: "💨" },
  { value: "jumping", label: "Jumping", emoji: "🤸" },
  { value: "squatting", label: "Squatting", emoji: "🏋️" },
  { value: "landing", label: "Landing", emoji: "🦵" },
  { value: "throwing", label: "Throwing", emoji: "🤾" },
  { value: "cutting_movement", label: "Cutting Movement", emoji: "🔀" },
  { value: "sport_specific_drill", label: "Sport-Specific Drill", emoji: "🥅" },
];

// Decorative floating emojis around the card
const FLOATING_EMOJIS = ["⚽", "🏀", "🏃‍♀️", "🥇", "💪", "🏋️‍♂️", "🤸‍♀️", "🎯", "⏱️", "🏆"];

// Keep in sync with SKELETON connections used server-side in
// backend/services/pose_estimation.py
const CONNECTIONS = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"], ["left_knee", "left_ankle"], ["left_ankle", "left_foot_index"],
  ["right_hip", "right_knee"], ["right_knee", "right_ankle"], ["right_ankle", "right_foot_index"],
];

export default function VideoAnalysis() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [activity, setActivity] = useState(ACTIVITIES[0].value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [video, setVideo] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [frames, setFrames] = useState([]);
  const [report, setReport] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedActivity = ACTIVITIES.find((a) => a.value === activity);

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  // Close the custom dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    setError("");
    setFile(e.target.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return setError("Choose a video first.");
    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("activity_type", activity);
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/videos/upload`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });
      setVideo(res.data);
      setStatusMsg("Processing video — running pose estimation…");
      startPolling(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const startPolling = (videoId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/videos/${videoId}`, { headers });
        setVideo(res.data);

        if (res.data.status === "completed") {
          clearInterval(pollRef.current);
          setStatusMsg("");
          loadResults(videoId);
        } else if (res.data.status === "failed") {
          clearInterval(pollRef.current);
          setStatusMsg(`Processing failed: ${res.data.error_message || "unknown error"}`);
        } else {
          setStatusMsg("Processing video — running pose estimation…");
        }
      } catch {
        clearInterval(pollRef.current);
        setStatusMsg("Couldn't check status — refresh the page.");
      }
    }, 3000);
  };

  const loadResults = async (videoId) => {
    try {
      const [framesRes, reportRes] = await Promise.all([
        axios.get(`${API_BASE}/videos/${videoId}/pose-frames`, { headers }),
        axios.get(`${API_BASE}/videos/${videoId}/biomechanics`, { headers }),
      ]);
      setFrames(framesRes.data);
      setReport(reportRes.data);
    } catch {
      setStatusMsg("Video processed, but couldn't load results — refresh the page.");
    }
  };

  // Draws the skeleton overlay in sync with video playback
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

  const getRiskVerdict = (report) => {
  if (!report) return null;

  const { movement_quality_score, avg_trunk_lean, knee_valgus_asymmetry } = report;

  const reasons = [];
  let riskLevel = "Low";

  if (movement_quality_score < 50) {
    riskLevel = "High";
    reasons.push("Overall movement quality is poor — form breakdown detected");
  } else if (movement_quality_score < 75) {
    riskLevel = "Medium";
    reasons.push("Movement quality is below optimal range");
  }

  if (avg_trunk_lean > 20) {
    riskLevel = "High";
    reasons.push(`Trunk lean is too high (${avg_trunk_lean}°) — adjust your posture`);
  } else if (avg_trunk_lean > 12 && riskLevel !== "High") {
    riskLevel = "Medium";
    reasons.push(`Trunk lean is slightly elevated (${avg_trunk_lean}°)`);
  }

  if (knee_valgus_asymmetry > 5) {
    riskLevel = "High";
    reasons.push("Knee valgus asymmetry is high — change your landing angle");
  }

  if (reasons.length === 0) {
    reasons.push("Your form looks good — knee angles, trunk lean, and symmetry are all within safe range");
  }

  return { riskLevel, reasons };
};
const verdict = getRiskVerdict(report);
  const reportCards = report
    ? [
        { label: "Knee Valgus Asymmetry", value: report.knee_valgus_asymmetry, hint: "Left vs. right deviation — lower is better" },
        { label: "Movement Symmetry", value: report.movement_symmetry_score, suffix: " / 100", hint: "How closely left/right knee angles match" },
        { label: "Movement Quality", value: report.movement_quality_score, suffix: " / 100", hint: "Combined valgus + symmetry score" },
        { label: "Avg. Trunk Lean", value: report.avg_trunk_lean, suffix: "°", hint: "Deviation from vertical posture" },
      ]
    : [];

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes floatY {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(8deg); }
        }
        .dropdown-option:hover { background: #f3e8ff !important; }
      `}</style>

      {/* Decorative floating emojis around the card */}
      {FLOATING_EMOJIS.map((e, i) => (
        <span key={i} style={styles.floatingEmoji(i)}>{e}</span>
      ))}

      <div style={styles.card}>
        <div style={styles.topRow}>
          <h2 style={styles.title}>🎥 Video Analysis 🤖</h2>
          <button style={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>

        {!video && (
          <>
            <div style={styles.grid}>
              {/* Custom-styled dropdown matching the app's glass UI */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  style={styles.dropdownButton}
                  onClick={() => setDropdownOpen((o) => !o)}
                >
                  <span style={{ fontSize: 26, marginRight: 12 }}>{selectedActivity.emoji}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{selectedActivity.label}</span>
                  <span style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
                    ▾
                  </span>
                </button>

                {dropdownOpen && (
                  <div style={styles.dropdownList}>
                    {ACTIVITIES.map((a) => (
                      <div
                        key={a.value}
                        className="dropdown-option"
                        style={{
                          ...styles.dropdownOption,
                          background: a.value === activity ? "#f3e8ff" : "transparent",
                        }}
                        onClick={() => {
                          setActivity(a.value);
                          setDropdownOpen(false);
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{a.emoji}</span>
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Big custom "choose file" button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  style={styles.chooseFileButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span style={{ fontSize: 26, marginRight: 12 }}>📁</span>
                  {file ? "Change Video" : "Choose Video File"}
                </button>
                {file && (
                  <p style={styles.fileChip}>
                    🎬 {file.name}
                  </p>
                )}
              </div>
            </div>

            {error && <p style={styles.error}>⚠️ {error}</p>}

            {uploading && (
              <div style={styles.progressTrack}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
            )}

            <button style={styles.button} onClick={handleUpload} disabled={uploading}>
              {uploading ? `⏳ Uploading… ${progress}%` : "🚀 Upload & Analyze"}
            </button>
          </>
        )}

        {video && statusMsg && <p style={styles.msg}>⏳ {statusMsg}</p>}

        {video && video.status === "completed" && (
          <div style={styles.resultsGrid}>
  {verdict && (
    <div style={{
      ...styles.reportCard,
      background: verdict.riskLevel === "High" ? "#fef2f2" : verdict.riskLevel === "Medium" ? "#fffbeb" : "#f0fdf4",
      border: `2px solid ${verdict.riskLevel === "High" ? "#fecaca" : verdict.riskLevel === "Medium" ? "#fde68a" : "#bbf7d0"}`,
    }}>
      <p style={styles.reportLabel}>Final Assessment</p>
      <p style={{
        ...styles.reportValue,
        color: verdict.riskLevel === "High" ? "#dc2626" : verdict.riskLevel === "Medium" ? "#d97706" : "#16a34a",
      }}>
        {verdict.riskLevel} Risk of Injury
      </p>
      {verdict.reasons.map((r, i) => (
        <p key={i} style={styles.reportHint}>• {r}</p>
      ))}
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

              {report?.rom_summary && (
                <div style={{ ...styles.reportCard, gridColumn: "1 / -1" }}>
                  <p style={styles.reportLabel}>📐 Range of Motion (Knees)</p>
                  <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
                    {Object.entries(report.rom_summary).map(([joint, range]) =>
                      range ? (
                        <div key={joint}>
                          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                            {joint.replace("_", " ")}
                          </p>
                          <p style={{ fontSize: 16, fontWeight: 700, color: "#4c1d95", margin: "4px 0 0" }}>
                            {range.min}° – {range.max}°
                          </p>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {video && (video.status === "uploaded" || video.status === "processing") && (
          <div style={styles.spinnerBox}>
            <div style={styles.spinner} />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#fdf4ff 0%,#f8e8ff 35%,#fce7f3 70%,#ede9fe 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
    fontFamily: "'Poppins', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  floatingEmoji: (i) => {
    // Spread emojis around the edges of the screen, each with its own
    // float animation timing so they don't all bob in sync.
    const positions = [
      { top: "6%", left: "8%" }, { top: "12%", left: "88%" },
      { top: "40%", left: "4%" }, { top: "35%", left: "93%" },
      { top: "70%", left: "6%" }, { top: "65%", left: "90%" },
      { top: "88%", left: "15%" }, { top: "90%", left: "80%" },
      { top: "4%", left: "45%" }, { top: "92%", left: "48%" },
    ];
    const pos = positions[i % positions.length];
    return {
      position: "absolute",
      fontSize: "38px",
      opacity: 0.5,
      animation: `floatY ${3 + (i % 4)}s ease-in-out infinite`,
      animationDelay: `${i * 0.3}s`,
      pointerEvents: "none",
      userSelect: "none",
      ...pos,
    };
  },
  card: {
    width: "1150px",
    maxWidth: "95vw",
    background: "rgba(255,255,255,0.78)",
    backdropFilter: "blur(18px)",
    borderRadius: "32px",
    padding: "56px",
    boxShadow: "0 20px 60px rgba(168,85,247,0.22),0 8px 24px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "26px",
    position: "relative",
    zIndex: 1,
  },
  topRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  title: { margin: 0, fontSize: "36px", fontWeight: "700", color: "#6d28d9", letterSpacing: ".5px" },
  back: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "12px 22px",
    borderRadius: "16px", cursor: "pointer", fontWeight: "600", fontSize: "15px",
    boxShadow: "0 4px 10px rgba(109,40,217,.12)",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px" },

  dropdownButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: "20px 24px",
    borderRadius: "20px",
    border: "2px solid #f3e8ff",
    background: "#ffffff",
    color: "#4c1d95",
    fontSize: "18px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(236,72,153,.08)",
  },
  dropdownList: {
    position: "absolute",
    top: "calc(100% + 10px)",
    left: 0,
    right: 0,
    background: "#ffffff",
    borderRadius: "20px",
    border: "2px solid #f3e8ff",
    boxShadow: "0 15px 35px rgba(168,85,247,.25)",
    padding: "10px",
    zIndex: 20,
    maxHeight: "320px",
    overflowY: "auto",
  },
  dropdownOption: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 16px",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    color: "#4c1d95",
    transition: "background .15s",
  },

  chooseFileButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 24px",
    borderRadius: "20px",
    border: "2px dashed #d8b4fe",
    background: "linear-gradient(135deg,#faf5ff,#fdf2f8)",
    color: "#6d28d9",
    fontSize: "18px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(236,72,153,.08)",
  },
  fileChip: {
    marginTop: "10px",
    fontSize: "14px",
    color: "#6d28d9",
    background: "#f3e8ff",
    display: "inline-block",
    padding: "8px 16px",
    borderRadius: "999px",
    fontWeight: 600,
  },

  error: { color: "#ef4444", textAlign: "center", fontSize: "14px", fontWeight: 600 },
  msg: {
    background: "#f3e8ff", color: "#6d28d9", padding: "16px", borderRadius: "18px",
    textAlign: "center", fontWeight: "600", fontSize: "16px", border: "1px solid #e9d5ff",
  },
  progressTrack: { height: 10, borderRadius: 999, background: "#f3e8ff", overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg,#d946ef,#8b5cf6)", transition: "width .2s ease" },
  button: {
    marginTop: "10px", background: "linear-gradient(135deg,#d946ef,#ec4899,#8b5cf6)",
    color: "white", padding: "20px", border: "none", borderRadius: "20px",
    cursor: "pointer", fontWeight: "700", fontSize: "19px", letterSpacing: ".5px",
    boxShadow: "0 12px 28px rgba(217,70,239,.35)",
  },
  resultsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" },
  reportGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  reportCard: {
    background: "#ffffff", borderRadius: "16px", padding: "18px",
    border: "2px solid #f3e8ff", boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },
  reportLabel: { fontSize: 13, color: "#6b7280", margin: 0 },
  reportValue: { fontSize: 28, fontWeight: 800, color: "#6d28d9", margin: "6px 0" },
  reportHint: { fontSize: 11, color: "#9ca3af", margin: 0 },
  spinnerBox: { display: "flex", justifyContent: "center", padding: "30px" },
  spinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "4px solid #ede9fe", borderTopColor: "#a855f7",
    animation: "spin 1s linear infinite",
  },
};
