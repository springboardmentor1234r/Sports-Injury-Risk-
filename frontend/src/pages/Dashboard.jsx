import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../api/AuthContext";
import { DEMO_STATS, DEMO_RECENT_ANALYSES, DEMO_SYSTEM_STATUS } from "../api/demoData";

export default function Dashboard() {
  const { user } = useAuth();
  const [allAthletes, setAllAthletes] = useState(null);

  const canViewAllAthletes = ["coach", "physiotherapist", "sports_scientist", "administrator"].includes(
    user?.role
  );

  useEffect(() => {
    if (canViewAllAthletes) {
      client.get("/athletes").then((res) => setAllAthletes(res.data));
    }
  }, [user]);

  if (!user) return <p className="loading-text">Loading...</p>;

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div>
          <h1>Welcome back, {user.full_name.split(" ")[0]}! 👋</h1>
          <p>Monitor performance, manage athlete health, and stay ahead of injuries.</p>
        </div>
      </div>

      {/* Stat strip - demo data, swap for live numbers once Milestone 2/3 endpoints exist */}
      <div className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Active Athletes</p>
          <p className="stat-value">{DEMO_STATS.activeAthletes}</p>
          <p className="stat-hint stat-hint-positive">{DEMO_STATS.activeAthletesDelta}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Videos Uploaded</p>
          <p className="stat-value">{DEMO_STATS.videosUploaded}</p>
          <p className="stat-hint">{DEMO_STATS.videosPending} pending AI run</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">High Risk Detected</p>
          <p className="stat-value stat-value-danger">{DEMO_STATS.highRiskDetected}</p>
          <p className="stat-hint">Immediate review recommended</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Processing Latency</p>
          <p className="stat-value">{DEMO_STATS.processingLatency}</p>
          <p className="stat-hint">Average per video</p>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon feature-icon-pink">👤</div>
          <h3>My Profile</h3>
          <p>View and edit your athlete profile</p>
          <Link to="/profile" className="btn-outline-link">Go to Profile →</Link>
        </div>

        <div className="feature-card feature-card-locked">
          <div className="feature-icon feature-icon-blue">🎥</div>
          <h3>Video Upload</h3>
          <p>Upload training footage for movement analysis</p>
          <span className="lock-tag">🔒 Coming Soon</span>
        </div>

        <div className="feature-card feature-card-locked">
          <div className="feature-icon feature-icon-red">🛡️</div>
          <h3>Injury Risk</h3>
          <p>AI-generated injury risk scoring per athlete</p>
          <span className="lock-tag">🔒 Coming Soon</span>
        </div>

        <div className="feature-card feature-card-locked">
          <div className="feature-icon feature-icon-purple">📊</div>
          <h3>Reports</h3>
          <p>Exportable biomechanics & performance reports</p>
          <span className="lock-tag">🔒 Coming Soon</span>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-header-row">
            <h3>Recent Analyses</h3>
            <span className="link-muted">View all</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Athlete</th>
                <th>Risk Level</th>
                <th>Key Finding</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_RECENT_ANALYSES.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="athlete-cell">
                      <span className="athlete-name">{row.athlete}</span>
                      <span className="athlete-sport">{row.sport}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`risk-badge risk-${row.risk.toLowerCase().replace(" risk", "").replace(" ", "-")}`}
                    >
                      {row.risk}
                    </span>
                  </td>
                  <td>{row.finding}</td>
                  <td className="muted-text">{row.processed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>System Status</h3>
          <ul className="status-list">
            {DEMO_SYSTEM_STATUS.map((s) => (
              <li key={s.name}>
                <span>{s.name}</span>
                <span className={`status-pill ${s.status === "Online" ? "status-online" : "status-idle"}`}>
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {canViewAllAthletes && (
        <div className="card">
          <h3>Athlete Roster</h3>
          {allAthletes && allAthletes.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sport</th>
                  <th>Position</th>
                  <th>Age</th>
                  <th>Training Load</th>
                </tr>
              </thead>
              <tbody>
                {allAthletes.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.sport_type || "-"}</td>
                    <td>{a.position || "-"}</td>
                    <td>{a.age || "-"}</td>
                    <td>
                      <span className={`load-badge load-${a.training_load || "none"}`}>
                        {a.training_load || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No athletes have registered yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
