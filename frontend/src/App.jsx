import { BrowserRouter, Routes, Route } from "react-router-dom";

import AnimatedBackground from "./components/common/AnimatedBackground";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AthleteProfile from "./pages/AthleteProfile";
import UploadVideo from "./pages/UploadVideo";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

export default function App() {
    return (
        <BrowserRouter>

            <AnimatedBackground />

            <Routes>

                <Route path="/" element={<Landing />} />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/profile" element={<AthleteProfile />} />

                <Route path="/upload" element={<UploadVideo />} />

                <Route path="/reports" element={<Reports />} />

                <Route path="*" element={<NotFound />} />

            </Routes>

        </BrowserRouter>
    );
}