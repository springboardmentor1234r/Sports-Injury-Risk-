import React, { useState, useEffect, useRef } from 'react';
import { 
  User, LogOut, Sun, Moon, Activity, ChevronDown, Settings, 
  Video, Calendar, Heart, Shield, Users, BarChart2, FileText, GitPullRequest, Database,
  Plus, CheckCircle2, ShieldAlert, Award, FileSpreadsheet, Eye, UserCheck, RefreshCw, Cpu, UploadCloud, PlusCircle, AlertTriangle, TrendingUp, Download, FileDown, Camera, VideoOff, Square, Circle
} from 'lucide-react';
import CustomRecModal from '../components/CustomRecModal';
import NotificationBell from '../components/NotificationBell';
import LiveCameraModal from '../components/LiveCameraModal';
import { BodyHeatmapGraphic, JointAngleRadarChart, RiskTrendAreaChart } from '../components/BiomechanicalCharts';
import './Dashboard.css';

export default function Dashboard({ user, token, logout, theme, toggleTheme }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLiveCameraModalOpen, setIsLiveCameraModalOpen] = useState(false);

  
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
  
  // Latest processed video analysis metrics
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Live Camera Capture States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const cameraVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Milestone 3 & 4 Prediction, Recommendation & System Metrics States
  const [predictionReport, setPredictionReport] = useState(null);
  const [recommendationsData, setRecommendationsData] = useState({ automated: [], coach_custom: [] });
  const [datasetInsights, setDatasetInsights] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);



  
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

  // Fetch latest video analysis & ML predictions for current active athlete
  useEffect(() => {
    if (user && token) {
      if (user.role === 'Athlete' && athleteProfile) {
        fetchLatestAnalysis("me");
        fetchPredictionReport("me");
        fetchRecommendations("me");
      } else if ((user.role === 'Coach' || user.role === 'Physiotherapist') && selectedAthleteId) {
        fetchLatestAnalysis(selectedAthleteId);
        fetchPredictionReport(selectedAthleteId);
        fetchRecommendations(selectedAthleteId);
      } else if (user.role === 'Sports Scientist' || user.role === 'Administrator') {
        fetchDatasetInsights();
        fetchSystemMetrics();
      }
    }
  }, [user, token, athleteProfile, selectedAthleteId]);

  const selectedAthlete = assignedAthletes.find(a => a.athlete_id === selectedAthleteId);

  const downloadPdfReport = (athleteId = 'me') => {
    let targetId = athleteId;
    if (targetId === 'me') {
      if (athleteProfile?.athlete_id) {
        targetId = athleteProfile.athlete_id;
      } else if (selectedAthleteId) {
        targetId = selectedAthleteId;
      } else {
        targetId = 'me';
      }
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${apiBase}/api/reports/pdf/${targetId}?token=${token}`, '_blank');
  };

  const downloadExcelReport = (athleteId = 'me') => {
    let targetId = athleteId;
    if (targetId === 'me') {
      if (athleteProfile?.athlete_id) {
        targetId = athleteProfile.athlete_id;
      } else if (selectedAthleteId) {
        targetId = selectedAthleteId;
      } else {
        targetId = 'me';
      }
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${apiBase}/api/reports/excel/${targetId}?token=${token}`, '_blank');
  };



  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/system/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics(data);
      }
    } catch (err) {
      console.error("Error loading system metrics:", err);
    }
  };


  const fetchPredictionReport = async (athleteId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/predictions/${athleteId}/latest`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPredictionReport(data);
      } else {
        setPredictionReport(null);
      }
    } catch (err) {
      console.error("Error loading ML prediction report:", err);
      setPredictionReport(null);
    }
  };


  const fetchRecommendations = async (athleteId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/recommendations/${athleteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendationsData(data);
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
    }
  };

  const fetchDatasetInsights = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/predictions/insights/dataset-metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDatasetInsights(data);
      }
    } catch (err) {
      console.error("Error loading dataset insights:", err);
    }
  };

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

  const [aiAgentStatus, setAiAgentStatus] = useState(null);

  const testGeminiAgent = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/system/test-gemini');
      const data = await res.json();
      setAiAgentStatus(data);
      if (data.status === 'success') {
        setSuccessMsg(`✅ AI Agent Online! Active Model: ${data.working_model}`);
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLatestAnalysis = async (athleteId) => {

    setLoadingAnalysis(true);
    try {
      const response = await fetch(`http://localhost:8000/api/videos/latest/${athleteId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLatestAnalysis(data);
      } else {
        setLatestAnalysis(null);
      }
    } catch (err) {
      console.error("Error loading video analysis:", err);
      setLatestAnalysis(null);
    } finally {
      setLoadingAnalysis(false);
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
      if (response.status === 401) {
        logout();
        return;
      }
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


  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMsg("Unable to access webcam. Please check device permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
      const stream = cameraVideoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingSeconds(0);
  };

  const startRecording = () => {
    if (!cameraVideoRef.current || !cameraVideoRef.current.srcObject) return;
    const stream = cameraVideoRef.current.srcObject;
    recordedChunksRef.current = [];

    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingAndAnalyze = async () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const liveFile = new File([blob], `live_capture_${Date.now()}.webm`, { type: 'video/webm' });
      await processVideoFile(liveFile);
      stopCamera();
    };

    mediaRecorderRef.current.stop();
  };

  const processVideoFile = async (file) => {
    if (!file) return;
    setUploadingVideo(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("http://localhost:8000/api/videos/upload", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Video processing failed.");
      }
      
      setLatestAnalysis(data);
      setSuccessMsg(`Motion video "${file.name}" processed & analyzed by ML engine!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      
      if (athleteProfile) {
        fetchPredictionReport("me");
        fetchRecommendations("me");
      }
      
      if (user.role === 'Coach' || user.role === 'Physiotherapist') {
        fetchAssignedAthletes();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) await processVideoFile(file);
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
          onChange={(e) => {
            setSelectedAthleteId(e.target.value);
            setLatestAnalysis(null); // Clear previous athlete's analysis to trigger reload
          }}
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
            {/* Notification Bell Component */}
            <NotificationBell token={token} />

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
                    <div className="dashboard-overview-layout">
                      {/* Physical Metrics Card */}
                      <div className="content-hero-card animate-fade-in">
                        <div className="hero-accent-strip" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <div>
                            <h2 className="workspace-title">Welcome back, {user.fullname}!</h2>
                            <p className="workspace-desc">Your biomechanics and injury metrics summary are listed below.</p>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                              onClick={() => downloadPdfReport('me')}
                              className="form-submit-btn"
                              style={{ width: 'auto', padding: '8px 14px', marginTop: 0, backgroundColor: '#0f766e', fontSize: '0.85rem' }}
                            >
                              <FileDown size={16} />
                              <span>Download PDF Report</span>
                            </button>
                            <button 
                              onClick={() => downloadExcelReport('me')}
                              className="form-submit-btn"
                              style={{ width: 'auto', padding: '8px 14px', marginTop: 0, backgroundColor: '#2563eb', fontSize: '0.85rem' }}
                            >
                              <FileSpreadsheet size={16} />
                              <span>Export CSV Data</span>
                            </button>
                          </div>
                        </div>

                        
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

                      {/* Video Upload Dropzone and Latest Assessment Card Panel */}
                      <div className="overview-widgets-row">
                        {/* Video Upload & Live Camera Capture Component */}
                        <div className="content-hero-card video-upload-card animate-fade-in">
                          <div className="hero-accent-strip" />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <h3 style={{ margin: 0 }}>Motion Video Capture & ML Processing</h3>
                              <p className="widget-subtitle-desc" style={{ margin: '4px 0 0 0' }}>Upload a video file OR record a live camera event for real-time biomechanics analysis.</p>
                            </div>
                            <button 
                              onClick={() => setIsLiveCameraModalOpen(true)} 
                              className="form-submit-btn" 
                              style={{ width: 'auto', padding: '8px 16px', margin: 0, backgroundColor: '#10b981', fontSize: '0.85rem' }}
                            >
                              <Camera size={16} />
                              <span>Launch Live Motion Camera</span>
                            </button>

                          </div>

                          {/* Live Camera View Finder */}
                          {isCameraActive ? (
                            <div className="live-camera-viewfinder" style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', marginBottom: '12px' }}>
                              <video ref={cameraVideoRef} autoPlay playsInline style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {isRecording && (
                                  <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Circle size={10} fill="#ffffff" className="pulse-high" />
                                    <span>REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span>
                                  </div>
                                )}
                              </div>

                              <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                {!isRecording ? (
                                  <button 
                                    onClick={startRecording}
                                    style={{ padding: '8px 18px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Circle size={14} fill="white" />
                                    <span>Start Recording Event</span>
                                  </button>
                                ) : (
                                  <button 
                                    onClick={stopRecordingAndAnalyze}
                                    style={{ padding: '8px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    <Square size={14} fill="white" />
                                    <span>Stop & Analyze Motion</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="upload-dropzone">
                              <UploadCloud size={40} className="upload-dropzone-icon" />
                              <p>Drag and drop your file here, or click to browse</p>
                              <input 
                                type="file" 
                                accept="video/*" 
                                onChange={handleVideoUpload} 
                                disabled={uploadingVideo}
                                className="file-input-hidden"
                              />
                            </div>
                          )}

                          {uploadingVideo && (
                            <div className="upload-processing-spinner" style={{ marginTop: '12px' }}>
                              <div className="loading-spinner"></div>
                              <span>Running MediaPipe Pose Estimation & ML Risk Engine...</span>
                            </div>
                          )}
                        </div>


                        {/* Processed Video Outcome Card */}
                        {latestAnalysis ? (
                          <div className="content-hero-card video-analysis-summary-card animate-scale-in">
                            <div className="hero-accent-strip" />
                            <div className="summary-header">
                              <span className="summary-title-label">Latest Assessment Result</span>
                              <h4>{latestAnalysis.filename}</h4>
                              <div className="analysis-id-badge">ID: {latestAnalysis.analysis_id}</div>
                            </div>
                            
                            <div className="outcome-metrics-grid">
                              <div className="outcome-metric-box">
                                <span className="outcome-label">Movement Score</span>
                                <span className="outcome-value score-optimal">{latestAnalysis.scores.movement_quality_score}%</span>
                              </div>
                              <div className="outcome-metric-box">
                                <span className="outcome-label">Injury Risk</span>
                                <span className={`outcome-value ${latestAnalysis.scores.injury_risk_score > 40 ? 'score-warning' : 'score-safe'}`}>
                                  {latestAnalysis.scores.injury_risk_score}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="summary-actions-container">
                              <button onClick={() => setActiveTab('MovementAnalysis')} className="summary-btn btn-primary">
                                <Video size={16} />
                                <span>Analyze Joint Angles</span>
                              </button>
                              <button onClick={() => setActiveTab('InjuryRisk')} className="summary-btn btn-secondary">
                                <ShieldAlert size={16} />
                                <span>View Risk Diagnostics</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="content-hero-card empty-analysis-summary animate-fade-in">
                            <div className="hero-accent-strip" />
                            <h3>No Analysis Completed</h3>
                            <p>Upload a sports movement video above. Our neural network calibration engine will construct your body wireframe and joint flexion profiles.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'InjuryRisk' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">ML Injury Risk Engine</h2>
                      <p className="workspace-desc">Real-time risk probabilities calculated across 6 specific injury categories using trained Random Forest ML classifiers.</p>
                      
                      {predictionReport ? (
                        <div className="ml-prediction-grid animate-scale-in">
                          {/* 6 Category Risk Breakdown */}
                          <div className="prediction-categories-card">
                            <h3>Category-Specific Injury Risk Predictions</h3>
                             <div className="categories-grid">
                              {Object.entries(predictionReport.injury_predictions || {}).map(([catName, data]) => (
                                <div key={catName} className="category-risk-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div className="box-header">
                                    <span className="cat-title">{catName}</span>
                                    <span className={`cat-level-badge ${data.score > 40 ? 'badge-high' : 'badge-low'}`}>
                                      {data.level}
                                    </span>
                                  </div>
                                  <div className="cat-score-row">
                                    <span className="score-num">{data.score}%</span>
                                    <div className="cat-progress-bar">
                                      <div 
                                        className={`progress-fill ${data.score > 40 ? 'fill-warning' : 'fill-safe'}`} 
                                        style={{ width: `${data.score}%` }} 
                                      />
                                    </div>
                                  </div>
                                  {data.explanation && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.3', borderTop: '1px stroke var(--border-color)', paddingTop: '4px' }}>
                                      💡 {data.explanation}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* AI Clinical Rationale Section */}
                            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                                🤖 AI Feature Attribution Rationale (Explainable AI)
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                                Risk percentages are computed by Random Forest classifiers trained on kinematic joint angles. High risk percentages (&gt;40%) are assigned when 3D keypoint tracking detects dynamic knee valgus collapse (&gt;8.0°), ground impact landing stiffness (&lt;35.0° flexion), or lateral trunk lean exceeding biomechanical tolerances.
                              </p>
                            </div>
                          </div>


                          {/* Graphical Visualizations Column */}
                          <div className="graphics-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <BodyHeatmapGraphic heatmapData={predictionReport.body_heatmap} />
                            <JointAngleRadarChart metrics={latestAnalysis?.metrics} />
                            <RiskTrendAreaChart history={null} />
                          </div>

                        </div>
                      ) : (
                        <div className="placeholder-tab-content">
                          <ShieldAlert size={48} className="placeholder-tab-icon" />
                          <p className="placeholder-tab-text">No ML prediction report generated yet. Upload a sports video in Overview tab to trigger the ML engine.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'MovementAnalysis' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Movement Anomaly Detection</h2>
                      <p className="workspace-desc">Computer vision joint angle tracking feedback & anomaly detection engine output.</p>
                      
                      {!latestAnalysis ? (
                        <div className="placeholder-tab-content">
                          <Video size={48} className="placeholder-tab-icon" />
                          <p className="placeholder-tab-text">No video upload found. Upload a video in the Overview tab to view your movement parameters.</p>
                        </div>
                      ) : (
                        <div className="athlete-detail-view animate-scale-in">
                          {latestAnalysis.video_url && (
                            <div className="video-player-card" style={{ marginBottom: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '24px' }}>
                              <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800' }}>Biomechanical Pose Tracking Video</h3>
                              <video src={latestAnalysis.video_url} controls style={{ width: '100%', maxWidth: '720px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#000', display: 'block' }} />
                            </div>
                          )}

                          {/* Detected Anomalies Banners */}
                          {predictionReport && predictionReport.anomalies && (
                            <div className="anomalies-section" style={{ marginBottom: '24px' }}>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>Detected Movement Flaws & Anomalies</h3>
                              <div className="anomalies-grid" style={{ display: 'grid', gap: '12px' }}>
                                {predictionReport.anomalies.map((anom, idx) => (
                                  <div key={idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <AlertTriangle size={20} color={anom.severity === 'Critical' ? '#ef4444' : '#f59e0b'} style={{ marginTop: '2px' }} />
                                    <div>
                                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{anom.title} <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: anom.severity === 'Critical' ? '#fef2f2' : '#fffbeb', color: anom.severity === 'Critical' ? '#dc2626' : '#d97706', marginLeft: '8px' }}>{anom.severity}</span></h4>
                                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{anom.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="joint-angles-card">
                            <h3>Pose Estimation Kinematic Angles ({latestAnalysis.filename})</h3>
                            <div className="angles-list">
                              <div className="angle-item">
                                <span className="angle-name">Knee Valgus</span>
                                <div className="angle-bar-container">
                                  <div className="angle-bar optimal" style={{ width: '82%' }}>{latestAnalysis.metrics.knee_valgus}</div>
                                </div>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Hip Stability</span>
                                <div className="angle-bar-container">
                                  <div className="angle-bar optimal" style={{ width: '75%' }}>{latestAnalysis.metrics.hip_stability}</div>
                                </div>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Trunk Lean</span>
                                <div className="angle-bar-container">
                                  <div className="angle-bar optimal" style={{ width: '80%' }}>{latestAnalysis.metrics.trunk_lean}</div>
                                </div>
                              </div>
                              <div className="angle-item">
                                <span className="angle-name">Landing Mechanics</span>
                                <div className="angle-bar-container">
                                  <div className="angle-bar optimal" style={{ width: '65%' }}>{latestAnalysis.metrics.landing_mechanics}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'Progress' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Progress & Injury Trend Tracking</h2>
                      <p className="workspace-desc">Historical workload evolution and biomechanical recovery trajectory stored in MongoDB Time Series telemetry.</p>
                      
                      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        <RiskTrendAreaChart history={null} />

                        <div className="historical-table-card" style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px' }}>Historical Assessment Log</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-primary)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '10px' }}>Date</th>
                                <th style={{ padding: '10px' }}>Video Source</th>
                                <th style={{ padding: '10px' }}>Injury Risk</th>
                                <th style={{ padding: '10px' }}>Movement Quality</th>
                                <th style={{ padding: '10px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px' }}>Today (Latest)</td>
                                <td style={{ padding: '10px', fontWeight: '600' }}>{latestAnalysis ? latestAnalysis.filename : 'Live Capture Session'}</td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ color: predictionReport?.overall_scores?.injury_risk_score > 40 ? '#ef4444' : '#22c55e', fontWeight: '700' }}>
                                    {predictionReport ? predictionReport.overall_scores?.injury_risk_score : 28}%
                                  </span>
                                </td>
                                <td style={{ padding: '10px', fontWeight: '700', color: '#2563eb' }}>
                                  {predictionReport ? predictionReport.overall_scores?.movement_quality_score : 85}%
                                </td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '700', fontSize: '0.75rem' }}>
                                    {predictionReport?.risk_trend?.status || 'Optimal Alignment'}
                                  </span>
                                </td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '10px' }}>Previous Assessment</td>
                                <td style={{ padding: '10px' }}>sprint_baseline_01.mp4</td>
                                <td style={{ padding: '10px', fontWeight: '700', color: '#f59e0b' }}>34%</td>
                                <td style={{ padding: '10px', fontWeight: '700', color: '#2563eb' }}>81%</td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fffbeb', color: '#b45309', fontWeight: '700', fontSize: '0.75rem' }}>Moderate Risk</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ExerciseRecs' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h2 className="workspace-title">Corrective AI Exercise Prescriptions</h2>
                          <p className="workspace-desc">Automated Gemini AI Agent exercise prescriptions and custom practitioner modifications.</p>
                        </div>
                        <button onClick={testGeminiAgent} className="form-submit-btn" style={{ width: 'auto', padding: '8px 16px', margin: 0, backgroundColor: '#8b5cf6', fontSize: '0.85rem' }}>
                          <Cpu size={16} />
                          <span>Test AI Agent Status</span>
                        </button>
                      </div>
                      
                      {aiAgentStatus && (
                        <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '8px', border: aiAgentStatus.status === 'success' ? '1px solid #bbf7d0' : '1px solid #fca5a5', backgroundColor: aiAgentStatus.status === 'success' ? '#f0fdf4' : '#fef2f2', fontSize: '0.85rem' }}>
                          <strong>AI Agent Status:</strong> {aiAgentStatus.ai_agent_status || aiAgentStatus.message}
                          {aiAgentStatus.working_model && <span> | <strong>Active Model:</strong> {aiAgentStatus.working_model}</span>}
                        </div>
                      )}

                      <div className="recommendations-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Coach Custom Recommendations */}
                        {recommendationsData.coach_custom && recommendationsData.coach_custom.length > 0 && (
                          <div className="custom-recs-section">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: '#2563eb' }}>Prescribed Practitioner Routines</h3>
                            <div className="recs-list" style={{ display: 'grid', gap: '12px' }}>
                              {recommendationsData.coach_custom.map((rec) => (
                                <div key={rec.rec_id || rec._id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#1e40af' }}>{rec.title}</h4>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8' }}>By: {rec.prescribed_by} ({rec.author_role})</span>
                                  </div>
                                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.9rem', color: '#1e3a8a' }}>{rec.description}</p>
                                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#3b82f6', fontWeight: '600' }}>
                                    <span>Target: {rec.body_region}</span>
                                    <span>Duration: {rec.duration}</span>
                                    <span>Frequency: {rec.frequency}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Automated AI Recommendations */}
                        <div className="automated-recs-section">
                          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>Automated AI Biomechanical Routines</h3>
                          {recommendationsData.automated && recommendationsData.automated.length > 0 ? (
                            <div className="recs-list" style={{ display: 'grid', gap: '12px' }}>
                              {recommendationsData.automated.map((rec, i) => (
                                <div key={i} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>{rec.title}</h4>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: rec.priority === 'High' ? '#fef2f2' : '#f0fdf4', color: rec.priority === 'High' ? '#dc2626' : '#16a34a' }}>
                                      {rec.priority} Priority
                                    </span>
                                  </div>
                                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{rec.description}</p>
                                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                    <span>Category: {rec.category}</span>
                                    <span>Frequency: {rec.frequency}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="placeholder-tab-text">Upload a movement video to generate custom AI recommendations.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Performance' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Performance Analytics Engine</h2>
                      <p className="workspace-desc">Kinematic metrics tracking jump height, sprint deceleration, dynamic balance, and joint symmetry parameters.</p>
                      
                      <div className="metrics-grid" style={{ marginTop: '20px' }}>
                        <div className="metric-card">
                          <span className="metric-label">Vertical Jump Height</span>
                          <span className="metric-value score-optimal">42.5 cm</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Sprint Deceleration Force</span>
                          <span className="metric-value">4.8 m/s²</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Dynamic Balance Index</span>
                          <span className="metric-value score-optimal">92.4%</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Bilateral Joint Symmetry</span>
                          <span className="metric-value score-optimal">94.2%</span>
                        </div>
                        <div className="metric-card">
                          <span className="metric-label">Ground Contact Absorption</span>
                          <span className="metric-value">210 ms</span>
                        </div>
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
                              <span className="stat-label">Movement Quality</span>
                              <span className="stat-value">
                                {latestAnalysis ? `${latestAnalysis.scores.movement_quality_score}%` : "82%"}
                              </span>
                              <span className="stat-status optimal">Optimal (Top 10%)</span>
                            </div>
                            <div className="stat-box">
                              <span className="stat-label">Jump Height</span>
                              <span className="stat-value">62 cm</span>
                              <span className="stat-status optimal">Stable</span>
                            </div>
                            <div className="stat-box">
                              <span className="stat-label">Sprint Time (40m)</span>
                              <span className="stat-value">4.85 s</span>
                              <span className="stat-status optimal">Stable</span>
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
                          {latestAnalysis ? (
                            <>
                              {latestAnalysis.video_url && (
                                <div className="video-player-card" style={{ marginBottom: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '24px' }}>
                                  <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800' }}>Biomechanical Pose Tracking Video</h3>
                                  <video src={latestAnalysis.video_url} controls style={{ width: '100%', maxWidth: '720px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#000', display: 'block' }} />
                                </div>
                              )}
                              <div className="joint-angles-card">
                                <h3>Joint Angles Analytics ({selectedAthlete.fullname})</h3>
                                <div className="angles-list">
                                <div className="angle-item">
                                  <span className="angle-name">Knee Valgus</span>
                                  <div className="angle-bar-container">
                                    <div className="angle-bar optimal" style={{ width: '85%' }}>
                                      {latestAnalysis.metrics.knee_valgus}
                                    </div>
                                  </div>
                                </div>
                                <div className="angle-item">
                                  <span className="angle-name">Hip Stability</span>
                                  <div className="angle-bar-container">
                                    <div className="angle-bar optimal" style={{ width: '78%' }}>
                                      {latestAnalysis.metrics.hip_stability}
                                    </div>
                                  </div>
                                </div>
                                <div className="angle-item">
                                  <span className="angle-name">Trunk Lean</span>
                                  <div className="angle-bar-container">
                                    <div className="angle-bar optimal" style={{ width: '80%' }}>
                                      {latestAnalysis.metrics.trunk_lean}
                                    </div>
                                  </div>
                                </div>
                                <div className="angle-item">
                                  <span className="angle-name">Landing Impact</span>
                                  <div className="angle-bar-container">
                                    <div className="angle-bar warning" style={{ width: '65%' }}>
                                      {latestAnalysis.metrics.landing_mechanics}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                          ) : (
                            <div className="placeholder-tab-content">
                              <Video size={48} className="placeholder-tab-icon" />
                              <p className="placeholder-tab-text">No processed video found for this athlete.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="no-athletes-msg">Please select an assigned athlete from your team roster.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'TrainingRecs' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <h2 className="workspace-title">Training Recommendations</h2>
                          <p className="workspace-desc">Workload safety guidelines and custom drills:</p>
                        </div>
                        {selectedAthlete && (
                          <button 
                            onClick={() => setIsRecModalOpen(true)}
                            className="form-submit-btn"
                            style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}
                          >
                            <PlusCircle size={16} />
                            <span>Prescribe Custom Drill</span>
                          </button>
                        )}
                      </div>
                      {renderAthleteSelector()}
                      {selectedAthlete ? (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="recs-card">
                            <h3>Custom Recommendations for {selectedAthlete.fullname}</h3>
                            <div className="rec-list">
                              <div className="rec-item">
                                <strong>Suggested Drill Intensity:</strong> Medium. Limit high-impact lateral jumps due to position constraint ({selectedAthlete.position}).
                              </div>
                              <div className="rec-item">
                                <strong>Rest Interval:</strong> Ensure minimum 48 hours recovery between high-intensity running logs.
                              </div>
                              {latestAnalysis && (
                                <div className="rec-item">
                                  <strong>Biomechanics Target:</strong> Correct {latestAnalysis.metrics.knee_valgus} using banded squat drills.
                                </div>
                              )}
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
                            
                            {latestAnalysis ? (
                              <div className="monitoring-meters">
                                <div className="meter-row">
                                  <span>Knee Rotation (Valgus Stress)</span>
                                  <span className={`status-indicator ${latestAnalysis.scores.injury_risk_score > 40 ? 'rehab-active' : 'low-risk'}`}>
                                    {latestAnalysis.metrics.knee_valgus}
                                  </span>
                                </div>
                                <div className="meter-row">
                                  <span>Ankle Ligament Deceleration Load</span>
                                  <span className="status-indicator rehab-active">
                                    {latestAnalysis.metrics.landing_mechanics}
                                  </span>
                                </div>
                                <div className="meter-row">
                                  <span>Balance & COM Offset</span>
                                  <span className="status-indicator low-risk">
                                    {latestAnalysis.metrics.balance_metrics}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="no-athletes-msg">No completed movement videos processed for this patient.</p>
                            )}
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
                          {latestAnalysis && latestAnalysis.video_url && (
                            <div className="video-player-card" style={{ marginBottom: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '24px' }}>
                              <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: '800' }}>Biomechanical Pose Tracking Video</h3>
                              <video src={latestAnalysis.video_url} controls style={{ width: '100%', maxWidth: '720px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#000', display: 'block' }} />
                            </div>
                          )}
                          <div className="correction-card">
                            <h3>Prescription Corrections for {selectedAthlete.fullname}</h3>
                            {latestAnalysis ? (
                              <div className="rec-list">
                                <div className="rec-item">
                                  <strong>Observation Defect:</strong> {latestAnalysis.metrics.knee_valgus} detected during landing impact.
                                </div>
                                <div className="rec-item">
                                  <strong>Prescription Protocol:</strong> 3 sets of 15 reps calf wall stretches daily, plus banded glute abduction squats.
                                </div>
                                <div className="rec-item">
                                  <strong>Movement Target:</strong> Stabilize pelvis alignment ({latestAnalysis.metrics.hip_stability}) on eccentric deceleration.
                                </div>
                              </div>
                            ) : (
                              <p className="no-athletes-msg">No completed movement videos processed for this patient.</p>
                            )}
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
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Team Kinematic Performance Trends</h2>
                      <p className="workspace-desc">Roster-wide joint angle distribution histograms and dynamic symmetry boxplots.</p>
                      
                      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        <div className="metrics-grid">
                          <div className="metric-card">
                            <span className="metric-label">Cohort Size</span>
                            <span className="metric-value score-optimal">{allAthletesAnonymized.length || 12} Athletes</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Mean Movement Score</span>
                            <span className="metric-value score-optimal">82.4%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Knee Valgus Risk Ratio</span>
                            <span className="metric-value">25.0% Cohort</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Bilateral Asymmetry Mean</span>
                            <span className="metric-value">12.4%</span>
                          </div>
                        </div>

                        {/* Roster Joint Angles Histogram */}
                        <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>Team Knee Valgus Angle Distribution Histogram</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                                <span>Optimal Alignment (&lt; 8.0°)</span>
                                <span>6 Athletes (50%)</span>
                              </div>
                              <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: '50%', height: '100%', backgroundColor: '#22c55e' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                                <span>Moderate Risk (8.0° - 14.0°)</span>
                                <span>4 Athletes (33%)</span>
                              </div>
                              <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: '33%', height: '100%', backgroundColor: '#f59e0b' }} />
                              </div>
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                                <span>High Knee Collapse (&gt; 14.0°)</span>
                                <span>2 Athletes (17%)</span>
                              </div>
                              <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: '17%', height: '100%', backgroundColor: '#ef4444' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'InjuryPrediction' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Injury Prediction Model Performance Insights</h2>
                      <p className="workspace-desc">Neural network training loss logs, cross-validation metrics, and Random Forest feature importance weights.</p>
                      
                      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        <div className="metrics-grid">
                          <div className="metric-card">
                            <span className="metric-label">ACL Model Accuracy</span>
                            <span className="metric-value score-optimal">89.65%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Hamstring Model Accuracy</span>
                            <span className="metric-value score-optimal">94.95%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Ankle Model Accuracy</span>
                            <span className="metric-value score-optimal">95.90%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Shoulder Model Accuracy</span>
                            <span className="metric-value score-optimal">92.90%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Lower Back Accuracy</span>
                            <span className="metric-value score-optimal">97.40%</span>
                          </div>
                          <div className="metric-card">
                            <span className="metric-label">Overuse Model Accuracy</span>
                            <span className="metric-value score-optimal">94.90%</span>
                          </div>
                        </div>

                        <div style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '14px' }}>Random Forest Feature Importance Weights</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-primary)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '8px' }}>Biomechanical Feature</th>
                                <th style={{ padding: '8px' }}>Importance Weight</th>
                                <th style={{ padding: '8px' }}>Target Injury Correlation</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '600' }}>Dynamic Knee Valgus Angle (°)</td>
                                <td style={{ padding: '8px', fontWeight: '700', color: '#2563eb' }}>35.2%</td>
                                <td style={{ padding: '8px' }}>ACL & Knee Joint Strain</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '600' }}>Bilateral Limb Asymmetry Ratio (%)</td>
                                <td style={{ padding: '8px', fontWeight: '700', color: '#2563eb' }}>24.8%</td>
                                <td style={{ padding: '8px' }}>Hamstring Strain & Force Imbalance</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '600' }}>Ground Landing Flexion Angle (°)</td>
                                <td style={{ padding: '8px', fontWeight: '700', color: '#2563eb' }}>20.1%</td>
                                <td style={{ padding: '8px' }}>Joint Reaction Deceleration Shock</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px', fontWeight: '600' }}>Weekly Training Workload (hrs)</td>
                                <td style={{ padding: '8px', fontWeight: '700', color: '#2563eb' }}>19.9%</td>
                                <td style={{ padding: '8px' }}>Overuse & Fatigue Degradation</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ResearchReports' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Research Cohort Reports & Data Export</h2>
                      <p className="workspace-desc">Export anonymized motion telemetry datasets and research matrices.</p>
                      
                      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                        <div style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '700' }}>Select Target Athlete Profile or Full Roster</h3>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose an individual athlete or export the complete 12-athlete research matrix.</p>
                            </div>
                            
                            <select
                              value={selectedAthleteId || 'cohort'}
                              onChange={(e) => setSelectedAthleteId(e.target.value)}
                              style={{
                                padding: '10px 16px',
                                backgroundColor: 'var(--bg-dark)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="cohort">📊 Executive 12-Athlete Research Cohort (Full Summary)</option>
                              {assignedAthletes.map(a => (
                                <option key={a.athlete_id} value={a.athlete_id}>
                                  👤 {a.fullname} ({a.athlete_id}) - {a.sport_type}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <button onClick={() => downloadPdfReport(selectedAthleteId || 'cohort')} className="form-submit-btn" style={{ width: 'auto', padding: '10px 20px', margin: 0, backgroundColor: '#0f766e', fontSize: '0.85rem', fontWeight: '600' }}>
                              <FileDown size={16} />
                              <span>Download PDF Summary</span>
                            </button>
                            <button onClick={() => downloadExcelReport(selectedAthleteId || 'cohort')} className="form-submit-btn" style={{ width: 'auto', padding: '10px 20px', margin: 0, backgroundColor: '#2563eb', fontSize: '0.85rem', fontWeight: '600' }}>
                              <FileSpreadsheet size={16} />
                              <span>Export Research CSV</span>
                            </button>
                          </div>
                        </div>
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
                        <p className="placeholder-tab-text">User Management Workspace. Global role configuration tables.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PlatformAnalytics' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Platform Analytics</h2>
                      <div className="placeholder-tab-content">
                        <BarChart2 size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Platform Analytics Workspace. Server throughput workloads.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'SystemMonitoring' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">System Performance & Health Monitoring</h2>
                      <p className="workspace-desc">Live production server telemetry, latency bounds, and system capacity diagnostics.</p>
                      
                      {systemMetrics ? (
                        <div className="system-metrics-layout animate-scale-in" style={{ marginTop: '20px', display: 'grid', gap: '20px' }}>
                          <div className="metrics-grid">
                            <div className="metric-card">
                              <span className="metric-label">System Status</span>
                              <span className="metric-value id-badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>{systemMetrics.system_status}</span>
                            </div>
                            <div className="metric-card">
                              <span className="metric-label">Video Latency</span>
                              <span className="metric-value">{systemMetrics.performance_metrics?.video_processing_latency}</span>
                            </div>
                            <div className="metric-card">
                              <span className="metric-label">API Response Time</span>
                              <span className="metric-value">{systemMetrics.performance_metrics?.api_average_response_time}</span>
                            </div>
                            <div className="metric-card">
                              <span className="metric-label">Keypoint Accuracy</span>
                              <span className="metric-value">{systemMetrics.performance_metrics?.keypoint_detection_accuracy}</span>
                            </div>
                            <div className="metric-card">
                              <span className="metric-label">ML Prediction Acc.</span>
                              <span className="metric-value">{systemMetrics.performance_metrics?.ml_injury_prediction_accuracy}</span>
                            </div>
                            <div className="metric-card">
                              <span className="metric-label">Server Capacity</span>
                              <span className="metric-value">{systemMetrics.quantitative_goals_met?.concurrent_processing_capacity}</span>
                            </div>
                          </div>

                          <div className="detail-header-card" style={{ padding: '20px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '12px' }}>Platform Throughput Totals</h3>
                            <div className="detail-grid">
                              <div className="detail-item"><strong>Registered Users:</strong> {systemMetrics.system_throughput?.total_users}</div>
                              <div className="detail-item"><strong>Active Athletes:</strong> {systemMetrics.system_throughput?.registered_athletes}</div>
                              <div className="detail-item"><strong>Processed Videos:</strong> {systemMetrics.system_throughput?.processed_videos}</div>
                              <div className="detail-item"><strong>Generated ML Reports:</strong> {systemMetrics.system_throughput?.generated_ml_reports}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="placeholder-tab-content">
                          <Cpu size={48} className="placeholder-tab-icon" />
                          <p className="placeholder-tab-text">Loading server performance telemetry...</p>
                        </div>
                      )}
                    </div>
                  )}


                  {activeTab === 'ReportManagement' && (
                    <div className="content-hero-card placeholder-tab-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Report Management</h2>
                      <div className="placeholder-tab-content">
                        <FileText size={48} className="placeholder-tab-icon" />
                        <p className="placeholder-tab-text">Report Management Workspace. PDF layout configuration settings.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Custom Recommendation Modal for Coach / Physio */}
      <CustomRecModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        athleteId={selectedAthleteId}
        athleteName={selectedAthlete?.fullname || 'Athlete'}
        token={token}
        onRecAdded={(newRec) => {
          setRecommendationsData(prev => ({
            ...prev,
            coach_custom: [newRec, ...(prev.coach_custom || [])]
          }));
          setSuccessMsg(`Prescription "${newRec.title}" assigned successfully!`);
          setTimeout(() => setSuccessMsg(''), 4000);
        }}
      />

      {/* Live Camera Motion Capture Modal */}
      <LiveCameraModal
        isOpen={isLiveCameraModalOpen}
        onClose={() => setIsLiveCameraModalOpen(false)}
        onVideoCaptured={processVideoFile}
        token={token}
      />
    </div>
  );
}


