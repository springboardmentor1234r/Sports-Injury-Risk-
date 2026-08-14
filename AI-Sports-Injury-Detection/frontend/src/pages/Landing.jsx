import { Link } from "react-router-dom";

function Landing() {
    return (
        <main className="public-page">
            <nav className="public-nav"><Link className="public-brand" to="/"><img src="/logo.png" alt="SportGuard AI Logo" className="brand-logo-img" style={{ marginRight: 8 }} />SportGuard AI</Link><div style={{display: "flex", gap: 10}}><Link className="btn btn-secondary" to="/login">Sign in</Link><Link className="btn btn-primary" to="/register">Create account</Link></div></nav>
            <section className="hero"><div><p className="eyebrow">Precision sports medicine</p><h1>Know the movement before it becomes an <em>injury.</em></h1><p className="hero-copy">SportGuard AI turns training video into clear biomechanical signals, helping coaches make earlier, more confident decisions for every athlete.</p><div style={{display: "flex", gap: 12, flexWrap: "wrap"}}><Link className="btn btn-accent" to="/register">Start your workspace</Link><Link className="btn btn-secondary" to="/login">Explore dashboard</Link></div></div><div className="hero-art"><p className="eyebrow" style={{color: "var(--teal)"}}>Live analysis</p><h2>Lower-body movement profile</h2><p>AI pose estimation has identified the latest readiness signals.</p><div className="signal"><div className="signal-row"><span>Knee alignment</span><strong style={{color: "var(--teal)"}}>Stable</strong></div><div className="signal-row"><span>Load symmetry</span><strong style={{color: "var(--teal)"}}>94%</strong></div><div className="signal-row"><span>Injury risk</span><strong style={{color: "#ffd27d"}}>Moderate</strong></div></div></div></section>
        </main>
    );
}
export default Landing;
