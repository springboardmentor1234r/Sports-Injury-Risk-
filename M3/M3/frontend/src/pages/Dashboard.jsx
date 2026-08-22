import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../api/AuthContext";
import Icon from "../components/Icon";

const label = value => value?.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
const riskClass = value => `risk-${value || "unassessed"}`;

function ScoreRing({ value, level }) {
  const numeric = Number(value || 0);
  return <div className={`score-ring ${riskClass(level)}`} style={{ "--score": `${numeric * 3.6}deg` }}><div><b>{value ?? "—"}</b><span>/ 100</span></div></div>;
}

function Stat({ icon, label: title, value, caption, tone = "blue" }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} size={19}/></span><div><p>{title}</p><h3>{value ?? "—"}</h3><small>{caption}</small></div></article>;
}

function RecentTable({ items = [] }) {
  if (!items.length) return <div className="empty-inline"><Icon name="video" size={22}/><span>No assessments yet. Upload a movement video to start your baseline.</span></div>;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Athlete</th><th>Drill</th><th>Risk</th><th>Primary signal</th><th>Quality</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><b>{item.athlete}</b></td><td>{label(item.activity)}</td><td><span className={`risk-badge ${riskClass(item.risk_level)}`}>{item.risk !== null ? `${item.risk} · ${label(item.risk_level)}` : "Processing"}</span></td><td className="finding-cell">{item.finding}</td><td>{item.movement_quality ? `${item.movement_quality}/100` : "—"}</td></tr>)}</tbody></table></div>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { client.get("/dashboard/overview").then(response => setOverview(response.data.data)).catch(() => setError("We could not load your dashboard. Refresh to try again.")); }, []);
  if (error) return <div className="notice-error">{error}</div>;
  if (!overview) return <div className="page-loading"><span className="pulse-dot"/>Building your workspace…</div>;
  const athlete = user.role === "athlete";
  const role = user.role;
  const cards = athlete ? [
    ["shield", "Current risk", overview.risk ?? "Unassessed", overview.risk ? `${label(overview.risk_level)} risk · latest assessment` : "Upload your first movement video", overview.risk_level === "high" ? "coral" : "blue"],
    ["activity", "Movement quality", overview.movement_quality ? `${overview.movement_quality}%` : "—", "Composite movement efficiency", "violet"],
    ["bell", "Active alerts", overview.unread_notifications, overview.unread_notifications ? "Review your latest updates" : "You're all caught up", "mint"],
  ] : role === "coach" ? [
    ["users", "Active athletes", overview.active_athletes, "Current athlete roster", "blue"], ["video", "Analyses complete", overview.videos_analyzed, "Movement videos assessed", "violet"], ["shield", "Priority reviews", overview.high_risk_count, "High or critical risk profiles", "coral"], ["trend", "Team readiness", overview.team_readiness ? `${overview.team_readiness}%` : "—", "Mean movement quality", "mint"],
  ] : role === "physiotherapist" ? [
    ["shield", "Priority cases", overview.priority_cases, "High-risk movement flags", "coral"], ["activity", "Assessments today", overview.assessments_today, "Completed movement screenings", "blue"], ["trend", "Mean symmetry", `${overview.average_symmetry}%`, "Across completed analyses", "mint"], ["bell", "Clinical alerts", overview.unread_notifications, "Unread care notifications", "violet"],
  ] : role === "sports_scientist" ? [
    ["activity", "Observations", overview.observations, "Completed video assessments", "blue"], ["shield", "Mean risk", `${overview.mean_risk}/100`, "Across analysis dataset", "coral"], ["trend", "Mean quality", `${overview.mean_quality}%`, "Movement efficiency signal", "mint"], ["users", "Mean symmetry", `${overview.mean_symmetry}%`, "Left-right balance", "violet"],
  ] : [
    ["users", "Platform users", overview.total_users, "Across all workspace roles", "blue"], ["activity", "Active athletes", overview.active_athletes, "Registered athlete accounts", "mint"], ["video", "Completed analyses", overview.completed_analyses, "Production assessment records", "violet"], ["shield", "Platform health", overview.platform_health, "Core API and database status", "blue"],
  ];
  return <><section className="welcome"><div><span className="eyebrow">{label(role)} WORKSPACE</span><h1>Welcome back, {user.full_name.split(" ")[0]}.</h1><p>{overview.headline}</p></div><Link className="primary-button" to="/upload"><Icon name="plus" size={18}/>Analyze a video</Link></section><section className={`stat-grid ${cards.length === 3 ? "three" : ""}`}>{cards.map(([icon, title, value, caption, tone]) => <Stat key={title} icon={icon} label={title} value={value} caption={caption} tone={tone}/>)}</section>{athlete ? <AthleteView data={overview}/> : <StaffView role={role} data={overview}/>}</>;
}

function AthleteView({ data }) {
  return <section className="dashboard-grid athlete-layout"><article className="panel score-panel"><div className="panel-title"><div><span className="eyebrow">LATEST ASSESSMENT</span><h3>Injury risk posture</h3></div><Link to="/analyses" className="text-link">View history <Icon name="arrow" size={15}/></Link></div><div className="score-content"><ScoreRing value={data.risk} level={data.risk_level}/><div><span className={`risk-badge ${riskClass(data.risk_level)}`}>{label(data.risk_level)}</span><h4>{data.risk ? "Your current risk signal" : "Build your first baseline"}</h4><p>{data.risk ? "Risk uses biomechanics, history, symmetry, training load, and fatigue signals." : "A short running, jumping, or squat video creates your first movement intelligence baseline."}</p><Link to="/upload" className="secondary-button">{data.risk ? "Record another drill" : "Upload a video"}<Icon name="arrow" size={16}/></Link></div></div></article><article className="panel recommendation-panel"><div className="panel-title"><div><span className="eyebrow">PERSONALIZED PLAN</span><h3>Next best steps</h3></div><Icon name="spark" size={20}/></div>{data.recommendations?.length ? <div className="recommendations">{data.recommendations.slice(0, 3).map((item, index) => <div key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><p><b>{item.title}</b>{item.detail}</p></div>)}</div> : <div className="empty-inline"><Icon name="spark" size={22}/><span>Recommendations will appear after your first completed analysis.</span></div>}</article><article className="panel wide-panel"><div className="panel-title"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Movement assessment history</h3></div><Link to="/analyses" className="text-link">All analyses <Icon name="arrow" size={15}/></Link></div><RecentTable items={data.recent_analyses}/></article></section>;
}

function StaffView({ role, data }) {
  const distribution = data.risk_distribution || data.role_distribution;
  const queue = data.review_queue || [];
  return <section className="dashboard-grid staff-layout"><article className="panel wide-panel"><div className="panel-title"><div><span className="eyebrow">LIVE WORKSPACE</span><h3>{role === "physiotherapist" ? "Clinical review queue" : "Recent movement assessments"}</h3></div><Link to="/analyses" className="text-link">Open analysis history <Icon name="arrow" size={15}/></Link></div>{queue.length ? <RecentTable items={queue}/> : <RecentTable items={data.recent_analyses}/>}</article><article className="panel insight-panel"><div className="panel-title"><div><span className="eyebrow">{role === "administrator" ? "ADOPTION" : "DISTRIBUTION"}</span><h3>At a glance</h3></div><Icon name="trend" size={19}/></div>{distribution ? <div className="distribution">{Object.entries(distribution).map(([name, value]) => <div key={name}><div><span>{label(name)}</span><b>{value}</b></div><i><em style={{ width: `${Math.max(8, Number(value) * (role === "administrator" ? 22 : 25))}%` }}/></i></div>)}</div> : <div className="empty-inline"><Icon name="activity" size={22}/><span>Insights grow as movement analyses are completed.</span></div>}</article></section>;
}
