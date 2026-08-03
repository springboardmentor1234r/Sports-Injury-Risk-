import { NavLink } from "react-router-dom";

function Sidebar(){
    return(
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">SG</div>
                <div>
                    <h1>SportGuard AI</h1>
                    <small>Biomechanics lab</small>
                </div>
            </div>
            <p className="nav-label">Workspace</p>
            <nav>
                <NavLink className="nav-link" to="/dashboard"><span className="nav-icon">+</span>Dashboard</NavLink>
                <NavLink className="nav-link" to="/athletes"><span className="nav-icon">O</span>Athletes</NavLink>
                <NavLink className="nav-link" to="/upload-video"><span className="nav-icon">^</span>Upload video</NavLink>
                <NavLink className="nav-link" to="/videos"><span className="nav-icon">[]</span>Analysis results</NavLink>
                <NavLink className="nav-link" to="/reports"><span className="nav-icon">#</span>Reports</NavLink>
                <NavLink className="nav-link" to="/profile"><span className="nav-icon">@</span>Profile</NavLink>
            </nav>
            <div className="sidebar-footer">AI-assisted screening for stronger, healthier performance.</div>
        </aside>
    )
}
export default Sidebar;