import React, { useState } from 'react';
import { 
  Search, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Trash2, 
  UserPlus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Video,
  Download,
  User,
  Activity,
  Sparkles,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AthletesViewProps {
  athletes: any[];
  onSelectAthlete: (athlete: any) => void;
  onDeleteAthlete: (id: any) => void;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onDownloadPDF?: (session: any, profile: any) => void;
  onGenerateRecommendations?: (sessionId: string, videoName: string, athleteId?: string) => Promise<void>;
  generatingRecId?: string | null;
  isLoading?: boolean;
}

export const AthletesView: React.FC<AthletesViewProps> = ({
  athletes,
  onSelectAthlete,
  onDeleteAthlete,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onDownloadPDF,
  onGenerateRecommendations,
  generatingRecId,
  isLoading
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'All' | 'High Risk' | 'Medium Risk' | 'Low Risk'>('All');
  
  // Track which athlete ID is expanded
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);
  // Store fetched histories for expanded athletes
  const [histories, setHistories] = useState<Record<string, any>>({});
  // Track loading state for expanded athletes
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);

  // Filter athletes matching search & risk filter
  const filteredAthletes = athletes.filter((ath) => {
    const fullName = (ath.full_name || `${ath.firstName || ''} ${ath.lastName || ''}`).toLowerCase();
    const email = (ath.email || '').toLowerCase();
    const sport = (ath.profile?.sport || ath.sport || '').toLowerCase();
    const position = (ath.position || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = 
      fullName.includes(query) ||
      email.includes(query) ||
      sport.includes(query) ||
      position.includes(query);

    const athRisk = ath.riskLevel || (
      ath.risk_category?.toLowerCase().includes('high') ? 'High Risk' :
      ath.risk_category?.toLowerCase().includes('medium') || ath.risk_category?.toLowerCase().includes('moderate') ? 'Medium Risk' :
      'Low Risk'
    );

    const matchesRisk = 
      selectedRiskFilter === 'All' || athRisk === selectedRiskFilter;

    return matchesSearch && matchesRisk;
  });

  const handleToggleExpand = async (athleteId: string) => {
    if (expandedAthleteId === athleteId) {
      setExpandedAthleteId(null);
      return;
    }

    setExpandedAthleteId(athleteId);

    // If history is not already fetched, load it
    if (!histories[athleteId]) {
      setLoadingHistoryId(athleteId);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/coach/athletes/${athleteId}/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHistories(prev => ({ ...prev, [athleteId]: data }));
        }
      } catch (err) {
        console.error("Failed to load athlete history in AthletesView", err);
      } finally {
        setLoadingHistoryId(null);
      }
    }
  };

  const handleDownloadSessionReport = async (sessionId: string, videoName: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/sessions/${sessionId}/report/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MoveIQ_Report_${videoName.replace('.mp4', '')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Failed to download PDF report", e);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 text-left text-[#191c1f]">
      {/* Header & Controls */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1f] dark:text-white tracking-tight">
              Athletes Roster
            </h2>
            <p className="text-xs text-[#424656] dark:text-slate-400 mt-1 font-semibold">
              Manage your assigned athletes, inspect profiles, and view full historical biomechanics.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('add_athlete')}
            className="px-4 py-2 bg-[#004ccd] text-white rounded-lg text-xs font-bold hover:bg-[#003da9] transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add New Athlete
          </button>
        </div>

        {/* Search & Filter Chips Row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search Bar */}
          <div className="relative w-full md:w-96 focus-within:ring-2 focus-within:ring-[#004ccd]/20 rounded-lg">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#737687] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Athletes by Name, Sport, positions..."
              className="w-full pl-10 pr-4 py-2 border border-[#c3c6d8] dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-[#191c1f] dark:text-slate-200 focus:outline-none focus:border-[#004ccd] dark:focus:border-blue-400 text-sm"
            />
          </div>

          {/* Risk Level Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'High Risk', 'Medium Risk', 'Low Risk'] as const).map((risk) => {
              const isActive = selectedRiskFilter === risk;
              return (
                <button
                  key={risk}
                  onClick={() => setSelectedRiskFilter(risk)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
                    isActive
                      ? 'bg-[#004ccd] text-white border-transparent shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-[#191c1f] dark:text-slate-300 border-[#c3c6d8] dark:border-slate-700 hover:bg-[#f2f4f8] dark:hover:bg-slate-800'
                  }`}
                >
                  {risk}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expandable Athletes List Section */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-[#c3c6d8] dark:border-slate-800 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
            </div>
          ))
        ) : (
          <>
        {filteredAthletes.map((athlete) => {
          const fullName = athlete.full_name || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || 'Athlete';
          const athleteRisk = athlete.riskLevel || (
            athlete.risk_category?.toLowerCase().includes('high') ? 'High Risk' :
            athlete.risk_category?.toLowerCase().includes('medium') || athlete.risk_category?.toLowerCase().includes('moderate') ? 'Medium Risk' :
            'Low Risk'
          );

          const isHigh = athleteRisk === 'High Risk';
          const isMedium = athleteRisk === 'Medium Risk';
          const isLow = athleteRisk === 'Low Risk';

          const indicatorColor = isHigh
            ? 'bg-[#ba1a1a]'
            : isMedium
            ? 'bg-[#b97b00]'
            : 'bg-[#11801c]';

          const badgeClass = isHigh
            ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]'
            : isMedium
            ? 'bg-[#ffe4c2] text-[#b97b00] border border-[#ffe0b2]'
            : 'bg-[#c4f2c7] text-[#11801c] border border-[#ceebd4]';

          const isExpanded = expandedAthleteId === athlete.id;
          const loadingHistory = loadingHistoryId === athlete.id;
          const historyData = histories[athlete.id];

          return (
            <div
              key={athlete.id}
              className={`bg-white dark:bg-slate-900 rounded-xl border border-[#c3c6d8] dark:border-slate-800 shadow-xs overflow-hidden transition-all duration-200 ${
                isExpanded ? 'ring-1 ring-[#004ccd] dark:ring-blue-400 shadow-sm' : 'hover:shadow-md'
              }`}
            >
              {/* Expandable Row Header */}
              <div 
                onClick={() => handleToggleExpand(athlete.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#faf8ff] dark:hover:bg-slate-800/50 transition-colors relative"
              >
                {/* Risk Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor}`} />

                {/* Left Information */}
                <div className="flex items-center gap-4 pl-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#c3c6d8] flex items-center justify-center bg-[#004ccd] text-white font-bold text-lg shrink-0">
                    {athlete.profile_picture_url || athlete.avatarUrl || athlete.profile?.profile_picture_url ? (
                      <img
                        src={athlete.profile_picture_url || athlete.avatarUrl || athlete.profile?.profile_picture_url}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#191c1f] dark:text-white text-base leading-tight">
                      {fullName}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#737687] dark:text-slate-400 mt-0.5">
                      {athlete.email} • {athlete.sport || athlete.profile?.sport || 'Soccer'}
                    </p>
                  </div>
                </div>

                {/* Middle Info / Badges */}
                <div className="flex flex-wrap items-center gap-4 pl-4 md:pl-0">
                  <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${badgeClass}`}>
                    {isHigh && <AlertTriangle className="w-3.5 h-3.5" />}
                    {isMedium && <Info className="w-3.5 h-3.5" />}
                    {isLow && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {athleteRisk}
                  </div>

                  <div className="text-xs font-semibold text-[#424656] dark:text-slate-400">
                    Strain Load: <span className={`font-bold ${isHigh ? 'text-[#ba1a1a] dark:text-red-400' : isMedium ? 'text-[#b97b00] dark:text-orange-400' : 'text-[#11801c] dark:text-green-500'}`}>{athlete.strainLoad ?? athlete.latest_score ?? 28}%</span>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-3 pl-4 md:pl-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAthlete(athlete);
                    }}
                    className="px-3.5 py-1.5 bg-[#f2f4f8] dark:bg-slate-800 hover:bg-[#e0e2e6] dark:hover:bg-slate-700 text-[#004ccd] dark:text-blue-400 text-xs font-bold rounded-lg border border-[#c3c6d8] dark:border-slate-700 transition-colors"
                  >
                    Open Profile
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove ${fullName} from roster?`)) {
                        onDeleteAthlete(athlete.id);
                      }
                    }}
                    className="p-2 text-[#424656] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors border border-transparent"
                    title="Remove Athlete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-[#737687] ml-2">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="border-t border-[#c3c6d8] dark:border-slate-800 bg-[#fcfcff] dark:bg-slate-900/50 p-6 space-y-6">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Loader2 className="w-6 h-6 text-[#004ccd] dark:text-blue-400 animate-spin" />
                      <span className="text-xs font-semibold text-[#424656] dark:text-slate-400">Loading athlete record...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Athlete Profile Summary */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#c3c6d8] dark:border-slate-800 p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#c3c6d8]/50 dark:border-slate-700/50">
                          <User className="w-4.5 h-4.5 text-[#004ccd] dark:text-blue-400" />
                          <h4 className="font-extrabold text-sm text-[#191c1f] dark:text-white">Profile Specifications</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Age</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block">{historyData?.profile?.age || athlete.profile?.age || 'N/A'} yrs</span>
                          </div>
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Gender</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block capitalize">{historyData?.profile?.gender || athlete.profile?.gender || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Height</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block">{historyData?.profile?.height || athlete.profile?.height || 'N/A'} cm</span>
                          </div>
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Weight</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block">{historyData?.profile?.weight || athlete.profile?.weight || 'N/A'} kg</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Training Load Intensity</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block capitalize">{historyData?.profile?.training_intensity || athlete.profile?.training_intensity || 'Medium'}</span>
                          </div>
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Weekly Workouts</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block">{historyData?.profile?.weekly_training_sessions || athlete.profile?.weekly_training_sessions || 'N/A'} sessions</span>
                          </div>
                          <div>
                            <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px]">Primary Sport</span>
                            <span className="text-[#191c1f] dark:text-slate-200 text-sm mt-0.5 block capitalize">{historyData?.profile?.sport || athlete.profile?.sport || 'Soccer'}</span>
                          </div>
                        </div>

                        {/* Injury details */}
                        <div className="mt-4 pt-4 border-t border-[#c3c6d8]/50 dark:border-slate-700/50 space-y-2">
                          <span className="text-[#737687] dark:text-slate-400 block uppercase text-[10px] font-bold">Injury Status Report</span>
                          <div className={`p-3 rounded-lg border text-xs font-semibold ${
                            (historyData?.profile?.has_previous_injury || athlete.profile?.has_previous_injury) === 'Yes'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {(historyData?.profile?.has_previous_injury || athlete.profile?.has_previous_injury) === 'Yes' ? (
                              <div>
                                <p className="font-bold">Prior Injury Logged</p>
                                <p className="font-normal mt-1">Type: {historyData?.profile?.previous_injury_type || 'N/A'}</p>
                                <p className="font-normal">Recency: {historyData?.profile?.injury_recency || 'N/A'}</p>
                              </div>
                            ) : (
                              <p className="font-bold">No previous injuries reported.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Analysis History Timeline */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#c3c6d8] dark:border-slate-800 p-5 lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#c3c6d8]/50 dark:border-slate-700/50">
                          <Activity className="w-4.5 h-4.5 text-[#004ccd] dark:text-blue-400" />
                          <h4 className="font-extrabold text-sm text-[#191c1f] dark:text-white">Historical Assessments & Progress Analytics</h4>
                        </div>

                        {(() => {
                          if (!historyData?.history || historyData.history.length === 0) return null;
                          const chartData = [...historyData.history]
                            .sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
                            .map((sess: any, i: number, arr: any[]) => {
                              const score = sess.risk_data?.overall_health_score ?? 100;
                              const efficiency = sess.risk_data?.biomechanical_efficiency_score ?? score;
                              const valgus = sess.risk_data?.valgus_angle ?? 0;
                              const prevScore = i > 0 ? (arr[i - 1].risk_data?.overall_health_score ?? 100) : score;
                              const diff = score - prevScore;
                              const diffLabel = i === 0 ? 'Baseline' : diff > 0 ? `+${diff} pts` : diff < 0 ? `${diff} pts` : 'No change';
                              return {
                                name: `S${i + 1}`,
                                date: sess.created_at ? new Date(sess.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `S${i + 1}`,
                                video: sess.video_name || `Session ${i + 1}`,
                                score: score,
                                efficiency: efficiency,
                                valgus: Number(valgus.toFixed(1)),
                                diff: diff,
                                diffLabel: diffLabel
                              };
                            });
                          const latestDiff = chartData[chartData.length - 1]?.diff ?? 0;
                          const latestDiffLabel = chartData[chartData.length - 1]?.diffLabel ?? 'Baseline';

                          return (
                            <div className="bg-[#f8fafc] dark:bg-slate-800/50 rounded-xl border border-[#c3c6d8]/70 dark:border-slate-700/70 p-4 mb-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#c3c6d8]/50 dark:border-slate-700/50">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-[#004ccd] dark:text-blue-400" />
                                  <h5 className="font-extrabold text-xs text-[#191c1f] dark:text-slate-200 uppercase tracking-wider">Session-over-Session Analytics Progress</h5>
                                </div>
                                {chartData.length > 1 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#424656] dark:text-slate-400">Latest vs Prev Session:</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                      latestDiff > 0 ? 'bg-[#c4f2c7] dark:bg-green-900/30 text-[#11801c] dark:text-green-400' :
                                      latestDiff < 0 ? 'bg-[#ffdad6] dark:bg-red-900/30 text-[#ba1a1a] dark:text-red-400' :
                                      'bg-[#e0e2e6] dark:bg-slate-700 text-[#424656] dark:text-slate-300'
                                    }`}>
                                      {latestDiffLabel}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="h-56 w-full pt-1">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2e6" />
                                    <XAxis dataKey="date" stroke="#737687" fontSize={11} fontStyle="bold" />
                                    <YAxis domain={[0, 100]} stroke="#737687" fontSize={11} />
                                    <Tooltip 
                                      content={({ active, payload }: any) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-[#191c1f] text-white p-3 rounded-lg shadow-xl border border-[#424656] text-xs space-y-1.5 min-w-[180px]">
                                              <p className="font-bold text-[#93a4ff] border-b border-gray-700 pb-1">{data.video} ({data.date})</p>
                                              <p className="flex justify-between font-semibold"><span className="text-gray-300">Health Score:</span> <strong className="text-[#00e5ff]">{data.score}/100</strong></p>
                                              <p className="flex justify-between font-semibold"><span className="text-gray-300">Efficiency:</span> <strong className="text-[#4ade80]">{data.efficiency}/100</strong></p>
                                              <p className="flex justify-between font-semibold"><span className="text-gray-300">Valgus Angle:</span> <strong className="text-[#fbbf24]">{data.valgus}°</strong></p>
                                              <div className="pt-1 border-t border-gray-700 flex justify-between items-center font-bold">
                                                <span className="text-gray-400">vs Prev Session:</span>
                                                <span className={data.diff > 0 ? 'text-[#4ade80]' : data.diff < 0 ? 'text-[#f87171]' : 'text-gray-400'}>
                                                  {data.diffLabel}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '5px' }} />
                                    <Line name="Health Score" type="monotone" dataKey="score" stroke="#004ccd" strokeWidth={3} dot={{ fill: '#004ccd', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    <Line name="Efficiency" type="monotone" dataKey="efficiency" stroke="#11801c" strokeWidth={2.5} strokeDasharray="4 4" dot={{ fill: '#11801c', r: 3 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })()}

                        {historyData?.history && historyData.history.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-[#c3c6d8] bg-[#f8fafc] text-[#737687]">
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Date</th>
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Video Name</th>
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-center">Score</th>
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-center">Valgus</th>
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider">Risk</th>
                                  <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#c3c6d8]/50 font-semibold text-[#191c1f]">
                                {historyData.history.map((sess: any) => {
                                  const healthScore = sess.risk_data?.overall_health_score ?? 100;
                                  const valgus = sess.risk_data?.valgus_angle ?? 0.0;
                                  const risk = sess.risk_data?.risk_category ?? 'Low Risk';

                                  return (
                                    <tr key={sess.session_id} className="hover:bg-[#faf8ff] transition-colors">
                                      <td className="py-3 px-3 font-medium">
                                        {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'N/A'}
                                      </td>
                                      <td className="py-3 px-3 max-w-[150px] truncate" title={sess.video_name}>
                                        {sess.video_name}
                                      </td>
                                      <td className="py-3 px-3 text-center font-bold text-[#11801c]">
                                        {healthScore}/100
                                      </td>
                                      <td className="py-3 px-3 text-center">
                                        {valgus.toFixed(1)}°
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          risk === 'High Risk' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                                          risk === 'Medium Risk' || risk === 'Moderate Risk' ? 'bg-[#ffe4c2] text-[#b97b00]' :
                                          'bg-[#c4f2c7] text-[#11801c]'
                                        }`}>
                                          {risk}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3 text-right">
                                        <div className="flex justify-end gap-1.5">
                                          <button
                                            onClick={() => onGenerateRecommendations ? onGenerateRecommendations(sess.session_id, sess.video_name, athlete.id || athlete.user_id) : onSelectAthlete({ ...athlete, target_session: sess })}
                                            disabled={generatingRecId === sess.session_id}
                                            className="p-1.5 hover:bg-[#004ccd]/10 rounded text-[#004ccd] transition-colors disabled:opacity-50"
                                            title="Generate AI Recommendations"
                                          >
                                            {generatingRecId === sess.session_id ? (
                                              <Loader2 className="w-4 h-4 animate-spin text-[#004ccd]" />
                                            ) : (
                                              <Sparkles className="w-4 h-4" />
                                            )}
                                          </button>
                                          <button
                                            onClick={() => onDownloadPDF ? onDownloadPDF(sess, athlete) : handleDownloadSessionReport(sess.session_id, sess.video_name)}
                                            className="p-1.5 hover:bg-[#737687]/10 rounded text-[#737687] transition-colors"
                                            title="Download PDF Assessment"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#c3c6d8] rounded-xl text-center">
                            <Video className="w-8 h-8 text-[#737687] mb-2" />
                            <p className="text-xs font-semibold text-[#737687]">No assessment records uploaded for this athlete yet.</p>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
          </>
        )}
      </div>

      {!isLoading && filteredAthletes.length === 0 && (
        <div className="bg-white rounded-xl border border-[#c3c6d8] p-12 text-center max-w-md mx-auto space-y-3">
          <p className="text-base font-semibold text-[#191c1f]">No athletes found</p>
          <p className="text-xs text-[#424656]">
            Try clearing your search query or changing the risk level filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRiskFilter('All');
            }}
            className="px-4 py-2 bg-[#004ccd] text-white rounded-lg text-xs font-semibold hover:bg-[#003da9]"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
