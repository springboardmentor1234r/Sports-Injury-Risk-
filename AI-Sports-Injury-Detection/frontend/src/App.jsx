import {BrowserRouter,Routes,Route} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import  AthleteProfile from "./pages/AthleteProfile"
import ProtectedRoute  from "./components/ProtectedRoute";
import UploadVideo from "./pages/UploadVideo";
import ViewVideos from "./pages/ViewVideos";
function App(){
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/athlete-profile" element={<AthleteProfile />} />
                <Route path="/upload-video" element={<UploadVideo />} />
                <Route path="/videos" element={<ViewVideos />} />

            </Routes>
        </BrowserRouter>
    )
}

export default App;
