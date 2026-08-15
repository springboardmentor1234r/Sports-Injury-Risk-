"use client";

import { MinimalProfessionalCard } from "@/components/ui/analytics-dashboard";
import { FileUploader } from "@/components/ui/file-uploader";
import { AuthForm } from "@/components/ui/auth-form";
import { LandingPage } from "@/components/Landing_page";
import { Sidebar, ViewType } from "@/components/ui/sidebar";
import { ProfileForm } from "@/components/ui/profile-form";
import { SettingsView } from "@/components/ui/settings-view";
import { CoachDashboard } from "@/components/ui/coach-dashboard";
import { DashboardView as AthleteDashboardView } from "@/components/ui/athlete/DashboardView";
import { AnalysisHistoryView as AthleteAnalysisHistoryView } from "@/components/ui/athlete/AnalysisHistoryView";
import { RecommendationsView as AthleteRecommendationsView } from "@/components/ui/athlete/RecommendationsView";
import { ReportsView as AthleteReportsView } from "@/components/ui/athlete/ReportsView";
import { ReportDetailModal } from "@/components/ui/athlete/ReportDetailModal";
import { ExerciseDetailModal } from "@/components/ui/athlete/ExerciseDetailModal";
import { OpsPortal } from "@/components/ui/ops/OpsPortal";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ChatWidget } from "@/components/ui/ChatWidget";
import { useState, useEffect } from "react";
import { Loader2, Award, Users, Search, Send, ArrowLeft } from "lucide-react";
import toast from 'react-hot-toast';

export default function Home() {
  const [hasData, setHasData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // RBAC & Dashboard Role Routing
  const [activeDashboard, setActiveDashboard] = useState<'athlete' | 'coach' | 'ops' | null>(null);

  // Layout View State
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [isLockedToProfile, setIsLockedToProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // Athlete Coach Connection Widget States
  const [currentCoachStatus, setCurrentCoachStatus] = useState<any>(null);
  const [coachQuery, setCoachQuery] = useState('');
  const [coachSearchResults, setCoachSearchResults] = useState<any[]>([]);
  const [isSearchingCoaches, setIsSearchingCoaches] = useState(false);
  // Athlete Sessions History
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeRecSession, setActiveRecSession] = useState<any>(null);
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [activeReportSession, setActiveReportSession] = useState<any>(null);

  const fetchSessionsHistory = async (authToken: string) => {
    setIsLoadingSessions(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/history`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        if (data.length > 0) {
          setActiveRecSession(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions history", e);
    } finally {
      setIsLoadingSessions(false);
    }
  };
  useEffect(() => {
    // Check if token exists on mount
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedDashboard = localStorage.getItem("activeDashboard") as 'athlete' | 'coach' | 'ops' | null;

    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);

      // Sync fresh user metadata (like profile avatar) from backend database
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const freshUser = {
            id: data.user.user_id || data.user.id,
            email: data.user.email,
            full_name: data.user.full_name,
            roles: data.user.roles,
            profile_picture_url: data.user.profile_picture_url,
            coach_code: data.user.coach_code
          };
          setUser(freshUser);
          localStorage.setItem("user", JSON.stringify(freshUser));
        }
      })
      .catch(err => console.error("Failed to sync user on mount", err));

      const roles = parsedUser.roles || [];
      if (savedDashboard === 'ops' || roles.includes('admin')) {
        setActiveDashboard('ops');
        localStorage.setItem('activeDashboard', 'ops');
      } else if (savedDashboard) {
        setActiveDashboard(savedDashboard as 'athlete' | 'coach');
        if (savedDashboard === 'athlete') {
          checkProfileStatus(savedToken);
          fetchCoachStatus(savedToken);
          fetchSessionsHistory(savedToken);
        }
      } else if (roles.includes("coach") && roles.includes("athlete")) {
        setActiveDashboard(null); // Force selection screen
      } else if (roles.includes("coach")) {
        setActiveDashboard("coach");
        localStorage.setItem("activeDashboard", "coach");
      } else {
        setActiveDashboard("athlete");
        localStorage.setItem("activeDashboard", "athlete");
        checkProfileStatus(savedToken);
        fetchCoachStatus(savedToken);
        fetchSessionsHistory(savedToken);
      }
    }
  }, []);

  // Auto-poll coach status every 5 s while pending — stops once accepted
  useEffect(() => {
    if (!token || activeDashboard !== 'athlete') return;
    if (currentCoachStatus?.status === 'pending') {
      const interval = setInterval(() => {
        fetchCoachStatus(token);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, activeDashboard, currentCoachStatus?.status]);



  const fetchCoachStatus = async (authToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athlete-status`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentCoachStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch coach status", e);
    }
  };


  async function checkProfileStatus(authToken: string) {
    setIsCheckingProfile(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.is_default) {
          setIsLockedToProfile(true);
          setActiveView('profile');
        }
      }
    } catch (e) {
      console.error("Failed to check profile status", e);
    } finally {
      setIsCheckingProfile(false);
    }
  }

  const handleLogin = (jwt: string, userData: any) => {
    // Reset all previous session state
    setHasData(false);
    setDashboardData(null);
    setActiveView('dashboard');
    setIsLockedToProfile(false);

    setToken(jwt);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));

    // Sync authoritative user metadata (such as coach_code and avatar) from backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${jwt}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        const freshUser = {
          id: data.user.user_id || data.user.id,
          email: data.user.email,
          full_name: data.user.full_name,
          roles: data.user.roles,
          profile_picture_url: data.user.profile_picture_url,
          coach_code: data.user.coach_code
        };
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      }
    })
    .catch(err => console.error("Failed to sync user on login", err));

    const roles = userData.roles || [];
    if (roles.includes('admin')) {
      setActiveDashboard('ops');
      localStorage.setItem('activeDashboard', 'ops');
    } else if (roles.includes("coach") && roles.includes("athlete")) {
      setActiveDashboard(null); // Choose role selection screen
    } else if (roles.includes("coach")) {
      setActiveDashboard("coach");
      localStorage.setItem("activeDashboard", "coach");
    } else {
      setActiveDashboard("athlete");
      localStorage.setItem("activeDashboard", "athlete");
      checkProfileStatus(jwt);
      fetchCoachStatus(jwt);
      fetchSessionsHistory(jwt);
    }
  };

  useEffect(() => {
    // Handle OAuth redirection from Google
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const urlUser = params.get("user");
    const urlError = params.get("error");

    if (urlError) {
      toast.error(`Google Authentication Failed: ${urlError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlToken && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        handleLogin(urlToken, parsedUser);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {
        console.error("Failed to parse OAuth user data", e);
      }
    }
  }, []);

  const handleSelectDashboard = (role: 'athlete' | 'coach') => {
    setActiveDashboard(role);
    localStorage.setItem("activeDashboard", role);
    setActiveView('dashboard');
    if (role === 'athlete' && token) {
      checkProfileStatus(token);
      fetchCoachStatus(token);
      fetchSessionsHistory(token);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setHasData(false);
    setDashboardData(null);
    setActiveDashboard(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeDashboard");
    setActiveView('dashboard');
    setIsLockedToProfile(false);
  };

  const handleProfileSaved = () => {
    setIsLockedToProfile(false);
  };

  const handleOpenSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const sessionData = await res.json();
        setDashboardData(sessionData);
        setHasData(true);
        setActiveView('dashboard');
      }
    } catch (e) {
      console.error("Failed to load session", e);
    }
  };
  const handleDownloadReport = async (session: any) => {
    if (!session) return;
    const format = localStorage.getItem("downloadFormat") || "pdf";

    if (format === "txt") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${session.session_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const rec = data.recommendations;
          let textContent = `MoveIQ BIOMECHANICAL ASSESSMENT SUMMARY
Session ID: ${session.session_id}
Video Name: ${session.video_name}
Risk Level: ${session.risk_data?.risk_category || 'N/A'}
Health Score: ${session.risk_data?.overall_health_score || 'N/A'}/100

AI INSIGHT SUMMARY:
${rec.one_line_summary}

`;
          if (rec.categories && rec.categories.length > 0) {
            rec.categories.forEach((cat: any, i: number) => {
              textContent += `${i + 1}. Category: ${cat.category_name.replace(/_/g, ' ')}\n`;
              textContent += `   Explanation: ${cat.explanation}\n`;
              textContent += `   Recommended Exercises:\n`;
              cat.recommended_exercises?.forEach((ex: string) => {
                textContent += `     - ${ex}\n`;
              });
              textContent += `\n`;
            });
          }
          textContent += `WRAP UP:\n${rec.wrap_up_summary}\n`;

          const blob = new Blob([textContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `MoveIQ_Plan_${session.video_name.replace('.mp4', '')}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          let textContent = `MoveIQ BIOMECHANICAL ASSESSMENT SUMMARY
Session ID: ${session.session_id}
Video Name: ${session.video_name}
Risk Level: ${session.risk_data?.risk_category || 'N/A'}
Health Score: ${session.risk_data?.overall_health_score || 'N/A'}/100
Biomechanical Efficiency: ${session.risk_data?.biomechanical_efficiency_score || 'N/A'}%

Note: AI Corrective Recommendation plan is not generated yet. Launch Recommendations tab to generate.`;
          const blob = new Blob([textContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `MoveIQ_Report_${session.video_name.replace('.mp4', '')}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Failed to download text report", e);
      }
    } else {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/${session.session_id}/report/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `MoveIQ_Report_${session.video_name.replace('.mp4', '')}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (e) {
        console.error("Failed to download report", e);
      }
    }
  };

  const handleSearchCoaches = async (query: string) => {
    setCoachQuery(query);
    if (!query.trim()) {
      setCoachSearchResults([]);
      return;
    }
    setIsSearchingCoaches(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/coaches/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCoachSearchResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingCoaches(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        if (dashboardData?.session_id === sessionId) {
          setDashboardData(null);
          setHasData(false);
        }
      } else {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete session');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRequestCoach = async (coachId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coach_id: coachId })
      });
      if (res.ok) {
        setCoachQuery('');
        setCoachSearchResults([]);
        fetchCoachStatus(token || '');
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to send request");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <LandingPage 
          onLogin={() => setAuthView('login')} 
          onSignUp={() => setAuthView('register')} 
        />
      );
    }
    return (
      <AuthForm 
        initialMode={authView === 'register' ? 'register' : 'login'} 
        onBack={() => setAuthView('landing')} 
        onSuccess={handleLogin} 
      />
    );
  }

  // Internal Operations Portal — activated only when account holds the ops role
  if (activeDashboard === 'ops') {
    return (
      <OpsPortal
        token={token!}
        user={user}
        onLogout={handleLogout}
        onUserUpdate={(newUser) => {
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
        }}
      />
    );
  }

  // Dashboard role selector (Dual-role user has logged in, needs choice)
  if (activeDashboard === null) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Choose Dashboard</h2>
            <p className="text-slate-400 text-sm mt-1">Select the role workspace you want to load.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleSelectDashboard('athlete')}
              className="w-full p-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-3 group transition-all"
            >
              <Award className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue as Athlete
            </button>
            
            <button
              onClick={() => handleSelectDashboard('coach')}
              className="w-full p-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-2xl border border-slate-700 flex items-center justify-center gap-3 group transition-all"
            >
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Continue as Coach
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-rose-450 transition-colors font-bold uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      </main>
    );
  }

  if (isCheckingProfile) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </main>
    );
  }

  return (
    <main className="h-screen w-screen bg-[#f7f9fd] flex overflow-hidden">
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        userName={user?.full_name}
        profilePictureUrl={user?.profile_picture_url}
        isLockedToProfile={isLockedToProfile}
        token={token || undefined}
        activeDashboard={activeDashboard}
        onSwitchDashboard={(role) => handleSelectDashboard(role)}
        userRoles={user?.roles}
        latestRisk={sessions.length > 0 && sessions[0].risk_data ? { score: sessions[0].risk_data.overall_health_score, category: sessions[0].risk_data.risk_category || 'Low Risk' } : null}
      />

      <div className="flex-1 h-full overflow-y-auto relative">
        
        {/* Athlete Notification & Chat (Floating Top Right) */}
        {activeDashboard === 'athlete' && token && (
          <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full p-1 border border-slate-200 shadow-sm">
            <ChatWidget token={token} role={activeDashboard} userId={user?.id || user?.user_id} />
            <NotificationBell token={token} />
          </div>
        )}
        
        {/* ── Coach Dashboard Render ── */}
        {activeDashboard === 'coach' && ['dashboard', 'my_athletes', 'teams', 'notifications', 'add_athlete', 'upload_video'].includes(activeView) && (
          <CoachDashboard 
            token={token || ''} 
            currentView={activeView as any}
            userName={user?.full_name}
            profilePictureUrl={user?.profile_picture_url}
            coachCode={user?.coach_code}
            userId={user?.id || user?.user_id}
          />
        )}

        {/* ── Athlete Dashboard Render ── */}
        {activeView === 'dashboard' && activeDashboard === 'athlete' && (
          <div className="w-full min-h-screen p-8 bg-[#faf8ff] dark:bg-slate-950 text-[#191c1f] dark:text-slate-100 transition-colors">
            {hasData && dashboardData ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setDashboardData(null);
                    setHasData(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl font-bold text-xs text-[#004ccd] dark:text-blue-400 hover:bg-[#f2f4f6] dark:hover:bg-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard Overview
                </button>
                <MinimalProfessionalCard 
                    token={token || undefined}
                    sessionId={dashboardData.session_id}
                    healthScore={dashboardData.risk_data?.overall_health_score || 0}
                    riskCategory={dashboardData.risk_data?.risk_category || "Unknown"}
                    efficiency={dashboardData.risk_data?.biomechanical_efficiency_score || 0}
                    sessionsAnalyzed={1}
                    flaggedIssues={
                      Array.isArray(dashboardData.risk_data?.flagged_issues)
                        ? dashboardData.risk_data.flagged_issues.map((i: any) => i.issue || i)
                        : typeof dashboardData.risk_data?.flagged_issues === 'string' && dashboardData.risk_data?.flagged_issues !== 'None'
                          ? dashboardData.risk_data.flagged_issues.split(' | ') 
                          : []
                    }
                    isProcessing={isProcessing}
                    videoUrl={dashboardData.video_url}
                    videoName={dashboardData.video_name}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {/* Uploader Card */}
                <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-[#191c1f] dark:text-white uppercase tracking-wider mb-4">Analyze Movement Video</h3>
                  <FileUploader 
                      token={token || undefined} 
                      onUploadStart={() => setIsProcessing(true)}
                      onUploadSuccess={(data) => {
                          setDashboardData(data);
                          setHasData(true);
                          setIsProcessing(false);
                          fetchSessionsHistory(token || '');
                      }} 
                  />
                </div>
                <AthleteDashboardView 
                  athlete={user}
                  sessions={sessions}
                  isLoading={isLoadingSessions}
                  onSelectTab={(tab) => {
                    if (tab === 'analysis_history') setActiveView('analysis_history');
                    else if (tab === 'recommendations_history') setActiveView('recommendations_history');
                    else if (tab === 'profile') setActiveView('profile');
                    else if (tab === 'settings') setActiveView('settings');
                    else {
                      setActiveView(tab);
                      if (tab === 'dashboard') {
                        setHasData(false);
                      }
                    }
                  }}
                  onOpenSession={handleOpenSession}
                  onDownloadReport={handleDownloadReport}
                  currentCoachStatus={currentCoachStatus}
                  coachQuery={coachQuery}
                  onCoachQueryChange={handleSearchCoaches}
                  coachSearchResults={coachSearchResults}
                  isSearchingCoaches={isSearchingCoaches}
                  onRequestCoach={handleRequestCoach}
                />
              </div>
            )}
          </div>
        )}

        {activeView === 'profile' && (
          <div className="min-h-screen p-8 bg-[#faf8ff] flex flex-col justify-center">
             <ProfileForm 
               token={token || ""} 
               onProfileSaved={handleProfileSaved} 
               user={user} 
               onUserUpdate={(newUser) => {
                 setUser(newUser);
                 localStorage.setItem("user", JSON.stringify(newUser));
               }} 
             />
          </div>
        )}

        {activeView === 'settings' && (
          <div className="min-h-screen p-8 bg-[#faf8ff] flex flex-col justify-center">
             <SettingsView 
               token={token || ""} 
               user={user} 
               onUserUpdate={(newUser) => {
                 setUser(newUser);
                 localStorage.setItem("user", JSON.stringify(newUser));
               }}
             />
          </div>
        )}

        {activeView === 'analysis_history' && (
          <div className="min-h-screen p-8 bg-[#faf8ff] flex flex-col justify-start pt-16">
             <AthleteAnalysisHistoryView 
               sessions={sessions} 
               onOpenSession={handleOpenSession} 
               onDeleteSession={handleDeleteSession}
               token={token || ""}
             />
          </div>
        )}

        {activeView === 'recommendations_history' && (
          <div className="min-h-screen p-8 bg-[#faf8ff] flex flex-col justify-start pt-16">
            {activeRecSession ? (
              <AthleteRecommendationsView 
                session={activeRecSession}
                sessions={sessions}
                onSelectSession={(s) => setActiveRecSession(s)}
                token={token || ""}
                onDeleteSession={handleDeleteSession}
              />
            ) : (
              <div className="max-w-2xl mx-auto w-full text-center p-12 bg-white border border-[#c3c6d7] rounded-xl text-[#737686]">
                No sessions available for corrective exercise recommendations.
              </div>
            )}
          </div>
        )}

        {activeView === 'reports' && (
          <div className="min-h-screen p-8 bg-[#faf8ff] flex flex-col justify-start pt-16">
             <AthleteReportsView 
               sessions={sessions} 
               onOpenReportModal={(s) => setActiveReportSession(s)}
               onDeleteSession={handleDeleteSession}
             />
          </div>
        )}

        {/* Global modals for Athlete layout */}
        {activeReportSession && (
          <ReportDetailModal 
            session={activeReportSession}
            onClose={() => setActiveReportSession(null)}
            onNavigateToRecommendations={() => {
              setActiveRecSession(activeReportSession);
              setActiveView('recommendations_history');
            }}
          />
        )}

        {activeExercise && (
          <ExerciseDetailModal 
            exercise={activeExercise}
            onClose={() => setActiveExercise(null)}
          />
        )}
      </div>
    </main>
  );
}
