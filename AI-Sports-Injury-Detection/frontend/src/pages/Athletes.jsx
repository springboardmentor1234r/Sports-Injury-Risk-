import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Athletes() {
    const [athletes, setAthletes] = useState([]); const [loading, setLoading] = useState(true); const [query, setQuery] = useState("");
    const fetchAthletes = async () => { try { const response = await API.get("/athletes"); setAthletes(response.data.athletes || []); } catch (error) { alert(error.response?.data?.message || "Failed to fetch athletes"); } finally { setLoading(false); } };
    // The roster is synchronized with the protected API when the page mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { fetchAthletes(); }, []);
    const handleDelete = async (id) => { if (!window.confirm("Delete this athlete?")) return; try { await API.delete(`/athletes/${id}`); fetchAthletes(); } catch (error) { alert(error.response?.data?.message || "Failed to delete athlete"); } };
    const filtered = athletes.filter((athlete) => `${athlete.name} ${athlete.sport} ${athlete.team}`.toLowerCase().includes(query.toLowerCase()));
    return <div><div className="page-heading"><div><p className="eyebrow">Roster / Athlete management</p><h1>Athletes</h1><p>Keep every profile, baseline, and risk conversation in one place.</p></div><Link className="btn btn-accent" to="/add-athlete">+ Add athlete</Link></div><section className="card card-pad"><div className="card-title"><div><h2>Active roster</h2><p>{athletes.length} athlete profiles connected to your workspace.</p></div><input className="field-input" style={{maxWidth: 220}} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roster" /></div>{loading ? <div className="empty-state">Loading athlete roster...</div> : filtered.length === 0 ? <div className="empty-state">No athlete profiles found.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>Athlete</th><th>Sport</th><th>Team</th><th>Age</th><th>Actions</th></tr></thead><tbody>{filtered.map((athlete) => <tr key={athlete._id}><td><span className="table-name">{athlete.name}</span></td><td>{athlete.sport || "-"}</td><td>{athlete.team || "-"}</td><td>{athlete.age || "-"}</td><td><div className="action-row"><Link className="action-button" to="/prediction">Analyze</Link><button className="action-button" onClick={() => handleDelete(athlete._id)}>Remove</button></div></td></tr>)}</tbody></table></div>}</section></div>;
}
export default Athletes;
