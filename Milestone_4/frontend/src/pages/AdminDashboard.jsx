import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/config";
import { downloadFile } from "../lib/download";

const STAFF_ROLES = ["coach", "physiotherapist", "sports_scientist"];

const ROLE_EMOJI = {
  athlete: "🏃",
  coach: "🎽",
  physiotherapist: "🩹",
  sports_scientist: "🔬",
  admin: "🛡️",
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const headers = { Authorization: `Bearer ${token}` };

  const [users, setUsers] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState("");
  const [assignMsg, setAssignMsg] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [reportAthleteId, setReportAthleteId] = useState("");
  const [downloading, setDownloading] = useState("");

  const staffUsers = users.filter((u) => STAFF_ROLES.includes(u.role));

  useEffect(() => {
    if (role !== "admin") return navigate("/login", { replace: true });
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, athletesRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/users`, { headers }),
        axios.get(`${API_BASE}/admin/athletes`, { headers }),
        axios.get(`${API_BASE}/admin/assignments`, { headers }),
      ]);
      setUsers(usersRes.data);
      setAthletes(athletesRes.data);
      setAssignments(assignmentsRes.data);
    } catch {
      setError("Couldn't load admin data. Try refreshing.");
    } finally {
      setLoading(false);
    }

    // Milestone 4 — Admin Dashboard "Platform analytics" + "System
    // monitoring" (PDF section 10). Kept out of the try/catch above so a
    // failure here never blocks the core user/athlete/assignment data.
    try {
      const [analyticsRes, monitoringRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/platform-analytics`, { headers }),
        axios.get(`${API_BASE}/admin/system-monitoring`, { headers }),
      ]);
      setAnalytics(analyticsRes.data);
      setMonitoring(monitoringRes.data);
    } catch {
      // Non-critical: the analytics/monitoring panels just won't render.
    }
  };

  const handleDownloadReport = async (format) => {
    if (!reportAthleteId) return;
    setDownloading(format);
    try {
      const ext = format === "pdf" ? "pdf" : "xlsx";
      await downloadFile(
        `${API_BASE}/reports/staff/athlete/${reportAthleteId}/${format}`,
        headers,
        `athlete_${reportAthleteId}_performance_report.${ext}`
      );
    } catch {
      setAssignMsg("⚠️ Couldn't generate that report.");
    } finally {
      setDownloading("");
    }
  };

  const handleAssign = async () => {
    setAssignMsg("");
    if (!selectedStaff || !selectedAthlete) {
      setAssignMsg("⚠️ Pick both a staff member and an athlete.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/admin/assign`,
        { staff_user_id: Number(selectedStaff), athlete_id: Number(selectedAthlete) },
        { headers }
      );
      setAssignMsg("✅ Assigned successfully!");
      setSelectedStaff("");
      setSelectedAthlete("");
      loadAll();
    } catch (err) {
      setAssignMsg(`⚠️ ${err.response?.data?.detail || "Assignment failed."}`);
    }
  };

  const handleUnassign = async (assignmentId) => {
    try {
      await axios.delete(`${API_BASE}/admin/assign/${assignmentId}`, { headers });
      loadAll();
    } catch {
      setAssignMsg("⚠️ Couldn't remove that assignment.");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h1 style={styles.title}>🛡️ Admin Dashboard</h1>
        <button style={styles.logoutBtn} onClick={logout}>🚪 Logout</button>
      </div>

      {loading && <p style={styles.msg}>Loading…</p>}
      {error && <p style={styles.error}>⚠️ {error}</p>}

      {!loading && !error && (analytics || monitoring) && (
        <div style={styles.execGrid}>
          {analytics && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>📊 Platform Analytics</h2>
              <div style={styles.statGrid}>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{analytics.total_users}</p>
                  <p style={styles.statLabel}>Total Users</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{analytics.total_athletes}</p>
                  <p style={styles.statLabel}>Total Athletes</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{analytics.total_videos}</p>
                  <p style={styles.statLabel}>Total Videos</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{analytics.total_risk_assessments}</p>
                  <p style={styles.statLabel}>Risk Assessments</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{analytics.avg_overall_injury_risk_score ?? "—"}</p>
                  <p style={styles.statLabel}>Avg. Risk Score</p>
                </div>
              </div>

              <div style={styles.breakdownRow}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={styles.breakdownTitle}>Users by Role</p>
                  <div style={styles.pillRow}>
                    {Object.entries(analytics.users_by_role).map(([r, count]) => (
                      <span key={r} style={styles.roleTag}>{ROLE_EMOJI[r] || "👤"} {r}: {count}</span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={styles.breakdownTitle}>Videos by Status</p>
                  <div style={styles.pillRow}>
                    {Object.entries(analytics.videos_by_status).map(([s, count]) => (
                      <span key={s} style={styles.roleTag}>{s}: {count}</span>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={styles.breakdownTitle}>Risk Category Distribution</p>
                  <div style={styles.pillRow}>
                    {Object.entries(analytics.risk_category_distribution).map(([c, count]) => (
                      <span key={c} style={styles.roleTag}>{c}: {count}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {monitoring && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>🩺 System Monitoring</h2>
              <div style={styles.statGrid}>
                <div style={{
                  ...styles.statCard,
                  background: monitoring.status === "healthy" ? "#f0fdf4" : "#fffbeb",
                }}>
                  <p style={{ ...styles.statValue, fontSize: 18 }}>
                    {monitoring.status === "healthy" ? "✅ Healthy" : "⚠️ Degraded"}
                  </p>
                  <p style={styles.statLabel}>Platform Status</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{monitoring.database_connected ? "✅" : "❌"}</p>
                  <p style={styles.statLabel}>Database</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{monitoring.videos_processing}</p>
                  <p style={styles.statLabel}>Videos Processing</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{monitoring.videos_failed}</p>
                  <p style={styles.statLabel}>Videos Failed</p>
                </div>
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{monitoring.total_pose_frames_tracked}</p>
                  <p style={styles.statLabel}>Pose Frames Tracked</p>
                </div>
              </div>
              <p style={styles.emptyText}>
                Last checked: {new Date(monitoring.generated_at).toLocaleString()}
              </p>
            </div>
          )}

          {/* Report management */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📄 Report Management</h2>
            <p style={{ ...styles.emptyText, marginBottom: 14 }}>
              Generate a performance report (PDF or Excel) for any athlete on the platform.
            </p>
            <div style={styles.assignRow}>
              <select
                style={styles.select}
                value={reportAthleteId}
                onChange={(e) => setReportAthleteId(e.target.value)}
              >
                <option value="">Choose athlete…</option>
                {athletes.map((a) => (
                  <option key={a.athlete_id} value={a.athlete_id}>
                    🏃 {a.owner_name} — {a.sport}
                  </option>
                ))}
              </select>
              <button
                style={styles.assignBtn}
                onClick={() => handleDownloadReport("pdf")}
                disabled={!reportAthleteId || downloading === "pdf"}
              >
                {downloading === "pdf" ? "Generating…" : "📄 PDF"}
              </button>
              <button
                style={styles.assignBtn}
                onClick={() => handleDownloadReport("excel")}
                disabled={!reportAthleteId || downloading === "excel"}
              >
                {downloading === "excel" ? "Generating…" : "📊 Excel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={styles.grid}>
          {/* Assign athlete to staff */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔗 Assign Athlete to Staff</h2>
            <div style={styles.assignRow}>
              <select style={styles.select} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                <option value="">Choose staff member…</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {ROLE_EMOJI[u.role]} {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <select style={styles.select} value={selectedAthlete} onChange={(e) => setSelectedAthlete(e.target.value)}>
                <option value="">Choose athlete…</option>
                {athletes.map((a) => (
                  <option key={a.athlete_id} value={a.athlete_id}>
                    🏃 {a.owner_name} — {a.sport}
                  </option>
                ))}
              </select>
              <button style={styles.assignBtn} onClick={handleAssign}>➕ Assign</button>
            </div>
            {assignMsg && <p style={styles.assignMsg}>{assignMsg}</p>}
          </div>

          {/* Current assignments */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Current Assignments ({assignments.length})</h2>
            {assignments.length === 0 ? (
              <p style={styles.emptyText}>No assignments yet.</p>
            ) : (
              <div style={styles.list}>
                {assignments.map((a) => (
                  <div key={a.id} style={styles.listRow}>
                    <span>
                      {ROLE_EMOJI[a.staff_role]} <strong>{a.staff_name}</strong> ({a.staff_role}) → 🏃 <strong>{a.athlete_name}</strong>
                    </span>
                    <button style={styles.removeBtn} onClick={() => handleUnassign(a.id)}>✕ Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All users */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>👥 All Users ({users.length})</h2>
            <div style={styles.list}>
              {users.map((u) => (
                <div key={u.id} style={styles.listRow}>
                  <span>
                    {ROLE_EMOJI[u.role] || "👤"} <strong>{u.name}</strong> — {u.email}
                  </span>
                  <span style={styles.roleTag}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All athletes */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🏃 All Athletes ({athletes.length})</h2>
            <div style={styles.list}>
              {athletes.map((a) => (
                <div key={a.athlete_id} style={styles.listRow}>
                  <span>
                    🏃 <strong>{a.owner_name}</strong> — {a.sport} ({a.position})
                  </span>
                  <span style={styles.roleTag}>{a.age}y</span>
                </div>
              ))}
            </div>
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
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  title: { margin: 0, fontSize: "32px", fontWeight: 700, color: "#6d28d9" },
  logoutBtn: {
    background: "#ede9fe", color: "#6d28d9", border: "none", padding: "10px 20px",
    borderRadius: "14px", cursor: "pointer", fontWeight: 600,
  },
  msg: { color: "#6d28d9", fontWeight: 600 },
  error: { color: "#ef4444", fontWeight: 600 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  execGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "24px" },
  statGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "14px",
  },
  statCard: {
    background: "#faf5ff", borderRadius: "16px", padding: "14px", textAlign: "center",
    border: "1px solid #f3e8ff",
  },
  statValue: { margin: 0, fontSize: 22, fontWeight: 800, color: "#4c1d95" },
  statLabel: { margin: "4px 0 0", fontSize: 11, color: "#6b7280", fontWeight: 600 },
  breakdownRow: { display: "flex", gap: "24px", marginTop: "20px", flexWrap: "wrap" },
  breakdownTitle: { margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#4c1d95" },
  pillRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  section: {
    background: "rgba(255,255,255,0.8)", backdropFilter: "blur(14px)", borderRadius: "22px",
    padding: "26px", border: "1px solid rgba(255,255,255,0.5)",
    boxShadow: "0 10px 30px rgba(168,85,247,0.1)", gridColumn: "span 1",
  },
  sectionTitle: { margin: "0 0 18px", fontSize: 18, fontWeight: 700, color: "#4c1d95" },
  assignRow: { display: "flex", gap: "10px", flexWrap: "wrap" },
  select: {
    flex: 1, minWidth: "180px", padding: "12px 14px", borderRadius: "14px",
    border: "2px solid #f3e8ff", background: "#fff", color: "#4c1d95", fontSize: 14,
  },
  assignBtn: {
    background: "linear-gradient(135deg,#d946ef,#8b5cf6)", color: "white", border: "none",
    padding: "12px 20px", borderRadius: "14px", fontWeight: 700, cursor: "pointer",
  },
  assignMsg: { marginTop: "12px", fontSize: 14, fontWeight: 600, color: "#6d28d9" },
  list: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "320px", overflowY: "auto" },
  listRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "#faf5ff", padding: "12px 16px", borderRadius: "12px", fontSize: 14, color: "#374151",
  },
  roleTag: {
    background: "#ede9fe", color: "#6d28d9", padding: "4px 12px", borderRadius: "999px",
    fontSize: 12, fontWeight: 700,
  },
  removeBtn: {
    background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 14px",
    borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: 12,
  },
  emptyText: { color: "#9ca3af", fontSize: 14 },
};
