import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "📊" },
  { label: "Notifications", icon: "🔔" },
  { label: "Activity", icon: "📈" },
  { label: "Settings", icon: "⚙️" },
  { label: "Help & Support", icon: "❓" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-logo">🏃</span>
        <div>
          <div className="sidebar-title">AI Sports</div>
          <div className="sidebar-subtitle">Injury Prediction</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <div className="sidebar-user-name">{user?.full_name}</div>
          <div className="sidebar-user-role">{user?.role.replace("_", " ")}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => (
          <button key={item.label} className={`sidebar-link ${i === 0 ? "active" : ""}`}>
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        🚪 Logout
      </button>
    </aside>
  );
}
