import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyProfile from "./pages/MyProfile";
import AthleteList from "./pages/AthleteList";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "athlete") return <Navigate to="/my-profile" replace />;
  return <Navigate to="/athletes" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
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
              <ProtectedRoute allowedRoles={["coach", "physiotherapist", "sports_scientist", "admin"]}>
                <AthleteList />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
