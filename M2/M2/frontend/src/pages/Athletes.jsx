import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { useAuth } from "../api/AuthContext";
import Icon from "../components/Icon";

const label = value => value?.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());

export default function Athletes() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { if (user.role === "athlete") { setLoading(false); return; } client.get("/athletes").then(response => setAthletes(response.data)).catch(error => setError(error.response?.data?.detail || "Roster could not be loaded.")).finally(() => setLoading(false)); }, [user.role]);
  const filtered = useMemo(() => athletes.filter(person => `${person.full_name} ${person.sport_type || ""} ${person.position || ""}`.toLowerCase().includes(search.toLowerCase())), [athletes, search]);
  if (loading) return <div className="page-loading"><span className="pulse-dot"/>Loading athlete roster…</div>;
  if (user.role === "athlete") return <section className="empty-card"><span className="empty-icon"><Icon name="shield" size={30}/></span><h3>This roster is protected.</h3><p>Athlete accounts can see their own assessment data in Analysis history.</p></section>;
  return <section className="page-enter"><div className="page-heading"><div><span className="eyebrow">ATHLETE INTELLIGENCE</span><h1>{user.role === "physiotherapist" ? "Clinical roster" : "Athlete roster"}</h1><p>Use the latest movement signal to focus the next coaching, screening, or performance conversation.</p></div><div className="roster-count"><Icon name="users" size={19}/><b>{athletes.length}</b> athletes</div></div>{error && <div className="notice-error">{error}</div>}<div className="panel roster-panel"><div className="table-toolbar"><div className="search-box"><Icon name="search" size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search athlete, sport, position…"/></div><span>{filtered.length} shown</span></div>{filtered.length ? <div className="table-scroll"><table className="data-table roster-table"><thead><tr><th>Athlete</th><th>Sport / position</th><th>Training load</th><th>Last assessment</th><th>Current risk</th><th>Risk score</th></tr></thead><tbody>{filtered.map(person => <tr key={person.id}><td><span className="table-avatar">{person.full_name.split(" ").map(name => name[0]).slice(0, 2).join("")}</span><b>{person.full_name}</b><small>{person.email}</small></td><td><b>{person.sport_type || "Profile pending"}</b><small>{person.position || "Position not set"}</small></td><td><span className={`load-chip ${person.training_load || "none"}`}>{person.training_load || "Not set"}</span></td><td>{person.last_analysis_at ? new Date(person.last_analysis_at).toLocaleDateString() : "No analyses"}</td><td><span className={`risk-badge risk-${person.risk_level || "unassessed"}`}>{label(person.risk_level || "unassessed")}</span></td><td><b>{person.latest_risk ?? "—"}</b></td></tr>)}</tbody></table></div> : <div className="empty-inline"><Icon name="users" size={22}/><span>No athlete matches that search yet.</span></div>}</div></section>;
}
