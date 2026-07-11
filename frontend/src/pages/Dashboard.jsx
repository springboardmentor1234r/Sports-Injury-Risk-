import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

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
          <div className="nav-item" style={styles.navItem}>
            🔔 Notifications <span style={styles.badge}>3</span>
          </div>
          <div className="nav-item" style={styles.navItem}>📈 Activity</div>
          <div className="nav-item" style={styles.navItem}>⚙️ Settings</div>
          <div className="nav-item" style={styles.navItem}>❓ Help & Support</div>
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
            <div style={styles.topbarIcon}>🔍</div>
            <div style={styles.topbarIcon}>
              🔔
              <span style={styles.notifBadge}>3</span>
            </div>
            <div style={styles.userChip}>
              <div style={styles.userAvatar}>🏃</div>
              <div>
                <div style={styles.userName}>Athlete</div>
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
            <p style={styles.cardDesc}>View and edit your athlete profile</p>
            <button className="btn-hover" style={styles.cardBtn}>
              Go to Profile →
            </button>
            <div style={styles.cardImgCircle}>🧑‍🦱</div>
          </div>

          {/* Video Upload */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #f3f0ff, #ede9fe)"}}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#7c3aed"}}>📹</div>
              <div style={styles.lockIcon}>🔒</div>
            </div>
            <h3 style={styles.cardTitle}>Video Upload</h3>
            <p style={styles.cardDesc}>Coming in Milestone 2</p>
            <button style={styles.comingSoonBtn}>Coming Soon 🔒</button>
            <div style={styles.cardImgCircle}>🎥</div>
          </div>

          {/* Injury Risk */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #fff5f5, #ffe4e4)"}}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#ef4444"}}>🛡️</div>
              <div style={styles.lockIcon}>🔒</div>
            </div>
            <h3 style={styles.cardTitle}>Injury Risk</h3>
            <p style={styles.cardDesc}>Coming in Milestone 3</p>
            <button style={styles.comingSoonBtn}>Coming Soon 🔒</button>
            <div style={styles.cardImgCircle}>⚠️</div>
          </div>

          {/* Reports */}
          <div
            className="card-hover"
            style={{...styles.card, background:"linear-gradient(135deg, #f0f4ff, #e8edff)"}}
          >
            <div style={styles.cardTop}>
              <div style={{...styles.cardIcon, background:"#6366f1"}}>📊</div>
              <div style={styles.lockIcon}>🔒</div>
            </div>
            <h3 style={styles.cardTitle}>Reports</h3>
            <p style={styles.cardDesc}>Coming in Milestone 4</p>
            <button style={styles.comingSoonBtn}>Coming Soon 🔒</button>
            <div style={styles.cardImgCircle}>📈</div>
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
  badge: {
    background: "#ec4899",
    color: "white",
    borderRadius: "10px",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: "700",
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
  notifBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ec4899",
    color: "white",
    borderRadius: "10px",
    padding: "1px 5px",
    fontSize: "10px",
    fontWeight: "700",
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
  userName: { fontWeight: "700", fontSize: "13px", color: "#1e1b4b" },
  userRole: { fontSize: "11px", color: "#ec4899" },

  // CARDS
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
  },
  card: {
    borderRadius: "20px",
    padding: "28px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    cursor: "pointer",
    minHeight: "180px",
    transition: "all 0.3s ease",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },
  editIcon: { fontSize: "18px", cursor: "pointer" },
  lockIcon: { fontSize: "18px", opacity: 0.5 },
  cardTitle: { color: "#1e1b4b", fontWeight: "800", fontSize: "18px", margin: "0 0 6px" },
  cardDesc: { color: "#6b7280", fontSize: "13px", margin: "0 0 16px" },
  cardBtn: {
    padding: "10px 20px",
    background: "white",
    border: "2px solid #ec4899",
    borderRadius: "12px",
    color: "#ec4899",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s ease",
  },
  comingSoonBtn: {
    padding: "10px 20px",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    color: "#6b7280",
    fontWeight: "600",
    cursor: "not-allowed",
    fontSize: "13px",
  },
  cardImgCircle: {
    position: "absolute",
    right: "20px",
    bottom: "20px",
    fontSize: "60px",
    opacity: 0.3,
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