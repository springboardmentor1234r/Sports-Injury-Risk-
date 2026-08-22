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

function ProtectedShell() {
  const { user, loading } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {}, [user]);
  if (loading) return <div className="app-loader"><span className="pulse-dot"/>Loading KineticGuard</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <div className="app-shell"><Sidebar unread={unread}/><main className="main"><header className="topbar"><div><span className="eyebrow">{user.role.replaceAll("_", " ")}</span><h2>Performance, protected.</h2></div><div className="top-actions"><span className="live-status"><i/>System online</span><div className="top-avatar">{user.full_name.split(" ").map(name => name[0]).slice(0, 2).join("")}</div></div></header><div className="page-wrap"><Routes><Route path="/dashboard" element={<Dashboard/>}/><Route path="/upload" element={<Upload/>}/><Route path="/analyses" element={<Analyses/>}/><Route path="/athletes" element={<Athletes/>}/><Route path="/profile" element={<Profile/>}/><Route path="/settings" element={<Settings/>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></div></main></div>;
}

export default function App() {
  const location = useLocation();
  if (["/login", "/register"].includes(location.pathname)) return <Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/></Routes>;
  return <ProtectedShell/>;
}
