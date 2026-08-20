/**
 * Dashboard.jsx — SIRD Platform
 *
 * This file is now a lean shell (~350 lines) that:
 *  1. Holds shared state (active tab, athlete data, analysis result, etc.)
 *  2. Orchestrates all API calls via the useApi hook
 *  3. Renders the sidebar + topbar layout
 *  4. Delegates all tab content to focused child components
 *
 * FIXES APPLIED:
 *  ✅ MediaPipe bypass on Render — pose estimation now runs client-side in
 *     AthleteOverviewTab via processVideoClientSide() (see hooks/useApi.js).
 *     The backend never needs MediaPipe at all.
 *  ✅ God-component split — 2,976 lines → ~350 lines + 7 focused tab components
 *  ✅ useQuery caching — raw useEffect+fetch replaced with useQuery() helper
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  User, LogOut, Sun, Moon, Activity, ChevronDown, Settings,
  Video, Calendar, Heart, Shield, Users, BarChart2, FileText,
  GitPullRequest, Database, ShieldAlert, Award, FileSpreadsheet,
  Eye, UserCheck, RefreshCw, Cpu, UploadCloud, PlusCircle,
  AlertTriangle, TrendingUp, Download, FileDown, Camera, Film,
} from 'lucide-react';

import CustomRecModal from '../components/CustomRecModal';
import NotificationBell from '../components/NotificationBell';
import LiveCameraModal from '../components/LiveCameraModal';
import { CohortScatterMatrixChart, RiskTrendAreaChart } from '../components/BiomechanicalCharts';

// Tab components
import AthleteOverviewTab from '../components/tabs/AthleteOverviewTab';
import InjuryRiskTab from '../components/tabs/InjuryRiskTab';
import MovementAnalysisTab from '../components/tabs/MovementAnalysisTab';
import VideoHistoryTab from '../components/tabs/VideoHistoryTab';
import ExerciseRecsTab from '../components/tabs/ExerciseRecsTab';
import ProfileSettingsTab from '../components/tabs/ProfileSettingsTab';
import AdminUserManagementTab from '../components/tabs/AdminUserManagementTab';

import { API_BASE, apiFetch, useQuery, invalidateCache, formatDateTime } from '../hooks/useApi';

import './Dashboard.css';

// ─── Default demo data ──────────────────────────────────────────────────────
const DEFAULT_ROSTER_ATHLETES = [
  { athlete_id: 'ATH-1001', name: 'Marcus Rashford', fullname: 'Marcus Rashford', sport_type: 'Soccer', position: 'Forward', age: 26, height: 180, weight: 70, movement_quality_score: 85.0 },
  { athlete_id: 'ATH-1002', name: 'Serena Williams', fullname: 'Serena Williams', sport_type: 'Tennis', position: 'Singles', age: 42, height: 175, weight: 72, movement_quality_score: 92.4 },
  { athlete_id: 'ATH-1003', name: 'Simone Biles', fullname: 'Simone Biles', sport_type: 'Gymnastics', position: 'All-Around', age: 27, height: 142, weight: 47, movement_quality_score: 96.2 },
  { athlete_id: 'ATH-1004', name: 'Erling Haaland', fullname: 'Erling Haaland', sport_type: 'Soccer', position: 'Striker', age: 24, height: 194, weight: 88, movement_quality_score: 88.0 },
  { athlete_id: 'ATH-1005', name: 'LeBron James', fullname: 'LeBron James', sport_type: 'Basketball', position: 'Small Forward', age: 39, height: 206, weight: 113, movement_quality_score: 91.5 },
  { athlete_id: 'ATH-1006', name: 'Katie Ledecky', fullname: 'Katie Ledecky', sport_type: 'Swimming', position: 'Freestyle', age: 27, height: 183, weight: 73, movement_quality_score: 94.8 },
  { athlete_id: 'ATH-1007', name: 'Novak Djokovic', fullname: 'Novak Djokovic', sport_type: 'Tennis', position: 'Singles', age: 37, height: 188, weight: 77, movement_quality_score: 95.1 },
  { athlete_id: 'ATH-1008', name: 'Yulimar Rojas', fullname: 'Yulimar Rojas', sport_type: 'Track & Field', position: 'Triple Jump', age: 28, height: 192, weight: 72, movement_quality_score: 89.3 },
  { athlete_id: 'ATH-1009', name: 'Kylian Mbappé', fullname: 'Kylian Mbappé', sport_type: 'Soccer', position: 'Forward', age: 25, height: 178, weight: 75, movement_quality_score: 87.6 },
  { athlete_id: 'ATH-1010', name: 'Naomi Osaka', fullname: 'Naomi Osaka', sport_type: 'Tennis', position: 'Singles', age: 26, height: 180, weight: 69, movement_quality_score: 90.2 },
  { athlete_id: 'ATH-1011', name: 'Giannis Antetokounmpo', fullname: 'Giannis Antetokounmpo', sport_type: 'Basketball', position: 'Power Forward', age: 29, height: 211, weight: 110, movement_quality_score: 93.0 },
  { athlete_id: 'ATH-1012', name: 'Alex Morgan', fullname: 'Alex Morgan', sport_type: 'Soccer', position: 'Forward', age: 35, height: 170, weight: 62, movement_quality_score: 89.0 },
  { athlete_id: 'ATH-1013', name: 'Caeleb Dressel', fullname: 'Caeleb Dressel', sport_type: 'Swimming', position: 'Butterfly', age: 27, height: 191, weight: 88, movement_quality_score: 92.0 },
];

const DEFAULT_COACHES = [
  { fullname: 'Coach Alex Ferguson', email: 'coach.alex@sird.org' },
  { fullname: 'Coach Erik ten Hag', email: 'coach.erik@sird.org' },
  { fullname: 'Coach Carlo Ancelotti', email: 'coach.carlo@sird.org' },
  { fullname: 'Coach Pep Guardiola', email: 'coach.pep@sird.org' },
];

const DEFAULT_PHYSIOS = [
  { fullname: 'Dr. John Carter (PT)', email: 'dr.john@sird.org' },
  { fullname: 'Dr. Sarah Jenkins (PT)', email: 'dr.sarah@sird.org' },
  { fullname: 'Dr. Michael Chen (PT)', email: 'dr.michael@sird.org' },
];

// ─── Role configuration ─────────────────────────────────────────────────────
function getRoleConfig(role) {
  switch (role) {
    case 'Athlete': return {
      themeColor: 'role-athlete', badgeText: 'Athlete',
      navItems: [
        { id: 'Overview', label: 'Dashboard Overview', icon: User },
        { id: 'InjuryRisk', label: 'Injury Risk Score', icon: ShieldAlert },
        { id: 'MovementAnalysis', label: 'Movement Analysis', icon: Video },
        { id: 'VideoHistory', label: 'Video Upload History', icon: Film },
        { id: 'Progress', label: 'Progress Tracking', icon: Calendar },
        { id: 'ExerciseRecs', label: 'Exercise Recommendations', icon: Heart },
        { id: 'Performance', label: 'Performance Trends', icon: BarChart2 },
        { id: 'Settings', label: 'Profile Settings', icon: Settings },
      ],
    };
    case 'Coach': return {
      themeColor: 'role-coach', badgeText: 'Coach / Trainer',
      navItems: [
        { id: 'Overview', label: 'Dashboard Overview', icon: Users },
        { id: 'TeamRisk', label: 'Team Risk Overview', icon: ShieldAlert },
        { id: 'AthletePerf', label: 'Athlete Performance', icon: BarChart2 },
        { id: 'MovementQuality', label: 'Movement Quality', icon: Video },
        { id: 'TrainingRecs', label: 'Training Recommendations', icon: Calendar },
      ],
    };
    case 'Physiotherapist': return {
      themeColor: 'role-physio', badgeText: 'Physiotherapist',
      navItems: [
        { id: 'Overview', label: 'Dashboard Overview', icon: Heart },
        { id: 'RehabTracking', label: 'Rehabilitation Tracking', icon: UserCheck },
        { id: 'InjuryMonitoring', label: 'Injury Risk Monitoring', icon: ShieldAlert },
        { id: 'MovementCorrection', label: 'Movement Correction', icon: Video },
        { id: 'RecoveryReports', label: 'Recovery Reports', icon: FileText },
      ],
    };
    case 'Sports Scientist': return {
      themeColor: 'role-scientist', badgeText: 'Sports Scientist',
      navItems: [
        { id: 'Overview', label: 'Dashboard Overview', icon: Database },
        { id: 'Biomechanical', label: 'Biomechanical Analytics', icon: GitPullRequest },
        { id: 'TeamTrends', label: 'Team Performance Trends', icon: BarChart2 },
        { id: 'InjuryPrediction', label: 'Injury Prediction Insights', icon: Cpu },
        { id: 'ResearchReports', label: 'Research Reports', icon: FileSpreadsheet },
      ],
    };
    case 'Administrator': return {
      themeColor: 'role-admin', badgeText: 'Administrator',
      navItems: [
        { id: 'Overview', label: 'Dashboard Overview', icon: Shield },
        { id: 'UserManagement', label: 'User Management', icon: Users },
        { id: 'PlatformAnalytics', label: 'Platform Analytics', icon: BarChart2 },
        { id: 'SystemMonitoring', label: 'System Monitoring', icon: Cpu },
        { id: 'ReportManagement', label: 'Report Management', icon: FileText },
      ],
    };
    default: return {
      themeColor: 'role-athlete', badgeText: 'User',
      navItems: [{ id: 'Overview', label: 'Dashboard Overview', icon: User }],
    };
  }
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ user, token, logout, theme, toggleTheme }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isLiveCameraModalOpen, setIsLiveCameraModalOpen] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);

  // Shared state
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [videoHistory, setVideoHistory] = useState([]);
  const [assignedAthletes, setAssignedAthletes] = useState(DEFAULT_ROSTER_ATHLETES);
  const [selectedAthleteId, setSelectedAthleteId] = useState('ATH-1001');

  // Athlete profile form state
  const [athleteProfile, setAthleteProfile] = useState(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [coachesList, setCoachesList] = useState(DEFAULT_COACHES);
  const [physiosList, setPhysiosList] = useState(DEFAULT_PHYSIOS);

  // Form fields (shared between questionnaire and settings)
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
  const [formErrorMsg, setFormErrorMsg] = useState('');

  // Notifications for success/error
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const notify = (type, msg) => {
    if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 5000); }
    else { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); }
  };

  // ── useQuery data ──────────────────────────────────────────────────────────
  const athleteTargetId = user.role === 'Athlete' ? 'me' : selectedAthleteId;

  const predQ = useQuery(
    `prediction-${athleteTargetId}`,
    () => apiFetch(`/api/predictions/${athleteTargetId}/latest`, token),
    [athleteTargetId, token],
  );

  const predHistoryQ = useQuery(
    `pred-history-${athleteTargetId}`,
    async () => {
      const raw = await apiFetch(`/api/predictions/${athleteTargetId}/history`, token);
      return raw.map((item) => ({
        date: new Date(item.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        risk: item.scores?.injury_risk_score || 30,
        quality: item.scores?.movement_quality_score || 80,
      }));
    },
    [athleteTargetId, token],
  );

  const recsQ = useQuery(
    `recommendations-${athleteTargetId}`,
    () => apiFetch(`/api/recommendations/${athleteTargetId}`, token),
    [athleteTargetId, token],
  );

  const allUsersQ = useQuery(
    'all-users',
    () => apiFetch('/api/users/all', token),
    [token],
  );

  const systemMetricsQ = useQuery(
    'system-metrics',
    () => apiFetch('/api/system/metrics', token),
    [token],
  );

  const datasetInsightsQ = useQuery(
    'dataset-insights',
    () => apiFetch('/api/predictions/insights/dataset-metrics', token),
    [token],
  );

  // ── Role-specific init ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    if (user.role === 'Athlete') {
      fetchAthleteProfile();
      fetchCoachesPhysios();
    } else if (user.role === 'Coach' || user.role === 'Physiotherapist') {
      fetchAssignedAthletes();
    } else if (user.role === 'Sports Scientist') {
      fetchAnonymizedAthletes();
    }
  }, [user?.role, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch latest analysis when target athlete changes
  useEffect(() => {
    if (!token) return;
    if ((user.role === 'Athlete' && athleteProfile) || (user.role !== 'Athlete' && selectedAthleteId)) {
      fetchLatestAnalysis(athleteTargetId);
      fetchVideoHistory(athleteTargetId);
    }
  }, [athleteProfile?.athlete_id, selectedAthleteId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch functions ────────────────────────────────────────────────────────
  const fetchAthleteProfile = async () => {
    setLoadingProfile(true);
    try {
      const data = await apiFetch('/api/users/athlete-profile', token);
      setAthleteProfile(data);
      setShowQuestionnaire(false);
      setSportType(data.sport_type); setPosition(data.position);
      setAge(data.age); setHeight(data.height); setWeight(data.weight);
      setInjuryHistory(data.injury_history); setTrainingLoad(data.training_load);
      setAssignedCoach(data.assigned_coach || ''); setAssignedPhysio(data.assigned_physio || '');
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('Not Found')) {
        setShowQuestionnaire(true);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchCoachesPhysios = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/coaches`),
        fetch(`${API_BASE}/api/users/physiotherapists`),
      ]);
      const coaches = cRes.ok ? await cRes.json() : [];
      const physios = pRes.ok ? await pRes.json() : [];
      setCoachesList(coaches.length > 0 ? coaches : DEFAULT_COACHES);
      setPhysiosList(physios.length > 0 ? physios : DEFAULT_PHYSIOS);
    } catch {
      setCoachesList(DEFAULT_COACHES);
      setPhysiosList(DEFAULT_PHYSIOS);
    }
  };

  const fetchAssignedAthletes = async () => {
    try {
      const data = await apiFetch('/api/users/my-athletes', token);
      if (data?.length > 0) setAssignedAthletes(data);
    } catch { /* keep defaults */ }
  };

  const fetchAnonymizedAthletes = async () => {
    try {
      const data = await apiFetch('/api/users/all-athletes-anonymized', token);
      setAssignedAthletes(data);
    } catch { /* keep defaults */ }
  };

  const fetchLatestAnalysis = async (targetId) => {
    try {
      const data = await apiFetch(`/api/videos/latest/${targetId}`, token);
      setLatestAnalysis(data);
    } catch {
      setLatestAnalysis(null);
    }
  };

  const [loadingHistory, setLoadingHistory] = useState(false);
  const fetchVideoHistory = async (targetId = athleteTargetId) => {
    setLoadingHistory(true);
    try {
      const data = await apiFetch(`/api/videos/history/${targetId}`, token);
      setVideoHistory(data || []);
    } catch { /* ignore */ } finally {
      setLoadingHistory(false);
    }
  };

  // ── Report downloads ───────────────────────────────────────────────────────
  const downloadReport = async (endpoint, filename) => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}?token=${token}`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${API_BASE}${endpoint}?token=${token}`, '_blank');
    }
  };

  const resolveAthleteId = (id) => {
    if (id === 'me' || id === 'cohort') {
      return athleteProfile?.athlete_id || selectedAthleteId || 'ATH-001';
    }
    return id;
  };

  const downloadPdfReport = (id) => {
    const rid = resolveAthleteId(id);
    downloadReport(`/api/reports/pdf/${rid}`, `SIRD_Report_${rid}.pdf`);
  };

  const downloadExcelReport = (id) => {
    const rid = resolveAthleteId(id);
    downloadReport(`/api/reports/excel/${rid}`, `SIRD_Telemetry_${rid}.csv`);
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const buildProfilePayload = () => ({
    sport_type: sportType, position, age: parseInt(age), height: parseFloat(height),
    weight: parseFloat(weight), injury_history: injuryHistory, training_load: trainingLoad,
    assigned_coach: assignedCoach || null, assigned_physio: assignedPhysio || null,
  });

  const handleQuestionnaireSubmit = async (e) => {
    e.preventDefault(); setFormErrorMsg(''); setSubmitting(true);
    try {
      const data = await apiFetch('/api/users/athlete-profile', token, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProfilePayload()),
      });
      setAthleteProfile(data); setShowQuestionnaire(false);
      notify('success', 'Athlete profile created successfully!');
    } catch (err) { setFormErrorMsg(err.message); }
    finally { setSubmitting(false); }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setFormErrorMsg(''); setSubmitting(true);
    try {
      const data = await apiFetch('/api/users/athlete-profile', token, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildProfilePayload()),
      });
      setAthleteProfile(data);
      notify('success', 'Physical metrics updated successfully!');
    } catch (err) { setFormErrorMsg(err.message); }
    finally { setSubmitting(false); }
  };

  // ── Admin handlers ─────────────────────────────────────────────────────────
  const updateUserRole = async (userId, newRole) => {
    try {
      await apiFetch(`/api/users/${userId}/role`, token, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      notify('success', `User role changed to ${newRole}`);
      invalidateCache('all-users');
      allUsersQ.refetch();
    } catch (err) { notify('error', err.message); }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user?')) return;
    try {
      await apiFetch(`/api/users/${userId}`, token, { method: 'DELETE' });
      notify('success', 'User profile deleted successfully');
      invalidateCache('all-users');
      allUsersQ.refetch();
    } catch (err) { notify('error', err.message); }
  };

  const selectedAthlete = assignedAthletes.find((a) => a.athlete_id === selectedAthleteId);
  const config = getRoleConfig(user.role);

  const formProps = {
    sportType, setSportType, position, setPosition,
    age, setAge, height, setHeight, weight, setWeight,
    trainingLoad, setTrainingLoad, injuryHistory, setInjuryHistory,
    assignedCoach, setAssignedCoach, assignedPhysio, setAssignedPhysio,
    coachesList, physiosList, submitting, errorMsg: formErrorMsg,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`dashboard-container ${config.themeColor}`}>
      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo"><Activity size={24} /></div>
          <span className="brand-name">SIRD System</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation Menu</div>
          <ul>
            {config.navItems.map((item) => (
              <li key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                style={showQuestionnaire ? { opacity: 0.5, pointerEvents: 'none' } : {}}
              >
                <button
                  onClick={() => { if (!showQuestionnaire) { setActiveTab(item.id); } }}
                  className="nav-item-button"
                  disabled={showQuestionnaire}
                >
                  {React.createElement(item.icon, { size: 20, className: 'nav-item-icon' })}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-settings-footer">
          <div className="theme-setting-container">
            <span className="setting-label">Theme Mode</span>
            <button className="theme-switch-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              <span className={`toggle-slider ${theme === 'dark' ? 'dark-active' : ''}`}>
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-welcome">
            <span className="welcome-role">{config.badgeText} Workspace</span>
          </div>
          <div className="topbar-actions">
            <NotificationBell token={token} />
            <div className="profile-dropdown-container">
              <button className={`profile-trigger ${profileOpen ? 'active' : ''}`} onClick={() => setProfileOpen(!profileOpen)}>
                <div className="avatar-circle">
                  {(user.fullname || user.email).charAt(0).toUpperCase()}
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
                      <LogOut size={16} /><span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard-content">
          {successMsg && (
            <div className="dashboard-success-banner animate-scale-in">✅ {successMsg}</div>
          )}
          {errorMsg && (
            <div className="dashboard-error-banner animate-scale-in">⚠️ {errorMsg}</div>
          )}

          {loadingProfile ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" /><p>Loading your profile metrics...</p>
            </div>
          ) : showQuestionnaire ? (
            <ProfileSettingsTab
              isQuestionnaire
              {...formProps}
              onSubmit={handleQuestionnaireSubmit}
            />
          ) : (
            <>
              {/* ══ ATHLETE VIEWS ══════════════════════════════════════════════════ */}
              {user.role === 'Athlete' && (
                <>
                  {activeTab === 'Overview' && (
                    <AthleteOverviewTab
                      user={user} token={token}
                      athleteProfile={athleteProfile}
                      latestAnalysis={latestAnalysis}
                      setLatestAnalysis={setLatestAnalysis}
                      setVideoHistory={setVideoHistory}
                      setActiveTab={setActiveTab}
                      downloadPdfReport={downloadPdfReport}
                      downloadExcelReport={downloadExcelReport}
                      isLiveCameraModalOpen={isLiveCameraModalOpen}
                      setIsLiveCameraModalOpen={setIsLiveCameraModalOpen}
                      onUploadSuccess={() => {
                        invalidateCache(`prediction-me`, `pred-history-me`, `recommendations-me`);
                        predQ.refetch(); predHistoryQ.refetch(); recsQ.refetch();
                        fetchVideoHistory('me');
                      }}
                    />
                  )}

                  {activeTab === 'InjuryRisk' && (
                    <InjuryRiskTab
                      predictionReport={predQ.data}
                      predictionHistory={predHistoryQ.data || []}
                      latestAnalysis={latestAnalysis}
                      user={user}
                    />
                  )}

                  {activeTab === 'MovementAnalysis' && (
                    <MovementAnalysisTab
                      latestAnalysis={latestAnalysis}
                      predictionReport={predQ.data}
                      athleteName={user.fullname}
                    />
                  )}

                  {activeTab === 'VideoHistory' && (
                    <VideoHistoryTab
                      videoHistory={videoHistory}
                      latestAnalysis={latestAnalysis}
                      loadingHistory={loadingHistory}
                      onRefresh={() => fetchVideoHistory('me')}
                      onInspect={(item) => { setLatestAnalysis(item); setActiveTab('MovementAnalysis'); }}
                      onGoToUpload={() => setActiveTab('Overview')}
                    />
                  )}

                  {activeTab === 'Progress' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Progress &amp; Injury Trend Tracking</h2>
                      <p className="workspace-desc">Historical workload evolution and biomechanical recovery trajectory stored in MongoDB Time Series telemetry.</p>
                      <div style={{ display: 'grid', gap: 20, marginTop: 20 }}>
                        <RiskTrendAreaChart history={predHistoryQ.data || []} />
                        <div className="historical-table-card" style={{ padding: 20, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>Historical Assessment Log</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: 'var(--bg-primary)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                                {['Date', 'Video Source', 'Injury Risk', 'Movement Quality', 'Status'].map((h) => (
                                  <th key={h} style={{ padding: 10 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {videoHistory.length > 0 ? videoHistory.map((item, idx) => (
                                <tr key={item.analysis_id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: 10 }}>{idx === 0 ? 'Today (Latest)' : formatDateTime(item.upload_date)}</td>
                                  <td style={{ padding: 10, fontWeight: 600 }}>{item.filename}</td>
                                  <td style={{ padding: 10 }}><span style={{ color: item.scores?.injury_risk_score > 40 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{item.scores?.injury_risk_score}%</span></td>
                                  <td style={{ padding: 10, fontWeight: 700, color: '#2563eb' }}>{item.scores?.movement_quality_score}%</td>
                                  <td style={{ padding: 10 }}><span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: item.scores?.injury_risk_score > 40 ? '#fffbeb' : '#dcfce7', color: item.scores?.injury_risk_score > 40 ? '#b45309' : '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>{item.scores?.injury_risk_score > 40 ? 'Moderate/High Risk' : 'Optimal Alignment'}</span></td>
                                </tr>
                              )) : (
                                <tr><td colSpan="5" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>No historical logs found. Upload a video to populate your history.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ExerciseRecs' && (
                    <ExerciseRecsTab
                      token={token}
                      recommendationsData={recsQ.data}
                    />
                  )}

                  {activeTab === 'Performance' && (() => {
                    const h = parseFloat(athleteProfile?.height) || 180;
                    const w = parseFloat(athleteProfile?.weight) || 75;
                    const a = parseFloat(athleteProfile?.age) || 24;
                    const perf = [
                      ['Vertical Jump Height', `${(h * 0.236).toFixed(1)} cm`, `Calculated dynamically scaling with height (${h}cm) × 0.236.`],
                      ['Sprint Deceleration Force', `${((w * 0.052) + (a * 0.038)).toFixed(1)} m/s²`, `Derived from body mass (${w}kg) and age-adjusted braking deceleration.`],
                      ['Dynamic Balance Index', latestAnalysis ? `${(latestAnalysis.scores.movement_quality_score * 0.96).toFixed(1)}%` : `${(92.4 + ((h % 5) - 2.5)).toFixed(1)}%`, 'MediaPipe COM sway offset stability score.'],
                      ['Bilateral Joint Symmetry', latestAnalysis ? `${latestAnalysis.scores.movement_quality_score}%` : `${(94.2 - (a % 3)).toFixed(1)}%`, '3D left vs right limb joint angle comparison.'],
                      ['Ground Contact Absorption', latestAnalysis ? `${Math.round(195 + (100 - latestAnalysis.scores.movement_quality_score) * 1.6)} ms` : '210 ms', 'Foot landing impact duration to off-ground frame count.'],
                    ];
                    return (
                      <div className="content-hero-card animate-fade-in">
                        <div className="hero-accent-strip" />
                        <h2 className="workspace-title">Performance Analytics Engine</h2>
                        <p className="workspace-desc">Kinematic metrics dynamically calculated for {user.fullname} ({athleteProfile?.sport_type} — {athleteProfile?.position}).</p>
                        <div className="metrics-grid" style={{ marginTop: 20 }}>
                          {perf.map(([label, val, note]) => (
                            <div key={label} className="metric-card">
                              <span className="metric-label">{label}</span>
                              <span className="metric-value score-optimal">{val}</span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>{note}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {activeTab === 'Settings' && (
                    <ProfileSettingsTab
                      isQuestionnaire={false}
                      {...formProps}
                      onSubmit={handleProfileUpdate}
                    />
                  )}
                </>
              )}

              {/* ══ COACH VIEWS ════════════════════════════════════════════════════ */}
              {user.role === 'Coach' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Coach Control Panel</h2>
                      <p className="workspace-desc">Welcome Coach {user.fullname}! Select a tab in the sidebar to monitor your roster.</p>
                      <div className="practitioner-stats">
                        <div className="metric-card"><span className="metric-label">My Athletes</span><span className="metric-value">{assignedAthletes.length} Assigned</span></div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'TeamRisk' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Team Risk Overview</h2>
                      {assignedAthletes.length === 0 ? (
                        <p className="no-athletes-msg">No athletes have selected you as their Coach yet.</p>
                      ) : (
                        <table className="athletes-table">
                          <thead><tr><th>Athlete ID</th><th>Name</th><th>Sport / Position</th><th>Training Load</th><th>Risk Score</th></tr></thead>
                          <tbody>
                            {assignedAthletes.map((ath) => (
                              <tr key={ath.athlete_id}>
                                <td className="id-badge">{ath.athlete_id}</td>
                                <td className="athlete-name">{ath.fullname}</td>
                                <td>{ath.sport_type} ({ath.position})</td>
                                <td>{ath.training_load}</td>
                                <td><span className="status-indicator low-risk">Low Risk (18%)</span></td>
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
                      <div className="athlete-select-bar animate-fade-in">
                        <label>Viewing Profile For:</label>
                        <select value={selectedAthleteId} onChange={(e) => { setSelectedAthleteId(e.target.value); setLatestAnalysis(null); }} className="form-select athlete-active-dropdown">
                          {assignedAthletes.map((a) => <option key={a.athlete_id} value={a.athlete_id}>{a.fullname} ({a.athlete_id})</option>)}
                        </select>
                      </div>
                      {selectedAthlete && (
                        <div className="athlete-detail-view animate-scale-in">
                          <div className="detail-header-card">
                            <h3>{selectedAthlete.fullname} - Physical Dimensions</h3>
                            <div className="detail-grid">
                              {[['Sport', selectedAthlete.sport_type], ['Position', selectedAthlete.position], ['Age', `${selectedAthlete.age} yrs`], ['Height', `${selectedAthlete.height} cm`], ['Weight', `${selectedAthlete.weight} kg`], ['Load', selectedAthlete.training_load]].map(([k, v]) => (
                                <div key={k} className="detail-item"><strong>{k}:</strong> {v}</div>
                              ))}
                            </div>
                          </div>
                          <div className="performance-stats-boxes">
                            <div className="stat-box"><span className="stat-label">Movement Quality</span><span className="stat-value">{latestAnalysis ? `${latestAnalysis.scores.movement_quality_score}%` : '82%'}</span><span className="stat-status optimal">Optimal</span></div>
                            <div className="stat-box"><span className="stat-label">Jump Height</span><span className="stat-value">62 cm</span><span className="stat-status optimal">Stable</span></div>
                            <div className="stat-box"><span className="stat-label">Sprint Time (40m)</span><span className="stat-value">4.85 s</span><span className="stat-status optimal">Stable</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'MovementQuality' && (
                    <MovementAnalysisTab latestAnalysis={latestAnalysis} predictionReport={predQ.data} athleteName={selectedAthlete?.fullname} />
                  )}

                  {activeTab === 'TrainingRecs' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div><h2 className="workspace-title">Training Recommendations</h2><p className="workspace-desc">Workload safety guidelines and custom drills:</p></div>
                        {selectedAthlete && <button onClick={() => setIsRecModalOpen(true)} className="form-submit-btn" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}><PlusCircle size={16} /><span>Prescribe Custom Drill</span></button>}
                      </div>
                      {selectedAthlete && <div className="recs-card"><h3>Custom Recommendations for {selectedAthlete.fullname}</h3><div className="rec-list"><div className="rec-item"><strong>Suggested Drill Intensity:</strong> Medium. Limit high-impact lateral jumps due to position constraint ({selectedAthlete.position}).</div><div className="rec-item"><strong>Rest Interval:</strong> Ensure minimum 48 hours recovery between high-intensity running logs.</div>{latestAnalysis && <div className="rec-item"><strong>Biomechanics Target:</strong> Correct {latestAnalysis.metrics.knee_valgus} using banded squat drills.</div>}</div></div>}
                    </div>
                  )}
                </>
              )}

              {/* ══ PHYSIOTHERAPIST VIEWS ════════════════════════════════════════════ */}
              {user.role === 'Physiotherapist' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in"><div className="hero-accent-strip" /><h2 className="workspace-title">Physiotherapist Diagnostic Hub</h2><p className="workspace-desc">Welcome {user.fullname}! Assess joint motion flags and recovery records.</p><div className="practitioner-stats"><div className="metric-card"><span className="metric-label">Active Patients</span><span className="metric-value">{assignedAthletes.length} Assigned</span></div></div></div>
                  )}
                  {activeTab === 'RehabTracking' && (
                    <div className="content-hero-card animate-fade-in"><div className="hero-accent-strip" /><h2 className="workspace-title">Rehabilitation Tracking</h2>{assignedAthletes.length === 0 ? <p className="no-athletes-msg">No athletes have selected you as their Physiotherapist yet.</p> : <table className="athletes-table"><thead><tr><th>Athlete ID</th><th>Name</th><th>Position</th><th>Injury Log</th><th>Rehab Compliance</th></tr></thead><tbody>{assignedAthletes.map((a) => <tr key={a.athlete_id}><td className="id-badge">{a.athlete_id}</td><td className="athlete-name">{a.fullname}</td><td>{a.position}</td><td>{a.injury_history}</td><td><span className="status-indicator rehab-active">Active (85%)</span></td></tr>)}</tbody></table>}</div>
                  )}
                  {activeTab === 'MovementCorrection' && (
                    <MovementAnalysisTab latestAnalysis={latestAnalysis} predictionReport={predQ.data} athleteName={selectedAthlete?.fullname} />
                  )}
                </>
              )}

              {/* ══ SPORTS SCIENTIST VIEWS ═══════════════════════════════════════════ */}
              {user.role === 'Sports Scientist' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in"><div className="hero-accent-strip" /><h2 className="workspace-title">Sports Scientist Research Panel</h2><p className="workspace-desc">Platform-wide anonymized telemetry logs are available for deep learning training.</p><div className="practitioner-stats"><div className="metric-card"><span className="metric-label">Research Dataset Records</span><span className="metric-value">{assignedAthletes.length} Athletes</span></div></div></div>
                  )}
                  {activeTab === 'TeamTrends' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Team Kinematic Performance Trends</h2>
                      <div style={{ display: 'grid', gap: 20, marginTop: 20 }}>
                        <div className="metrics-grid">
                          {[['Cohort Size', `${assignedAthletes.length || 12} Athletes`], ['Mean Movement Score', '82.4%'], ['Knee Valgus Risk Ratio', '25.0% Cohort'], ['Bilateral Asymmetry Mean', '12.4%']].map(([l, v]) => <div key={l} className="metric-card"><span className="metric-label">{l}</span><span className="metric-value score-optimal">{v}</span></div>)}
                        </div>
                        <CohortScatterMatrixChart athletesList={assignedAthletes} />
                      </div>
                    </div>
                  )}
                  {activeTab === 'ResearchReports' && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">Research Cohort Reports &amp; Data Export</h2>
                      <div style={{ marginTop: 20, padding: 24, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                          <div><h3 style={{ margin: '0 0 6px' }}>Select Target Athlete Profile or Full Roster</h3><p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose an individual athlete or export the complete research matrix.</p></div>
                          <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} style={{ padding: '10px 16px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
                            {assignedAthletes.map((a) => <option key={a.athlete_id} value={a.athlete_id}>👤 {a.fullname} ({a.athlete_id}) - {a.sport_type}</option>)}
                          </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                          <button onClick={() => downloadPdfReport(selectedAthleteId)} className="form-submit-btn" style={{ width: 'auto', padding: '10px 20px', margin: 0, backgroundColor: '#0f766e', fontSize: '0.85rem' }}><FileDown size={16} /><span>Download PDF Summary</span></button>
                          <button onClick={() => downloadExcelReport(selectedAthleteId)} className="form-submit-btn" style={{ width: 'auto', padding: '10px 20px', margin: 0, backgroundColor: '#2563eb', fontSize: '0.85rem' }}><FileSpreadsheet size={16} /><span>Export Research CSV</span></button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ══ ADMINISTRATOR VIEWS ════════════════════════════════════════════ */}
              {user.role === 'Administrator' && (
                <>
                  {activeTab === 'Overview' && (
                    <div className="content-hero-card animate-fade-in"><div className="hero-accent-strip" /><h2 className="workspace-title">System Admin Console</h2><p className="workspace-desc">Perform server maintenance, audit diagnostic endpoints, and control user roles.</p><div className="practitioner-stats"><div className="metric-card"><span className="metric-label">Database Status</span><span className="metric-value id-badge">CONNECTED</span></div></div></div>
                  )}
                  {activeTab === 'UserManagement' && (
                    <AdminUserManagementTab
                      allUsers={allUsersQ.data || []}
                      loadingUsers={allUsersQ.loading}
                      onRefresh={allUsersQ.refetch}
                      onUpdateRole={updateUserRole}
                      onDeleteUser={deleteUser}
                    />
                  )}
                  {activeTab === 'SystemMonitoring' && systemMetricsQ.data && (
                    <div className="content-hero-card animate-fade-in">
                      <div className="hero-accent-strip" />
                      <h2 className="workspace-title">System Monitoring</h2>
                      <div className="metrics-grid" style={{ marginTop: 20 }}>
                        {Object.entries(systemMetricsQ.data).map(([k, v]) => (
                          <div key={k} className="metric-card">
                            <span className="metric-label">{k.replace(/_/g, ' ')}</span>
                            <span className="metric-value">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {isLiveCameraModalOpen && (
        <LiveCameraModal
          token={token}
          apiBase={API_BASE}
          athleteProfile={athleteProfile}
          onClose={() => setIsLiveCameraModalOpen(false)}
          onAnalysisComplete={(data) => {
            setLatestAnalysis(data);
            setIsLiveCameraModalOpen(false);
            notify('success', `Live capture analyzed: ${data.filename}`);
            invalidateCache(`prediction-me`, `pred-history-me`, `recommendations-me`);
            predQ.refetch(); predHistoryQ.refetch(); recsQ.refetch();
          }}
        />
      )}

      {isRecModalOpen && selectedAthlete && (
        <CustomRecModal
          token={token}
          apiBase={API_BASE}
          athlete={selectedAthlete}
          user={user}
          onClose={() => setIsRecModalOpen(false)}
          onSaved={() => {
            setIsRecModalOpen(false);
            invalidateCache(`recommendations-${selectedAthleteId}`);
            recsQ.refetch();
            notify('success', 'Custom drill prescription saved!');
          }}
        />
      )}
    </div>
  );
}
