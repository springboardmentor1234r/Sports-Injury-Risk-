import { useEffect, useState } from "react";
import API from "../../services/api";

function Navbar() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await API.get("/auth/profile");
                setUser(response.data.user);
            } catch (error) {
                // Fail silently for navbar
            }
        };
        fetchUser();
    }, []);

    const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1) + " account") : "User account";
    const avatarChar = user?.name ? user.name.charAt(0).toUpperCase() : "U";

    return (
        <header className="navbar">
            <div className="navbar-copy">
                <p>SportGuard AI / Workspace</p>
                <h2>Biomechanics overview</h2>
            </div>
            <div className="navbar-user">
                <span>{userRole}</span>
                <div className="avatar">{avatarChar}</div>
            </div>
        </header>
    );
}

export default Navbar;