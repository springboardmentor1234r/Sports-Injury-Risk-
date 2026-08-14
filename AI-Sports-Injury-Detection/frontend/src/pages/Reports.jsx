import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState("");
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this analysis report?")) return;
        try {
            await API.delete(`/analysis/${reportId}`);
            setReports(reports.filter(r => r._id !== reportId));
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete report");
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await API.get("/auth/profile");
                setUserRole(response.data.user.role);
            } catch (error) {
                console.error("Could not fetch user role", error);
            }
        };
        const fetchReports = async () => {
            try {
                const response = await API.get("/analysis");
                setReports(response.data.analyses || []);
            } catch (error) {
                alert(error.response?.data?.message || "Failed to fetch reports");
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
        fetchReports();
    }, []);

    const getVideoUrl = (url) => {
        if (!url) return "#";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        const clean = url.replace(/\\/g, "/");
        return `http://localhost:5000/${clean}`;
    };

    // Derived statistics
    const totalReports = reports.length;
    const highRiskCount = reports.filter(r => {
        const predText = (r.mlPrediction || "").toLowerCase();
        return r.riskScore >= 70 || predText.includes("high");
    }).length;
    const avgConfidence = reports.length ? Math.round(reports.reduce((acc, curr) => acc + (curr.movementScore || 0), 0) / reports.length) : 0;

    return (
        <div>
            <div className="page-heading">
                <div>
                    <p className="eyebrow">Workspace / Intelligence</p>
                    <h1>Reports</h1>
                    <p>Turn movement signals into a clear record of athlete readiness.</p>
                </div>
            </div>

            <div className="stats-grid" style={{marginBottom: 32}}>
                <div className="card stat-card">
                    <div className="stat-label">Reports generated</div>
                    <div className="stat-value">{String(totalReports).padStart(2, '0')}</div>
                    <div className="stat-meta">This season</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Reviewed this week</div>
                    <div className="stat-value">{String(totalReports).padStart(2, '0')}</div>
                    <div className="stat-meta">100% completion</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">High risk reports</div>
                    <div className="stat-value">{String(highRiskCount).padStart(2, '0')}</div>
                    <div className="stat-meta" style={{color: "var(--danger)"}}>Requires action</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Avg. confidence</div>
                    <div className="stat-value">{avgConfidence}%</div>
                    <div className="stat-meta">Model confidence</div>
                </div>
            </div>

            <section className="card card-pad">
                <div className="card-title">
                    <div>
                        <h2>Recent reports</h2>
                        <p>Detailed summaries and video replays from your latest movement screenings.</p>
                    </div>
                </div>
                {loading ? (
                    <div className="empty-state">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="empty-state">No reports generated yet. Start by uploading a video.</div>
                ) : (
                    <div className="table-wrap">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Athlete</th>
                                    <th>Movement</th>
                                    <th>Date</th>
                                    <th>Risk Score</th>
                                    <th>Prediction & Explanations</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => {
                                    const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric"
                                    });
                                    const riskClass = report.riskScore >= 70 ? "high" : report.riskScore >= 40 ? "medium" : "low";
                                    return (
                                        <tr key={report._id}>
                                            <td>
                                                <span className="table-name">{report.athlete?.name || "Unknown"}</span>
                                            </td>
                                            <td>{report.video?.sport || "N/A"}</td>
                                            <td>{dateStr}</td>
                                            <td>
                                                <span className={`badge badge-${riskClass}`}>
                                                    {report.riskScore}%
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    {(() => {
                                                        const predText = (report.mlPrediction || "").toLowerCase();
                                                        const isHigh = predText.includes("high") || report.riskScore >= 70;
                                                        const isMedium = predText.includes("mod") || predText.includes("med") || (report.riskScore >= 40 && report.riskScore < 70);
                                                        const predColor = isHigh ? 'var(--danger)' : isMedium ? 'var(--warning)' : 'var(--success)';
                                                        const explanation = isHigh 
                                                            ? "High Risk: Devs exceed 70%. Workload reduction recommended; consult physiotherapist immediately." 
                                                            : isMedium 
                                                                ? "Medium Risk: Devs between 40-70%. Focus on targeted dynamic stabilization drills." 
                                                                : "Low Risk: Metrics within baseline ranges. Continue standard training schedules.";
                                                        return (
                                                            <>
                                                                <span style={{ fontWeight: 600, color: predColor }}>
                                                                    {report.mlPrediction || "Unknown"}
                                                                </span>
                                                                <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "var(--muted)", maxWidth: 300, lineHeight: 1.4 }}>
                                                                    {explanation}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <button 
                                                        className="btn btn-primary" 
                                                        style={{ padding: "6px 12px", fontSize: 12 }}
                                                        onClick={() => setSelectedAnalysis(report)}
                                                    >
                                                        View details
                                                    </button>
                                                    {report.video?.videoUrl ? (
                                                        <a 
                                                            className="btn btn-secondary" 
                                                            style={{ padding: "6px 12px", fontSize: 12, display: "inline-block", textDecoration: "none" }}
                                                            href={getVideoUrl(report.video.videoUrl)} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                        >
                                                            View video
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: "var(--muted)", fontSize: 12 }}>No video</span>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteReport(report._id)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'var(--danger)',
                                                            cursor: 'pointer',
                                                            fontSize: 15,
                                                            padding: '6px 8px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            opacity: 0.7,
                                                            transition: 'opacity 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                                                        title="Delete report"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Detailed Analysis Report Modal */}
            {selectedAnalysis && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(10, 25, 47, 0.75)",
                    backdropFilter: "blur(8px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: 20
                }} onClick={() => setSelectedAnalysis(null)}>
                    <div style={{
                        background: "#fff",
                        width: "100%",
                        maxWidth: 800,
                        borderRadius: 12,
                        padding: 30,
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                        maxHeight: "90vh",
                        overflowY: "auto"
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--line)", paddingBottom: 16, marginBottom: 20 }}>
                            <div>
                                <p className="eyebrow" style={{ margin: "0 0 4px 0" }}>Biomechanical screening report</p>
                                <h2 style={{ margin: 0, color: "var(--navy-900)" }}>{selectedAnalysis.video?.sport || "Movement analysis"}</h2>
                                <p style={{ margin: "4px 0 0 0", color: "var(--muted)", fontSize: 13 }}>
                                    Athlete: <strong>{selectedAnalysis.athlete?.name || "Unknown"}</strong> · Uploaded on {new Date(selectedAnalysis.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="form-grid" style={{ gap: 20, gridTemplateColumns: "1fr 1fr" }}>
                            <div className="card card-pad" style={{ border: '1px solid var(--line)', background: '#fcfdfe', padding: 20 }}>
                                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>Injury Risk Prediction</h3>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Injury Risk Score:</span>
                                        <strong style={{ color: selectedAnalysis.riskScore >= 70 ? 'var(--danger)' : selectedAnalysis.riskScore >= 40 ? 'var(--warning)' : 'var(--success)' }}>{selectedAnalysis.riskScore}%</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Movement Score:</span>
                                        <strong>{selectedAnalysis.movementScore} / 100</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Prediction Category:</span>
                                        <strong>{selectedAnalysis.mlPrediction}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Knee Symmetry:</span>
                                        <strong>{selectedAnalysis.symmetry?.knee || "Symmetric"}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Elbow Symmetry:</span>
                                        <strong>{selectedAnalysis.symmetry?.elbow || "Symmetric"}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Running Phase:</span>
                                        <strong>{selectedAnalysis.runningPhase || "N/A"}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="card card-pad" style={{ border: '1px solid var(--line)', background: '#fcfdfe', padding: 20 }}>
                                <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>Corrective Exercise Recommendations</h3>
                                <div>
                                    {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 ? (
                                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--ink)', lineHeight: '1.6' }}>
                                            {selectedAnalysis.recommendations.map((rec, i) => (
                                                <li key={i} style={{ marginBottom: 8 }}>{rec}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>No corrective exercises found.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button className="btn btn-primary" onClick={() => setSelectedAnalysis(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
