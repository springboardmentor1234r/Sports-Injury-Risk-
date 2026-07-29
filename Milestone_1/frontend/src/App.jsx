import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import History from "./pages/History";
import AthleteProfile from "./pages/AthleteProfile";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/edit-profile" element={<EditProfile />} />

        <Route path="/upload" element={<UploadVideo />} />

        <Route path="/history" element={<History />} />

        <Route path="/settings" element={<Settings />} /> 

        <Route path="/profile" element={<AthleteProfile />} />

        <Route path="/reports" element={<Reports />} />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;