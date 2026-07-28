import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000";
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
