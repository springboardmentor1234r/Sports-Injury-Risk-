import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./api/AuthContext";
import client from "./api/client";
import Sidebar from "./components/Sidebar";
import Icon from "./components/Icon";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Athletes from "./pages/Athletes";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Upload from "./pages/Upload";
import Analyses from "./pages/Analyses";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";

function ProtectedShell() {
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => { if (user) client.get("/notifications").then(({ data }) => setUnread(data.filter(item => !item.is_read).length)).catch(() => {}); }, [user]);
  if (loading) return <div className="app-loader"><span className="pulse-dot"/>Loading KineticGuard</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <div className="app-shell"><Sidebar unread={unread}/><main className="main"><header className="topbar"><div><span className="eyebrow">{user.role.replaceAll("_", " ")}</span><h2>Performance, protected.</h2></div><div className="top-actions"><span className="live-status"><i/>System online</span><button className="icon-button" title="Notifications" onClick={() => window.location.assign("/notifications")}><Icon name="bell" size={19}/>{unread ? <b>{unread}</b> : null}</button><div className="top-avatar">{user.full_name.split(" ").map(name => name[0]).slice(0, 2).join("")}</div></div></header><div className="page-wrap"><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/upload" element={<Upload/>}/><Route path="/analyses" element={<Analyses/>}/><Route path="/athletes" element={<Athletes/>}/><Route path="/reports" element={<Reports/>}/><Route path="/notifications" element={<Notifications onRead={() => setUnread(value => Math.max(0, value - 1))}/>}/><Route path="/profile" element={<Profile/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></div></main></div>;
}

export default function App() {
  const location = useLocation();
  if (["/login", "/register"].includes(location.pathname)) return <Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/></Routes>;
  return <ProtectedShell/>;
}
