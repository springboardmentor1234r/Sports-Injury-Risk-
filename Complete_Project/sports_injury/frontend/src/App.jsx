import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AthleteProfile from "./pages/AthleteProfile";
import VideoAnalysis from "./pages/VideoAnalysis";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AthleteDetail from "./pages/AthleteDetail";
import InjuryRiskDashboard from "./pages/InjuryRiskDashboard";
import Settings from "./pages/Settings";

function App() {
  const token = localStorage.getItem("token");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profile" element={token ? <AthleteProfile /> : <Navigate to="/login" />} />
        <Route path="/video-analysis" element={token ? <VideoAnalysis /> : <Navigate to="/login" />} />
        <Route path="/injury-risk" element={token ? <InjuryRiskDashboard /> : <Navigate to="/login" />} />
        <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
        <Route path="/staff-dashboard" element={token ? <StaffDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin-dashboard" element={token ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/athlete-detail/:athleteId" element={token ? <AthleteDetail /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;