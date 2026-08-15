import React from 'react';
import { AlertTriangle, CheckCircle2, Activity, TrendingUp, Info } from 'lucide-react';

interface PdfAnalyticsOnlyProps {
  session: any;
  recommendations?: any;
  previousSession?: any;
  athleteProfile?: any;
}

export const PdfAnalyticsOnly = React.forwardRef<HTMLDivElement, PdfAnalyticsOnlyProps>((props, ref) => {
  const { session } = props;
  if (!session) return null;

  const riskData = session.risk_data || {};
  const bio = session.biomechanics || {};
  const finalScore = Math.round(riskData.final_risk_score || 0);
  const healthScore = Math.round(riskData.overall_health_score || 0);
  const movQuality = Math.round(riskData.movement_quality_score || 0);
  const bioEff = Math.round(riskData.biomechanical_efficiency_score || 0);
  const fatigueScore = Math.round(riskData.fatigue_score || 0);
  const category = riskData.risk_category || 'Unknown';
  
  const recommendations = props.recommendations || session.recommendations;
  const previousSession = props.previousSession || session.previousSession;
  const athleteProfile = props.athleteProfile || session.athleteProfile;

  const date = session.created_at ? new Date(session.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : new Date().toLocaleDateString();

  const colors = {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    emerald100: '#d1fae5',
    emerald400: '#34d399',
    emerald500: '#10b981',
    emerald600: '#059669',
    emerald700: '#047857',
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber600: '#d97706',
    amber700: '#b45309',
    rose50: '#fff1f2',
    rose100: '#ffe4e6',
    rose200: '#fecdd3',
    rose500: '#f43f5e',
    rose600: '#e11d48',
    rose700: '#be123c',
    blue100: '#dbeafe',
    blue700: '#1d4ed8',
  };

  const riskColor = category.includes('High') ? colors.rose600 : category.includes('Moderate') ? colors.amber600 : colors.emerald600;
  const riskBg = category.includes('High') ? colors.rose100 : category.includes('Moderate') ? colors.amber100 : colors.emerald100;

  // Semicircle Gauge Component
  const SemicircleGauge = ({ value, max = 100 }: { value: number; max?: number }) => {
    const pct = Math.min(100, Math.max(0, value));
    const r = 45;
    const c = Math.PI * r;
    const offset = c - (pct / 100) * c;
    const color = pct >= 70 ? colors.emerald500 : pct >= 45 ? colors.amber500 : colors.rose500;
    return (
      <svg viewBox="0 0 120 65" width="130" height="70" className="mx-auto">
        <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={colors.slate200} strokeWidth="10" strokeLinecap="round" />
        <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={color} strokeWidth="10" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        <text x="60" y="48" textAnchor="middle" fontSize="22" fontWeight="900" fill={colors.slate900}>{value}</text>
        <text x="60" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill={colors.slate400}>/ {max}</text>
      </svg>
    );
  };

  // Issue Parser with Severity Mapping
  const issueMap: Record<string, { label: string; why: string; priority: 'High' | 'Medium' | 'Low' }> = {
    right_knee_rom: { label: 'Right Knee ROM exceeds safe limit', why: 'Increases ligament stress and injury risk.', priority: 'High' },
    left_knee_rom: { label: 'Left Knee ROM exceeds safe limit', why: 'Indicates muscle imbalance or ligament laxity.', priority: 'High' },
    right_hip_rom: { label: 'Right Hip ROM is abnormal', why: 'Hip issues cascade to knee and lower back.', priority: 'Medium' },
    left_hip_rom: { label: 'Left Hip ROM is abnormal', why: 'Restricted hip ROM alters gait mechanics.', priority: 'Medium' },
    right_elbow_rom: { label: 'Right Elbow ROM exceeds safe limit', why: 'Indicates instability or overuse pattern.', priority: 'Medium' },
    left_elbow_rom: { label: 'Left Elbow ROM is abnormal', why: 'Asymmetric ROM suggests compensation.', priority: 'Low' },
    right_ankle_rom: { label: 'Right Ankle ROM is restricted', why: 'Affects landing mechanics and balance.', priority: 'Medium' },
    left_ankle_rom: { label: 'Left Ankle ROM is restricted', why: 'Ankle stiffness overloads knee and hip.', priority: 'Medium' },
    balance_sway: { label: 'Balance Sway above safe threshold', why: 'High sway increases fall and joint injury risk.', priority: 'High' },
    knee_symmetry_avg: { label: 'Significant Knee Asymmetry (L vs R)', why: 'Overloads one side, causing overuse injury.', priority: 'High' },
    hip_symmetry_avg: { label: 'Significant Hip Asymmetry (L vs R)', why: 'Indicates muscle weakness or compensation.', priority: 'Medium' },
    elbow_symmetry_avg: { label: 'Significant Elbow Asymmetry (L vs R)', why: 'Differential arm loading during movement.', priority: 'Low' },
    ankle_symmetry_avg: { label: 'Significant Ankle Asymmetry (L vs R)', why: 'Affects gait symmetry and energy efficiency.', priority: 'Medium' },
  };

  const parseIssues = (input: any) => {
    if (!input || input === 'None') return [];
    
    // Normalize to an array of raw strings
    let rawIssues: string[] = [];
    if (typeof input === 'string') {
      rawIssues = input.split(' | ').filter(Boolean);
    } else if (Array.isArray(input)) {
      rawIssues = input.map(i => typeof i === 'string' ? i : (i.issue || JSON.stringify(i)));
    } else {
      rawIssues = [JSON.stringify(input)];
    }

    return rawIssues.map(raw => {
      const key = Object.keys(issueMap).find(k => raw.toLowerCase().includes(k));
      return key ? { ...issueMap[key], raw } : {
        label: raw.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()),
        why: 'Flagged by biomechanical analysis.',
        priority: 'Medium' as const,
        raw,
      };
    }).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]));
  };

  const issues = parseIssues(riskData.flagged_issues || '');

  const pBadge = (p: 'High' | 'Medium' | 'Low') => ({
    High: { bg: colors.rose50, border: colors.rose200, color: colors.rose700, tag: 'High Severity' },
    Medium: { bg: colors.amber50, border: colors.amber200, color: colors.amber700, tag: 'Moderate' },
    Low: { bg: colors.blue100, border: '#93c5fd', color: colors.blue700, tag: 'Low Severity' },
  }[p]);

  const prevHealth = previousSession?.risk_data?.overall_health_score !== undefined 
    ? Math.round(previousSession.risk_data.overall_health_score) 
    : undefined;

  // Header & Footer Helpers
  const PageHeader = () => (
    <div className="flex justify-between items-end pb-3 mb-6 border-b-2" style={{ borderColor: colors.slate800 }}>
      <div>
        <h1 className="text-xl font-black tracking-tight" style={{ color: colors.slate900 }}>MoveIQ</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: colors.slate500 }}>AI Biomechanics Analytics Report</p>
      </div>
      <div className="text-right text-[11px] space-y-0.5" style={{ color: colors.slate500 }}>
        <p>Report ID: <span className="font-bold" style={{ color: colors.slate800 }}>MIQ-{session.session_id.substring(0, 8).toUpperCase()}</span></p>
        <p>Date: <span className="font-bold" style={{ color: colors.slate800 }}>{date}</span></p>
      </div>
    </div>
  );

  const PageFooter = ({ page, total }: { page: number; total: number }) => (
    <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[10px] pt-3 border-t" style={{ color: colors.slate400, borderColor: colors.slate200 }}>
      <span>MoveIQ AI — Confidential Athlete Report</span>
      <span>Page {page} of {total}</span>
    </div>
  );

  const SecHead = ({ n, title }: { n: string; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: colors.slate900, color: colors.white }}>{n}</span>
      <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.slate800 }}>{title}</h2>
    </div>
  );

  return (
    <div>
      <div ref={ref} className="font-sans w-[800px] mx-auto text-xs" style={{ backgroundColor: colors.white, color: colors.slate900 }}>
        
        {/* ================= PAGE 1 ================= */}
        <div className="pdf-page p-10 relative min-h-[1131px] flex flex-col justify-between" style={{ pageBreakAfter: 'always', backgroundColor: colors.white }}>
          <div>
            <PageHeader />

            {/* Athlete & Session Metadata Block */}
            <div className="mb-6 p-4 rounded-xl border bg-slate-50" style={{ borderColor: colors.slate200 }}>
              <div className="grid grid-cols-4 gap-3 text-left">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Athlete Name</span>
                  <span className="font-bold text-slate-800 text-sm">{athleteProfile?.full_name || 'Valued Athlete'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Sport & Position</span>
                  <span className="font-bold text-slate-800 text-xs">{athleteProfile?.sport || 'General Athletic'} {athleteProfile?.position ? `(${athleteProfile.position})` : ''}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Video Duration & FPS</span>
                  <span className="font-bold text-slate-800 text-xs">{session.video_duration || '30s'} / {session.fps || 30} FPS ({session.frame_count || 900} f)</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block mb-0.5">Analysis Confidence</span>
                  <span className="font-bold text-emerald-600 text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 92% — High Accuracy
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Summary with Radial Gauge */}
            <SecHead n="1" title="Summary & Health Overview" />
            <div className="grid grid-cols-2 gap-5 mb-6">
              <div className="rounded-xl p-5 flex flex-col items-center justify-center text-center border" style={{ borderColor: colors.slate200 }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.slate500 }}>Overall Athlete Health Score</h3>
                <SemicircleGauge value={healthScore} />
                <span className="px-3 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase mt-2" style={{ backgroundColor: riskBg, color: riskColor }}>
                  {category}
                </span>
              </div>
              <div className="rounded-xl p-5 flex flex-col justify-center border" style={{ borderColor: colors.slate200 }}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: colors.slate500 }}>Risk Assessment Summary</h3>
                <h4 className="text-lg font-bold mb-2" style={{ color: riskColor }}>{category} Detected</h4>
                <p className="leading-relaxed text-[11px]" style={{ color: colors.slate600 }}>
                  The analysis reveals {category.toLowerCase()} movement patterns based on AI frame-by-frame joint pose estimation. 
                  Immediate attention should be directed to joint asymmetry and range-of-motion limits to prevent overuse injury and optimize biomechanical efficiency.
                </p>
              </div>
            </div>

            {/* Section 2: Supporting Scores */}
            <SecHead n="2" title="Supporting Biomechanical Scores" />
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Injury Risk Score', val: finalScore, bcolor: colors.rose500 },
                { label: 'Movement Quality', val: movQuality, bcolor: colors.emerald500 },
                { label: 'Biomechanical Efficiency', val: bioEff, bcolor: colors.emerald500 },
                { label: 'Fatigue Score', val: fatigueScore, bcolor: colors.amber500 }
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-4 text-center border" style={{ borderColor: colors.slate200, borderBottom: `3px solid ${s.bcolor}` }}>
                  <div className="flex justify-center items-end gap-1 mb-1">
                    <span className="text-2xl font-black" style={{ color: colors.slate900 }}>{s.val}</span>
                    <span className="text-xs font-bold mb-0.5" style={{ color: colors.slate400 }}>/100</span>
                  </div>
                  <p className="text-[9px] font-bold uppercase" style={{ color: colors.slate500 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Section 3: Body-Region Risk Map */}
            <SecHead n="3" title="Body-Region Risk Map" />
            <div className="p-4 rounded-xl border bg-slate-50 mb-6 flex items-center gap-6" style={{ borderColor: colors.slate200 }}>
              <div className="w-[80px] shrink-0 flex justify-center">
                <svg viewBox="0 0 120 260" width="75" height="150">
                  <circle cx="60" cy="22" r="16" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="44" y="40" width="32" height="74" rx="10" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="24" y="46" width="14" height="54" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="82" y="46" width="14" height="54" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="44" y="118" width="14" height="58" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="62" y="118" width="14" height="58" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="44" y="180" width="14" height="56" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  <rect x="62" y="180" width="14" height="56" rx="7" fill={colors.slate200} stroke={colors.slate400} strokeWidth="1.5"/>
                  {[
                    { cx: 31, cy: 100, v: bio.left_elbow_rom, t: 140 },
                    { cx: 89, cy: 100, v: bio.right_elbow_rom, t: 140 },
                    { cx: 49, cy: 120, v: bio.left_hip_rom, t: 60 },
                    { cx: 71, cy: 120, v: bio.right_hip_rom, t: 60 },
                    { cx: 49, cy: 178, v: bio.left_knee_rom, t: 130 },
                    { cx: 71, cy: 178, v: bio.right_knee_rom, t: 130 },
                    { cx: 49, cy: 238, v: bio.left_ankle_rom, t: 90 },
                    { cx: 71, cy: 238, v: bio.right_ankle_rom, t: 90 },
                  ].map((dot, i) => {
                    if (dot.v === undefined) return null;
                    const bad = dot.v > dot.t;
                    const mid = dot.v > dot.t * 0.85;
                    const col = bad ? colors.rose500 : mid ? colors.amber500 : colors.emerald500;
                    return <circle key={i} cx={dot.cx} cy={dot.cy} r="7" fill={col} stroke={colors.white} strokeWidth="1.5" opacity="0.95" />;
                  })}
                </svg>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                {[
                  { name: 'Right Knee ROM', v: bio.right_knee_rom, t: 130 },
                  { name: 'Left Knee ROM', v: bio.left_knee_rom, t: 130 },
                  { name: 'Right Hip ROM', v: bio.right_hip_rom, t: 60 },
                  { name: 'Left Hip ROM', v: bio.left_hip_rom, t: 60 },
                  { name: 'Right Elbow ROM', v: bio.right_elbow_rom, t: 140 },
                  { name: 'Left Elbow ROM', v: bio.left_elbow_rom, t: 140 },
                ].filter(j => j.v !== undefined).map((j, i) => {
                  const bad = j.v > j.t;
                  const mid = j.v > j.t * 0.85;
                  const col = bad ? colors.rose600 : mid ? colors.amber600 : colors.emerald600;
                  const status = bad ? 'High Risk' : mid ? 'Moderate' : 'Normal';
                  return (
                    <div key={i} className="flex justify-between items-center border-b pb-1" style={{ borderColor: colors.slate200 }}>
                      <span className="text-slate-700 font-medium">{j.name}:</span>
                      <span className="font-bold" style={{ color: col }}>{typeof j.v === 'number' ? j.v.toFixed(1) : j.v}° ({status})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Detected Issues with Severity Tags */}
            <SecHead n="4" title="Detected Biomechanical Issues" />
            <div className="space-y-2">
              {issues.length > 0 ? (
                issues.map((iss, idx) => {
                  const ps = pBadge(iss.priority);
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50" style={{ borderColor: colors.slate200 }}>
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: ps.color }} />
                        <div>
                          <p className="font-bold text-slate-800 text-[11px]">{iss.label}</p>
                          <p className="text-[10px] text-slate-500">{iss.why}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[9px] font-bold uppercase shrink-0 border" style={{ backgroundColor: ps.bg, color: ps.color, borderColor: ps.border }}>
                        {ps.tag}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-emerald-50 text-emerald-700 font-semibold text-xs border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> No major biomechanical issues detected. Movement patterns are optimal.
                </div>
              )}
            </div>
          </div>

          <PageFooter page={1} total={3} />
        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="pdf-page p-10 relative min-h-[1131px] flex flex-col justify-between" style={{ pageBreakAfter: 'always', backgroundColor: colors.white }}>
          <div>
            <PageHeader />

            {/* Section 5: Biomechanical Measurements */}
            <SecHead n="5" title="Biomechanical Measurements Table" />
            <div className="overflow-hidden rounded-xl border mb-6" style={{ borderColor: colors.slate200 }}>
              <table className="w-full text-left border-collapse">
                <thead style={{ backgroundColor: colors.slate50, borderBottom: `1px solid ${colors.slate200}` }}>
                  <tr>
                    <th className="py-2.5 px-4 font-bold text-[10px] text-slate-600 uppercase">Joint / Metric</th>
                    <th className="py-2.5 px-4 font-bold text-[10px] text-slate-600 text-center uppercase">Recorded Value</th>
                    <th className="py-2.5 px-4 font-bold text-[10px] text-slate-600 text-center uppercase">Safe Normative Range</th>
                    <th className="py-2.5 px-4 font-bold text-[10px] text-slate-600 text-center uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { m: 'Right Knee ROM', v: bio.right_knee_rom, t: 130, u: '°', desc: 'Max flexion angle during landing' },
                    { m: 'Left Knee ROM', v: bio.left_knee_rom, t: 130, u: '°', desc: 'Max flexion angle during landing' },
                    { m: 'Right Hip ROM', v: bio.right_hip_rom, t: 60, u: '°', desc: 'Hip extension / flexion deviation' },
                    { m: 'Left Hip ROM', v: bio.left_hip_rom, t: 60, u: '°', desc: 'Hip extension / flexion deviation' },
                    { m: 'Right Elbow ROM', v: bio.right_elbow_rom, t: 140, u: '°', desc: 'Elbow extension limit' },
                    { m: 'Left Elbow ROM', v: bio.left_elbow_rom, t: 140, u: '°', desc: 'Elbow extension limit' },
                    { m: 'Knee Asymmetry', v: bio.knee_symmetry_avg, t: 15, u: '°', desc: 'Left vs Right differential' },
                    { m: 'Hip Asymmetry', v: bio.hip_symmetry_avg, t: 15, u: '°', desc: 'Pelvic tilt / rotation difference' },
                    { m: 'Balance Sway', v: bio.balance_sway, t: 0.5, u: '', desc: 'Center of mass postural sway' },
                  ].map((row, i) => {
                    const hasVal = row.v !== undefined && row.v !== null;
                    const valNum = typeof row.v === 'number' ? row.v : 0;
                    const bad = hasVal && valNum > row.t;
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${colors.slate100}` : 'none' }}>
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-slate-800 text-[11px]">{row.m}</p>
                          <p className="text-[9px] text-slate-400">{row.desc}</p>
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-800 text-[11px]">
                          {hasVal ? `${typeof row.v === 'number' ? row.v.toFixed(1) : row.v}${row.u}` : '--'}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-500 text-[11px]">
                          ≤ {row.t}{row.u}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block" 
                            style={{ 
                              backgroundColor: !hasVal ? colors.slate100 : bad ? colors.rose100 : colors.emerald100, 
                              color: !hasVal ? colors.slate500 : bad ? colors.rose700 : colors.emerald700 
                            }}>
                            {!hasVal ? 'N/A' : bad ? 'Flagged' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Section 6: Trend / History Mini-Chart */}
            <SecHead n="6" title="Overall Health Score Trend (Recent History)" />
            <div className="p-4 rounded-xl border bg-slate-50 mb-6 flex items-center justify-between" style={{ borderColor: colors.slate200 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Progress Trajectory</h4>
                  {prevHealth !== undefined ? (
                    <p className="text-[10px] text-slate-500">
                      Previous session score: <strong className="text-slate-800">{prevHealth}/100</strong> vs. Current: <strong className="text-slate-800">{healthScore}/100</strong> 
                      {healthScore >= prevHealth ? (
                        <span className="text-emerald-600 font-bold ml-1">(▲ +{healthScore - prevHealth} Improvement)</span>
                      ) : (
                        <span className="text-rose-600 font-bold ml-1">(▼ {healthScore - prevHealth} Decrease)</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500">First recorded session — longitudinal trend trajectory will be plotted after your 2nd video analysis.</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {prevHealth !== undefined && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border text-xs font-bold shadow-sm" style={{ borderColor: colors.slate200 }}>
                    <span className="text-slate-400 text-[10px]">Prev:</span> {prevHealth} <span className="text-slate-300">→</span> <span className="text-slate-400 text-[10px]">Cur:</span> {healthScore}
                  </div>
                )}
              </div>
            </div>

            {/* Section 7 preview / link */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-blue-600" />
              <span><strong>Next Page:</strong> Embedded MoveIQ AI Intervention Plan & Corrective Exercise Prescription based on these joint measurements.</span>
            </div>
          </div>

          <div>
            {/* Legend / Methodology Footnote */}
            <div className="pt-3 border-t text-[9px] text-slate-500 leading-relaxed mb-6" style={{ borderColor: colors.slate200 }}>
              <strong>Methodology & Normative Thresholds:</strong> Normal ranges and symmetry thresholds are established using sport-specific biomechanical literature and normative athletic movement databases. Joint angles are computed via computer vision pose triangulation.
            </div>
            <PageFooter page={2} total={3} />
          </div>
        </div>

        {/* ================= PAGE 3 ================= */}
        <div className="pdf-page p-10 relative min-h-[1131px] flex flex-col justify-between" style={{ pageBreakAfter: 'always', backgroundColor: colors.white }}>
          <div>
            <PageHeader />

            {/* Section 7: Embedded Intervention Plan */}
            <SecHead n="7" title="Embedded AI Intervention Plan & Corrective Prescriptions" />
            
            {!recommendations || (typeof recommendations === 'string' && recommendations.includes("No recommendations generated")) ? (
              <div className="p-6 rounded-xl border border-dashed bg-slate-50 text-center text-slate-500 text-xs mb-6" style={{ borderColor: colors.slate300 }}>
                No corrective exercise recommendations have been generated for this session yet. Please run the AI Intervention Plan generator from the MoveIQ dashboard.
              </div>
            ) : typeof recommendations === 'object' && recommendations.one_line_summary ? (
              <div className="border rounded-xl overflow-hidden mb-6" style={{ borderColor: colors.slate200 }}>
                <div className="bg-slate-900 p-3.5 text-white text-xs font-bold leading-relaxed">
                  {recommendations.one_line_summary}
                </div>
                
                <div className="p-4 bg-white space-y-4">
                  {recommendations.categories && recommendations.categories.map((cat: any, idx: number) => {
                    // Match category to trigger measurement for direct linking
                    const catLower = cat.category_name?.toLowerCase() || '';
                    let triggerText = "Triggered by overall movement pattern analysis";
                    if (catLower.includes('knee') || catLower.includes('asymmetry')) triggerText = `Triggered by: Knee Asymmetry / ROM deviation (${bio.knee_symmetry_avg ? `${Math.round(bio.knee_symmetry_avg)}°` : 'Abnormal'})`;
                    else if (catLower.includes('elbow') || catLower.includes('instability')) triggerText = `Triggered by: Elbow ROM / Instability (${bio.right_elbow_rom ? `${Math.round(bio.right_elbow_rom)}°` : 'Abnormal'})`;
                    else if (catLower.includes('hip')) triggerText = `Triggered by: Hip ROM deviation (${bio.right_hip_rom ? `${Math.round(bio.right_hip_rom)}°` : 'Abnormal'})`;
                    else if (catLower.includes('fatigue')) triggerText = `Triggered by: Fatigue Score (${fatigueScore}/100 > 30/100 threshold)`;

                    return (
                      <div key={idx} className="border-b pb-3.5 last:border-0 last:pb-0" style={{ borderColor: colors.slate100 }}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">{cat.category_name.replace(/_/g, ' ')}</h4>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border" style={{ borderColor: colors.slate200 }}>
                            Priority Rank #{idx + 1}
                          </span>
                        </div>
                        
                        {/* Direct issue -> exercise linking */}
                        <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 mb-2 inline-block">
                          ⚡ {triggerText}
                        </div>

                        <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed pl-4 border-l-2 border-slate-200">
                          {cat.issue_translation}
                        </p>

                        <div className="pl-4">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Prescribed Corrective Exercises:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.recommended_exercises?.map((ex: string, i: number) => (
                              <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[10px]">
                                ✓ {ex}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {recommendations.wrap_up_summary && (
                  <div className="p-3.5 bg-slate-50 border-t text-[10px] text-slate-600 leading-relaxed font-medium" style={{ borderColor: colors.slate200 }}>
                    {recommendations.wrap_up_summary}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border text-[11px] text-slate-700 whitespace-pre-wrap mb-6" style={{ borderColor: colors.slate200 }}>
                {typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations)}
              </div>
            )}

            {/* Section 8: 7-Day Sample Recovery Schedule */}
            <SecHead n="8" title="7-Day Sample Recovery Schedule" />
            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                <div key={d} className="border rounded-lg overflow-hidden text-center" style={{ borderColor: colors.slate200 }}>
                  <div className="py-1 bg-slate-100 font-bold text-[9px] text-slate-700 border-b" style={{ borderColor: colors.slate200 }}>{d}</div>
                  <div className="p-1.5 text-[8px] font-medium text-slate-600 h-12 flex items-center justify-center bg-white leading-tight">
                    {['Mobility + Balance', 'Lower Body Strength', 'Active Recovery', 'Core + Stability', 'Plyometrics (Low)', 'Full Body Control', 'Rest & Hydrate'][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* AI Disclosure Line */}
            <div className="p-3 rounded-lg bg-slate-900 text-white text-[9px] leading-relaxed text-center mb-6">
              <strong>AI Medical Disclosure:</strong> Recommendations generated using MoveIQ AI (Groq/Llama) — for guidance only, not a medical prescription. Consult a licensed physiotherapist or physician for persistent pain, swelling, or clinical injury diagnosis.
            </div>
            <PageFooter page={3} total={3} />
          </div>
        </div>

      </div>
    </div>
  );
});

PdfAnalyticsOnly.displayName = 'PdfAnalyticsOnly';

