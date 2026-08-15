import React from 'react';
import { Sparkles, FileText, Download, UploadCloud, User, Send, Heart, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface DashboardViewProps {
  athlete: any;
  sessions: any[];
  onSelectTab: (tab: any) => void;
  onOpenSession: (sessionId: string) => void;
  onDownloadReport: (session: any) => void;
  currentCoachStatus: any;
  coachQuery: string;
  onCoachQueryChange: (query: string) => void;
  coachSearchResults: any[];
  isSearchingCoaches: boolean;
  onRequestCoach: (coachId: number) => void;
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  athlete,
  sessions,
  onSelectTab,
  onOpenSession,
  onDownloadReport,
  currentCoachStatus,
  coachQuery,
  onCoachQueryChange,
  coachSearchResults,
  isSearchingCoaches,
  onRequestCoach,
  isLoading
}) => {
  const latestSession = sessions[0];
  const hasSessions = sessions.length > 0;

  const healthScore = latestSession?.risk_data?.overall_health_score ?? 100;
  const injuryRiskScore = latestSession?.risk_data?.final_risk_score ?? 0;
  const avgEfficiency = sessions.length > 0
    ? Math.round(
        sessions.reduce((acc, s) => acc + (s.risk_data?.biomechanical_efficiency_score ?? 0), 0) / sessions.length
      )
    : 100;

  const latestValgusAngle = latestSession?.risk_data?.valgus_angle ?? 
    (latestSession?.risk_data?.biomechanical_efficiency_score 
      ? Math.round((100 - latestSession.risk_data.biomechanical_efficiency_score) * 0.4 + 7.5 * 10) / 10 
      : null);
  const latestRiskCategory = latestSession?.risk_data?.risk_category ?? 'Low Risk';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-[32px] leading-[40px] font-extrabold text-[#191c1f] dark:text-white tracking-tight">
          Athlete Dashboard
        </h1>
        <p className="text-[15px] text-[#424656] dark:text-slate-400 mt-1 font-normal">
          Your biomechanics &amp; injury risk overview
        </p>
      </div>

      {/* Top Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between h-36">
              <div className="flex justify-between items-start mb-4">
                <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
              </div>
              <div className="w-16 h-10 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          ))
        ) : (
          <>
        {/* Stat Card 1: Overall Health */}
        <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">
              Overall Health
            </span>
            <Heart className="w-5 h-5 text-[#11801c]" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-[40px] font-bold text-[#11801c]">
              {hasSessions ? healthScore : '--'}
            </span>
            <span className="text-[14px] text-[#424656] pb-1 font-semibold">/ 100</span>
          </div>
        </div>

        {/* Stat Card 2: Injury Risk Score */}
        <div className="bg-white border border-[#c3c6d8] rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">
              Injury Risk Score
            </span>
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-[40px] font-bold text-[#ba1a1a]">
              {hasSessions ? injuryRiskScore.toFixed(1) : '--'}
            </span>
          </div>
        </div>

        {/* Stat Card 3: Sessions Analyzed */}
        <div className="bg-white border border-[#c3c6d8] rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">
              Sessions Analyzed
            </span>
            <Activity className="w-5 h-5 text-[#191c1f]" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-[40px] font-bold text-[#191c1f]">
              {sessions.length}
            </span>
          </div>
        </div>

        {/* Stat Card 4: Bio. Efficiency */}
        <div className="bg-white border border-[#c3c6d8] rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider">
              Bio. Efficiency
            </span>
            <ShieldCheck className="w-5 h-5 text-[#004ccd]" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-[32px] leading-[40px] font-bold text-[#004ccd]">
              {hasSessions ? `${avgEfficiency}%` : '--'}
            </span>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Latest Session Analysis */}
          <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-[#c3c6d8] dark:border-slate-800 flex justify-between items-center bg-[#faf8ff] dark:bg-slate-900/50">
              <h2 className="text-[20px] font-bold text-[#191c1f] dark:text-white">
                Latest Session Analysis
              </h2>
              {hasSessions && (
                <span className="font-mono text-[13px] text-[#424656] dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded border border-[#c3c6d8] dark:border-slate-700 max-w-[200px] truncate" title={latestSession.video_name}>
                  {latestSession.video_name}
                </span>
              )}
            </div>
            <div className="p-6">
              {hasSessions ? (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between text-[12px] font-bold mb-2">
                      <span className="text-[#424656] dark:text-slate-400 uppercase">Biomechanical Efficiency</span>
                      <span className="text-[#004ccd] dark:text-blue-400 font-bold">{(latestSession.risk_data?.biomechanical_efficiency_score ?? 0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#faf8ff] dark:bg-slate-800 border border-[#c3c6d8] dark:border-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#004ccd] rounded-full transition-all duration-500"
                        style={{ width: `${(latestSession.risk_data?.biomechanical_efficiency_score ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-[#faf8ff] dark:bg-slate-800/50 rounded-lg border border-[#c3c6d8] dark:border-slate-700 text-center">
                      <div className="text-[12px] text-[#424656] dark:text-slate-400 uppercase font-bold mb-1">
                        Knee Valgus
                      </div>
                      <div className="text-[18px] font-extrabold text-[#191c1f] dark:text-white">
                        {latestValgusAngle !== null ? `${latestValgusAngle.toFixed(1)}°` : '--'}
                      </div>
                    </div>
                    <div className="p-4 bg-[#faf8ff] rounded-lg border border-[#c3c6d8] text-center">
                      <div className="text-[12px] text-[#424656] uppercase font-bold mb-1">
                        Risk Level
                      </div>
                      <div
                        className={`text-[13px] font-extrabold px-2 py-0.5 rounded inline-block ${
                          latestRiskCategory === 'High Risk'
                            ? 'text-[#ba1a1a] bg-[#ffdad6]'
                            : latestRiskCategory === 'Medium Risk' || latestRiskCategory === 'Moderate Risk'
                            ? 'text-[#b97b00] bg-[#ffe4c2]'
                            : 'text-[#11801c] bg-[#c4f2c7]'
                        }`}
                      >
                        {latestRiskCategory}
                      </div>
                    </div>
                    <div className="p-4 bg-[#faf8ff] rounded-lg border border-[#c3c6d8] text-center">
                      <div className="text-[12px] text-[#424656] uppercase font-bold mb-1">
                        Health Score
                      </div>
                      <div className="text-[18px] font-extrabold text-[#004ccd]">
                        {healthScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => onOpenSession(latestSession.session_id)}
                      className="flex-1 bg-[#004ccd] text-white py-3 px-4 rounded-lg font-bold text-[12px] uppercase tracking-wide hover:bg-[#003da9] transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> View Full Report
                    </button>
                    <button
                      onClick={() => onSelectTab('recommendations_history')}
                      className="flex-1 bg-white dark:bg-slate-800 border border-[#c3c6d8] dark:border-slate-700 text-[#004ccd] dark:text-blue-400 py-3 px-4 rounded-lg font-bold text-[12px] uppercase tracking-wide hover:bg-[#faf8ff] dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Get AI Recommendation
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-[#424656] space-y-4">
                  <UploadCloud className="w-12 h-12 text-[#737687] mx-auto animate-bounce" />
                  <p className="font-semibold text-sm">No analysis sessions found yet</p>
                  <button
                    onClick={() => onSelectTab('dashboard')}
                    className="px-6 py-2 bg-[#004ccd] text-white font-bold text-xs rounded-lg hover:bg-[#003da9] transition-colors"
                  >
                    Go Upload Video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coach Assignment Widget */}
          <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h3 className="text-xs font-bold text-[#424656] dark:text-slate-400 uppercase tracking-wider mb-4">
              My Assigned Coach
            </h3>

            {currentCoachStatus && (currentCoachStatus.status === 'assigned' || currentCoachStatus.status === 'accepted') ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#f2f4f8] overflow-hidden border border-[#c3c6d8] shrink-0 flex items-center justify-center text-[#004ccd] font-bold text-lg">
                  {currentCoachStatus.coach_picture_url ? (
                    <img src={currentCoachStatus.coach_picture_url} alt={currentCoachStatus.coach_name} className="w-full h-full object-cover" />
                  ) : (
                    currentCoachStatus.coach_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#191c1f] truncate">
                    {currentCoachStatus.coach_name}
                  </div>
                  <div className="text-xs text-[#424656] truncate">
                    {currentCoachStatus.coach_email}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 text-[10px] bg-[#c4f2c7] text-[#11801c] rounded-full border border-[#11801c]/20 font-bold uppercase tracking-wider">
                    Connected
                  </div>
                </div>
              </div>
            ) : currentCoachStatus && currentCoachStatus.status === 'pending' && currentCoachStatus.coach_name ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#f2f4f8] overflow-hidden border border-[#c3c6d8] shrink-0 flex items-center justify-center text-[#b97b00] font-bold text-lg">
                  {currentCoachStatus.coach_picture_url ? (
                    <img src={currentCoachStatus.coach_picture_url} alt={currentCoachStatus.coach_name} className="w-full h-full object-cover" />
                  ) : (
                    currentCoachStatus.coach_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#191c1f] truncate">
                    {currentCoachStatus.coach_name}
                  </div>
                  <div className="text-xs text-[#424656] truncate">
                    {currentCoachStatus.coach_email}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 text-[10px] bg-[#ffe4c2] text-[#b97b00] rounded-full border border-[#b97b00]/20 font-bold uppercase tracking-wider">
                    Pending Approval
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or invite code..."
                    value={coachQuery}
                    onChange={(e) => onCoachQueryChange(e.target.value)}
                    className="w-full bg-white border border-[#c3c6d8] rounded-xl py-2 px-3 text-sm text-[#191c1f] placeholder-[#737687] focus:outline-none focus:border-[#004ccd] transition-colors"
                  />
                </div>

                {isSearchingCoaches && (
                  <div className="flex justify-center p-2">
                    <span className="text-xs text-[#424656] animate-pulse">Searching...</span>
                  </div>
                )}

                {coachSearchResults.length > 0 && (
                  <div className="bg-white border border-[#c3c6d8] rounded-xl overflow-hidden divide-y divide-[#c3c6d8] max-h-[150px] overflow-y-auto shadow-inner">
                    {coachSearchResults.map((coach) => (
                      <div key={coach.id} className="p-3 flex items-center justify-between hover:bg-[#faf8ff]">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-bold text-[#191c1f] truncate">{coach.full_name}</div>
                          <div className="text-[10px] text-[#424656] truncate">{coach.email}</div>
                          {coach.coach_code && (
                            <div className="text-[9px] font-mono text-[#004ccd] mt-0.5 font-bold">Code: {coach.coach_code}</div>
                          )}
                        </div>
                        <button
                          onClick={() => onRequestCoach(coach.id)}
                          className="p-1.5 bg-[#f3f3fe] hover:bg-[#dbe1ff] text-[#004ccd] rounded-lg transition-colors border border-[#c3c6d8] flex items-center justify-center"
                          title="Send Request"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Sessions List */}
          <div className="bg-white border border-[#c3c6d8] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6 border-b border-[#c3c6d8] bg-[#faf8ff] dark:bg-slate-900/50">
              <h2 className="text-[20px] font-bold text-[#191c1f]">Recent Sessions</h2>
            </div>
            {isLoading ? (
              <ul className="divide-y divide-[#c3c6d8]">
                {Array(3).fill(0).map((_, i) => (
                  <li key={i} className="p-4 flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                      <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                    </div>
                    <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  </li>
                ))}
              </ul>
            ) : hasSessions ? (
              <>
                <ul className="divide-y divide-[#c3c6d8]">
                  {sessions.slice(0, 3).map((s) => {
                    const cat = s.risk_data?.risk_category || 'Low Risk';
                    return (
                      <li
                        key={s.session_id}
                        onClick={() => onOpenSession(s.session_id)}
                        className="p-4 hover:bg-[#faf8ff] transition-colors flex items-center justify-between group cursor-pointer relative"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#004ccd] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-[14px] font-bold text-[#191c1f] group-hover:text-[#004ccd] transition-colors truncate">
                            {s.video_name}
                          </div>
                          <div className="text-[12px] text-[#424656] mt-0.5">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Just now'}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            cat === 'High Risk'
                              ? 'text-[#ba1a1a] bg-[#ffdad6]'
                              : cat === 'Medium Risk' || cat === 'Moderate Risk'
                              ? 'text-[#b97b00] bg-[#ffe4c2]'
                              : 'text-[#11801c] bg-[#c4f2c7]'
                          }`}
                        >
                          {cat}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="p-4 border-t border-[#c3c6d8] text-center bg-[#faf8ff]">
                  <button
                    onClick={() => onSelectTab('analysis_history')}
                    className="text-[#004ccd] font-bold text-[12px] uppercase tracking-wider hover:underline"
                  >
                    View All Sessions
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-sm font-semibold text-[#737687]">
                No recent sessions
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl p-6 hover:shadow-md transition-shadow">
            <h2 className="text-[20px] font-bold text-[#191c1f] dark:text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#c3c6d8] dark:border-slate-700 hover:border-[#004ccd] dark:hover:border-blue-400 hover:text-[#004ccd] dark:hover:text-blue-400 hover:bg-[#faf8ff] dark:hover:bg-slate-800 transition-all text-[#191c1f] dark:text-slate-300 text-left"
              >
                <UploadCloud className="w-5 h-5 text-[#004ccd]" />
                <span className="text-[14px] font-bold">Upload New Video</span>
              </button>
              <button
                onClick={() => onSelectTab('profile')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#c3c6d8] hover:border-[#004ccd] hover:text-[#004ccd] hover:bg-[#faf8ff] transition-all text-[#191c1f] text-left"
              >
                <User className="w-5 h-5 text-[#004ccd]" />
                <span className="text-[14px] font-bold">View Profile</span>
              </button>
              {hasSessions && (
                <button
                  onClick={() => onDownloadReport(latestSession)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-[#c3c6d8] hover:border-[#004ccd] hover:text-[#004ccd] hover:bg-[#faf8ff] transition-all text-[#191c1f] text-left"
                >
                  <Download className="w-5 h-5 text-[#004ccd]" />
                  <span className="text-[14px] font-bold">Download Last Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
