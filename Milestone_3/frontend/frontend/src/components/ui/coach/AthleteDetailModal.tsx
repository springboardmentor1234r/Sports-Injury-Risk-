import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  FileText, 
  Save, 
  User, 
  Scale,
  Download,
  Sparkles,
  Loader2,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AthleteDetailModalProps {
  athlete: any;
  onClose: () => void;
  onUpdateNotes?: (athleteId: string, notes: string) => void;
  athleteHistory?: any;
  isLoadingHistory?: boolean;
  onUpdateProfileSubmit?: (e: React.FormEvent) => void;
  onDownloadPDF?: (session: any, profile: any) => void;
  onOpenSession?: (session: any) => void;
  onGenerateRecommendations?: (sessionId: string, videoName: string, athleteId?: string) => Promise<void>;
  generatingRecId?: string | null;
  
  // Profile form binding state
  formAge?: number | '';
  setFormAge?: (val: any) => void;
  formGender?: string;
  setFormGender?: (val: any) => void;
  formHasPrevInjury?: string;
  setFormHasPrevInjury?: (val: any) => void;
  formHeight?: number | '';
  setFormHeight?: (val: any) => void;
  formInjuryRecency?: string;
  setFormInjuryRecency?: (val: any) => void;
  formPrevInjuryType?: string;
  setFormPrevInjuryType?: (val: any) => void;
  formSport?: string;
  setFormSport?: (val: any) => void;
  formTrainingIntensity?: string;
  setFormTrainingIntensity?: (val: any) => void;
  formWeeklySessions?: number | '';
  setFormWeeklySessions?: (val: any) => void;
  formWeight?: number | '';
  setFormWeight?: (val: any) => void;
  formAvatarUrl?: string;
  setFormAvatarUrl?: (val: string) => void;
  isUpdatingProfile?: boolean;
  profileSuccessMsg?: string | null;
  profileErrorMsg?: string | null;
}

export const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({
  athlete,
  onClose,
  onUpdateNotes,
  athleteHistory,
  isLoadingHistory,
  onUpdateProfileSubmit,
  onDownloadPDF,
  onOpenSession,
  onGenerateRecommendations,
  generatingRecId,
  formAge,
  setFormAge,
  formGender,
  setFormGender,
  formHasPrevInjury,
  setFormHasPrevInjury,
  formHeight,
  setFormHeight,
  formInjuryRecency,
  setFormInjuryRecency,
  formPrevInjuryType,
  setFormPrevInjuryType,
  formSport,
  setFormSport,
  formTrainingIntensity,
  setFormTrainingIntensity,
  formWeeklySessions,
  setFormWeeklySessions,
  formWeight,
  setFormWeight,
  formAvatarUrl,
  setFormAvatarUrl,
  isUpdatingProfile,
  profileSuccessMsg,
  profileErrorMsg
}) => {
  const [notes, setNotes] = useState(athlete.notes || '');
  const [isSaved, setIsSaved] = useState(false);

  const fullName = athlete.full_name || `${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || 'Athlete';
  const strainLoad = athlete.strainLoad ?? athlete.latest_score ?? 68;

  // 7-day strain load timeline — built from REAL session history
  const trendData = (() => {
    const sessions = athleteHistory?.history;
    if (sessions && sessions.length > 0) {
      // Take up to last 7 sessions (they come newest-first from backend, so reverse)
      const recent = [...sessions].reverse().slice(-7);
      return recent.map((s: any) => {
        const score = s.risk_data?.final_risk_score ?? s.risk_data?.overall_health_score ?? null;
        const dateLabel = s.created_at
          ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          : (s.session_id || 'Session');
        return { day: dateLabel, strain: score !== null ? Number(score.toFixed(1)) : null };
      });
    }
    // No sessions yet — return empty so chart shows "No data" state
    return [];
  })();

  const lastScanLabel = (() => {
    const s = athleteHistory?.history?.[0];
    if (!s?.created_at) return 'No sessions yet';
    const d = new Date(s.created_at);
    const today = new Date();
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(athlete.id, notes);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const athleteRisk = athlete.riskLevel || (
    athlete.risk_category?.toLowerCase().includes('high') ? 'High Risk' :
    athlete.risk_category?.toLowerCase().includes('medium') || athlete.risk_category?.toLowerCase().includes('moderate') ? 'Medium Risk' :
    'Low Risk'
  );

  const isHigh = athleteRisk === 'High Risk';
  const isMedium = athleteRisk === 'Medium Risk';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full shadow-2xl border border-[#c3c6d8] dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#c3c6d8] dark:border-slate-800 flex justify-between items-start bg-[#f7f9fd] dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 flex items-center justify-center bg-[#004ccd] text-white font-bold text-xl">
              {athlete.avatarUrl || athlete.profile_picture_url || athlete.profile?.profile_picture_url ? (
                <img
                  src={athlete.avatarUrl || athlete.profile_picture_url || athlete.profile?.profile_picture_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-[#191c1f] dark:text-white">
                  {fullName}
                </h3>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    isHigh
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : isMedium
                      ? 'bg-[#ffe4c2] text-[#b97b00]'
                      : 'bg-[#c4f2c7] text-[#11801c]'
                  }`}
                >
                  {isHigh && <AlertTriangle className="w-3.5 h-3.5" />}
                  {isMedium && <Info className="w-3.5 h-3.5" />}
                  {!isHigh && !isMedium && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {athleteRisk}
                </span>
              </div>
              <p className="text-xs text-[#424656] dark:text-slate-400 mt-1">
                {athlete.sport || athlete.profile?.sport || 'Soccer'} • {athlete.position || 'Athlete'} | {athlete.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#424656] dark:text-slate-400 hover:bg-[#e0e2e6] dark:hover:bg-slate-700 hover:text-[#191c1f] dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Biometric Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-medium text-[#424656] dark:text-slate-400 uppercase block">
                Strain Load
              </span>
              <span className={`text-xl font-bold ${isHigh ? 'text-[#ba1a1a]' : isMedium ? 'text-[#b97b00]' : 'text-[#11801c]'}`}>
                {strainLoad}%
              </span>
            </div>

            <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-medium text-[#424656] dark:text-slate-400 uppercase block">
                Symmetry Score
              </span>
              <span className="text-xl font-bold text-[#191c1f] dark:text-white">
                {athlete.keyStats?.symmetryScore ?? (athleteHistory?.history?.[0]?.risk_data?.symmetry_score !== undefined ? `${athleteHistory.history[0].risk_data.symmetry_score}%` : 'N/A')}
              </span>
            </div>

            <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-medium text-[#424656] dark:text-slate-400 uppercase block">
                Fatigue Index
              </span>
              <span className="text-xl font-bold text-[#191c1f] dark:text-white">
                {athlete.keyStats?.fatigueIndex ?? (athleteHistory?.history?.[0]?.risk_data?.fatigue_index !== undefined ? `${athleteHistory.history[0].risk_data.fatigue_index}%` : 'N/A')}
              </span>
            </div>

            <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3.5 rounded-xl text-center">
              <span className="text-[11px] font-medium text-[#424656] dark:text-slate-400 uppercase block">
                Demographics
              </span>
              <span className="text-xs font-bold text-[#191c1f] dark:text-white block mt-1">
                {athlete.age || athlete.profile?.age || '--'}y • {athlete.heightCm || athlete.profile?.height || '--'}cm • {athlete.weightKg || athlete.profile?.weight || '--'}kg
              </span>
            </div>
          </div>

          {/* Strain Load Trend Chart */}
          <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-[#191c1f] dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#004ccd] dark:text-blue-400" />
                7-Day Strain Load Timeline
              </h4>
              <span className="text-xs text-[#424656] dark:text-slate-400">
                Last scan: {lastScanLabel}
              </span>
            </div>

            <div className="h-44 w-full">
              {trendData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#737687]">
                  No session data available yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2e6" />
                    <XAxis dataKey="day" stroke="#737687" fontSize={11} />
                    <YAxis stroke="#737687" fontSize={11} domain={[0, 100]} />
                    <Tooltip 
                      formatter={(val: any) => [`${val}%`, 'Risk Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="strain" 
                      stroke={isHigh ? '#ba1a1a' : isMedium ? '#b97b00' : '#11801c'} 
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Biomechanical Notes & Coach Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#191c1f] dark:text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#004ccd] dark:text-blue-400" />
                Biomechanical Evaluation & Coach Protocol
              </span>
              {isSaved && (
                <span className="text-xs font-semibold text-[#11801c]">
                  Saved!
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter custom rehab notes, targeted joint mobility drills, or training load constraints..."
              className="w-full p-3 text-xs text-[#191c1f] dark:text-slate-200 bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#004ccd] focus:ring-1 focus:ring-[#004ccd] dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-[#004ccd] text-white rounded-lg text-xs font-semibold hover:bg-[#003da9] flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save Evaluation Notes
              </button>
            </div>
          </div>

          {/* Latest Session Report & PDF Download */}
          {athleteHistory && athleteHistory.history && athleteHistory.history.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-[#c3c6d8] dark:border-slate-800 p-5 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#004ccd] dark:text-blue-400 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Latest Session Report
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3 rounded-lg border border-[#c3c6d8]/40 dark:border-slate-700/40">
                  <span className="text-[10px] text-[#424656] dark:text-slate-400 font-medium uppercase block">Health Score</span>
                  <span className="text-lg font-bold text-[#004ccd] dark:text-blue-400">{athleteHistory.history[0].risk_data?.overall_health_score || 0}</span>
                </div>
                <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3 rounded-lg border border-[#c3c6d8]/40 dark:border-slate-700/40">
                  <span className="text-[10px] text-[#424656] dark:text-slate-400 font-medium uppercase block">Injury Risk</span>
                  <span className="text-lg font-bold text-[#ba1a1a] dark:text-red-400">{athleteHistory.history[0].risk_data?.final_risk_score || 0}</span>
                </div>
                <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3 rounded-lg border border-[#c3c6d8]/40 dark:border-slate-700/40">
                  <span className="text-[10px] text-[#424656] dark:text-slate-400 font-medium uppercase block">Quality Score</span>
                  <span className="text-lg font-bold text-[#11801c] dark:text-green-500">{athleteHistory.history[0].risk_data?.movement_quality_score || 0}</span>
                </div>
                <div className="bg-[#f2f4f8] dark:bg-slate-800/50 p-3 rounded-lg border border-[#c3c6d8]/40 dark:border-slate-700/40">
                  <span className="text-[10px] text-[#424656] dark:text-slate-400 font-medium uppercase block">Efficiency</span>
                  <span className="text-lg font-bold text-[#304db9] dark:text-indigo-400">{athleteHistory.history[0].risk_data?.biomechanical_efficiency_score || 0}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {onGenerateRecommendations && (
                  <button
                    onClick={() => onGenerateRecommendations(athleteHistory.history[0].session_id, athleteHistory.history[0].video_name, athlete.id || athlete.user_id)}
                    disabled={generatingRecId === athleteHistory.history[0].session_id}
                    className="flex-1 py-2 px-2 bg-[#f2f4f8] dark:bg-slate-800 hover:bg-[#e0e2e6] dark:hover:bg-slate-700 text-[#004ccd] dark:text-blue-400 text-xs font-semibold rounded-lg border border-[#004ccd]/30 dark:border-blue-400/30 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Generate AI Recommendations"
                  >
                    {generatingRecId === athleteHistory.history[0].session_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004ccd]" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#004ccd]" />
                    )}
                    Start (AI Recs)
                  </button>
                )}
                {onOpenSession && (
                  <button
                    onClick={() => onOpenSession(athleteHistory.history[0])}
                    className="flex-1 py-2 px-2 bg-[#f2f4f8] dark:bg-slate-800 hover:bg-[#e0e2e6] dark:hover:bg-slate-700 text-[#191c1f] dark:text-slate-300 text-xs font-semibold rounded-lg border border-[#c3c6d8] dark:border-slate-700 transition-colors flex items-center justify-center gap-1"
                    title="Preview Full Report"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#737687]" /> View
                  </button>
                )}
                {onDownloadPDF && (
                  <button
                    onClick={() => onDownloadPDF(athleteHistory.history[0], athleteHistory.profile)}
                    className="flex-1 py-2 px-2 bg-[#004ccd] hover:bg-[#003da9] text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs"
                    title="Download Report"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
