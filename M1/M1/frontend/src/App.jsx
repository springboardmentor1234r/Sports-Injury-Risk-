import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./api/AuthContext";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading-text">Loading...</p>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell-sidebar">
      <PrivateRouteWrapper>
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </PrivateRouteWrapper>
    </div>
  );
}

function PrivateRouteWrapper({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="loading-text">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  return children;
}
