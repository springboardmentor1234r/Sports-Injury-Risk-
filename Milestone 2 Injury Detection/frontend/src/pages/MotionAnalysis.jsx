import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const API_ORIGIN = "http://localhost:8000";

function AngleTable({ angles }) {
  if (!angles) return null;
  const labels = {
    left_knee: "Left Knee",
    right_knee: "Right Knee",
    left_hip: "Left Hip",
    right_hip: "Right Hip",
    left_elbow: "Left Elbow",
    right_elbow: "Right Elbow",
    trunk_lean_from_vertical: "Trunk Lean (from vertical)",
  };
  return (
    <table>
      <thead>
        <tr>
          <th>Joint</th>
          <th>Angle</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(angles).map(([key, value]) => (
          <tr key={key}>
            <td>{labels[key] || key}</td>
            <td>{value}°</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ResultCard({ result }) {
  return (
    <div className="card mt-24">
      <div className="grid grid-2">
        <div>
          <h2 style={{ marginTop: 0 }}>Annotated Pose</h2>
          {result.annotated_image_url && (
            <img
              src={`${API_ORIGIN}${result.annotated_image_url}`}
              alt="Annotated pose skeleton"
              style={{ width: "100%", borderRadius: 8, border: "1px solid var(--border)" }}
            />
          )}
          <p className="muted mt-16">
            Detection confidence: {(result.landmark_confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <h2 style={{ marginTop: 0 }}>Joint Angles</h2>
          <AngleTable angles={result.joint_angles} />

          <h2 className="mt-24">Asymmetry Flags</h2>
          <ul style={{ paddingLeft: 18 }}>
            {result.risk_flags.map((flag, i) => (
              <li
                key={i}
                style={{
                  color: flag.includes("exceeds") || flag.includes("imbalance") ? "var(--warning)" : "var(--text-dim)",
                  marginBottom: 6,
                }}
              >
                {flag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function MotionAnalysis() {
  const { id } = useParams(); // present when a staff member is analyzing a specific athlete
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const historyUrl = id ? `/pose/history/${id}` : "/pose/history/me";

  const loadHistory = () => {
    api
      .get(historyUrl)
      .then((res) => setHistory(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    setError("");
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const query = id ? `?athlete_profile_id=${id}` : "";
      const res = await api.post(`/pose/analyze${query}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Please try a different image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1>Motion & Biomechanical Analysis</h1>
      <p className="muted">
        Upload a clear, full-body photo. We'll detect body keypoints, compute joint angles, and
        flag left/right asymmetry — an early indicator used in sports-science injury screening.
      </p>

      <div className="card mt-24" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Upload image (JPG/PNG, full body, max 8MB)</label>
            <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} />
          </div>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", borderRadius: 8, marginBottom: 16, maxHeight: 260, objectFit: "cover" }}
            />
          )}
          {error && <div className="error-box">{error}</div>}
          <button className="btn btn-primary" disabled={!file || busy}>
            {busy ? "Analyzing..." : "Run Analysis"}
          </button>
        </form>
      </div>

      {result && <ResultCard result={result} />}

      <div className="card mt-24">
        <h2 style={{ marginTop: 0 }}>Analysis History</h2>
        {history.length === 0 ? (
          <p className="muted">No analyses yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Knee Asymmetry</th>
                <th>Hip Asymmetry</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{new Date(h.created_at).toLocaleString()}</td>
                  <td>{h.asymmetry?.knee_angle_diff ?? "—"}°</td>
                  <td>{h.asymmetry?.hip_angle_diff ?? "—"}°</td>
                  <td className="muted">{h.risk_flags?.[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
