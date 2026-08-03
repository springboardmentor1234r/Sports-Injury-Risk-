import { Link } from "react-router-dom";

const reports = [
    { athlete: "R. Sharma", movement: "Football sprint", date: "Jul 22, 2026", risk: "High", score: "78%" },
    { athlete: "A. Williams", movement: "Landing mechanics", date: "Jul 21, 2026", risk: "Medium", score: "54%" },
    { athlete: "D. Martinez", movement: "Cutting drill", date: "Jul 19, 2026", risk: "Medium", score: "48%" },
    { athlete: "S. Lee", movement: "Jump analysis", date: "Jul 18, 2026", risk: "Low", score: "16%" },
];

function Reports() {
    return <div><div className="page-heading"><div><p className="eyebrow">Workspace / Intelligence</p><h1>Reports</h1><p>Turn movement signals into a clear record of athlete readiness.</p></div><Link className="btn btn-accent" to="/upload-video">+ New report</Link></div><div className="stats-grid"><div className="card stat-card"><div className="stat-label">Reports generated</div><div className="stat-value">42</div><div className="stat-meta">This season</div></div><div className="card stat-card"><div className="stat-label">Reviewed this week</div><div className="stat-value">18</div><div className="stat-meta">82% completion</div></div><div className="card stat-card"><div className="stat-label">High risk reports</div><div className="stat-value">03</div><div className="stat-meta" style={{color: "var(--danger)"}}>Requires action</div></div><div className="card stat-card"><div className="stat-label">Avg. confidence</div><div className="stat-value">91%</div><div className="stat-meta">Model confidence</div></div></div><section className="card card-pad"><div className="card-title"><div><h2>Recent reports</h2><p>Exportable summaries from your latest movement screenings.</p></div><button className="btn btn-secondary">Export all</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Athlete</th><th>Movement</th><th>Date</th><th>Risk</th><th>Score</th><th>Action</th></tr></thead><tbody>{reports.map((report) => <tr key={`${report.athlete}-${report.date}`}><td><span className="table-name">{report.athlete}</span></td><td>{report.movement}</td><td>{report.date}</td><td><span className={`badge badge-${report.risk.toLowerCase()}`}>{report.risk}</span></td><td>{report.score}</td><td><button className="action-button">Open report</button></td></tr>)}</tbody></table></div></section></div>;
}

export default Reports;
