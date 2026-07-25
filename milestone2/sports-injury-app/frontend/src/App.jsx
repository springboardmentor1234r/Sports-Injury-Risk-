import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Route-level code splitting: each page (and its dependencies, like the
// recharts-heavy panels) only downloads when the user actually navigates
// there, instead of one large bundle upfront.
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const AthleteList = lazy(() => import("./pages/AthleteList"));
const AthleteDetail = lazy(() => import("./pages/AthleteDetail"));

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "athlete") return <Navigate to="/my-profile" replace />;
  return <Navigate to="/athletes" replace />;
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
    </div>
  );
}

const STAFF_ROLES = ["coach", "physiotherapist", "sports_scientist", "admin"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/my-profile"
              element={
                <ProtectedRoute allowedRoles={["athlete"]}>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/athletes"
              element={
                <ProtectedRoute allowedRoles={STAFF_ROLES}>
                  <AthleteList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/athletes/:profileId"
              element={
                <ProtectedRoute allowedRoles={STAFF_ROLES}>
                  <AthleteDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
