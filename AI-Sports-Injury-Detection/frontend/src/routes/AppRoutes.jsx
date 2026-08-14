import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import AddAthlete from "../pages/AddAthlete";
import Prediction from "../pages/Prediction";

import Dashboard from "../pages/Dashboard";
import Athletes from "../pages/Athletes";
import UploadVideo from "../pages/UploadVideo";
import Reports from "../pages/Reports";

import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../components/layout/Layout";

function StaffOnlyRoute() {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" />;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        if (decoded.role === "athlete") {
            return <Navigate to="/dashboard" />;
        }
    } catch (e) {
        return <Navigate to="/login" />;
    }
    return <Outlet />;
}

export default function AppRoutes() {
    return (
        <Routes>

            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload-video" element={<UploadVideo />} />
                <Route path="/reports" element={<Reports />} />

                {/* Staff Only (Coach, Admin, Physiotherapist, Sports Scientist) */}
                <Route element={<StaffOnlyRoute />}>
                    <Route path="/athletes" element={<Athletes />} />
                    <Route path="/add-athlete" element={<AddAthlete />} />
                    <Route path="/prediction" element={<Prediction />} />
                </Route>
            </Route>

        </Routes>
    );
}