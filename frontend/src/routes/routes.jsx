import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AthletesPage from '../pages/AthletesPage';
import VideoUploadPage from '../pages/VideoUploadPage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';
import DashboardLayout from '../layouts/DashboardLayout';

function ProtectedRoute() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  if (loading) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/athletes" element={<AthletesPage />} />
          <Route path="/videos" element={<VideoUploadPage />} />
          <Route path="/analysis" element={<div className="p-8"><h1 className="text-2xl text-white">Analysis Page</h1></div>} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
