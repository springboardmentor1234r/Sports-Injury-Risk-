import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import AddAthlete from "../pages/AddAthlete";

import Dashboard from "../pages/Dashboard";
import Athletes from "../pages/Athletes";
import UploadVideo from "../pages/UploadVideo";
import ViewVideos from "../pages/ViewVideos";

import ProtectedRoute from "../components/common/ProtectedRoute";
import Layout from "../components/layout/Layout";

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
                <Route path="/athletes" element={<Athletes />} />
                <Route path="/add-athlete" element={<AddAthlete />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/upload-video" element={<UploadVideo />} />
                <Route path="/videos" element={<ViewVideos />} />
            </Route>

        </Routes>
    );
}