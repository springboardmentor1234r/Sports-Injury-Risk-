import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { riskStyle } from "../lib/risk";
import { API_BASE } from "../lib/config";

const ROLE_INFO = {
  coach: { title: "Coach Dashboard", icon: "🎽", subtitle: "Athletes you're coaching" },
  physiotherapist: { title: "Physiotherapist Dashboard", icon: "🩹", subtitle: "Athletes under your care" },
  sports_scientist: { title: "Sports Scientist Dashboard", icon: "🔬", subtitle: "Athletes you're analyzing" },
};

const ANALYTICS_PANEL_INFO = {
  coach: { title: "Team Performance Analytics", icon: "📈" },
  physiotherapist: { title: "Injury Risk & Movement Correction Analytics", icon: "🩺" },
  sports_scientist: { title: "Biomechanical & Injury Prediction Insights", icon: "🔬" },
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const info = ROLE_INFO[role] || { title: "Staff Dashboard", icon: "🧑‍⚕️", subtitle: "Your athletes" };
  const analyticsInfo = ANALYTICS_PANEL_INFO[role] || { title: "Team Analytics", icon: "📊" };

  const [athletes, setAthletes] = useState([]);
  const [riskByAthlete, setRiskByAthlete] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Safety net: this page is for coach/physio/sports_scientist only.
    if (role === "athlete") return navigate("/dashboard", { replace: true });
    if (role === "admin") return navigate("/admin-dashboard", { replace: true });

    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(`${API_BASE}/staff/my-athletes`, { headers })
      .then((res) => setAthletes(res.data))
      .catch(() => setError("Couldn't load your athletes. Try refreshing."))
      .finally(() => setLoading(false));

    // Milestone 3 — Coach Dashboard "Team risk overview" (PDF section 10).
    axios
      .get(`${API_BASE}/staff/team-risk-overview`, { headers })
      .then((res) => {
        const map = {};
        res.data.forEach((item) => {
          map[item.athlete_id] = item;
        });
        setRiskByAthlete(map);
      })
      .catch(() => {
        // Non-critical: risk badges just won't show if this fails.
      });

    // Milestone 4 — "executive dashboard" analytics behind the Sports
    // Scientist / Physiotherapist dashboard panels (PDF section 10).
    axios
      .get(`${API_BASE}/staff/analytics-overview`, { headers })
      .then((res) => setAnalytics(res.data))
      .catch(() => {
        // Non-critical: the analytics panel just won't render if this fails.
      });
  }, [role, navigate, token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h1 style={styles.title}>
          {info.icon} {info.title}
        </h1>
        <button style={styles.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>
      <p style={styles.subtitle}>{info.subtitle}</p>

      {analytics && analytics.athletes_covered > 0 && (
        <div style={styles.analyticsPanel}>
          <p style={styles.analyticsTitle}>
            {analyticsInfo.icon} {analyticsInfo.title}
          </p>

          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.athletes_covered}</p>
              <p style={styles.statLabel}>Athletes Covered</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.videos_analyzed}</p>
              <p style={styles.statLabel}>Videos Analyzed</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.avg_team_risk_score ?? "—"}</p>
              <p style={styles.statLabel}>Avg. Team Risk Score</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.avg_movement_quality_score ?? "—"}</p>
              <p style={styles.statLabel}>Avg. Movement Quality</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.avg_knee_valgus_asymmetry ?? "—"}</p>
              <p style={styles.statLabel}>Avg. Knee Valgus Asymmetry</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>{analytics.avg_trunk_lean ?? "—"}°</p>
              <p style={styles.statLabel}>Avg. Trunk Lean</p>
            </div>
          </div>

          <div style={styles.breakdownRow}>
            {Object.keys(analytics.team_risk_distribution || {}).length > 0 && (
              <div style={styles.breakdownCol}>
                <p style={styles.breakdownTitle}>Team Risk Distribution</p>
                <div style={styles.pillRow}>
                  {Object.entries(analytics.team_risk_distribution).map(([category, count]) => {
                    const rs = riskStyle(category);
                    return (
                      <span
                        key={category}
                        style={{
                          ...styles.pill,
                          background: rs.bg, color: rs.text, border: `1px solid ${rs.border}`,
                        }}
                      >
                        {category}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(analytics.most_common_anomaly_types || {}).length > 0 && (
              <div style={styles.breakdownCol}>
                <p style={styles.breakdownTitle}>Most Common Movement Anomalies</p>
                <div style={styles.pillRow}>
                  {Object.entries(analytics.most_common_anomaly_types).map(([type, count]) => (
                    <span key={type} style={styles.neutralPill}>
                      {type.replace(/_/g, " ")}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && <p style={styles.msg}>Loading athletes…</p>}
      {error && <p style={styles.error}>⚠️ {error}</p>}

      {!loading && !error && athletes.length === 0 && (
        <div style={styles.emptyCard}>
          <p style={{ fontSize: 40, margin: 0 }}>🗒️</p>
          <p style={styles.emptyText}>
            No athletes assigned to you yet. Ask an admin to assign athletes to your account.
          </p>
        </div>
      )}

      <div style={styles.grid}>
        {athletes.map((a) => {
          const risk = riskByAthlete[a.athlete_id];
          const rs = risk?.latest_risk_category ? riskStyle(risk.latest_risk_category) : null;
          return (
            <div
              key={a.athlete_id}
              className="athlete-card"
              style={styles.card}
              onClick={() => navigate(`/athlete-detail/${a.athlete_id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={styles.avatar}>🏃</div>
                {rs && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999,
                    background: rs.bg, color: rs.text, border: `1px solid ${rs.border}`,
                  }}>
                    🛡️ {risk.latest_risk_category} ({risk.latest_risk_score})
                  </span>
                )}
              </div>
              <h3 style={styles.cardName}>{a.owner_name}</h3>
              <p style={styles.cardSport}>{a.sport} • {a.position}</p>
              <div style={styles.cardStats}>
                <span>🎂 {a.age}y</span>
                <span>📏 {a.height}cm</span>
                <span>⚖️ {a.weight}kg</span>
              </div>
              <button style={styles.viewBtn}>View Profile →</button>
            </div>
          );
        })}
      </div>
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
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { margin: 0, fontSize: "32px", fontWeight: 700, color: "#6d28d9" },
  subtitle: { color: "#6b7280", fontSize: "15px", marginTop: "6px", marginBottom: "32px" },
  analyticsPanel: {
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(14px)", borderRadius: "24px",
    padding: "28px", border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 10px 30px rgba(168,85,247,0.1)", marginBottom: "32px",
  },
  analyticsTitle: { margin: "0 0 18px", fontSize: 17, fontWeight: 700, color: "#6d28d9" },
  statGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "16px",
  },
  statCard: {
    background: "#faf5ff", borderRadius: "16px", padding: "16px", textAlign: "center",
    border: "1px solid #f3e8ff",
  },
  statValue: { margin: 0, fontSize: 24, fontWeight: 800, color: "#4c1d95" },
  statLabel: { margin: "4px 0 0", fontSize: 11, color: "#6b7280", fontWeight: 600 },
  breakdownRow: { display: "flex", gap: "32px", marginTop: "22px", flexWrap: "wrap" },
  breakdownCol: { flex: 1, minWidth: 220 },
  breakdownTitle: { margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#4c1d95" },
  pillRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  pill: { fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999 },
  neutralPill: {
    fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 999,
    background: "#f3f4f6", color: "#4b5563", border: "1px solid #e5e7eb", textTransform: "capitalize",
  },
  logoutBtn: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "10px 20px",
    borderRadius: "14px", cursor: "pointer", fontWeight: 600,
  },
  msg: { color: "#6d28d9", fontWeight: 600 },
  error: { color: "#ef4444", fontWeight: 600 },
  emptyCard: {
    background: "rgba(255,255,255,0.7)", borderRadius: "24px", padding: "48px",
    textAlign: "center", border: "1px solid rgba(255,255,255,0.5)",
  },
  emptyText: { color: "#6b7280", fontSize: "15px", marginTop: "12px" },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px",
  },
  card: {
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(14px)", borderRadius: "22px",
    padding: "26px", border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 10px 30px rgba(168,85,247,0.12)", cursor: "pointer",
    display: "flex", flexDirection: "column", gap: "8px", transition: "transform .15s",
  },
  avatar: {
    width: 56, height: 56, borderRadius: "50%",
    background: "linear-gradient(135deg,#d946ef,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
  },
  cardName: { margin: "8px 0 0", fontSize: 18, fontWeight: 700, color: "#1e1b4b" },
  cardSport: { margin: 0, fontSize: 13, color: "#6d28d9", fontWeight: 600 },
  cardStats: { display: "flex", gap: "14px", fontSize: 13, color: "#6b7280", marginTop: "4px" },
  viewBtn: {
    marginTop: "14px", background: "linear-gradient(135deg,#d946ef,#8b5cf6)", color: "white",
    border: "none", padding: "10px", borderRadius: "12px", fontWeight: 700, cursor: "pointer",
  },
};
