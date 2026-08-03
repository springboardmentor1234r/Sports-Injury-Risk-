import { useNavigate } from "react-router-dom";

function Profile() {
    const navigate = useNavigate(); const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };
    return <div><div className="page-heading"><div><p className="eyebrow">Workspace / Account</p><h1>Profile</h1><p>Manage your SportGuard workspace identity and preferences.</p></div><button className="btn btn-secondary" onClick={handleLogout}>Sign out</button></div><section className="card profile-banner"><p className="eyebrow" style={{color: "var(--teal)"}}>Coach account</p><h1>Ready to make the next decision clearer?</h1><p>Your account is connected to the SportGuard AI analysis workspace.</p></section><section className="card card-pad" style={{marginTop: 20}}><div className="card-title"><div><h2>Account details</h2><p>These details are used across your workspace.</p></div></div><div className="form-grid"><div className="form-field"><label>Display name</label><input value="Coach account" readOnly /></div><div className="form-field"><label>Role</label><input value="Performance coach" readOnly /></div><div className="form-field"><label>Email</label><input value="coach@sportguard.ai" readOnly /></div><div className="form-field"><label>Workspace</label><input value="Primary training group" readOnly /></div></div></section></div>;
}
export default Profile;
