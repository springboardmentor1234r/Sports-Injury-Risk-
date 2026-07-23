import { NavLink } from "react-router-dom";

function Sidebar(){
    return(
        <aside className="sidebar">
            <div className="logo">
                <h2>AI Sports</h2>
            </div>
            <nav>
                <NavLink to="/dashboard">
                    Dashboard
                </NavLink>

                <NavLink to="/athletes">
                    Athletes
                </NavLink>

                <NavLink to="/upload-video">
                    Upload Video
                </NavLink>

                <NavLink to="/videos">
                    Analysis Results
                </NavLink>

                <NavLink to="/profile">
                    Profile
                </NavLink>
            </nav>
            
        </aside>
    )
}
export default Sidebar;