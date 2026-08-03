import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <div className="page-heading">
        <div><p className="eyebrow">Tuesday, July 23, 2026</p><h1>Good morning, coach.</h1><p>Here is the latest signal from your athlete roster.</p></div>
        <Link className="btn btn-accent" to="/upload-video">+ New analysis</Link>
      </div>
      <div className="stats-grid">
        <div className="card stat-card"><div className="stat-label">Total athletes</div><div className="stat-value">24</div><div className="stat-meta">+3 this month</div></div>
        <div className="card stat-card"><div className="stat-label">High risk flags</div><div className="stat-value">03</div><div className="stat-meta" style={{color: 'var(--danger)'}}>Needs review</div></div>
        <div className="card stat-card"><div className="stat-label">Analyses this week</div><div className="stat-value">18</div><div className="stat-meta">+12.5% vs last week</div></div>
        <div className="card stat-card"><div className="stat-label">Avg. readiness</div><div className="stat-value">82%</div><div className="stat-meta">Healthy cohort</div></div>
      </div>
      <div className="dashboard-grid">
        <section className="card card-pad"><div className="card-title"><div><h2>Risk distribution</h2><p>Current roster by injury risk tier</p></div><span className="badge badge-low">Live snapshot</span></div><div className="risk-chart"><div className="bar-wrap"><div className="bar" style={{height: '76%'}}></div><span className="bar-label">Low</span></div><div className="bar-wrap"><div className="bar alt" style={{height: '42%'}}></div><span className="bar-label">Medium</span></div><div className="bar-wrap"><div className="bar" style={{height: '18%', background: '#d45c55'}}></div><span className="bar-label">High</span></div><div className="bar-wrap"><div className="bar alt" style={{height: '30%'}}></div><span className="bar-label">Monitoring</span></div></div></section>
        <section className="card card-pad"><div className="card-title"><div><h2>Needs attention</h2><p>Latest risk signals</p></div><Link className="text-link" to="/athletes">View all</Link></div><div className="risk-list"><div className="risk-row"><span className="risk-name"><i className="dot danger" />R. Sharma</span><span className="badge badge-high">High</span></div><div className="risk-row"><span className="risk-name"><i className="dot warning" />A. Williams</span><span className="badge badge-medium">Medium</span></div><div className="risk-row"><span className="risk-name"><i className="dot warning" />D. Martinez</span><span className="badge badge-medium">Medium</span></div></div></section>
      </div>
      <section className="card card-pad" style={{marginTop: 20}}><div className="card-title"><div><h2>Quick actions</h2><p>Move from signal to action.</p></div></div><div style={{display:'flex', gap: 12, flexWrap:'wrap'}}><Link className="btn btn-primary" to="/athletes">Manage athletes</Link><Link className="btn btn-secondary" to="/videos">Review reports</Link><Link className="btn btn-secondary" to="/prediction">Run prediction</Link></div></section>
    </div>
  );
}

export default Dashboard;