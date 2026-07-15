import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api.js";

export default function AthleteDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/athletes/${id}`)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Could not load athlete"));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <div className="error-box">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return <div className="page muted">Loading...</div>;
  }

  return (
    <div className="page">
      <Link to="/dashboard" className="muted">
        ← Back to team overview
      </Link>
      <h1 className="mt-16">{profile.user.full_name}</h1>
      <span className="role-pill">{profile.user.role.replace("_", " ")}</span>

      <div className="grid grid-2 mt-24">
        <div className="stat-card">
          <div className="label">Sport</div>
          <div className="value" style={{ fontSize: "1.2rem" }}>{profile.sport_type || "Not set"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Position</div>
          <div className="value" style={{ fontSize: "1.2rem" }}>{profile.position || "Not set"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Age</div>
          <div className="value">{profile.age ?? "—"}</div>
        </div>
        <div className="stat-card">
          <div className="label">Training Load</div>
          <div className="value" style={{ fontSize: "1.2rem" }}>{profile.training_load || "Not set"}</div>
        </div>
      </div>

      <div className="card mt-24">
        <h2>Injury History</h2>
        {profile.injury_history.length === 0 ? (
          <p className="muted">No injuries recorded.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Body Part</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {profile.injury_history.map((rec) => (
                <tr key={rec.id}>
                  <td>{rec.injury_type}</td>
                  <td>{rec.body_part || "—"}</td>
                  <td>{rec.severity || "—"}</td>
                  <td>{rec.recovery_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
