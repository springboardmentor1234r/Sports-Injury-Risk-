import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";

import RoleDashboard from "./pages/RoleDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import Admin from "./pages/Admin";
import Athlete from "./pages/Athlete";
import UploadVideo from "./pages/UploadVideo";
import NotFound from "./pages/NotFound";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Help from "./pages/Help";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/"
          element={
            <>
              <Home />
              <Footer />
            </>
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* ================= DASHBOARD ================= */}

        <Route
  path="/dashboard"
  element={
    <ProtectedRoute
      allowedRoles={[
        "admin",
        "coach",
        "athlete",
      ]}
    >
      <Layout>
        <RoleDashboard />
      </Layout>
    </ProtectedRoute>
  }
/>

        <Route
    path="/dashboard/admin"
    element={
        <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
                <Admin />
            </Layout>
        </ProtectedRoute>
    }
/>

        {/* ================= ATHLETES ================= */}

        <Route
          path="/dashboard/athletes"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
              ]}
            >
              <Layout>
                <Athlete />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= UPLOAD ================= */}

        <Route
          path="/dashboard/upload"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <UploadVideo />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= ANALYSIS ================= */}

        <Route
          path="/dashboard/analysis"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <Analysis />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= REPORTS ================= */}

        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= HISTORY ================= */}

        <Route
          path="/dashboard/history"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <History />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= SETTINGS ================= */}

        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= HELP ================= */}

        <Route
          path="/dashboard/help"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "coach",
                "athlete",
              ]}
            >
              <Layout>
                <Help />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= 404 ================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;