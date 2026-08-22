import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../api/AuthContext";
import Icon from "../components/Icon";

const ROLES = ["athlete", "coach", "physiotherapist", "sports_scientist", "administrator"];
const label = value => value.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());

export default function Settings() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (user.role === "administrator") client.get("/users").then(response => setUsers(response.data)).catch(() => setError("User administration could not be loaded.")); }, [user.role]);
  const changeRole = async (person, role) => { try { const response = await client.patch(`/users/${person.id}/role`, { role }); setUsers(current => current.map(item => item.id === person.id ? response.data : item)); setMessage(`${person.full_name}'s role was updated.`); } catch (err) { setError(err.response?.data?.detail || "Role could not be updated."); } };
  return <section className="page-enter"><div className="page-heading"><div><span className="eyebrow">SETTINGS</span><h1>{user.role === "administrator" ? "Platform administration" : "Workspace preferences"}</h1><p>{user.role === "administrator" ? "Manage access roles and maintain a healthy, accountable workspace." : "KineticGuard uses secure role-based access to keep athlete data visible to the right people."}</p></div></div>{error && <div className="notice-error">{error}</div>}{message && <div className="notice-success"><Icon name="check" size={17}/>{message}</div>}{user.role === "administrator" ? <div className="panel user-admin"><div className="panel-title"><div><h3>User access</h3><p>{users.length} registered workspace members</p></div><span className="role-tag"><Icon name="shield" size={15}/>Administrator</span></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Member</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead><tbody>{users.map(person => <tr key={person.id}><td><b>{person.full_name}</b></td><td>{person.email}</td><td>{new Date(person.created_at).toLocaleDateString()}</td><td><select className="role-select" value={person.role} onChange={event => changeRole(person, event.target.value)}>{ROLES.map(role => <option key={role} value={role}>{label(role)}</option>)}</select></td></tr>)}</tbody></table></div></div> : <div className="settings-grid"><article className="panel"><span className="setting-icon"><Icon name="shield" size={21}/></span><h3>Privacy and access</h3><p>Your workspace uses JWT authentication and role checks to protect profile, video, and reporting data.</p><span className="status-line"><i/>Access protected</span></article><article className="panel"><span className="setting-icon violet"><Icon name="activity" size={21}/></span><h3>Analysis method</h3><p>Scores combine biomechanics, history, symmetry, training load, and fatigue indicators. They support, not replace, clinical judgment.</p><span className="status-line"><i/>Assessment engine online</span></article></div>}</section>;
}
