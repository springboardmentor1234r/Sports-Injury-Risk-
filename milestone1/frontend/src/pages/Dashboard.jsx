import React, { useState, useEffect } from 'react';
import { 
  User, LogOut, Sun, Moon, Activity, ChevronDown, Settings, 
  Video, Calendar, Heart, Shield, Users, BarChart2, FileText, GitPullRequest, Database,
  Plus, CheckCircle2, ShieldAlert, Award, FileSpreadsheet, Eye, UserCheck, RefreshCw, Cpu
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ user, token, logout, theme, toggleTheme }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Athlete Profile States
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  
  // Dynamic Lists for Athlete settings / questionnaire
  const [coachesList, setCoachesList] = useState([]);
  const [physiosList, setPhysiosList] = useState([]);
  
  // Assigned athletes list for Coach / Physio
  const [assignedAthletes, setAssignedAthletes] = useState([]);
  const [loadingAthletes, setLoadingAthletes] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  
  // Scientist Platform-wide metrics
  const [allAthletesAnonymized, setAllAthletesAnonymized] = useState([]);
  const [loadingAnonymized, setLoadingAnonymized] = useState(false);
  
  // Form input states
  const [sportType, setSportType] = useState('');
  const [position, setPosition] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [injuryHistory, setInjuryHistory] = useState('');
  const [trainingLoad, setTrainingLoad] = useState('');
  const [assignedCoach, setAssignedCoach] = useState('');
  const [assignedPhysio, setAssignedPhysio] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch contextual role-specific metrics
  useEffect(() => {
    if (user && token) {
      if (user.role === 'Athlete') {
        fetchAthleteProfile();
        fetchCoachesAndPhysios();
      } else if (user.role === 'Coach' || user.role === 'Physiotherapist') {
        fetchAssignedAthletes();
      } else if (user.role === 'Sports Scientist') {
        fetchAnonymizedAthletes();
      }
    }
  }, [user, token]);

  // Set default selected athlete for coach / physio
  useEffect(() => {
    if (assignedAthletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(assignedAthletes[0].athlete_id);
    }
  }, [assignedAthletes, selectedAthleteId]);

  const selectedAthlete = assignedAthletes.find(a => a.athlete_id === selectedAthleteId);

  const fetchAthleteProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/athlete-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) {
        setShowQuestionnaire(true);
        setAthleteProfile(null);
      } else if (response.ok) {
        const data = await response.json();
        setAthleteProfile(data);
        setShowQuestionnaire(false);
        // Prepopulate form states
        setSportType(data.sport_type);
        setPosition(data.position);
        setAge(data.age);
        setHeight(data.height);
        setWeight(data.weight);
        setInjuryHistory(data.injury_history);
        setTrainingLoad(data.training_load);
        setAssignedCoach(data.assigned_coach || '');
        setAssignedPhysio(data.assigned_physio || '');
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchCoachesAndPhysios = async () => {
    try {
      const cRes = await fetch('http://localhost:8000/api/users/coaches');
      if (cRes.ok) {
        const coaches = await cRes.json();
        setCoachesList(coaches);
      }
      
      const pRes = await fetch('http://localhost:8000/api/users/physiotherapists');
      if (pRes.ok) {
        const physios = await pRes.json();
        setPhysiosList(physios);
      }
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  const fetchAssignedAthletes = async () => {
    setLoadingAthletes(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/my-athletes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignedAthletes(data);
      }
    } catch (err) {
      console.error("Error loading assigned athletes:", err);
    } finally {
      setLoadingAthletes(false);
    }
  };

  const fetchAnonymizedAthletes = async () => {
    setLoadingAnonymized(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/all-athletes-anonymized', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAllAthletesAnonymized(data);
      }
    } catch (err) {
      console.error("Error loading scientist data:", err);
    } finally {
      setLoadingAnonymized(false);
    }
  };

  const handleQuestionnaireSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    const payload = {
      sport_type: sportType,
      position: position,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      injury_history: injuryHistory,
      training_load: trainingLoad,
      assigned_coach: assignedCoach || null,
      assigned_physio: assignedPhysio || null
    };

    try {
      const response = await fetch('http://localhost:8000/api/users/athlete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to submit questionnaire.");
      }
      setAthleteProfile(data);
      setShowQuestionnaire(false);
      setSuccessMsg("Athlete profile created successfully!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const payload = {
      sport_type: sportType,
      position: position,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      injury_history: injuryHistory,
      training_load: trainingLoad,
      assigned_coach: assignedCoach || null,
      assigned_physio: assignedPhysio || null
    };

    try {
      const response = await fetch('http://localhost:8000/api/users/athlete-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to update profile.");
      }
      setAthleteProfile(data);
      setSuccessMsg("Physical metrics updated successfully!");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderAthleteSelector = () => {
    if (assignedAthletes.length === 0) return null;
    return (
      <div className="athlete-select-bar animate-fade-in">
        <label htmlFor="active-athlete-select">Viewing Profile For:</label>
        <select 
          id="active-athlete-select" 
          value={selectedAthleteId} 
          onChange={(e) => setSelectedAthleteId(e.target.value)}
          className="form-select athlete-active-dropdown"
        >
          {assignedAthletes.map((ath) => (
            <option key={ath.athlete_id} value={ath.athlete_id}>
              {ath.fullname} ({ath.athlete_id})
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Switch role configuration for tabs and colors
  const getRoleConfig = (role) => {
    switch (role) {
      case 'Athlete':
        return {
          themeColor: 'role-athlete',
          badgeText: 'Athlete',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: User },
            { id: 'InjuryRisk', label: 'Injury Risk Score', icon: ShieldAlert },
            { id: 'MovementAnalysis', label: 'Movement Analysis', icon: Video },
            { id: 'Progress', label: 'Progress Tracking', icon: Calendar },
            { id: 'ExerciseRecs', label: 'Exercise Recommendations', icon: Heart },
            { id: 'Performance', label: 'Performance Trends', icon: BarChart2 },
            { id: 'Settings', label: 'Profile Settings', icon: Settings },
          ]
        };
      case 'Coach':
        return {
          themeColor: 'role-coach',
          badgeText: 'Coach / Trainer',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: Users },
            { id: 'TeamRisk', label: 'Team Risk Overview', icon: ShieldAlert },
            { id: 'AthletePerf', label: 'Athlete Performance', icon: BarChart2 },
            { id: 'MovementQuality', label: 'Movement Quality', icon: Video },
            { id: 'TrainingRecs', label: 'Training Recommendations', icon: Calendar },
          ]
        };
      case 'Physiotherapist':
        return {
          themeColor: 'role-physio',
          badgeText: 'Physiotherapist',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: Heart },
            { id: 'RehabTracking', label: 'Rehabilitation Tracking', icon: UserCheck },
            { id: 'InjuryMonitoring', label: 'Injury Risk Monitoring', icon: ShieldAlert },
            { id: 'MovementCorrection', label: 'Movement Correction', icon: Video },
            { id: 'RecoveryReports', label: 'Recovery Reports', icon: FileText },
          ]
        };
      case 'Sports Scientist':
        return {
          themeColor: 'role-scientist',
          badgeText: 'Sports Scientist',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: Database },
            { id: 'Biomechanical', label: 'Biomechanical Analytics', icon: GitPullRequest },
            { id: 'TeamTrends', label: 'Team Performance Trends', icon: BarChart2 },
            { id: 'InjuryPrediction', label: 'Injury Prediction Insights', icon: Cpu },
            { id: 'ResearchReports', label: 'Research Reports', icon: FileSpreadsheet },
          ]
        };
      case 'Administrator':
        return {
          themeColor: 'role-admin',
          badgeText: 'Administrator',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: Shield },
            { id: 'UserManagement', label: 'User Management', icon: Users },
            { id: 'PlatformAnalytics', label: 'Platform Analytics', icon: BarChart2 },
            { id: 'SystemMonitoring', label: 'System Monitoring', icon: Cpu },
            { id: 'ReportManagement', label: 'Report Management', icon: FileText },
          ]
        };
      default:
        return {
          themeColor: 'role-athlete',
          badgeText: 'User',
          navItems: [
            { id: 'Overview', label: 'Dashboard Overview', icon: User },
          ]
        };
    }
  };

  const config = getRoleConfig(user.role);
  const NavIconComponent = (icon) => React.createElement(icon, { size: 20, className: "nav-item-icon" });

  return (
    <div className={`dashboard-container ${config.themeColor}`}>
      {/* Sidebar navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Activity size={24} />
          </div>
          <span className="brand-name">SIRD System</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation Menu</div>
          <ul>
            {config.navItems.map((item) => (
              <li 
                key={item.id} 
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                style={showQuestionnaire ? { opacity: 0.5, pointerEvents: 'none' } : {}}
              >
                <button 
                  onClick={() => {
                    if (!showQuestionnaire) {
                      setActiveTab(item.id);
                      setErrorMsg('');
                      setSuccessMsg('');
                    }
                  }}
                  className="nav-item-button"
                  disabled={showQuestionnaire}
                >
                  {NavIconComponent(item.icon)}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar settings footer */}
        <div className="sidebar-settings-footer">
          <div className="theme-setting-container">
            <span className="setting-label">Theme Mode</span>
            <button className="theme-switch-toggle" onClick={toggleTheme} aria-label="Toggle theme mode">
              <span className={`toggle-slider ${theme === 'dark' ? 'dark-active' : ''}`}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main dashboard content area */}
      <div className="dashboard-main">
        {/* Top bar header */}
        <header className="dashboard-topbar">
          <div className="topbar-welcome">
            <span className="welcome-role">{config.badgeText} Workspace</span>
          </div>

          <div className="topbar-actions">
            {/* Profile Dropdown */}
            <div className="profile-dropdown-container">
              <button 
                className={`profile-trigger ${profileOpen ? 'active' : ''}`} 
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="avatar-circle">
                  {user.fullname ? user.fullname.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
                <div className="profile-trigger-info">
                  <span className="trigger-name">{user.fullname}</span>
                  <span className="trigger-role">{user.role}</span>
                </div>
                <ChevronDown size={16} className={`chevron-icon ${profileOpen ? 'rotate' : ''}`} />
              </button>

              {profileOpen && (
                <>
                  <div className="dropdown-overlay" onClick={() => setProfileOpen(false)} />
                  <div className="profile-dropdown-menu animate-scale-in">
                    <div className="dropdown-user-details">
                      <span className="details-name">{user.fullname}</span>
                      <span className="details-email">{user.email}</span>
                      <span className={`role-badge ${config.themeColor}`}>{user.role}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-logout-btn" onClick={logout}>
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="dashboard-content">
          {successMsg && (
            <div className="dashboard-success-banner animate-scale-in">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="dashboard-error-banner animate-scale-in">
              <ShieldAlert size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadingProfile ? (
            <div className="dashboard-loading">
              <div className="loading-spinner"></div>
              <p>Loading your profile metrics...</p>
            </div>
          ) : showQuestionnaire ? (
            /* Mandatory Athlete Questionnaire Form */
            <div className="content-hero-card questionnaire-card animate-fade-in">
              <div className="hero-accent-strip" />
              <div className="form-header">
                <h2>Athlete Physical Questionnaire</h2>
                <p>Welcome to SIRD! Please complete your physical credentials to unlock your injury analytics dashboard.</p>
              </div>

              <form onSubmit={handleQuestionnaireSubmit} className="questionnaire-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Sport Type *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Soccer, Basketball, Athletics" 
                      value={sportType} 
                      onChange={(e) => setSportType(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Playing Position *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Forward, Midfielder, Point Guard" 
                      value={position} 
                      onChange={(e) => setPosition(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>Age (years) *</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 23" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      required 
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Height (cm) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 182.5" 
                      value={height} 
                      onChange={(e) => setHeight(e.target.value)} 
                      required 
                      min="10"
                    />
                  </div>

                  <div className="form-group">
                    <label>Weight (kg) *</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 78.2" 
                      value={weight} 
                      onChange={(e) => setWeight(e.target.value)} 
                      required 
                      min="10"
                    />
                  </div>

                  <div className="form-group">
                    <label>Weekly Training Load *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 12 hours/week, High intensity" 
                      value={trainingLoad} 
                      onChange={(e) => setTrainingLoad(e.target.value)} 
                      required 
                    />
                  </div>

                  {/* Dropdown Selectors for seeded / custom Coaches and Physios */}
                  <div className="form-group">
                    <label>Assign Coach</label>
                    <select value={assignedCoach} onChange={(e) => setAssignedCoach(e.target.value)} className="form-select">
                      <option value="">-- No Coach Selected --</option>
                      {coachesList.map((c) => (
                        <option key={c.email} value={c.fullname}>{c.fullname}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Assign Physiotherapist</label>
                    <select value={assignedPhysio} onChange={(e) => setAssignedPhysio(e.target.value)} className="form-select">
                      <option value="">-- No Physiotherapist Selected --</option>
                      {physiosList.map((p) => (
                        <option key={p.email} value={p.fullname}>{p.fullname}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Injury History log *</label>
                  <textarea 
                    rows="3" 
                    placeholder="Provide details of any past operations, sprains, or recurring issues (e.g. ACL tear in 2024, Left Ankle Sprain)" 
                    value={injuryHistory} 
                    onChange={(e) => setInjuryHistory(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="form-submit-btn" disabled={submitting}>
                  {submitting ? 'Submitting Details...' : 'Save Profile & Open Dashboard'}
                </button>
              </form>
            </div>
          ) : (
            /* Regular Dashboards Content */
            <>
              {/* ATHLETE VIEWS */}
              {user.role === 'Athlete' && athleteProfile && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Welcome back, {user.fullname}!</h2>
                      <p className="workspace-desc">Your biomechanics and injury metrics summary are listed below.</p>
                      
                      <div className="metrics-grid">
                        <div className="metric-card">
                          <span className="metric-label">Athlete ID</span>
                          <span className="metric-value id-badge">{athleteProfile.athlete_id}</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Sport Type</span>
                          <span className="metric-value">{athleteProfile.sport_type}</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Position</span>
                          <span className="metric-value">{athleteProfile.position}</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Age</span>
                          <span className="metric-value">{athleteProfile.age} yrs</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Height</span>
                          <span className="metric-value">{athleteProfile.height} cm</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Weight</span>
                          <span className="metric-value">{athleteProfile.weight} kg</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Assigned Coach</span>
                          <span className="metric-value practitioner-val">{athleteProfile.assigned_coach || 'Not Assigned'}</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Assigned Physio</span>
                          <span className="metric-value practitioner-val">{athleteProfile.assigned_physio || 'Not Assigned'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'InjuryRisk' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Injury Risk Score</h2>
                      <div className="placeholder-tab-content">
                        <div className="risk-score-circle">
                          <span className="risk-percentage">18%</span>
                          <span className="risk-level">Low Risk</span>
                        </div>
                        <p className="placeholder-tab-text">Athlete Injury Risk Score Workspace. Joint strain analysis is within optimal limits.</p>
                        <span className="milestone-badge">Milestone 1 Active</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'MovementAnalysis' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Movement Analysis Reports</h2>
                      <div className="placeholder-tab-content">
                        <Video size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Movement Analysis Reports Workspace. Currently showing blank logs.</p>
                        <span className="milestone-badge">Milestone 2 Feature Placeholder</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Progress' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Progress Tracking</h2>
                      <div className="placeholder-tab-content">
                        <Calendar size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Progress Tracking Workspace. Currently showing blank workload logs.</p>
                        <span className="milestone-badge">Milestone 2 Feature Placeholder</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ExerciseRecs' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Exercise Recommendations</h2>
                      <div className="placeholder-tab-content">
                        <Heart size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Exercise Recommendations Workspace. Target workouts will appear here.</p>
                        <span className="milestone-badge">Milestone 2 Feature Placeholder</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Performance' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Performance Trends</h2>
                      <div className="placeholder-tab-content">
                        <BarChart2 size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Performance Trends Workspace. Currently showing blank charts.</p>
                        <span className="milestone-badge">Milestone 2 Feature Placeholder</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Settings' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Profile Settings</h2>
                      <p className="workspace-desc">Edit and update your physical and practitioner parameters below.</p>

                      <form onSubmit={handleProfileUpdate} className="settings-form">
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Sport Type</label>
                            <input type="text" value={sportType} onChange={(e) => setSportType(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Playing Position</label>
                            <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Age (years)</label>
                            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required min="1" />
                          </div>
                          <div className="form-group">
                            <label>Height (cm)</label>
                            <input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} required min="10" />
                          </div>
                          <div className="form-group">
                            <label>Weight (kg)</label>
                            <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} required min="10" />
                          </div>
                          <div className="form-group">
                            <label>Weekly Training Load</label>
                            <input type="text" value={trainingLoad} onChange={(e) => setTrainingLoad(e.target.value)} required />
                          </div>
                          <div className="form-group">
                            <label>Update Coach</label>
                            <select value={assignedCoach} onChange={(e) => setAssignedCoach(e.target.value)} className="form-select">
                              <option value="">-- No Coach Selected --</option>
                              {coachesList.map((c) => (
                                <option key={c.email} value={c.fullname}>{c.fullname}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Update Physiotherapist</label>
                            <select value={assignedPhysio} onChange={(e) => setAssignedPhysio(e.target.value)} className="form-select">
                              <option value="">-- No Physiotherapist Selected --</option>
                              {physiosList.map((p) => (
                                <option key={p.email} value={p.fullname}>{p.fullname}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-group full-width">
                          <label>Injury History log</label>
                          <textarea rows="3" value={injuryHistory} onChange={(e) => setInjuryHistory(e.target.value)} required />
                        </div>

                        <button type="submit" className="form-submit-btn" disabled={submitting}>
                          {submitting ? 'Saving Metrics...' : 'Update Profile Details'}
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}

              {/* COACH VIEWS */}
              {user.role === 'Coach' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Coach Control Panel</h2>
                      <p className="workspace-desc">Welcome Coach {user.fullname}! Select a tab in the sidebar menu to monitor your roster.</p>
                      
                      <div className="practitioner-stats">
                        <div className="metric-card">
                          <span className="metric-label">My Athletes</span>
                          <span className="metric-value">{assignedAthletes.length} Assigned</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'TeamRisk' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Team Risk Overview</h2>
                      <p className="workspace-desc">Assigned athletes list and dynamic risk scores:</p>
                      
                      {assignedAthletes.length === 0 ? (
                        <p className="no-athletes-msg">No athletes have selected you as their Coach yet.</p>
                      ) : (
                        <table className="athletes-table">
                          <thead>
                            <tr>
                              <th>Athlete ID</th>
                              <th>Name</th>
                              <th>Sport / Position</th>
                              <th>Training Load</th>
                              <th>Risk Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedAthletes.map((ath) => (
                              <tr key={ath.athlete_id}>
                                <td className="id-badge">{ath.athlete_id}</td>
                                <td className="athlete-name">{ath.fullname}</td>
                                <td>{ath.sport_type} ({ath.position})</td>
                                <td>{ath.training_load}</td>
                                <td>
                                  <span className="status-indicator low-risk">Low Risk (18%)</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'AthletePerf' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Athlete Performance Analytics</h2>
                      <p className="workspace-desc">Track and monitor biomechanics metrics over time.</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="detail-header-card">
                            <h3>{selectedAthlete.fullname} - Physical Dimensions</h3>
                            <div className="detail-grid">
                              <div className="detail-item"><strong>Sport Type:</strong> {selectedAthlete.sport_type}</div>
                              <div className="detail-item"><strong>Position:</strong> {selectedAthlete.position}</div>
                              <div className="detail-item"><strong>Age:</strong> {selectedAthlete.age} yrs</div>
                              <div className="detail-item"><strong>Height:</strong> {selectedAthlete.height} cm</div>
                              <div className="detail-item"><strong>Weight:</strong> {selectedAthlete.weight} kg</div>
                              <div className="detail-item"><strong>Load:</strong> {selectedAthlete.training_load}</div>
                            </div>
                          </div>
                          <div className="performance-stats-boxes">
                            <div className="stat-box">
                              <span className="stat-label">Jump Height</span>
                              <span className="stat-value">62 cm</span>
                              <span className="stat-status optimal">Optimal (Top 10%)</span>
                            </div>
                            <div className="stat-box">
                              <span className="stat-label">Sprint Time (40m)</span>
                              <span className="stat-value">4.85 s</span>
                              <span className="stat-status optimal">Stable</span>
                            </div>
                            <div className="stat-box">
                              <span className="stat-label">Aerobic Index</span>
                              <span className="stat-value">VO2 Max 54</span>
                              <span className="stat-status warning">Needs Conditioning</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select an assigned athlete from your team roster.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'MovementQuality' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Movement Quality Reports</h2>
                      <p className="workspace-desc">Computer vision joint angle tracking feedback:</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="joint-angles-card">
                            <h3>Joint Angles Analytics ({selectedAthlete.fullname})</h3>
                            <div className="angles-list">
                              <div className="angle-item">
                                <span className="angle-name">Knee Flexion (Squat)</span>
                                <div className="angle-bar-container"><div className="angle-bar optimal" style={{ width: '85%' }}>124°</div></div>
                                <span className="angle-comment optimal">Optimal</span>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Hip Flexion (Squat)</span>
                                <div className="angle-bar-container"><div className="angle-bar optimal" style={{ width: '78%' }}>92°</div></div>
                                <span className="angle-comment optimal">Optimal</span>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Ankle Dorsiflexion</span>
                                <div className="angle-bar-container"><div className="angle-bar warning" style={{ width: '45%' }}>14°</div></div>
                                <span className="angle-comment warning">Restricted (Tight Calves)</span>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Lateral Hip Drop</span>
                                <div className="angle-bar-container"><div className="angle-bar danger" style={{ width: '25%' }}>6°</div></div>
                                <span className="angle-comment danger">Knee Valgus Risk</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select an assigned athlete from your team roster.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'TrainingRecs' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Training Recommendations</h2>
                      <p className="workspace-desc">Workload safety guidelines and custom drills:</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="recs-card">
                            <h3>Custom Recommendations for {selectedAthlete.fullname}</h3>
                            <div className="rec-list">
                              <div className="rec-item">
                                <strong>Suggested Drill Intensity:</strong> Medium. Limit lateral jumping reps due to ankle restriction.
                              </div>
                              <div className="rec-item">
                                <strong>Rest Interval:</strong> Ensure minimum 48 hours recovery between high-intensity running logs.
                              </div>
                              <div className="rec-item">
                                <strong>Current Sport Target:</strong> Work on {selectedAthlete.sport_type} specific position ({selectedAthlete.position}) patterns.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select an assigned athlete from your team roster.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* PHYSIOTHERAPIST VIEWS */}
              {user.role === 'Physiotherapist' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Physiotherapist Diagnostic Hub</h2>
                      <p className="workspace-desc">Welcome {user.fullname}! Assess joints motion flags and recover records.</p>
                      
                      <div className="practitioner-stats">
                        <div className="metric-card">
                          <span className="metric-label">Active Patients</span>
                          <span className="metric-value">{assignedAthletes.length} Assigned</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'RehabTracking' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Rehabilitation Tracking</h2>
                      <p className="workspace-desc">Assigned patients compliance tracking logs:</p>
                      
                      {assignedAthletes.length === 0 ? (
                        <p className="no-athletes-msg">No athletes have selected you as their Physiotherapist yet.</p>
                      ) : (
                        <table className="athletes-table">
                          <thead>
                            <tr>
                              <th>Athlete ID</th>
                              <th>Name</th>
                              <th>Position</th>
                              <th>Injury Log</th>
                              <th>Rehab Compliance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignedAthletes.map((ath) => (
                              <tr key={ath.athlete_id}>
                                <td className="id-badge">{ath.athlete_id}</td>
                                <td className="athlete-name">{ath.fullname}</td>
                                <td>{ath.position}</td>
                                <td>{ath.injury_history}</td>
                                <td>
                                  <span className="status-indicator rehab-active">Active (85% Compliance)</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'InjuryMonitoring' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Injury Risk Monitoring</h2>
                      <p className="workspace-desc">Diagnostic indicators based on physical metrics:</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="injury-monitoring-card">
                            <h3>Medical Risk Diagnostics ({selectedAthlete.fullname})</h3>
                            <div className="detail-item" style={{ marginBottom: '16px' }}>
                              <strong>Recorded Injury History:</strong> 
                              <p style={{ marginTop: '6px', color: 'var(--text-muted)' }}>{selectedAthlete.injury_history}</p>
                            </div>
                            <div className="monitoring-meters">
                              <div className="meter-row">
                                <span>ACL Tendon Stress</span>
                                <span className="status-indicator low-risk">SAFE</span>
                              </div>
                              <div className="meter-row">
                                <span>Ankle Ligament Load</span>
                                <span className="status-indicator rehab-active">ELEVATED</span>
                              </div>
                              <div className="meter-row">
                                <span>Lumbar Strain</span>
                                <span className="status-indicator low-risk">SAFE</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select a patient from your assigned active lists.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'MovementCorrection' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Movement Correction Analytics</h2>
                      <p className="workspace-desc">Corrective biomechanical tasks and routines:</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="correction-card">
                            <h3>Prescription Corrections for {selectedAthlete.fullname}</h3>
                            <div className="rec-list">
                              <div className="rec-item">
                                <strong>Observation Defect:</strong> Reduced ankle flexion causing minor trunk lean.
                              </div>
                              <div className="rec-item">
                                <strong>Prescription Protocol:</strong> 3 sets of 15 reps calf wall stretches daily.
                              </div>
                              <div className="rec-item">
                                <strong>Active Corrective Drill:</strong> Banded squats for hip abduction correction to limit knee valgus risk.
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select a patient from your assigned active lists.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'RecoveryReports' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Recovery Reports</h2>
                      <p className="workspace-desc">Recovery logs and subjective pain indices:</p>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="recovery-logs-card">
                            <h3>Subjective Recovery Logs ({selectedAthlete.fullname})</h3>
                            <div className="performance-stats-boxes">
                              <div className="stat-box">
                                <span className="stat-label">Pain Index (VAS)</span>
                                <span className="stat-value">2 / 10</span>
                                <span className="stat-status optimal">Minimal Pain</span>
                              </div>
                              <div className="stat-box">
                                <span className="stat-label">Muscle Soreness</span>
                                <span className="stat-value">3 / 10</span>
                                <span className="stat-status optimal">Light Soreness</span>
                              </div>
                              <div className="stat-box">
                                <span className="stat-label">Sleep Quality</span>
                                <span className="stat-value">8 / 10</span>
                                <span className="stat-status optimal">Excellent</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select a patient from your assigned active lists.</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* SPORTS SCIENTIST VIEWS */}
              {user.role === 'Sports Scientist' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Sports Scientist Research Panel</h2>
                      <p className="workspace-desc">Platform-wide anonymized telemetry logs are available for deep learning training.</p>
                      
                      <div className="practitioner-stats">
                        <div className="metric-card">
                          <span className="metric-label">Research Dataset Records</span>
                          <span className="metric-value">{allAthletesAnonymized.length} Athletes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Biomechanical' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Biomechanical Analytics</h2>
                      <p className="workspace-desc">Anonymized Platform-wide data registry:</p>
                      
                      {allAthletesAnonymized.length === 0 ? (
                        <p className="no-athletes-msg">No platform-wide biomechanical datasets loaded yet.</p>
                      ) : (
                        <table className="athletes-table">
                          <thead>
                            <tr>
                              <th>Anonymized ID</th>
                              <th>Sport</th>
                              <th>Age</th>
                              <th>Physical Dimensions</th>
                              <th>Weekly Load</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allAthletesAnonymized.map((ath, i) => (
                              <tr key={i}>
                                <td className="id-badge">{ath.athlete_id}</td>
                                <td>{ath.sport_type} ({ath.position})</td>
                                <td>{ath.age} yrs</td>
                                <td>{ath.height}cm / {ath.weight}kg</td>
                                <td>{ath.training_load}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {activeTab === 'TeamTrends' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Team Performance Trends</h2>
                      <div className="placeholder-tab-content">
                        <BarChart2 size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Team Performance Trends Workspace. Distribution histograms. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'InjuryPrediction' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Injury Prediction Insights</h2>
                      <div className="placeholder-tab-content">
                        <Cpu size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Injury Prediction Insights Workspace. Neural network loss logs. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ResearchReports' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Research Reports</h2>
                      <div className="placeholder-tab-content">
                        <FileSpreadsheet size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Research Reports Workspace. Click to download anonymized database matrices.</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ADMIN VIEWS */}
              {user.role === 'Administrator' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">System Admin Console</h2>
                      <p className="workspace-desc">Perform server maintenance, audit diagnostic endpoints, and control user roles.</p>
                      
                      <div className="practitioner-stats">
                        <div className="metric-card">
                          <span className="metric-label">Database Status</span>
                          <span className="metric-value id-badge">CONNECTED</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'UserManagement' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">User Management</h2>
                      <div className="placeholder-tab-content">
                        <Users size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">User Management Workspace. Global role config tables. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PlatformAnalytics' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Platform Analytics</h2>
                      <div className="placeholder-tab-content">
                        <BarChart2 size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Platform Analytics Workspace. Server throughput workloads. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'SystemMonitoring' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">System Monitoring</h2>
                      <div className="placeholder-tab-content">
                        <Cpu size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">System Monitoring Workspace. CPU / RAM diagnostic telemetry charts. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ReportManagement' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Report Management</h2>
                      <div className="placeholder-tab-content">
                        <FileText size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Report Management Workspace. PDF layout configuration settings. (Milestone 2 placeholder)</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
