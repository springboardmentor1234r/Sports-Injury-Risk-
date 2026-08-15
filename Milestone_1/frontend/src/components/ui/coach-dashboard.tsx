"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Header
} from './coach/Header';
import {
  DashboardView
} from './coach/DashboardView';
import {
  AthletesView
} from './coach/AthletesView';
import {
  TeamsView
} from './coach/TeamsView';
import {
  AddAthleteView
} from './coach/AddAthleteView';
import {
  UploadVideoView
} from './coach/UploadVideoView';
import {
  NotificationsView
} from './coach/NotificationsView';
import {
  AthleteDetailModal
} from './coach/AthleteDetailModal';
import {
  SettingsModal
} from './coach/SettingsModal';
import {
  SupportModal
} from './coach/SupportModal';

import { PdfReport } from './pdf-report';
import toast from 'react-hot-toast';


interface CoachDashboardProps {
  token: string;
  currentView: 'dashboard' | 'my_athletes' | 'teams' | 'notifications' | 'add_athlete' | 'upload_video';
  userName?: string;
  profilePictureUrl?: string | null;
  coachCode?: string | null;
  userId?: number | string;
}

export function CoachDashboard({ token, currentView, userName, profilePictureUrl, coachCode, userId }: CoachDashboardProps) {
  // Navigation / View States synced with parent sidebar routing
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const targetTab = currentView === 'my_athletes' ? 'athletes' : currentView;
    setActiveTab(targetTab || 'dashboard');
  }, [currentView]);

  // Roster/Athletes state
  const [athletes, setAthletes] = useState<any[]>([]);

  // Dashboard overall stats
  const [stats, setStats] = useState<any>(null);

  // Selected athlete detail state (athlete card click)
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [athleteHistory, setAthleteHistory] = useState<any | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Selected single session details (for full report popup)
  const [activeSession, setActiveSession] = useState<any | null>(null);

  // Modals & Drawers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Profile edit form fields state
  const [formAge, setFormAge] = useState<number | ''>('');
  const [formGender, setFormGender] = useState('Other');
  const [formHasPrevInjury, setFormHasPrevInjury] = useState('No');
  const [formHeight, setFormHeight] = useState<number | ''>('');
  const [formInjuryRecency, setFormInjuryRecency] = useState('None');
  const [formPrevInjuryType, setFormPrevInjuryType] = useState('None');
  const [formSport, setFormSport] = useState('');
  const [formTrainingIntensity, setFormTrainingIntensity] = useState('Medium');
  const [formWeeklySessions, setFormWeeklySessions] = useState<number | ''>('');
  const [formWeight, setFormWeight] = useState<number | ''>('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Notifications / connection requests
  const [requests, setRequests] = useState<any[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);

  // Teams State
  const [teams, setTeams] = useState<any[]>([]);

  // PDF Download States
  const [pdfData, setPdfData] = useState<{ session: any, recommendations: string, previousSession?: any, athleteProfile?: any } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [generatingRecId, setGeneratingRecId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      const loadAll = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchStats(),
          fetchAthletes(),
          fetchNotifications(),
          fetchTeams()
        ]);
        setIsLoading(false);
      };
      loadAll();
    }
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch coach stats", e);
    }
  };

  const fetchAthletes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.sort((a: any, b: any) => (b.latest_score || 0) - (a.latest_score || 0));
          setAthletes(data);
        }
      }
    } catch (e) {
      console.error("Failed to load athletes", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        setGeneralNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTeams(data);
      }
    } catch (e) {
      console.error("Failed to load teams", e);
    }
  };

  const handleRespondRequest = async (requestId: number, accept: boolean) => {
    // Optimistically remove from list immediately for snappy UX
    setRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/respond-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          request_id: requestId,
          status: accept ? 'accepted' : 'rejected'
        })
      });
      if (res.ok) {
        fetchNotifications();
        fetchAthletes();
        fetchStats();
      } else {
        // Restore on failure by refetching
        fetchNotifications();
      }
    } catch (e) {
      console.error("Failed to respond to request", e);
      fetchNotifications();
    }
  };

  const handleRemoveAthlete = async (athleteId: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes/${athleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAthletes();
        fetchStats();
        if (selectedAthlete && selectedAthlete.id === athleteId) {
          setSelectedAthlete(null);
          setAthleteHistory(null);
        }
      }
    } catch (e) {
      console.error("Failed to remove athlete", e);
    }
  };

  const handleViewAthlete = async (athlete: any) => {
    setSelectedAthlete(athlete);
    setIsLoadingHistory(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    // Pre-populate fields with fallbacks
    setFormAge(athlete.profile?.age || athlete.age || '');
    setFormGender(athlete.profile?.gender || athlete.gender || 'Other');
    setFormHasPrevInjury(athlete.profile?.has_previous_injury || 'No');
    setFormHeight(athlete.profile?.height || athlete.heightCm || '');
    setFormInjuryRecency(athlete.profile?.injury_recency || 'None');
    setFormPrevInjuryType(athlete.profile?.previous_injury_type || 'None');
    setFormSport(athlete.profile?.sport || athlete.sport || '');
    setFormTrainingIntensity(athlete.profile?.training_intensity || 'Medium');
    setFormWeeklySessions(athlete.profile?.weekly_training_sessions || '');
    setFormWeight(athlete.profile?.weight || athlete.weightKg || '');
    setFormAvatarUrl(athlete.profile_picture_url || athlete.avatarUrl || '');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes/${athlete.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAthleteHistory(data);

        if (data.profile) {
          setFormAge(data.profile.age || '');
          setFormGender(data.profile.gender || 'Other');
          setFormHasPrevInjury(data.profile.has_previous_injury || 'No');
          setFormHeight(data.profile.height || '');
          setFormInjuryRecency(data.profile.injury_recency || 'None');
          setFormPrevInjuryType(data.profile.previous_injury_type || 'None');
          setFormSport(data.profile.sport || '');
          setFormTrainingIntensity(data.profile.training_intensity || 'Medium');
          setFormWeeklySessions(data.profile.weekly_training_sessions || '');
          setFormWeight(data.profile.weight || '');
        }
      }
    } catch (e) {
      console.error("Failed to fetch athlete history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;
    setIsUpdatingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const payload = {
      profile_picture_url: formAvatarUrl.trim() || undefined,
      age: formAge === '' ? null : Number(formAge),
      gender: formGender,
      has_previous_injury: formHasPrevInjury,
      height: formHeight === '' ? null : Number(formHeight),
      injury_recency: formInjuryRecency,
      previous_injury_type: formPrevInjuryType,
      sport: formSport,
      training_intensity: formTrainingIntensity,
      weekly_training_sessions: formWeeklySessions === '' ? null : Number(formWeeklySessions),
      weight: formWeight === '' ? null : Number(formWeight)
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes/${selectedAthlete.id}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setProfileSuccessMsg("Athlete profile updated successfully.");
        fetchAthletes();
      } else {
        const err = await res.json();
        setProfileErrorMsg(err.detail || "Failed to update profile.");
      }
    } catch (e) {
      setProfileErrorMsg("Network error updating profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddAthleteSubmit = async (payload: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/register-athlete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        fetchAthletes();
        fetchStats();
        return data;
      } else {
        throw new Error(data.detail || "Failed to register athlete");
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleVideoUploadSubmit = async (formData: FormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/upload-and-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        fetchStats();
        return data;
      } else {
        throw new Error(data.detail || "Upload analysis failed");
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleCreateTeamSubmit = async (teamName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: teamName })
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTeam = async (teamId: any) => {
    if (!confirm("Are you sure you want to delete this team group? This action will not delete the athletes on your roster.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch (e) {
      console.error("Failed to delete team", e);
    }
  };

  const handleAssignAthleteToTeam = async (athleteId: string, teamId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/teams/${teamId}/athletes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ athlete_id: Number(athleteId) })
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPDF = async (session: any, profile: any) => {
    try {
      setIsGeneratingPDF(true);
      const format = typeof window !== 'undefined' ? (localStorage.getItem("downloadFormat") || "pdf") : "pdf";

      // Fetch recommendations if not already loaded
      let recommendations = session.recommendations;
      if (!recommendations || typeof recommendations !== 'object') {
        try {
          const recRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${session.session_id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (recRes.ok) {
            const recData = await recRes.json();
            if (recData.recommendations) recommendations = recData.recommendations;
            else if (recData && typeof recData === 'object' && (recData.one_line_summary || recData.categories)) recommendations = recData;
          }
        } catch (e) {
          console.error("Could not fetch recommendations", e);
        }
      }

      const mergedProf = {
        ...(selectedAthlete || {}),
        ...(profile?.profile || {}),
        ...(profile || {}),
        full_name: profile?.full_name || selectedAthlete?.full_name || profile?.user?.full_name || profile?.profile?.full_name || session?.athlete_name || "Athlete"
      };

      if (format === 'txt') {
        const hasRecsObj = recommendations && typeof recommendations === 'object' && (recommendations.one_line_summary || recommendations.categories || (Array.isArray(recommendations) && recommendations.length > 0));
        let recText = "";
        if (hasRecsObj) {
          recText = `
MOVEIQ AI RECOMMENDATIONS:
Summary: ${recommendations.one_line_summary || ''}

Categories:
${(recommendations.categories || []).map((c: any) => `- ${c.category_name?.replace(/_/g, ' ') || 'Category'}: ${c.issue_translation || ''}\n  Recommended Exercises: ${(c.recommended_exercises || []).join(', ')}`).join('\n\n')}

Wrap Up: ${recommendations.wrap_up_summary || ''}
`;
        }

        const reportText = `MoveIQ OFFICIAL BIOMECHANICAL REPORT (COACH EDITION)
-----------------------------------------
Athlete Name: ${mergedProf.full_name || 'Athlete'}
Session ID: ${session.session_id}
File Name: ${session.video_name || 'Assessment'}
Assessment Date: ${session.created_at ? new Date(session.created_at).toLocaleString() : 'N/A'}
Overall Health Score: ${session.risk_data?.overall_health_score || 100}/100
Biomechanical Efficiency: ${session.risk_data?.biomechanical_efficiency_score || 100}%
Risk Classification: ${session.risk_data?.risk_category || 'Normal'}
Peak Valgus Angle: ${session.risk_data?.valgus_angle || 0}°

SUMMARY OF FINDINGS:
${session.risk_data?.flagged_issues || 'Movement patterns analyzed by AI Biomechanics Engine.'}
${recText}
-----------------------------------------
MoveIQ Injury Prevention System
`;
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MoveIQ_Coach_Report_${(session.video_name || "Assessment").replace('.mp4', '')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        setIsGeneratingPDF(false);
        return;
      }

      // Find previous session if we have history
      let previousSession = undefined;
      try {
        if (athleteHistory && Array.isArray(athleteHistory)) {
          const idx = athleteHistory.findIndex(s => s.session_id === session.session_id);
          if (idx !== -1 && idx < athleteHistory.length - 1) {
            previousSession = athleteHistory[idx + 1];
          }
        }
      } catch (e) {
        console.error("Could not find previous session", e);
      }

      setPdfData({ 
        session, 
        recommendations: recommendations || "No recommendations generated yet.", 
        previousSession, 
        athleteProfile: mergedProf 
      });

      // Wait for React to render the hidden PdfReport
      await new Promise(resolve => setTimeout(resolve, 500));

      const htmlToImage = await import('html-to-image');
      const jsPDF = (await import('jspdf')).default;
      
      if (!reportRef.current) throw new Error('Report component not mounted');
      
      const pages = reportRef.current.querySelectorAll('.pdf-page');
      if (!pages || pages.length === 0) throw new Error('No pages found');
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const dataUrl = await htmlToImage.toPng(pageEl, { quality: 0.95, pixelRatio: 2 });
        
        if (i > 0) {
          pdf.addPage();
        }
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (pageEl.offsetHeight * pdfWidth) / pageEl.offsetWidth;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`MoveIQ_Report_${session.video_name || session.session_id.substring(0,6)}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
      setPdfData(null);
    }
  };

  const handleGenerateRecommendations = async (sessionId: string, videoName: string, athleteId?: string) => {
    try {
      setGeneratingRecId(sessionId);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${sessionId}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const recRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/recommendations/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (recRes.ok) {
          const recData = await recRes.json();
          const recs = recData.recommendations || recData;
          if (selectedAthlete) {
            setSelectedAthlete((prev: any) => ({ ...prev, recommendations: recs }));
          }
          if (athleteHistory && Array.isArray(athleteHistory)) {
            setAthleteHistory((prev: any[]) => prev.map((s: any) => s.session_id === sessionId ? { ...s, recommendations: recs } : s));
          }
        }
        toast.success("Recommendation generated successfully!");
      } else {
        console.error("Failed to generate recommendations");
        toast.error("Failed to generate recommendations. Please try again.");
      }
    } catch (e) {
      console.error("Error generating recommendations:", e);
      toast.error("Error generating recommendations.");
    } finally {
      setGeneratingRecId(null);
    }
  };

  return (
    <div className="w-full min-h-full bg-[#f7f9fd] text-[#191c1f] flex flex-col font-sans antialiased">
      {/* Top Header Bar from Frontenddemo */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenSupport={() => setShowSupportModal(true)}
        coachName={userName || 'Coach'}
        coachTitle="MoveIQ Coach"
        avatarUrl={profilePictureUrl || undefined}
        token={token}
        userId={userId}
      />

      <div className="flex-1">
        {/* Main Tab Render */}
        {activeTab === 'dashboard' && (
          <DashboardView
            athletes={athletes}
            recentSessions={[]}
            setActiveTab={setActiveTab}
            onSelectAthlete={handleViewAthlete}
            searchQuery={searchQuery}
            stats={stats}
            isLoading={isLoading}
          />
        )}

        {(activeTab === 'athletes' || activeTab === 'my_athletes') && (
          <AthletesView
            athletes={athletes}
            onSelectAthlete={handleViewAthlete}
            onDeleteAthlete={handleRemoveAthlete}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onDownloadPDF={handleDownloadPDF}
            onGenerateRecommendations={handleGenerateRecommendations}
            generatingRecId={generatingRecId}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'teams' && (
          <TeamsView
            teams={teams}
            athletes={athletes}
            onCreateTeam={handleCreateTeamSubmit}
            onAssignAthlete={handleAssignAthleteToTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}

        {activeTab === 'add_athlete' && (
          <AddAthleteView
            onAddAthlete={handleAddAthleteSubmit}
            setActiveTab={setActiveTab}
            token={token}
          />
        )}

        {activeTab === 'upload_video' && (
          <UploadVideoView
            athletes={athletes}
            onUploadAndAnalyze={handleVideoUploadSubmit}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsView
            invites={requests}
            alerts={generalNotifications}
            onApproveInvite={(id) => handleRespondRequest(Number(id), true)}
            onDeclineInvite={(id) => handleRespondRequest(Number(id), false)}
          />
        )}
      </div>

      {/* Athlete Detail Profile Drawer / Modal */}
      {selectedAthlete && (
        <AthleteDetailModal
          athlete={selectedAthlete}
          onClose={() => {
            setSelectedAthlete(null);
            setAthleteHistory(null);
          }}
          onUpdateNotes={(athleteId, notes) => {
            setAthletes(prev => prev.map(a => a.id === athleteId ? { ...a, notes } : a));
          }}
          athleteHistory={athleteHistory}
          isLoadingHistory={isLoadingHistory}
          onUpdateProfileSubmit={handleUpdateProfileSubmit}
          onDownloadPDF={handleDownloadPDF}
          onGenerateRecommendations={handleGenerateRecommendations}
          generatingRecId={generatingRecId}
          onOpenSession={(sess) => setActiveSession(sess)}
          formAge={formAge}
          setFormAge={setFormAge}
          formGender={formGender}
          setFormGender={setFormGender}
          formHasPrevInjury={formHasPrevInjury}
          setFormHasPrevInjury={setFormHasPrevInjury}
          formHeight={formHeight}
          setFormHeight={setFormHeight}
          formInjuryRecency={formInjuryRecency}
          setFormInjuryRecency={setFormInjuryRecency}
          formPrevInjuryType={formPrevInjuryType}
          setFormPrevInjuryType={setFormPrevInjuryType}
          formSport={formSport}
          setFormSport={setFormSport}
          formTrainingIntensity={formTrainingIntensity}
          setFormTrainingIntensity={setFormTrainingIntensity}
          formWeeklySessions={formWeeklySessions}
          setFormWeeklySessions={setFormWeeklySessions}
          formWeight={formWeight}
          setFormWeight={setFormWeight}
          formAvatarUrl={formAvatarUrl}
          setFormAvatarUrl={setFormAvatarUrl}
          isUpdatingProfile={isUpdatingProfile}
          profileSuccessMsg={profileSuccessMsg}
          profileErrorMsg={profileErrorMsg}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          coachName={userName || 'Coach'}
          coachRole="MoveIQ Coach"
          avatarUrl={profilePictureUrl || undefined}
        />
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <SupportModal onClose={() => setShowSupportModal(false)} />
      )}

      {/* Full Session PDF Report Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-[#c3c6d8] shadow-2xl rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#c3c6d8] bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{activeSession.video_name || activeSession.movementType || 'Session'} Analysis</h3>
              <button
                onClick={() => setActiveSession(null)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <PdfReport session={activeSession} recommendations={activeSession.recommendations || ""} athleteProfile={selectedAthlete || activeSession} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden Container for Premium PDF generation */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none">
        {pdfData && (
          <div id="premium-pdf-container" ref={reportRef}>
            <PdfReport
              session={pdfData.session}
              recommendations={pdfData.recommendations}
              previousSession={pdfData.previousSession}
              athleteProfile={pdfData.athleteProfile}
            />
          </div>
        )}
      </div>

    </div>
  );
}
