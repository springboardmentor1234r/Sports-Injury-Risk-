import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";

const ROLE_INFO = {
  coach: { title: "Coach Dashboard", icon: "🎽", subtitle: "Athletes you're coaching" },
  physiotherapist: { title: "Physiotherapist Dashboard", icon: "🩹", subtitle: "Athletes under your care" },
  sports_scientist: { title: "Sports Scientist Dashboard", icon: "🔬", subtitle: "Athletes you're analyzing" },
};

export default function StaffDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const info = ROLE_INFO[role] || { title: "Staff Dashboard", icon: "🧑‍⚕️", subtitle: "Your athletes" };

  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Safety net: this page is for coach/physio/sports_scientist only.
    if (role === "athlete") return navigate("/dashboard", { replace: true });
    if (role === "admin") return navigate("/admin-dashboard", { replace: true });

    axios
      .get(`${API_BASE}/staff/my-athletes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setAthletes(res.data))
      .catch(() => setError("Couldn't load your athletes. Try refreshing."))
      .finally(() => setLoading(false));
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
        {athletes.map((a) => (
          <div
            key={a.athlete_id}
            className="athlete-card"
            style={styles.card}
            onClick={() => navigate(`/athlete-detail/${a.athlete_id}`)}
          >
            <div style={styles.avatar}>🏃</div>
            <h3 style={styles.cardName}>{a.owner_name}</h3>
            <p style={styles.cardSport}>{a.sport} • {a.position}</p>
            <div style={styles.cardStats}>
              <span>🎂 {a.age}y</span>
              <span>📏 {a.height}cm</span>
              <span>⚖️ {a.weight}kg</span>
            </div>
            <button style={styles.viewBtn}>View Profile →</button>
          </div>
        ))}
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
