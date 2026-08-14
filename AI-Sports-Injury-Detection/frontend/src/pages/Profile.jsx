import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await API.get("/auth/profile");
                setUser(response.data.user);
            } catch (error) {
                alert(error.response?.data?.message || "Failed to fetch profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return <div className="empty-state">Loading profile details...</div>;
    }

    const displayName = user?.name || "User account";
    const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : "User";
    const userEmail = user?.email || "N/A";
    const userWorkspace = user?.role === "coach" ? "Primary training group" : "Athlete cohort";

    return (
        <div>
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Workspace / Account</p>
                    <h1>Profile</h1>
                    <p>Manage your SportGuard workspace identity and preferences.</p>
                </div>
                <button className="btn btn-secondary" onClick={handleLogout}>Sign out</button>
            </div>
            <section className="card profile-banner">
                <p className="eyebrow" style={{color: "var(--teal)"}}>{userRole} account</p>
                <h1>Ready to make the next decision clearer?</h1>
                <p>Your account is connected to the SportGuard AI analysis workspace.</p>
            </section>
            <section className="card card-pad" style={{marginTop: 20}}>
                <div className="card-title">
                    <div>
                        <h2>Account details</h2>
                        <p>These details are used across your workspace.</p>
                    </div>
                </div>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Display name</label>
                        <input value={displayName} readOnly />
                    </div>
                    <div className="form-field">
                        <label>Role</label>
                        <input value={userRole} readOnly />
                    </div>
                    <div className="form-field">
                        <label>Email</label>
                        <input value={userEmail} readOnly />
                    </div>
                    <div className="form-field">
                        <label>Workspace</label>
                        <input value={userWorkspace} readOnly />
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Profile;
