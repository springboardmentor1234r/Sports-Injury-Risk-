import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

function Sidebar(){
    const [role, setRole] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                const decoded = JSON.parse(jsonPayload);
                setRole(decoded.role || "athlete");
            } catch (error) {
                console.error("Error decoding token in Sidebar:", error);
            }
        }
    }, []);

    const showAthletesLink = role !== "athlete";

    return (
        <aside className="sidebar">
            <div className="brand">
                <img src="/logo.png" alt="SportGuard AI Logo" className="brand-logo-img" />
                <div>
                    <h1>SportGuard AI</h1>
                </div>
            </div>
            <p className="nav-label">Workspace</p>
            <nav>
                <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                {showAthletesLink && <NavLink className="nav-link" to="/athletes">Athletes</NavLink>}
                <NavLink className="nav-link" to="/upload-video">Upload video</NavLink>
                <NavLink className="nav-link" to="/reports">Analysis reports</NavLink>
                <NavLink className="nav-link" to="/profile">Profile</NavLink>
            </nav>
        </aside>
    );
}
export default Sidebar;