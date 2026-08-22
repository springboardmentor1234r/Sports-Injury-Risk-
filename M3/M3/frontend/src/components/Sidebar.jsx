import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import Icon from "./Icon";

const COMMON = [["/dashboard", "Overview", "grid"], ["/upload", "Analyze video", "video"], ["/analyses", "Analysis history", "activity"], ["/notifications", "Alerts", "bell"], ["/profile", "My profile", "user"], ["/settings", "Settings", "settings"]];

export default function Sidebar({ unread }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAthlete = user?.role === "athlete";
  const links = [...COMMON];
  if (!isAthlete) links.splice(3, 0, ["/athletes", user?.role === "physiotherapist" ? "Clinical roster" : "Athletes", "users"]);
  
  const initials = user?.full_name?.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase() || "KG";
  return <aside className="sidebar">
    <NavLink to="/dashboard" className="brand"><span className="brand-mark"><span /></span><span><b>Kinetic</b>Guard<small>Movement intelligence</small></span></NavLink>
    <div className="workspace-label">WORKSPACE</div>
    <nav>{links.map(([path, label, icon]) => <NavLink key={path} to={path} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}><Icon name={icon} size={18}/><span>{label}</span>{path === "/notifications" && unread ? <em>{unread}</em> : null}</NavLink>)}</nav>
    <div className="sidebar-bottom">
      <div className="profile-chip"><span className="avatar">{initials}</span><span><b>{user?.full_name}</b><small>{user?.role?.replaceAll("_", " ")}</small></span></div>
      <button className="side-link logout" onClick={() => { logout(); navigate("/login"); }}><Icon name="logout" size={18}/><span>Sign out</span></button>
    </div>
  </aside>;
}
