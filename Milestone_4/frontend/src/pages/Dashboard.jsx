import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import NotificationBell from "../components/NotificationBell";
import { API_BASE } from "../lib/config";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);

  // Safety net: this dashboard is athlete-only. Coach/physio/sports
  // scientist/admin land on their own dashboards after login, but if
  // someone navigates here directly (bookmark, back button), send them
  // to the right place instead of showing an athlete's view.
  useEffect(() => {
    if (role === "admin") navigate("/admin-dashboard", { replace: true });
    else if (role && role !== "athlete") navigate("/staff-dashboard", { replace: true });
  }, [role, navigate]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => {});
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.page}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🏃</div>
          <div>
            <div style={styles.logoTitle}>AI Sports</div>
            <div style={styles.logoSub}>Injury Prediction</div>
          </div>
        </div>

        <div style={styles.sidebarImgContainer}>
          <img src="/athlete.png" style={styles.sidebarImg} alt="athlete" />
        </div>

        <nav style={styles.nav}>
          <div style={styles.navItemActive}>🏠 Dashboard</div>
          <div className="nav-item" style={styles.navItem} onClick={logout}>🚪 Logout</div>
        </nav>

        <div style={styles.quote}>
          <div style={styles.quoteIcon}>❝</div>
          <p style={styles.quoteText}>Strong today, <span style={styles.pink}>safer tomorrow.</span></p>
          <p style={styles.quoteSub}>Stay consistent, stay injury-free.</p>
          <div style={styles.quoteLine} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.main}>

        {/* Top Bar */}
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.welcome}>Welcome back, {role}! 👋</h2>
            <p style={styles.welcomeSub}>Monitor your performance, manage your health, and stay ahead.</p>
          </div>
          <div style={styles.topbarRight}>
            <NotificationBell />
            <div style={styles.topbarIcon} onClick={() => navigate("/settings")} title="Account Settings">
              ⚙️
            </div>
            <div style={styles.userChip} onClick={() => navigate("/settings")}>
              {user?.profile_picture ? (
                <img src={`${API_BASE}${user.profile_picture}`} alt="Profile" style={styles.userAvatarImg} />
              ) : (
                <div style={styles.userAvatar}>🏃</div>
              )}
              <div>
                <div style={styles.userName}>{user?.name || "Athlete"}</div>
                <div style={styles.userRole}>{role}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={styles.grid}>

          {/* My Profile */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #fff0f6, #ffe4f0)"}}
            onClick={() => navigate("/profile")}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#ec4899"}}>👤</div>
              <div style={styles.editIcon}>✏️</div>
            </div>
            <h3 style={styles.cardTitle}>My Profile</h3>
            <p style={styles.cardDesc}>View and edit your athlete profile — sport, position, physical stats, injury history, and training load.</p>
            <div style={styles.cardTags}>
              <span style={{...styles.cardTag, color:"#ec4899", borderColor:"#fbcfe8"}}>Sport & Position</span>
              <span style={{...styles.cardTag, color:"#ec4899", borderColor:"#fbcfe8"}}>Physical Stats</span>
              <span style={{...styles.cardTag, color:"#ec4899", borderColor:"#fbcfe8"}}>Training Load</span>
            </div>
            <button className="btn-hover" style={styles.cardBtn}>
              Go to Profile →
            </button>
            <div style={styles.cardImgCircle}>🧑‍🦱</div>
          </div>

          {/* Video Upload */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #f3f0ff, #ede9fe)"}}
            onClick={() => navigate("/video-analysis")}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#7c3aed"}}>📹</div>
              <div style={styles.editIcon}>▶️</div>
            </div>
            <h3 style={styles.cardTitle}>Video Upload</h3>
            <p style={styles.cardDesc}>Upload a movement video and get full pose estimation & biomechanical analysis in minutes.</p>
            <div style={styles.cardTags}>
              <span style={{...styles.cardTag, color:"#7c3aed", borderColor:"#ddd6fe"}}>Pose Estimation</span>
              <span style={{...styles.cardTag, color:"#7c3aed", borderColor:"#ddd6fe"}}>Joint Angles</span>
              <span style={{...styles.cardTag, color:"#7c3aed", borderColor:"#ddd6fe"}}>8 Activities</span>
            </div>
            <button className="btn-hover" style={{...styles.cardBtn, borderColor:"#7c3aed", color:"#7c3aed"}}>
              Analyze Video →
            </button>
            <div style={styles.cardImgCircle}>🎥</div>
          </div>

          {/* Injury Risk */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #fff5f5, #ffe4e4)"}}
            onClick={() => navigate("/injury-risk")}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#ef4444"}}>🛡️</div>
              <div style={styles.editIcon}>▶️</div>
            </div>
            <h3 style={styles.cardTitle}>Injury Risk</h3>
            <p style={styles.cardDesc}>See your injury risk score, full breakdown, corrective recommendations, and downloadable reports.</p>
            <div style={styles.cardTags}>
              <span style={{...styles.cardTag, color:"#ef4444", borderColor:"#fecaca"}}>Risk Score</span>
              <span style={{...styles.cardTag, color:"#ef4444", borderColor:"#fecaca"}}>Recommendations</span>
              <span style={{...styles.cardTag, color:"#ef4444", borderColor:"#fecaca"}}>PDF / Excel</span>
            </div>
            <button className="btn-hover" style={{...styles.cardBtn, borderColor:"#ef4444", color:"#ef4444"}}>
              View Risk Dashboard →
            </button>
            <div style={styles.cardImgCircle}>⚠️</div>
          </div>

        </div>

        {/* Bottom Banner */}
        <div style={styles.banner}>
          <div style={styles.bannerIcon}>⚡</div>
          <p style={styles.bannerText}>
            Consistency in training and monitoring today leads to a{" "}
            <span style={styles.pinkText}>healthier, stronger tomorrow.</span>
          </p>
          <div style={styles.bannerRunner}>🏃</div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    background: "#f3f0ff",
  },

  // SIDEBAR
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #6d28d9, #7c3aed, #9333ea)",
    display: "flex",
    flexDirection: "column",
    padding: "28px 20px",
    position: "relative",
    overflow: "hidden",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  logoIcon: {
    fontSize: "32px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "12px",
    padding: "8px",
  },
  logoTitle: { color: "white", fontWeight: "800", fontSize: "18px" },
  logoSub: { color: "rgba(255,255,255,0.7)", fontSize: "12px" },
  sidebarImgContainer: {
    height: "220px",
    position: "relative",
    overflow: "hidden",
    marginBottom: "10px",
  },
  sidebarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItemActive: {
    padding: "12px 16px",
    borderRadius: "12px",
    background: "transparent",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    fontSize: "14px",
    cursor: "pointer",
  },
  navItem: {
    padding: "12px 16px",
    borderRadius: "12px",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
  },
  quote: { marginTop: "auto", paddingTop: "20px" },
  quoteIcon: { color: "rgba(255,255,255,0.4)", fontSize: "24px" },
  quoteText: { color: "white", fontWeight: "700", fontSize: "14px", margin: "8px 0 4px" },
  quoteSub: { color: "rgba(255,255,255,0.6)", fontSize: "12px" },
  quoteLine: { height: "2px", background: "#ec4899", width: "40px", marginTop: "12px" },
  pink: { color: "#f9a8d4" },
  pinkText: { color: "#7c3aed", fontWeight: "700" },

  // MAIN
  main: {
    flex: 1,
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "white",
    borderRadius: "20px",
    padding: "20px 28px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  welcome: { color: "#1e1b4b", fontWeight: "800", fontSize: "22px", margin: 0 },
  welcomeSub: { color: "#6b7280", fontSize: "13px", marginTop: "4px" },
  topbarRight: { display: "flex", alignItems: "center", gap: "16px" },
  topbarIcon: {
    fontSize: "20px",
    cursor: "pointer",
    position: "relative",
    background: "#f3f4f6",
    borderRadius: "10px",
    padding: "8px 10px",
  },
  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#f3f4f6",
    borderRadius: "12px",
    padding: "8px 14px",
    cursor: "pointer",
  },
  userAvatar: { fontSize: "24px" },
  userAvatarImg: { width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" },
  userName: { fontWeight: "700", fontSize: "13px", color: "#1e1b4b" },
  userRole: { fontSize: "11px", color: "#ec4899" },

  // CARDS
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    borderRadius: "24px",
    padding: "36px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    cursor: "pointer",
    minHeight: "320px",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
  },
  editIcon: { fontSize: "20px", cursor: "pointer" },
  cardTitle: { color: "#1e1b4b", fontWeight: "800", fontSize: "22px", margin: "0 0 10px" },
  cardDesc: { color: "#6b7280", fontSize: "14px", margin: "0 0 18px", lineHeight: 1.6 },
  cardTags: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "22px" },
  cardTag: {
    fontSize: "11px", fontWeight: "700", padding: "6px 12px", borderRadius: "999px",
    background: "rgba(255,255,255,0.7)", border: "1.5px solid",
  },
  cardBtn: {
    padding: "13px 24px",
    background: "white",
    border: "2px solid #ec4899",
    borderRadius: "14px",
    color: "#ec4899",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    marginTop: "auto",
    alignSelf: "flex-start",
    position: "relative",
    zIndex: 1,
  },
  cardImgCircle: {
    position: "absolute",
    right: "10px",
    bottom: "0px",
    fontSize: "130px",
    opacity: 0.15,
    lineHeight: 1,
  },

  // BANNER
  banner: {
    background: "white",
    borderRadius: "20px",
    padding: "20px 28px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  bannerIcon: {
    background: "#7c3aed",
    borderRadius: "12px",
    padding: "10px",
    fontSize: "20px",
  },
  bannerText: { flex: 1, color: "#374151", fontSize: "14px", margin: 0 },
  bannerRunner: { fontSize: "28px" },
};