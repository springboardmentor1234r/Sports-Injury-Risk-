import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { athleteAPI, injuryAPI, trainingAPI, reportAPI, adminAPI, intelligenceAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  
  const isAthlete = user?.role === 'athlete';
  const isAdminOrCoach = user?.role === 'admin' || user?.role === 'coach';
  
  // Tab control: profile, training, injuries, analytics, admin
  const [activeTab, setActiveTab] = useState('profile');
  
  // Selection state for staff/coaches
  const [selectedAthleteId, setSelectedAthleteId] = useState(null);
  const [athletesList, setAthletesList] = useState([]);
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    date_of_birth: '',
    height_cm: '',
    weight_kg: '',
    sport: '',
    bio: ''
  });

  // Training load state
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [trainingForm, setTrainingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    activity_type: 'Weightlifting',
    duration_minutes: 60,
    rpe: 5,
    notes: ''
  });

  // Injury state
  const [injuries, setInjuries] = useState([]);
  const [injuryForm, setInjuryForm] = useState({
    injury_type: '',
    body_part: '',
    severity: 'Medium',
    occurrence_date: new Date().toISOString().split('T')[0],
    status: 'active',
    notes: ''
  });

  // Admin stats state
  const [adminStats, setAdminStats] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch list of athletes if user is staff (coach, physiotherapist, admin)
  useEffect(() => {
    if (!isAthlete) {
      const fetchAthletes = async () => {
        try {
          const res = await athleteAPI.listAllAthletes();
          setAthletesList(res.data);
          if (res.data.length > 0) {
            setSelectedAthleteId(res.data[0].id);
          } else {
            setLoadingData(false);
          }
        } catch (err) {
          console.error("Error fetching athlete list:", err);
          setErrorMsg("Could not retrieve athlete directory.");
          setLoadingData(false);
        }
      };
      fetchAthletes();
    }
  }, [isAthlete]);

  // Load profile, injuries, and training loads whenever the target athlete ID changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingData(true);
      setErrorMsg('');
      try {
        const targetId = isAthlete ? null : selectedAthleteId;
        
        if (isAthlete) {
          const profRes = await athleteAPI.getMyProfile();
          setProfile(profRes.data);
          
          const injuryRes = await injuryAPI.getInjuries();
          setInjuries(injuryRes.data);

          const trainRes = await trainingAPI.getTrainingLogs();
          setTrainingLogs(trainRes.data);
        } else if (selectedAthleteId) {
          const profRes = await athleteAPI.getSpecificProfile(selectedAthleteId);
          setProfile(profRes.data);
          
          const injuryRes = await injuryAPI.getInjuries(selectedAthleteId);
          setInjuries(injuryRes.data);

          const trainRes = await trainingAPI.getTrainingLogs(selectedAthleteId);
          setTrainingLogs(trainRes.data);
        }
      } catch (err) {
        console.error("Dashboard details loading failed:", err);
        setErrorMsg("Failed to load athlete parameters. Verify profiles are configured.");
      } finally {
        setLoadingData(false);
      }
    };

    if (isAthlete || selectedAthleteId) {
      fetchDashboardData();
    }
  }, [isAthlete, selectedAthleteId]);

  useEffect(() => {
    const loadAssessment = async () => {
      const athleteId = isAthlete ? profile?.id : selectedAthleteId;
      if (!athleteId) return;
      setLoadingAssessment(true);
      try {
        const response = await intelligenceAPI.getAssessment(athleteId);
        setAssessment(response.data);
      } catch (err) {
        console.error('Intelligence assessment loading failed:', err);
        setAssessment(null);
      } finally {
        setLoadingAssessment(false);
      }
    };
    loadAssessment();
  }, [isAthlete, profile?.id, selectedAthleteId, trainingLogs.length, injuries.length]);

  // Fetch Admin Stats when active tab switches to admin
  useEffect(() => {
    if (activeTab === 'admin' && isAdminOrCoach) {
      const fetchAdminStats = async () => {
        setLoadingAdmin(true);
        try {
          const res = await adminAPI.getStats();
          setAdminStats(res.data);
        } catch (err) {
          console.error("Error fetching admin stats:", err);
          setErrorMsg("Could not load administrative system metrics.");
        } finally {
          setLoadingAdmin(false);
        }
      };
      fetchAdminStats();
    }
  }, [activeTab, isAdminOrCoach]);

  // Sync profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        date_of_birth: profile.date_of_birth || '',
        height_cm: profile.height_cm || '',
        weight_kg: profile.weight_kg || '',
        sport: profile.sport || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  // Profile update submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await athleteAPI.updateMyProfile({
        date_of_birth: profileForm.date_of_birth || null,
        height_cm: parseFloat(profileForm.height_cm) || null,
        weight_kg: parseFloat(profileForm.weight_kg) || null,
        sport: profileForm.sport || null,
        bio: profileForm.bio || null
      });
      setProfile(prev => ({ ...prev, ...res.data }));
      setEditingProfile(false);
      setSuccessMsg('Profile metrics updated successfully.');
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to update profile details.");
    }
  };

  // Training load log submit
  const handleTrainingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const targetId = isAthlete ? null : selectedAthleteId;
      const res = await trainingAPI.logTraining({
        ...trainingForm,
        duration_minutes: parseInt(trainingForm.duration_minutes),
        rpe: parseInt(trainingForm.rpe)
      }, targetId);
      
      setTrainingLogs(prev => [res.data, ...prev]);
      setSuccessMsg('Training load logged successfully!');
      setTrainingForm({
        date: new Date().toISOString().split('T')[0],
        activity_type: 'Weightlifting',
        duration_minutes: 60,
        rpe: 5,
        notes: ''
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to log training session.");
    }
  };

  // Injury log submit
  const handleInjurySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const targetId = isAthlete ? null : selectedAthleteId;
      const res = await injuryAPI.logInjury(injuryForm, targetId);
      setInjuries(prev => [res.data, ...prev]);
      setSuccessMsg('Injury record added successfully!');
      setInjuryForm({
        injury_type: '',
        body_part: '',
        severity: 'Medium',
        occurrence_date: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: ''
      });
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to log injury entry.");
    }
  };

  // Local calculation of Acute-to-Chronic Workload Ratio (ACWR) for charts
  const calculateACWRLocal = () => {
    if (trainingLogs.length === 0) return { acwr: 1.0, acute: 0, chronic: 0, status: 'Optimal', risk: 'Low', color: 'var(--color-success)' };
    
    const today = new Date();
    let acuteSum = 0;
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    
    trainingLogs.forEach(log => {
      const logDate = new Date(log.date);
      const diffTime = Math.abs(today - logDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const load = log.duration_minutes * log.rpe;
      
      if (diffDays <= 7) {
        acuteSum += load;
        w1 += load;
      } else if (diffDays <= 14) {
        w2 += load;
      } else if (diffDays <= 21) {
        w3 += load;
      } else if (diffDays <= 28) {
        w4 += load;
      }
    });
    
    const totalChronic = w1 + w2 + w3 + w4;
    const chronicAvg = totalChronic / 4;
    const acwrVal = chronicAvg > 0 ? (acuteSum / chronicAvg) : 1.0;
    const acwrRounded = Math.round(acwrVal * 100) / 100;
    
    let status = 'Optimal';
    let risk = 'Low';
    let color = 'var(--color-success)';
    
    if (acwrRounded > 1.5) {
      status = 'Overtrained Spike';
      risk = 'High';
      color = 'var(--color-danger)';
    } else if (acwrRounded > 1.3) {
      status = 'Overreaching';
      risk = 'Medium';
      color = 'var(--color-warning)';
    } else if (acwrRounded < 0.5) {
      status = 'Under-conditioned';
      risk = 'Medium';
      color = 'var(--color-warning)';
    }
    
    return {
      acwr: acwrRounded,
      acute: acuteSum,
      chronic: Math.round(chronicAvg),
      status,
      risk,
      color
    };
  };

  const acwrMetrics = calculateACWRLocal();

  // Local heuristic for Biomechanical & Injury Risk Score
  const calculateInjuryRiskScore = () => {
    let score = 12.0; // baseline
    const factors = [];
    
    if (acwrMetrics.acwr > 1.5) {
      score += 35;
      factors.push(`Acute spikes detected (ACWR ratio = ${acwrMetrics.acwr})`);
    } else if (acwrMetrics.acwr < 0.5) {
      score += 15;
      factors.push("Under-conditioning hazard: vulnerable to loading spikes");
    }
    
    // Check for active injuries
    const activeInjuries = injuries.filter(i => i.status === 'active' || i.status === 'rehab');
    if (activeInjuries.length > 0) {
      score += (activeInjuries.length * 20);
      activeInjuries.forEach(i => {
        factors.push(`Unresolved ${i.severity} injury: ${i.injury_type} (${i.body_part})`);
      });
    }
    
    // Check if recent video reports has poor movement scores
    if (profile?.videos && profile.videos.length > 0) {
      const latestAnalyzed = [...profile.videos]
        .filter(v => v.status === 'analyzed')
        .sort((a,b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))[0];
      if (latestAnalyzed && latestAnalyzed.movement_score < 80) {
        score += 20;
        factors.push(`Postural asymmetry detected (Kinematic grade: ${latestAnalyzed.movement_score}/100)`);
      }
    }
    
    const finalScore = Math.min(score, 95);
    let level = 'Low';
    let color = 'var(--color-success)';
    let rehab = ["Maintain baseline loading", "10 min dynamic warmups", "Active cooldowns"];
    
    if (finalScore > 60) {
      level = 'High';
      color = 'var(--color-danger)';
      rehab = [
        "Reduce training volume by 40%",
        "Focus on unilateral joint stabilizers (single-leg bridges)",
        "Daily physical checkup with Head Therapist",
        "Schedule complete rest day"
      ];
    } else if (finalScore > 30) {
      level = 'Medium';
      color = 'var(--color-warning)';
      rehab = [
        "De-load weekly training volume by 15%",
        "Integrate core stability checkups (birddogs, planks)",
        "Targeted joint mobility exercises",
        "Post-workout hot/cold contrast baths"
      ];
    }
    
    return {
      score: Math.round(finalScore),
      level,
      color,
      factors: factors.length > 0 ? factors : ["No critical biomechanical risk factors flagged."],
      rehab
    };
  };

  const fallbackRiskMetrics = calculateInjuryRiskScore();
  const riskMetrics = assessment ? {
    score: Math.round(assessment.injury_risk_score),
    level: assessment.risk_category,
    color: assessment.risk_category === 'Critical' || assessment.risk_category === 'High' ? 'var(--color-danger)' : assessment.risk_category === 'Moderate' ? 'var(--color-warning)' : 'var(--color-success)',
    factors: assessment.explanation ? [assessment.explanation] : [],
    rehab: assessment.recommendations.map(item => item.recommendation),
  } : fallbackRiskMetrics;

  const getTopLoads = () => {
    return [...trainingLogs].slice(0, 7).reverse();
  };

  const topLoads = getTopLoads();
  const maxLoadVal = topLoads.length > 0 ? Math.max(...topLoads.map(l => l.calculated_load), 100) : 100;

  return (
    <div>
      {/* Staff directory selector card */}
      {!isAthlete && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--color-secondary)' }}>Athlete Registry Portal</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff view: monitoring client statistics, workload factors, and logs.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Select Athlete:</span>
              <select
                className="form-select"
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value))}
                style={{ minWidth: '240px' }}
              >
                {athletesList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.user?.full_name} ({a.sport || 'Unspecified'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', marginBottom: '2rem', gap: '1rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('profile')} 
          className="btn" 
          style={{ 
            background: 'transparent', 
            color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : 'none',
            borderRadius: 0, padding: '0.75rem 1rem' 
          }}
        >
          👤 Profile Overview
        </button>
        <button 
          onClick={() => setActiveTab('training')} 
          className="btn" 
          style={{ 
            background: 'transparent', 
            color: activeTab === 'training' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'training' ? '2px solid var(--color-primary)' : 'none',
            borderRadius: 0, padding: '0.75rem 1rem' 
          }}
        >
          🏋 Training Load
        </button>
        <button 
          onClick={() => setActiveTab('injuries')} 
          className="btn" 
          style={{ 
            background: 'transparent', 
            color: activeTab === 'injuries' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'injuries' ? '2px solid var(--color-primary)' : 'none',
            borderRadius: 0, padding: '0.75rem 1rem' 
          }}
        >
          🩹 Injury Records
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          className="btn" 
          style={{ 
            background: 'transparent', 
            color: activeTab === 'analytics' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--color-primary)' : 'none',
            borderRadius: 0, padding: '0.75rem 1rem' 
          }}
        >
          📊 Risk & Biomechanics
        </button>
        {isAdminOrCoach && (
          <button 
            onClick={() => setActiveTab('admin')} 
            className="btn" 
            style={{ 
              background: 'transparent', 
              color: activeTab === 'admin' ? 'var(--color-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'admin' ? '2px solid var(--color-primary)' : 'none',
              borderRadius: 0, padding: '0.75rem 1rem' 
            }}
          >
            ⚙ Admin Telemetry
          </button>
        )}
      </div>

      {/* Notifications and messages */}
      {errorMsg && (
        <div style={{ backgroundColor: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--color-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ backgroundColor: 'rgba(14, 219, 137, 0.1)', border: '1px solid rgba(14, 219, 137, 0.2)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {successMsg}
        </div>
      )}

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Synchronizing profile variables...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: PROFILE SUMMARY */}
          {activeTab === 'profile' && (
            <div className="dashboard-grid">
              <div className="dashboard-side">
                <div className="card profile-header-card">
                  <div className="profile-avatar">
                    {profile?.user?.full_name?.charAt(0) || 'A'}
                  </div>
                  <h3>{profile?.user?.full_name || 'Athlete Profile'}</h3>
                  <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {profile?.sport || 'Unassigned Sport'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                    "{profile?.bio || 'No biography written.'}"
                  </p>

                  <div className="profile-stat-row">
                    <div className="profile-stat-box">
                      <div className="profile-stat-val">{profile?.height_cm ? `${profile.height_cm} cm` : '--'}</div>
                      <div className="profile-stat-lbl">Height</div>
                    </div>
                    <div className="profile-stat-box" style={{ borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
                      <div className="profile-stat-val">{profile?.weight_kg ? `${profile.weight_kg} kg` : '--'}</div>
                      <div className="profile-stat-lbl">Weight</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className="profile-stat-val">
                        {profile?.date_of_birth ? 
                          (new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()) : '--'
                        }
                      </div>
                      <div className="profile-stat-lbl">Age</div>
                    </div>
                  </div>

                  {isAthlete && !editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="btn btn-secondary"
                      style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.8rem' }}
                    >
                      Update Profile Statistics
                    </button>
                  )}
                </div>
              </div>

              <div className="dashboard-main">
                {editingProfile ? (
                  <div className="card">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Update Characteristics</h3>
                    <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label">Sport Category</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profileForm.sport}
                          onChange={(e) => setProfileForm({ ...profileForm, sport: e.target.value })}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Height (cm)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={profileForm.height_cm}
                            onChange={(e) => setProfileForm({ ...profileForm, height_cm: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Weight (kg)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={profileForm.weight_kg}
                            onChange={(e) => setProfileForm({ ...profileForm, weight_kg: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          className="form-input"
                          value={profileForm.date_of_birth}
                          onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Biography Details</label>
                        <textarea
                          className="form-textarea"
                          rows="3"
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                        <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.2rem' }}>Performance File Profile</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Summary details registered for this athlete's recovery dossier.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong>Full Name:</strong>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>{profile?.user?.full_name}</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <strong>Email Address:</strong>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>{profile?.user?.email}</p>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                      <h4>Download Performance Reports</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Export comprehensive logs, recovery timelines, and injury warning metrics.</p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <a 
                          href={reportAPI.getCSVDownloadUrl(profile.id)} 
                          download 
                          className="btn btn-secondary" 
                          style={{ borderColor: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          📥 Export Excel (CSV)
                        </a>
                        <a 
                          href={reportAPI.getHTMLDownloadUrl(profile.id)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ borderColor: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          📄 Export Printable Report (HTML/PDF)
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TRAINING LOAD LOGS */}
          {activeTab === 'training' && (
            <div className="dashboard-grid">
              <div className="dashboard-side">
                <div className="card">
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Log Training load</h3>
                  <form onSubmit={handleTrainingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Activity Type</label>
                      <input
                        type="text"
                        className="form-input"
                        value={trainingForm.activity_type}
                        onChange={(e) => setTrainingForm({ ...trainingForm, activity_type: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Duration (Min)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={trainingForm.duration_minutes}
                          onChange={(e) => setTrainingForm({ ...trainingForm, duration_minutes: Number(e.target.value) })}
                          min="1"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">RPE Rating (1-10)</label>
                        <select
                          className="form-select"
                          value={trainingForm.rpe}
                          onChange={(e) => setTrainingForm({ ...trainingForm, rpe: Number(e.target.value) })}
                        >
                          {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} - {
                              i < 2 ? 'Easy' : i < 5 ? 'Moderate' : i < 7 ? 'Hard' : 'Max Effort'
                            }</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Activity Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={trainingForm.date}
                        onChange={(e) => setTrainingForm({ ...trainingForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Session Notes</label>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        value={trainingForm.notes}
                        onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                        placeholder="Metrics focus, lifting set parameters..."
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Session</button>
                  </form>
                </div>
              </div>

              <div className="dashboard-main">
                <div className="card">
                  <h3 style={{ marginBottom: '0.2rem' }}>Training Load Timeline (Last 7 Sessions)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Visual load index distribution (Duration × RPE).</p>
                  
                  {topLoads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      No training logs found. Start submitting sessions to plot charts.
                    </div>
                  ) : (
                    <div className="chart-container">
                      {topLoads.map((load, idx) => {
                        const pct = (load.calculated_load / maxLoadVal) * 80;
                        return (
                          <div key={load.id || idx} className="chart-bar-wrapper">
                            <div className="chart-tooltip">
                              <strong>{load.calculated_load}</strong> ({load.duration_minutes}m × RPE {load.rpe})
                            </div>
                            <div className="chart-bar" style={{ height: `${Math.max(pct, 5)}%` }} />
                            <div className="chart-label">
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{load.activity_type}</div>
                              <div style={{ fontSize: '0.65rem' }}>{new Date(load.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Tabular Activity Logs</h3>
                  {trainingLogs.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No historical logs available.</p>
                  ) : (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Activity</th>
                            <th>Duration</th>
                            <th>RPE</th>
                            <th>Calculated Load</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trainingLogs.map(log => (
                            <tr key={log.id}>
                              <td>{log.date}</td>
                              <td style={{ fontWeight: 600 }}>{log.activity_type}</td>
                              <td>{log.duration_minutes} mins</td>
                              <td>{log.rpe}/10</td>
                              <td style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{log.calculated_load}</td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.notes || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INJURY LOGS */}
          {activeTab === 'injuries' && (
            <div className="dashboard-grid">
              <div className="dashboard-side">
                <div className="card">
                  <h3 style={{ marginBottom: '1rem', color: 'var(--color-warning)' }}>Add Injury Record</h3>
                  <form onSubmit={handleInjurySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Injury Type</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Tendinitis"
                        value={injuryForm.injury_type}
                        onChange={(e) => setInjuryForm({ ...injuryForm, injury_type: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Affected Body Part</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Left Achilles"
                        value={injuryForm.body_part}
                        onChange={(e) => setInjuryForm({ ...injuryForm, body_part: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Severity</label>
                        <select
                          className="form-select"
                          value={injuryForm.severity}
                          onChange={(e) => setInjuryForm({ ...injuryForm, severity: e.target.value })}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Recovery Status</label>
                        <select
                          className="form-select"
                          value={injuryForm.status}
                          onChange={(e) => setInjuryForm({ ...injuryForm, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="rehab">Rehabilitation</option>
                          <option value="recovered">Recovered</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Occurrence Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={injuryForm.occurrence_date}
                        onChange={(e) => setInjuryForm({ ...injuryForm, occurrence_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Therapy Notes</label>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        value={injuryForm.notes}
                        onChange={(e) => setInjuryForm({ ...injuryForm, notes: e.target.value })}
                        placeholder="Clinical assessment notes..."
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--color-warning)' }}>
                      Add Injury Record
                    </button>
                  </form>
                </div>
              </div>

              <div className="dashboard-main">
                <div className="card">
                  <h3 style={{ marginBottom: '1rem' }}>Injury Records & History</h3>
                  {injuries.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No injury records logged for this athlete profile.</p>
                  ) : (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Injury Description</th>
                            <th>Severity</th>
                            <th>Recovery Status</th>
                            <th>Therapy Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {injuries.map(inj => (
                            <tr key={inj.id}>
                              <td>{inj.occurrence_date}</td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{inj.injury_type}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inj.body_part}</div>
                              </td>
                              <td>
                                <span className={`badge badge-${inj.severity.toLowerCase()}`}>
                                  {inj.severity}
                                </span>
                              </td>
                              <td>
                                <span className={`badge badge-${inj.status.toLowerCase()}`}>
                                  {inj.status}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inj.notes || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BIOMECHANICS & RISK ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="dashboard-grid">
              
              {/* Left Column: Injury Risk Gauge Card */}
              <div className="dashboard-side">
                <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>ML Injury Risk Grade</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '-1rem' }}>Explainable analytical estimate — not a medical diagnosis.</p>
                  
                  {/* Visual Circular Risk Score Meter */}
                  <div style={{
                    width: '130px', height: '130px',
                    borderRadius: '50%',
                    border: `6px solid ${riskMetrics.color}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: `0 0 15px ${riskMetrics.color}33`
                  }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{riskMetrics.score}%</span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Risk Index</span>
                  </div>

                  <div className={`badge badge-${riskMetrics.level.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderRadius: '20px' }}>
                    Risk Category: {riskMetrics.level}
                  </div>

                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', textAlign: 'left' }}>
                    <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Primary Risk Factors:</strong>
                    <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {riskMetrics.factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: ACWR status meter and recommendations */}
                <div className="dashboard-main">
                  {loadingAssessment ? (
                    <div className="card"><p style={{ color: 'var(--text-muted)' }}>Updating intelligence assessment…</p></div>
                  ) : assessment && (
                    <>
                      <div className="card">
                        <h3>Assessment Scorecard</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                          {[['Movement Quality', assessment.movement_quality_score], ['Biomechanical Efficiency', assessment.biomechanical_efficiency_score], ['Fatigue Risk', assessment.fatigue_risk_score], ['Athlete Health', assessment.health_score]].map(([label, value]) => (
                            <div key={label} style={{ border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div><strong>{Math.round(value)}/100</strong></div>
                          ))}
                        </div>
                        <h4 style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Transparent weighted contributors</h4>
                        {Object.entries(assessment.scoring_breakdown.components).map(([key, item]) => <div key={key} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{key.replaceAll('_', ' ')}: {item.raw_risk_score}/100 × {item.weight_pct}% = <strong>{item.weighted_contribution}</strong></div>)}
                      </div>
                      <div className="card">
                        <h3>Detected Movement Anomalies</h3>
                        {assessment.anomalies.length ? assessment.anomalies.map(item => <div key={item.id} style={{ marginTop: '0.7rem', fontSize: '0.82rem' }}><strong>{item.anomaly_type.replaceAll('_', ' ')}</strong> · {item.severity} · {item.body_region}<br/><span style={{ color: 'var(--text-muted)' }}>{item.explanation} Recommended: {item.recommended_action}</span></div>) : <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No supported anomalies were detected in the available analysis.</p>}
                      </div>
                    </>
                  )}
                
                {/* ACWR visual breakdown */}
                <div className="card">
                  <h3>Acute-to-Chronic Workload Ratio (ACWR)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Monitors training spikes comparing last 7 days vs 28 days workloads.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acute (7-day)</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{acwrMetrics.acute}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chronic (28-day)</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{acwrMetrics.chronic}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACWR Ratio</span>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: acwrMetrics.color }}>{acwrMetrics.acwr}</p>
                    </div>
                  </div>

                  {/* Horizontal gauge indicating Sweet Spot */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      <span>0.0 (Under-conditioned)</span>
                      <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>0.8 - 1.3 (Sweet Spot)</span>
                      <span>1.5+ (Overtrained Danger)</span>
                    </div>
                    
                    {/* Gauge Bar */}
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative' }}>
                      {/* Sweet spot marker background overlay */}
                      <div style={{ position: 'absolute', left: '40%', right: '35%', top: 0, bottom: 0, background: 'rgba(14, 219, 137, 0.2)' }} />
                      
                      {/* Active indicator node */}
                      <div style={{
                        position: 'absolute',
                        left: `${Math.min((acwrMetrics.acwr / 2.0) * 100, 98)}%`,
                        top: '-4px', width: '16px', height: '16px',
                        borderRadius: '50%', background: acwrMetrics.color,
                        border: '2px solid #fff',
                        boxShadow: `0 0 10px ${acwrMetrics.color}`,
                        transition: 'left 0.5s ease'
                      }} />
                    </div>
                    
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
                      Calculated Status: <strong style={{ color: acwrMetrics.color }}>{acwrMetrics.status}</strong>
                    </p>
                  </div>
                </div>

                {/* Recommendations Engine Card */}
                <div className="card" style={{ borderLeft: `4px solid ${riskMetrics.color}` }}>
                  <h3>Rehabilitation & Workload Recommendations</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Personalized exercises and active recovery guidelines generated based on risk metrics.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {riskMetrics.rehab.map((ex, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-glass)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', gap: '0.75rem', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>🎯</span>
                        <span style={{ fontSize: '0.85rem' }}>{ex}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ADMIN / STAFF SYSTEM TELEMETRY */}
          {activeTab === 'admin' && isAdminOrCoach && (
            <div className="dashboard-main">
              <div className="card">
                <h3>Global Administrative Telemetry</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Summarizing active users, video pipelines processing loads, and critical alarms.</p>

                {loadingAdmin ? (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ display: 'inline-block', width: '25px', height: '25px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : adminStats ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Registered Users</span>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{adminStats.total_users}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Athletes</span>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.25rem' }}>{adminStats.total_athletes}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Video Vault Files</span>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '0.25rem' }}>{adminStats.total_videos} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>({adminStats.analyzed_videos} analyzed)</span></p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)', borderColor: adminStats.critical_injury_alerts > 0 ? 'var(--color-danger)' : 'var(--border-glass)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Critical Injury Alerts</span>
                      <p style={{ fontSize: '2rem', fontWeight: 800, color: adminStats.critical_injury_alerts > 0 ? 'var(--color-danger)' : 'var(--color-success)', marginTop: '0.25rem' }}>{adminStats.critical_injury_alerts}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Metrics could not be read.</p>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Dashboard;
