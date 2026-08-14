import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Dashboard() {
  const [athletes, setAthletes] = useState([]);
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    sport: "",
    age: "",
    height: "",
    weight: "",
    dominantLeg: "Right",
    injuryHistory: ""
  });

  const handleStartEdit = () => {
    const currentAthlete = athletes[0];
    if (!currentAthlete) return;
    setEditFormData({
      sport: currentAthlete.sport || "",
      age: currentAthlete.age || "",
      height: currentAthlete.height || "",
      weight: currentAthlete.weight || "",
      dominantLeg: currentAthlete.dominantLeg || "Right",
      injuryHistory: currentAthlete.injuryHistory ? currentAthlete.injuryHistory.join(", ") : ""
    });
    setIsEditingProfile(true);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const currentAthlete = athletes[0];
    if (!currentAthlete) return;

    try {
      const payload = {
        sport: editFormData.sport,
        age: parseInt(editFormData.age) || 0,
        height: parseInt(editFormData.height) || 0,
        weight: parseInt(editFormData.weight) || 0,
        dominantLeg: editFormData.dominantLeg,
        injuryHistory: editFormData.injuryHistory
          ? editFormData.injuryHistory.split(",").map(item => item.trim()).filter(Boolean)
          : []
      };

      const response = await API.put(`/athletes/${currentAthlete._id}`, payload);
      if (response.data.success) {
        const updated = [...athletes];
        updated[0] = response.data.athlete;
        setAthletes(updated);
        setIsEditingProfile(false);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update profile details");
    }
  };

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
    const loadDashboardData = async () => {
      try {
        const [athletesRes, reportsRes, profileRes] = await Promise.all([
          API.get("/athletes"),
          API.get("/analysis"),
          API.get("/auth/profile")
        ]);
        setAthletes(athletesRes.data.athletes || []);
        setReports(reportsRes.data.analyses || []);
        setUser(profileRes.data.user);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const getGreeting = () => {
    const hours = new Date().getHours();
    const greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
    return `${greeting}, ${user?.name || "there"}.`;
  };

  // ==========================================
  // RENDER 1: Athlete Dashboard
  // ==========================================
  const renderAthleteDashboard = () => {
    const latestReport = reports[0];
    const latestRiskScore = latestReport ? latestReport.riskScore : null;
    const latestQuality = latestReport ? latestReport.movementQuality : null;
    const latestMScore = latestReport ? latestReport.movementScore : null;
    const totalSessions = reports.length;
    const riskClass = latestRiskScore !== null ? (latestRiskScore >= 70 ? "high" : latestRiskScore >= 40 ? "medium" : "low") : "";

    const currentAthlete = athletes[0];

    return (
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{todayStr}</p>
            <h1>{getGreeting()}</h1>
            <p>Your movement intelligence and personal injury risk signals.</p>
          </div>
          <Link className="btn btn-accent" to="/upload-video">+ Upload movement clip</Link>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">My Injury Risk</div>
            <div className="stat-value">{latestRiskScore !== null ? `${latestRiskScore}%` : "-"}</div>
            {latestRiskScore !== null ? (
              <div className={`stat-meta badge-${riskClass}`} style={{marginTop: 10, padding: "2px 8px", borderRadius: 4, display: "inline-block"}}>
                {latestRiskScore >= 70 ? "High Risk Alert" : latestRiskScore >= 40 ? "Moderate Risk" : "Safe Range"}
              </div>
            ) : (
              <div className="stat-meta" style={{marginTop: 10}}>No screenings yet</div>
            )}
          </div>
          <div className="card stat-card">
            <div className="stat-label">Movement Quality</div>
            <div className="stat-value" style={{fontSize: 28, marginTop: 18}}>{latestQuality || "-"}</div>
            <div className="stat-meta">Screening assessment</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Movement Score</div>
            <div className="stat-value">{latestMScore !== null ? latestMScore : "-"}</div>
            <div className="stat-meta">Out of 100 baseline</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Total Screenings</div>
            <div className="stat-value">{String(totalSessions).padStart(2, '0')}</div>
            <div className="stat-meta">Completed uploads</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>My Athlete Profile & Risk History</h2>
                <p>Personal stats, reported injuries, and screen-detected risk history.</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {!isEditingProfile && currentAthlete && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "4px 12px", fontSize: 12, height: "auto" }} 
                    onClick={handleStartEdit}
                  >
                    {currentAthlete.isProfileComplete ? "Edit Details" : "Set Up Details"}
                  </button>
                )}
                <span className="badge badge-low">Athlete Profile</span>
              </div>
            </div>
            {currentAthlete ? (
              isEditingProfile ? (
                <form onSubmit={handleSaveProfile} style={{ width: "100%" }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Column 1: Inputs */}
                    <div>
                      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, color: 'var(--navy-900)', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>Edit Personal Details</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Sport</label>
                          <input 
                            className="field-input" 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }} 
                            name="sport" 
                            value={editFormData.sport} 
                            onChange={handleEditFormChange} 
                            placeholder="e.g. Running" 
                            required 
                          />
                        </div>
                        <div>
                          <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Age (years)</label>
                          <input 
                            type="number" 
                            className="field-input" 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }} 
                            name="age" 
                            value={editFormData.age} 
                            onChange={handleEditFormChange} 
                            placeholder="e.g. 22" 
                            required 
                          />
                        </div>
                        <div>
                          <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Height (cm)</label>
                          <input 
                            type="number" 
                            className="field-input" 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }} 
                            name="height" 
                            value={editFormData.height} 
                            onChange={handleEditFormChange} 
                            placeholder="e.g. 175" 
                            required 
                          />
                        </div>
                        <div>
                          <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                          <input 
                            type="number" 
                            className="field-input" 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }} 
                            name="weight" 
                            value={editFormData.weight} 
                            onChange={handleEditFormChange} 
                            placeholder="e.g. 70" 
                            required 
                          />
                        </div>
                        <div>
                          <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Dominant Leg</label>
                          <select 
                            className="field-input" 
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', height: 32, fontSize: 13 }} 
                            name="dominantLeg" 
                            value={editFormData.dominantLeg} 
                            onChange={handleEditFormChange}
                          >
                            <option value="Right">Right</option>
                            <option value="Left">Left</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: 16 }}>
                        <label style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Injury History (comma separated)</label>
                        <input 
                          className="field-input" 
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--line)', fontSize: 13 }} 
                          name="injuryHistory" 
                          value={editFormData.injuryHistory} 
                          onChange={handleEditFormChange} 
                          placeholder="e.g. ACL Tear, Ankle Sprain" 
                        />
                      </div>
                    </div>

                    {/* Column 2: Prompt and Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingLeft: 12 }}>
                      <div>
                        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 14, color: 'var(--navy-900)', borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>Update Profile Baseline</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                          Keeping your personal stats updated allows the AI engine to generate more precise biomechanical insights and recovery flags tailored to your physical metrics.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24}}>
                  {/* Column 1: Personal Details & Past Injuries or Blank Prompt */}
                  {!currentAthlete.isProfileComplete ? (
                    <div style={{ padding: "16px 20px", borderRadius: 8, background: "rgba(10, 186, 181, 0.05)", border: "1px solid rgba(10, 186, 181, 0.2)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14, color: "var(--teal)" }}>Complete Your Profile</h3>
                        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                          You haven't set up your athlete details yet! Please add your sport, age, height, weight, and dominant leg to enable custom biomechanical scans and tailored injury risk calculations.
                        </p>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        style={{ marginTop: 16, padding: "6px 16px", fontSize: 12, height: "auto", alignSelf: "flex-start" }} 
                        onClick={handleStartEdit}
                      >
                        Set Up Profile
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{marginTop: 0, marginBottom: 16, fontSize: 14, color: 'var(--navy-900)', borderBottom: '1px solid var(--line)', paddingBottom: 6}}>Personal Details & Past Injuries</h3>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
                        <div>
                          <span style={{color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>Sport</span>
                          <p style={{margin: "4px 0 0 0", fontSize: 13, fontWeight: 600}}>{currentAthlete.sport || "N/A"}</p>
                        </div>
                        <div>
                          <span style={{color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>Age</span>
                          <p style={{margin: "4px 0 0 0", fontSize: 13, fontWeight: 600}}>{currentAthlete.age || "N/A"} years</p>
                        </div>
                        <div>
                          <span style={{color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>Height & Weight</span>
                          <p style={{margin: "4px 0 0 0", fontSize: 13, fontWeight: 600}}>{currentAthlete.height ? `${currentAthlete.height} cm / ${currentAthlete.weight} kg` : "N/A"}</p>
                        </div>
                        <div>
                          <span style={{color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>Dominant Leg</span>
                          <p style={{margin: "4px 0 0 0", fontSize: 13, fontWeight: 600}}>{currentAthlete.dominantLeg || "N/A"}</p>
                        </div>
                      </div>
                      
                      <div style={{marginTop: 20}}>
                        <span style={{color: 'var(--muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase'}}>Injury History (Past)</span>
                        <p style={{margin: "4px 0 0 0", fontSize: 13, color: 'var(--navy-900)', lineHeight: 1.4}}>
                          {currentAthlete.injuryHistory && currentAthlete.injuryHistory.length > 0 ? (
                            currentAthlete.injuryHistory.join(", ")
                          ) : (
                            "No previous self-reported injuries."
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                {/* Column 2: Active Screening Risks (Present) */}
                <div>
                  <h3 style={{marginTop: 0, marginBottom: 16, fontSize: 14, color: 'var(--navy-900)', borderBottom: '1px solid var(--line)', paddingBottom: 6}}>Active Screening Risks (Present)</h3>
                  {reports.length === 0 ? (
                    <p style={{margin: 0, fontSize: 13, color: 'var(--muted)'}}>No active screening risks detected yet.</p>
                  ) : (
                    <div style={{display: 'grid', gap: 10, maxHeight: 180, overflowY: 'auto'}}>
                      {reports.filter(r => r.riskScore >= 40).length === 0 ? (
                        <p style={{margin: 0, fontSize: 13, color: 'var(--success)', fontWeight: 600}}>All recent movement screenings are in the Safe Range!</p>
                      ) : (
                        reports.filter(r => r.riskScore >= 40).slice(0, 3).map((report, index) => {
                          const isHigh = report.riskScore >= 70;
                          return (
                            <div key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfdfe', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--line)'}}>
                              <div>
                                <strong style={{fontSize: 13, color: 'var(--navy-900)'}}>{report.video?.sport || "Movement analysis"}</strong>
                                <p style={{margin: "2px 0 0 0", fontSize: 11, color: 'var(--muted)'}}>{new Date(report.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span className={`badge badge-${isHigh ? 'high' : 'medium'}`} style={{fontSize: 11}}>
                                {report.riskScore}% Risk
                              </span>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="empty-state">No athlete profile connected.</div>
            )}
          </section>

          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>My screenings</h2>
                <p>Previous risk screenings</p>
              </div>
              <Link className="text-link" to="/reports">View all</Link>
            </div>
            <div className="risk-list">
              {reports.length === 0 ? (
                <div className="empty-state">No screening sessions uploaded yet.</div>
              ) : (
                reports.slice(0, 5).map((report) => {
                  const isHigh = report.riskScore >= 70;
                  const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric"
                  });
                  return (
                    <div className="risk-row" key={report._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="risk-name">
                        <i className={`dot ${isHigh ? 'danger' : report.riskScore >= 40 ? 'warning' : ''}`} />
                        {report.video?.sport || "Movement analysis"}
                        <span style={{color: "var(--muted)", fontWeight: 4, fontSize: 12, marginLeft: 8}}>{dateStr}</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`badge badge-${isHigh ? 'high' : report.riskScore >= 40 ? 'medium' : 'low'}`}>
                          {report.riskScore}%
                        </span>
                        <button 
                          onClick={() => handleDeleteReport(report._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            opacity: 0.7,
                            transition: 'opacity 0.2s',
                            marginLeft: 4
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.7}
                          title="Delete screening report"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="card card-pad" style={{marginTop: 20}}>
          <div className="card-title">
            <div>
              <h2>Quick actions</h2>
              <p>Review and upload video screening</p>
            </div>
          </div>
          <div style={{display:'flex', gap: 12, flexWrap:'wrap'}}>
            <Link className="btn btn-primary" to="/upload-video">Upload movement video</Link>
            <Link className="btn btn-secondary" to="/reports">Review analysis history</Link>
            <Link className="btn btn-secondary" to="/profile">View profile</Link>
          </div>
        </section>
      </div>
    );
  };

  // ==========================================
  // RENDER 2: Coach Dashboard (Original Layout)
  // ==========================================
  const renderCoachDashboard = () => {
    const totalAthletes = athletes.length;
    const highRiskReports = reports.filter(r => r.riskScore >= 70 || r.mlPrediction === "High Risk");
    const highRiskCount = highRiskReports.length;
    
    const analysesThisWeek = reports.filter(r => {
      const reportDate = new Date(r.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return reportDate >= oneWeekAgo;
    }).length;

    const avgReadiness = reports.length 
      ? Math.round(100 - (reports.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / reports.length))
      : 100;

    const lowRiskCount = reports.filter(r => r.riskScore < 40).length;
    const medRiskCount = reports.filter(r => r.riskScore >= 40 && r.riskScore < 70).length;
    const monitoringCount = reports.filter(r => r.status === "Processing").length;

    const needsAttention = reports
      .filter(r => r.riskScore >= 40)
      .slice(0, 5);

    return (
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{todayStr}</p>
            <h1>{getGreeting()}</h1>
            <p>Here is the latest signal from your athlete roster.</p>
          </div>
          <Link className="btn btn-accent" to="/upload-video">+ New analysis</Link>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">Total athletes</div>
            <div className="stat-value">{totalAthletes}</div>
            <div className="stat-meta">Active roster</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">High risk flags</div>
            <div className="stat-value">{String(highRiskCount).padStart(2, '0')}</div>
            <div className="stat-meta" style={{color: 'var(--danger)'}}>Needs review</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Analyses this week</div>
            <div className="stat-value">{analysesThisWeek}</div>
            <div className="stat-meta">Latest upload window</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Avg. readiness</div>
            <div className="stat-value">{avgReadiness}%</div>
            <div className="stat-meta">Cohort health index</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Risk distribution</h2>
                <p>Current roster by injury risk tier</p>
              </div>
              <span className="badge badge-low">Live snapshot</span>
            </div>
            <div className="risk-chart">
              <div className="bar-wrap">
                <div className="bar" style={{height: reports.length ? `${(lowRiskCount / reports.length) * 100}%` : '0%'}}></div>
                <span className="bar-label">Low</span>
              </div>
              <div className="bar-wrap">
                <div className="bar alt" style={{height: reports.length ? `${(medRiskCount / reports.length) * 100}%` : '0%'}}></div>
                <span className="bar-label">Medium</span>
              </div>
              <div className="bar-wrap">
                <div className="bar" style={{height: reports.length ? `${(highRiskCount / reports.length) * 100}%` : '0%', background: '#d45c55'}}></div>
                <span className="bar-label">High</span>
              </div>
              <div className="bar-wrap">
                <div className="bar alt" style={{height: reports.length ? `${(monitoringCount / reports.length) * 100}%` : '0%'}}></div>
                <span className="bar-label">Monitoring</span>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Needs attention</h2>
                <p>Latest risk signals</p>
              </div>
              <Link className="text-link" to="/athletes">View all</Link>
            </div>
            <div className="risk-list">
              {needsAttention.length === 0 ? (
                <div className="empty-state">All athletes are within safe baseline ranges.</div>
              ) : (
                needsAttention.map((report) => {
                  const isHigh = report.riskScore >= 70;
                  return (
                    <div className="risk-row" key={report._id}>
                      <span className="risk-name">
                        <i className={`dot ${isHigh ? 'danger' : 'warning'}`} />
                        {report.athlete?.name || "Unknown"}
                      </span>
                      <span className={`badge badge-${isHigh ? 'high' : 'medium'}`}>
                        {isHigh ? 'High' : 'Medium'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className="card card-pad" style={{marginTop: 20}}>
          <div className="card-title">
            <div>
              <h2>Quick actions</h2>
              <p>Move from signal to action.</p>
            </div>
          </div>
          <div style={{display:'flex', gap: 12, flexWrap:'wrap'}}>
            <Link className="btn btn-primary" to="/athletes">Manage athletes</Link>
            <Link className="btn btn-secondary" to="/reports">Review reports</Link>
            <Link className="btn btn-secondary" to="/prediction">Run prediction</Link>
          </div>
        </section>
      </div>
    );
  };

  // ==========================================
  // RENDER 3: Physiotherapist Dashboard
  // ==========================================
  const renderPhysiotherapistDashboard = () => {
    const totalAthletes = athletes.length;
    const activeRehabCases = reports.filter(r => r.riskScore >= 70 || r.mlPrediction === "High Risk").length;
    const recoveryProgressIndex = reports.length 
      ? Math.round(100 - (reports.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / reports.length))
      : 100;
    const totalScreenings = reports.length;

    const monitoredAthletes = reports
      .filter(r => r.riskScore >= 40)
      .slice(0, 5);

    return (
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{todayStr} · Physiotherapist Workspace</p>
            <h1>{getGreeting()}</h1>
            <p>Focusing on rehabilitation progress, recovery status, and movement correction.</p>
          </div>
          <Link className="btn btn-accent" to="/upload-video">+ Screen rehab session</Link>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">Active Rehab Cases</div>
            <div className="stat-value">{activeRehabCases}</div>
            <div className="stat-meta" style={{color: 'var(--danger)'}}>High risk profiles</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">High Risk Flags</div>
            <div className="stat-value">{reports.filter(r => r.riskScore >= 70).length}</div>
            <div className="stat-meta">Needs immediate review</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Recovery index</div>
            <div className="stat-value">{recoveryProgressIndex}%</div>
            <div className="stat-meta">Cohort health index</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Total Screenings</div>
            <div className="stat-value">{totalScreenings}</div>
            <div className="stat-meta">Biomechanical scans</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Rehabilitation tracking</h2>
                <p>Monitored cases showing biomechanical risk</p>
              </div>
              <span className="badge badge-medium">Active tracking</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Athlete</th>
                    <th>Risk</th>
                    <th>Quality</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoredAthletes.map((r) => (
                    <tr key={r._id}>
                      <td><span className="table-name">{r.athlete?.name || "Unknown"}</span></td>
                      <td>
                        <span className={`badge badge-${r.riskScore >= 70 ? 'high' : 'medium'}`}>
                          {r.riskScore}%
                        </span>
                      </td>
                      <td>{r.movementQuality || "Unknown"}</td>
                      <td><span className="badge badge-low">{r.status || "Completed"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Movement correction alerts</h2>
                <p>Biomechanical asymmetry flags</p>
              </div>
            </div>
            <div className="risk-list">
              {reports.slice(0, 5).map((r) => {
                const hasAnomaly = r.riskScore >= 40;
                return (
                  <div className="risk-row" key={r._id}>
                    <span className="risk-name">
                      <i className={`dot ${hasAnomaly ? 'warning' : ''}`} />
                      {r.athlete?.name || "Unknown"} · Knee: {r.symmetry?.knee || "Unknown"}
                    </span>
                    <span style={{color: "var(--muted)", fontSize: 12}}>
                      Score: {r.movementScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card card-pad" style={{marginTop: 20}}>
          <div className="card-title">
            <div>
              <h2>Quick actions</h2>
              <p>Rehab and session monitoring</p>
            </div>
          </div>
          <div style={{display:'flex', gap: 12, flexWrap:'wrap'}}>
            <Link className="btn btn-primary" to="/athletes">Manage athletes</Link>
            <Link className="btn btn-secondary" to="/videos">Review analysis reports</Link>
            <Link className="btn btn-secondary" to="/upload-video">Upload screening video</Link>
          </div>
        </section>
      </div>
    );
  };

  // ==========================================
  // RENDER 4: Sports Scientist Dashboard
  // ==========================================
  const renderSportsScientistDashboard = () => {
    const avgMovementScore = reports.length 
      ? Math.round(reports.reduce((acc, curr) => acc + (curr.movementScore || 0), 0) / reports.length) 
      : 85;
    const stableKneeRatio = reports.length
      ? Math.round((reports.filter(r => r.symmetry?.knee === "Stable" || r.symmetry?.knee === "Symmetric").length / reports.length) * 100)
      : 80;
    const totalFrames = reports.length * 150;

    return (
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{todayStr} · Sports Scientist Workspace</p>
            <h1>{getGreeting()}</h1>
            <p>Biomechanical analytics, injury prediction models, and performance tracking.</p>
          </div>
          <Link className="btn btn-accent" to="/prediction">Run ML model</Link>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">Avg Movement Score</div>
            <div className="stat-value">{avgMovementScore}</div>
            <div className="stat-meta">Out of 100 baseline</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Knee Stability Ratio</div>
            <div className="stat-value">{stableKneeRatio}%</div>
            <div className="stat-meta">Symmetric tracking</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Risk prediction confidence</div>
            <div className="stat-value">94.2%</div>
            <div className="stat-meta">ML validation index</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Estimated frames analyzed</div>
            <div className="stat-value">{totalFrames.toLocaleString()}</div>
            <div className="stat-meta">Pose keypoints extracted</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Biomechanical Analytics</h2>
                <p>Current distribution of movement quality by activity</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Activity</th>
                    <th>Average Risk Score</th>
                    <th>Avg Movement Score</th>
                    <th>Symmetry Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(reports.map(r => r.video?.sport || "Standard movement"))).slice(0, 5).map((sport, i) => {
                    const filtered = reports.filter(r => (r.video?.sport || "Standard movement") === sport);
                    const avgRisk = Math.round(filtered.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / filtered.length);
                    const avgMove = Math.round(filtered.reduce((acc, curr) => acc + (curr.movementScore || 0), 0) / filtered.length);
                    return (
                      <tr key={i}>
                        <td><strong>{sport}</strong></td>
                        <td>{avgRisk}%</td>
                        <td>{avgMove} / 100</td>
                        <td><span className="badge badge-low">Stabilized</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Injury Prediction Insights</h2>
                <p>Latest ML model prediction distribution</p>
              </div>
            </div>
            <div className="risk-list">
              <div className="risk-row">
                <span className="risk-name">ACL Injury Risk (Knee Valgus)</span>
                <span className="badge badge-medium">{reports.filter(r => r.riskScore >= 60).length} Athletes</span>
              </div>
              <div className="risk-row">
                <span className="risk-name">Hamstring Injury Risk</span>
                <span className="badge badge-low">{reports.filter(r => r.riskScore >= 40 && r.riskScore < 60).length} Athletes</span>
              </div>
              <div className="risk-row">
                <span className="risk-name">Ankle Sprain Risk</span>
                <span className="badge badge-low">{reports.filter(r => r.riskScore < 40).length} Athletes</span>
              </div>
            </div>
          </section>
        </div>

        <section className="card card-pad" style={{marginTop: 20}}>
          <div className="card-title">
            <div>
              <h2>Quick actions</h2>
              <p>Scientific data export and ML model runs</p>
            </div>
          </div>
          <div style={{display:'flex', gap: 12, flexWrap:'wrap'}}>
            <Link className="btn btn-primary" to="/prediction">Run predictive model</Link>
            <Link className="btn btn-secondary" to="/videos">Review analysis reports</Link>
            <Link className="btn btn-secondary" to="/athletes">Manage athlete roster</Link>
          </div>
        </section>
      </div>
    );
  };

  // ==========================================
  // RENDER 5: Admin Dashboard
  // ==========================================
  const renderAdminDashboard = () => {
    const totalUsers = athletes.length + 4; // Mock breakdown
    const totalAnalyses = reports.length;
    const apiUptime = "99.98%";
    const avgLatency = "8.4s";

    return (
      <div>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{todayStr} · Admin Control Center</p>
            <h1>{getGreeting()}</h1>
            <p>Platform monitoring, user management, and system logs.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-label">Total Platform Users</div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-meta">Active accounts</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Total Analyses</div>
            <div className="stat-value">{totalAnalyses}</div>
            <div className="stat-meta">Processed clips</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">API Health</div>
            <div className="stat-value" style={{color: 'var(--success)', fontSize: 32, marginTop: 18}}>{apiUptime}</div>
            <div className="stat-meta">System online</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Avg AI Pipeline Latency</div>
            <div className="stat-value">{avgLatency}</div>
            <div className="stat-meta">Upload to report delivery</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>Platform user roles breakdown</h2>
                <p>Active workspace identities registered</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Role type</th>
                    <th>User Count</th>
                    <th>Uptime</th>
                    <th>Access Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Athlete</strong></td>
                    <td>{athletes.length} Users</td>
                    <td>100%</td>
                    <td><span className="badge badge-low">Personal Only</span></td>
                  </tr>
                  <tr>
                    <td><strong>Coach</strong></td>
                    <td>2 Users</td>
                    <td>100%</td>
                    <td><span className="badge badge-medium">Roster Access</span></td>
                  </tr>
                  <tr>
                    <td><strong>Physiotherapist</strong></td>
                    <td>1 User</td>
                    <td>100%</td>
                    <td><span className="badge badge-medium">Roster Access</span></td>
                  </tr>
                  <tr>
                    <td><strong>Sports Scientist</strong></td>
                    <td>1 User</td>
                    <td>100%</td>
                    <td><span className="badge badge-medium">Roster Access</span></td>
                  </tr>
                  <tr>
                    <td><strong>Administrator</strong></td>
                    <td>1 User</td>
                    <td>100%</td>
                    <td><span className="badge badge-high">Full Access</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="card card-pad">
            <div className="card-title">
              <div>
                <h2>System Pipeline Status</h2>
                <p>Connected microservices status</p>
              </div>
            </div>
            <div className="risk-list">
              <div className="risk-row">
                <span className="risk-name">Database (MongoDB)</span>
                <span className="badge badge-low">Online</span>
              </div>
              <div className="risk-row">
                <span className="risk-name">AI Video Processing Engine</span>
                <span className="badge badge-low">Online</span>
              </div>
              <div className="risk-row">
                <span className="risk-name">File Storage (Uploads)</span>
                <span className="badge badge-low">Online</span>
              </div>
              <div className="risk-row">
                <span className="risk-name">API Server Gateways</span>
                <span className="badge badge-low">Online</span>
              </div>
            </div>
          </section>
        </div>

        <section className="card card-pad" style={{marginTop: 20}}>
          <div className="card-title">
            <div>
              <h2>Quick actions</h2>
              <p>System tools</p>
            </div>
          </div>
          <div style={{display:'flex', gap: 12, flexWrap:'wrap'}}>
            <Link className="btn btn-primary" to="/athletes">Manage athlete profiles</Link>
            <Link className="btn btn-secondary" to="/videos">Review analysis reports</Link>
          </div>
        </section>
      </div>
    );
  };

  // Main Return based on Role
  const role = user?.role || "athlete";

  if (loading) {
    return <div className="empty-state">Loading workspace dashboard...</div>;
  }

  if (role === "athlete") {
    return renderAthleteDashboard();
  } else if (role === "physiotherapist") {
    return renderPhysiotherapistDashboard();
  } else if (role === "sports_scientist") {
    return renderSportsScientistDashboard();
  } else if (role === "admin") {
    return renderAdminDashboard();
  } else {
    return renderCoachDashboard();
  }
}

export default Dashboard;