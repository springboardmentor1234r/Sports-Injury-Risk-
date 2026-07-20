"use client";

import { MinimalProfessionalCard } from "@/components/ui/analytics-dashboard";
import { FileUploader } from "@/components/ui/file-uploader";
import { AuthForm } from "@/components/ui/auth-form";
import { Sidebar, ViewType } from "@/components/ui/sidebar";
import { ProfileForm } from "@/components/ui/profile-form";
import { SettingsView } from "@/components/ui/settings-view";
import { AnalysisHistory } from "@/components/ui/analysis-history";
import { RecommendationsHistory } from "@/components/ui/recommendations-history";
import { ReportsView } from "@/components/ui/reports-view";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [hasData, setHasData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Layout State
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isLockedToProfile, setIsLockedToProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    // Check if token exists on mount
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      checkProfileStatus(savedToken);
    }
  }, []);

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
    // ── Reset ALL previous session state before setting new account ──
    setHasData(false);
    setDashboardData(null);
    setActiveView('dashboard');
    setIsLockedToProfile(false);

    setToken(jwt);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("token", jwt);
    localStorage.setItem("user", JSON.stringify(userData));
    checkProfileStatus(jwt);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setHasData(false);
    setDashboardData(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setActiveView('dashboard');
    setIsLockedToProfile(false);
  };

  const handleProfileSaved = () => {
    setIsLockedToProfile(false);
    // Optionally switch them to dashboard immediately or let them navigate
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">MoveIQ</h1>
            <p className="text-slate-400 font-medium">AI Sports Biomechanics Pipeline</p>
          </div>
          <AuthForm onSuccess={handleLogin} />
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
    <main className="min-h-screen bg-slate-950 flex overflow-hidden">
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        userName={user?.full_name}
        isLockedToProfile={isLockedToProfile}
        token={token || undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {activeView === 'dashboard' && (
          <div className="flex flex-col xl:flex-row w-full min-h-screen">
            {/* Left side: Upload */}
            <div className="w-full xl:w-1/3 p-8 border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-950/50 flex flex-col justify-center">
              <div className="mb-8">
                  <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">MoveIQ Dashboard</h1>
                  <p className="text-slate-400 font-medium">Upload a video to analyze biomechanics</p>
              </div>
              <FileUploader 
                  token={token || undefined} 
                  onUploadStart={() => setIsProcessing(true)}
                  onUploadSuccess={(data) => {
                      setDashboardData(data);
                      setHasData(true);
                      setIsProcessing(false);
                  }} 
              />
            </div>

            {/* Right side: Dashboard */}
            <div className="w-full xl:w-2/3 bg-slate-900">
              {hasData && dashboardData ? (
                  <MinimalProfessionalCard 
                      token={token || undefined}
                      sessionId={dashboardData.session_id}
                      healthScore={dashboardData.risk_data.overall_health_score || 0}
                      riskCategory={dashboardData.risk_data.risk_category || "Unknown"}
                      efficiency={dashboardData.risk_data.biomechanical_efficiency_score || 0}
                      sessionsAnalyzed={1}
                      flaggedIssues={
                        typeof dashboardData.risk_data.flagged_issues === 'string' && dashboardData.risk_data.flagged_issues !== 'None'
                          ? dashboardData.risk_data.flagged_issues.split(' | ') 
                          : []
                      }
                      isProcessing={isProcessing}
                      videoUrl={dashboardData.video_url}
                      videoName={dashboardData.video_name}
                  />
              ) : (
                  <MinimalProfessionalCard isProcessing={isProcessing} token={token || undefined} />
              )}
            </div>
          </div>
        )}

        {activeView === 'profile' && (
          <div className="min-h-screen p-8 bg-slate-950 flex flex-col justify-center">
             <ProfileForm token={token || ""} onProfileSaved={handleProfileSaved} />
          </div>
        )}

        {activeView === 'settings' && (
          <div className="min-h-screen p-8 bg-slate-950 flex flex-col justify-center">
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
          <div className="min-h-screen p-8 bg-slate-950 flex flex-col justify-start pt-16">
             <AnalysisHistory token={token || ""} onOpenSession={handleOpenSession} />
          </div>
        )}

        {activeView === 'recommendations_history' && (
          <div className="min-h-screen p-8 bg-slate-950 flex flex-col justify-start pt-16">
             <RecommendationsHistory 
                token={token || ""} 
             />
          </div>
        )}

        {activeView === 'reports' && (
          <div className="min-h-screen p-8 bg-slate-950 flex flex-col justify-start pt-16">
             <ReportsView token={token || ""} />
          </div>
        )}
      </div>
    </main>
  );
}
