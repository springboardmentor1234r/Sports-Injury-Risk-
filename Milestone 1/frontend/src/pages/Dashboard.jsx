import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const STAFF_ROLES = ["coach", "physiotherapist", "sports_scientist", "administrator"];

function AthleteDashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/athletes/me")
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Could not load profile"));
  }, []);

  return (
    <div>
      <h1>Your Athlete Profile</h1>
      <p className="muted">Milestone 1 core data — biomechanical modules land in later milestones.</p>

      {error && <div className="error-box mt-16">{error}</div>}

      {profile && (
        <>
          <div className="grid grid-2 mt-24">
            <div className="stat-card">
              <div className="label">Sport</div>
              <div className="value" style={{ fontSize: "1.2rem" }}>
                {profile.sport_type || "Not set"}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Position</div>
              <div className="value" style={{ fontSize: "1.2rem" }}>
                {profile.position || "Not set"}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Age</div>
              <div className="value">{profile.age ?? "—"}</div>
            </div>
            <div className="stat-card">
              <div className="label">Training Load</div>
              <div className="value" style={{ fontSize: "1.2rem" }}>
                {profile.training_load || "Not set"}
              </div>
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

          <Link to="/profile" className="btn btn-primary mt-24" style={{ display: "inline-flex" }}>
            Edit Profile
          </Link>
        </>
      )}
    </div>
  );
}

function StaffDashboard() {
  const [athletes, setAthletes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/athletes")
      .then((res) => setAthletes(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Could not load athletes"));
  }, []);

  return (
    <div>
      <h1>Team Overview</h1>
      <p className="muted">All registered athletes visible to your role.</p>

      {error && <div className="error-box mt-16">{error}</div>}

      <div className="card mt-24">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Sport</th>
              <th>Position</th>
              <th>Training Load</th>
              <th>Injuries</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a) => (
              <tr key={a.id}>
                <td>{a.user.full_name}</td>
                <td>{a.sport_type || "—"}</td>
                <td>{a.position || "—"}</td>
                <td>{a.training_load || "—"}</td>
                <td>{a.injury_history.length}</td>
                <td>
                  <Link to={`/athletes/${a.id}`} className="link-btn">
                    View profile →
                  </Link>
                </td>
              </tr>
            ))}
            {athletes.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No athletes registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page">
      {STAFF_ROLES.includes(user.role) ? <StaffDashboard /> : <AthleteDashboard />}
    </div>
  );
}
