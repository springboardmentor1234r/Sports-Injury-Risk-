import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { athleteAPI, injuryAPI, trainingAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Dashboard view selection variables
  const isAthlete = user?.role === 'athlete';
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
        if (isAthlete) {
          // Fetch self
          const profRes = await athleteAPI.getMyProfile();
          setProfile(profRes.data);
          
          const injuryRes = await injuryAPI.getInjuries();
          setInjuries(injuryRes.data);

          const trainRes = await trainingAPI.getTrainingLogs();
          setTrainingLogs(trainRes.data);
        } else if (selectedAthleteId) {
          // Fetch specific athlete (staff access)
          const profRes = await athleteAPI.getSpecificProfile(selectedAthleteId);
          setProfile(profRes.data);
          
          const injuryRes = await injuryAPI.getInjuries(selectedAthleteId);
          setInjuries(injuryRes.data);

          const trainRes = await trainingAPI.getTrainingLogs(selectedAthleteId);
          setTrainingLogs(trainRes.data);
        }
      } catch (err) {
        console.error("Dashboard details loading failed:", err);
        setErrorMsg("Failed to load athlete parameters. Ensure profiles are registered.");
      } finally {
        setLoadingData(false);
      }
    };

    if (isAthlete || selectedAthleteId) {
      fetchDashboardData();
    }
  }, [isAthlete, selectedAthleteId]);

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
      setSuccessMsg('Profile updated successfully.');
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

  // Calculation for custom CSS graph
  const getTopLoads = () => {
    // Return last 7 entries, sorted chronologically for graph plotting
    return [...trainingLogs]
      .slice(0, 7)
      .reverse();
  };

  const topLoads = getTopLoads();
  const maxLoadVal = topLoads.length > 0 ? Math.max(...topLoads.map(l => l.calculated_load), 100) : 100;

  return (
    <div>
      {/* Staff Bar: Select Athlete */}
      {!isAthlete && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--color-secondary)' }}>Athlete Performance Dashboard</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Staff access mode: monitoring athlete metrics and biomechanical inputs.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="form-label" style={{ margin: 0 }}>Active Athlete:</span>
              <select
                className="form-select"
                value={selectedAthleteId || ''}
                onChange={(e) => setSelectedAthleteId(Number(e.target.value))}
                style={{ minWidth: '220px' }}
              >
                {athletesList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.user?.full_name} ({a.sport || 'Unspecified Sport'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Global Alerts */}
      {errorMsg && (
        <div style={{
          backgroundColor: 'rgba(255, 75, 75, 0.1)',
          border: '1px solid rgba(255, 75, 75, 0.2)',
          color: 'var(--color-danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(14, 219, 137, 0.1)',
          border: '1px solid rgba(14, 219, 137, 0.2)',
          color: 'var(--color-success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '2rem'
        }}>
          {successMsg}
        </div>
      )}

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid var(--border-glass)',
            borderTopColor: 'var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Synchronizing profile indexes...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* LEFT SIDEBAR: PROFILE & CONTROLS */}
          <div className="dashboard-side">
            
            {/* Profile Info Card */}
            <div className="card profile-header-card">
              <div className="profile-avatar">
                {profile?.user?.full_name?.charAt(0) || 'A'}
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>{profile?.user?.full_name || 'Athlete Name'}</h3>
              <p style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                {profile?.sport || 'No Sport Designated'}
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
                  style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  Edit Profile Stats
                </button>
              )}
            </div>

            {/* Edit Profile Form Overlay/Section */}
            {isAthlete && editingProfile && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>Update Metrics</h4>
                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Sport</label>
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
                    <label className="form-label">Bio Details</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>Save</button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Log Training Session (Available to athlete or staff coaches) */}
            {(isAthlete || user.role === 'coach' || user.role === 'admin') && (
              <div className="card">
                <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Log Training Load</h4>
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
                      <label className="form-label">RPE (1-10)</label>
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
                    <label className="form-label">Session Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={trainingForm.date}
                      onChange={(e) => setTrainingForm({ ...trainingForm, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      value={trainingForm.notes}
                      onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
                      placeholder="Cardio thresholds, recovery levels..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Load</button>
                </form>
              </div>
            )}
          </div>

          {/* MAIN DASHBOARD PANEL */}
          <div className="dashboard-main">
            
            {/* Visual Training Load Metrics */}
            <div className="card">
              <h3 style={{ marginBottom: '0.2rem' }}>Calculated Training Load (RPE × Duration)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Visual timeline of the 7 most recent athletic activities.</p>
              
              {topLoads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No training records logged yet. Use the sidebar to submit activities and start plotting metrics.
                </div>
              ) : (
                <div className="chart-container">
                  {topLoads.map((load, index) => {
                    const pct = (load.calculated_load / maxLoadVal) * 80; // Scale to max 80% height of chart
                    return (
                      <div key={load.id || index} className="chart-bar-wrapper">
                        <div className="chart-tooltip">
                          <strong>{load.calculated_load}</strong> (RPE {load.rpe} × {load.duration_minutes}m)
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

            {/* Injury Logs & Active Recovery Form Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
              
              {/* Injury List */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Injury Log & Recovery Timeline</h3>
                
                {injuries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>No historical injury records found. Excellent!</p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Injury / Region</th>
                          <th>Severity</th>
                          <th>Status</th>
                          <th>Notes</th>
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

              {/* Log Injury Form (Physiotherapist, Admin, Athlete) */}
              {(isAthlete || user.role === 'physiotherapist' || user.role === 'admin') && (
                <div className="card">
                  <h4 style={{ marginBottom: '1rem', color: 'var(--color-warning)' }}>Add Injury Log</h4>
                  <form onSubmit={handleInjurySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div className="form-group">
                      <label className="form-label">Injury Type</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Muscle Tear"
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
                        placeholder="e.g. Right Hamstring"
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
                        placeholder="R.I.C.E protocol, physio exercises..."
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--color-warning)' }}>
                      Record Log
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Full Training Log History */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Detailed Training Activity Logs</h3>
              {trainingLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activity logs recorded.</p>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Duration (Min)</th>
                        <th>RPE Score</th>
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
                          <td>{log.rpe} / 10</td>
                          <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{log.calculated_load}</td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.notes || '--'}</td>
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
    </div>
  );
};

export default Dashboard;
