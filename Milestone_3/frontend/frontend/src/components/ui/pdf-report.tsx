import React from 'react';
import { AlertTriangle, CheckCircle2, Activity } from 'lucide-react';

interface PdfReportProps {
  session: any;
  recommendations: any;
  previousSession?: any;
  athleteProfile?: any;
}

export const PdfReport = React.forwardRef<HTMLDivElement, PdfReportProps>(
  ({ session, recommendations, previousSession, athleteProfile }, ref) => {
    if (!session) return null;

    // ── Data extraction & normalization ──
    const prof = {
      ...(athleteProfile?.profile || {}),
      ...(athleteProfile?.user || {}),
      ...(athleteProfile || {}),
    };
    const athleteName = prof.full_name || prof.name || session.athlete_name || 'N/A';
    const sportName = prof.sport || 'N/A';
    const ageVal = prof.age ? `${prof.age} yrs` : 'N/A';
    const genderVal = prof.gender || 'N/A';
    const heightVal = prof.height ? `${prof.height} cm` : 'N/A';
    const weightVal = prof.weight ? `${prof.weight} kg` : 'N/A';
    const intensityVal = prof.training_intensity || 'N/A';
    const prevInjVal = prof.has_previous_injury === 'Yes' 
      ? `Yes — ${prof.previous_injury_type || ''}` 
      : (prof.has_previous_injury || 'N/A');

    const riskData = session.risk_data || {};
    const bio = session.biomechanics || {};
    const finalScore = Math.round(riskData.final_risk_score || 0);
    const healthScore = Math.round(riskData.overall_health_score || 0);
    const movQuality = Math.round(riskData.movement_quality_score || 0);
    const bioEff = Math.round(riskData.biomechanical_efficiency_score || 0);
    const fatigueScore = Math.round(riskData.fatigue_score || 0);
    const category = riskData.risk_category || 'Unknown';

    const prevRiskData = previousSession?.risk_data || {};
    const prevHealth = prevRiskData.overall_health_score !== undefined ? Math.round(prevRiskData.overall_health_score) : undefined;
    const prevRisk = prevRiskData.final_risk_score !== undefined ? Math.round(prevRiskData.final_risk_score) : undefined;
    const prevBio = prevRiskData.biomechanical_efficiency_score !== undefined ? Math.round(prevRiskData.biomechanical_efficiency_score) : undefined;

    const date = session.created_at
      ? new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString();

    // ── Color palette (hex only, no oklch) ──
    const c = {
      white: '#ffffff', slate50: '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
      slate400: '#94a3b8', slate500: '#64748b', slate600: '#475569', slate700: '#334155',
      slate800: '#1e293b', slate900: '#0f172a',
      em100: '#d1fae5', em400: '#34d399', em500: '#10b981', em600: '#059669', em700: '#047857',
      am50: '#fffbeb', am100: '#fef3c7', am200: '#fde68a', am500: '#f59e0b', am600: '#d97706', am700: '#b45309',
      re50: '#fff1f2', re100: '#ffe4e6', re200: '#fecdd3', re500: '#f43f5e', re600: '#e11d48', re700: '#be123c',
      bl50: '#eff6ff', bl100: '#dbeafe', bl600: '#2563eb', bl700: '#1d4ed8',
    };

    const riskColor = category.includes('High') ? c.re600 : category.includes('Moderate') ? c.am600 : c.em600;
    const riskBg = category.includes('High') ? c.re100 : category.includes('Moderate') ? c.am100 : c.em100;

    // ── Semicircle Gauge helper ──
    const SemicircleGauge = ({ value, max = 100 }: { value: number; max?: number }) => {
      const pct = Math.min(100, Math.max(0, value));
      const r = 45;
      const circ = Math.PI * r;
      const offset = circ - (pct / 100) * circ;
      const color = pct >= 70 ? c.em500 : pct >= 45 ? c.am500 : c.re500;
      return (
        <svg viewBox="0 0 120 65" width="130" height="70" style={{ margin: '0 auto' }}>
          <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={c.slate200} strokeWidth="10" strokeLinecap="round" />
          <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
          <text x="60" y="48" textAnchor="middle" fontSize="22" fontWeight="900" fill={c.slate900}>{value}</text>
          <text x="60" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill={c.slate400}>/ {max}</text>
        </svg>
      );
    };

    // ── Bar helper (block chars, PDF-safe) ──
    const Bar = ({ val, good = true }: { val: number; good?: boolean }) => {
      const pct = Math.max(0, Math.min(100, val));
      const blocks = 16;
      const filled = Math.round((pct / 100) * blocks);
      const color = good
        ? pct >= 70 ? c.em500 : pct >= 45 ? c.am500 : c.re500
        : pct <= 30 ? c.em500 : pct <= 55 ? c.am500 : c.re500;
      return (
        <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '1px' }}>
          <span style={{ color }}>{'█'.repeat(filled)}</span>
          <span style={{ color: c.slate200 }}>{'░'.repeat(blocks - filled)}</span>
        </span>
      );
    };

    const statusLabel = (val: number, good = true) => {
      if (good) return val >= 70 ? { t: 'Excellent', c: c.em600 } : val >= 45 ? { t: 'Moderate', c: c.am600 } : { t: 'Low', c: c.re600 };
      return val <= 30 ? { t: 'Low', c: c.em600 } : val <= 55 ? { t: 'Moderate', c: c.am600 } : { t: 'High', c: c.re600 };
    };

    // ── Issue parser → human-readable ──
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

    const parseIssues = (s: string) => {
      if (!s || s === 'None') return [];
      return s.split(' | ').map(raw => {
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
      High: { bg: c.re50, border: c.re200, color: c.re700 },
      Medium: { bg: c.am50, border: c.am200, color: c.am700 },
      Low: { bg: c.bl100, border: '#93c5fd', color: c.bl700 },
    }[p]);

    // ── Exercise map by priority ──
    const exMap = {
      High: { ex: 'Single-leg squat, Nordic curl, lateral band walk — focus on end-range control.', dur: '3–4 Weeks' },
      Medium: { ex: 'Hip mobility drills, clamshells, glute bridges — progress to loaded movements.', dur: '2–3 Weeks' },
      Low: { ex: 'Balance boards, stability training, proprioception drills — add to warm-up.', dur: '1–2 Weeks' },
    };

    // ── Friendly translation of issues for athlete ──
    const parseAthleteFriendlyIssues = (s: string) => {
      if (!s || s === 'None') return [];
      const issuesList: { title: string; explanation: string; tip: string; badge: string; color: string; bg: string }[] = [];
      
      const lower = s.toLowerCase();
      if (lower.includes('knee')) {
        issuesList.push({
          title: 'Knee Control During Movement',
          explanation: 'We noticed some inward dip or asymmetric bending in your knees during peak load.',
          tip: 'Strengthening your glutes and hamstrings will keep your knees tracking straight and protect your ligaments!',
          badge: 'Attention Needed',
          color: c.am700, bg: c.am50
        });
      }
      if (lower.includes('hip')) {
        issuesList.push({
          title: 'Hip Mobility & Stability',
          explanation: 'Your hip range of motion showed slight stiffness or imbalance between left and right.',
          tip: 'Better hip mobility takes pressure off your lower back and knees while boosting your power output.',
          badge: 'Mobility Focus',
          color: c.am700, bg: c.am50
        });
      }
      if (lower.includes('balance') || lower.includes('sway')) {
        issuesList.push({
          title: 'Core Stability & Balance Sway',
          explanation: 'Your center of gravity shifted slightly more than optimal during single-leg or landing phases.',
          tip: 'Core and proprioception drills will improve your balance and make your movements much more efficient.',
          badge: 'Stability Focus',
          color: c.bl700, bg: c.bl50
        });
      }
      if (issuesList.length === 0 && s !== 'None') {
        issuesList.push({
          title: 'Movement Optimization Note',
          explanation: s.replace(/_/g, ' '),
          tip: 'Focus on smooth, controlled form during your training sessions to maintain peak efficiency.',
          badge: 'Coaching Tip',
          color: c.bl700, bg: c.bl50
        });
      }
      return issuesList;
    };

    const athleteIssues = parseAthleteFriendlyIssues(riskData.flagged_issues || '');

    // ── Page header/footer helpers ──
    const PH = () => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px', marginBottom: '20px', borderBottom: `2px solid ${c.slate900}` }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: c.slate900, letterSpacing: '-0.5px' }}>MoveIQ</div>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: c.slate500, marginTop: '2px' }}>AI Biomechanics Report</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: c.slate500, lineHeight: '1.6' }}>
          <div>Report ID: <strong style={{ color: c.slate700 }}>MIQ-{session.session_id.substring(0, 8).toUpperCase()}</strong></div>
          <div>Date: <strong style={{ color: c.slate700 }}>{date}</strong></div>
        </div>
      </div>
    );

    const PF = ({ page, total }: { page: number; total: number }) => (
      <div style={{ position: 'absolute', bottom: '28px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: c.slate400, paddingTop: '8px', borderTop: `1px solid ${c.slate200}` }}>
        <span>MoveIQ Biomechanics Engine — Clinical Assessment & Performance Analysis</span>
        <span>Page {page} of {total}</span>
      </div>
    );

    const SecHead = ({ n, title }: { n: string; title: string }) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c.slate900, color: c.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{n}</span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: c.slate900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
      </div>
    );

    const hasRecs = recommendations && typeof recommendations === 'object' && (recommendations.one_line_summary || recommendations.categories || (Array.isArray(recommendations) && recommendations.length > 0));
    const totalPages = hasRecs ? 4 : 3;

    return (
      <div>
        <div ref={ref} style={{ fontFamily: 'sans-serif', width: '794px', margin: '0 auto', backgroundColor: c.white, color: c.slate900, fontSize: '12px' }}>

          {/* ═══ PAGE 1 — Athlete Info + Scores + Issues ═══ */}
          <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, pageBreakAfter: 'always', minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <PH />


            {/* ── Section 1: Athlete Information ── */}
            <SecHead n="1" title="Athlete Information" />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: `1px solid ${c.slate200}`, borderRadius: '8px', overflow: 'hidden', fontSize: '11px' }}>
              <tbody>
                <tr style={{ backgroundColor: c.slate50 }}>
                  {[
                    { label: 'Athlete Name', value: athleteName },
                    { label: 'Video Name', value: session.video_name || 'N/A' },
                    { label: 'Sport', value: sportName },
                  ].map((f, i) => (
                    <td key={i} style={{ padding: '8px 12px', borderRight: i < 2 ? `1px solid ${c.slate200}` : 'none', width: '33%' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: c.slate400, marginBottom: '2px' }}>{f.label}</div>
                      <div style={{ fontWeight: 700, color: c.slate800 }}>{f.value}</div>
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: `1px solid ${c.slate200}`, backgroundColor: c.white }}>
                  {[
                    { label: 'Age', value: ageVal },
                    { label: 'Gender', value: genderVal },
                    { label: 'Height', value: heightVal },
                  ].map((f, i) => (
                    <td key={i} style={{ padding: '8px 12px', borderRight: i < 2 ? `1px solid ${c.slate200}` : 'none' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: c.slate400, marginBottom: '2px' }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: c.slate700 }}>{f.value}</div>
                    </td>
                  ))}
                </tr>
                <tr style={{ borderTop: `1px solid ${c.slate200}`, backgroundColor: c.slate50 }}>
                  {[
                    { label: 'Weight', value: weightVal },
                    { label: 'Training Intensity', value: intensityVal },
                    { label: 'Previous Injury', value: prevInjVal },
                  ].map((f, i) => (
                    <td key={i} style={{ padding: '8px 12px', borderRight: i < 2 ? `1px solid ${c.slate200}` : 'none' }}>
                      <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: c.slate400, marginBottom: '2px' }}>{f.label}</div>
                      <div style={{ fontWeight: 600, color: c.slate700 }}>{f.value}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* ── Section 2: Health Summary ── */}
            <SecHead n="2" title="Health Summary" />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {/* Big score with Gauge */}
              <div style={{ width: '180px', flexShrink: 0, border: `1px solid ${c.slate200}`, borderRadius: '8px', padding: '14px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: c.slate500, marginBottom: '4px' }}>Overall Health</div>
                <SemicircleGauge value={healthScore} />
                <div style={{ marginTop: '6px', padding: '2px 8px', borderRadius: '20px', backgroundColor: riskBg, color: riskColor, fontSize: '9px', fontWeight: 700, display: 'inline-block' }}>{category}</div>
              </div>
              {/* Sub-scores */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {[
                  { label: 'Movement Quality', val: movQuality, good: true },
                  { label: 'Biomechanical Efficiency', val: bioEff, good: true },
                  { label: 'Injury Risk Score', val: finalScore, good: false },
                  { label: 'Fatigue Score', val: fatigueScore, good: false },
                ].map((s, i) => {
                  const sl = statusLabel(s.val, s.good);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '6px', border: `1px solid ${c.slate200}`, backgroundColor: c.slate50 }}>
                      <span style={{ width: '150px', flexShrink: 0, fontSize: '10px', fontWeight: 600, color: c.slate600 }}>{s.label}</span>
                      <div style={{ flex: 1 }}><Bar val={s.val} good={s.good} /></div>
                      <span style={{ width: '60px', textAlign: 'right', fontSize: '10px' }}>
                        <strong style={{ color: c.slate800 }}>{s.val}</strong>
                        <span style={{ color: c.slate400 }}>/100</span>
                      </span>
                      <span style={{ width: '55px', textAlign: 'right', fontSize: '9px', fontWeight: 700, color: sl.c }}>{sl.t}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Detected Issues ── */}
            <SecHead n="3" title="Detected Issues" />
            {issues.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '6px', backgroundColor: c.em100, border: `1px solid ${c.em400}`, color: c.em700, marginBottom: '20px', fontSize: '11px' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>No major issues detected — excellent movement quality!</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: `1px solid ${c.slate200}`, borderRadius: '8px', fontSize: '10px' }}>
                <thead>
                  <tr style={{ backgroundColor: c.slate50, borderBottom: `1px solid ${c.slate200}` }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: c.slate600, width: '70px' }}>Priority</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: c.slate600 }}>Issue</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: c.slate600 }}>Why it matters</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((iss, idx) => {
                    const ps = pBadge(iss.priority);
                    return (
                      <tr key={idx} style={{ borderTop: idx > 0 ? `1px solid ${c.slate100}` : 'none' }}>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 700, backgroundColor: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                            {iss.priority}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: c.slate800 }}>{iss.label}</td>
                        <td style={{ padding: '6px 10px', color: c.slate500 }}>{iss.why}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            </div>
            <PF page={1} total={totalPages} />
          </div>

          {/* ═══ PAGE 2 — Biomechanics + Recovery Plan ═══ */}
          <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, pageBreakAfter: 'always', minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <PH />

              {/* ── Section 4: Biomechanical Measurements ── */}
              <SecHead n="4" title="Biomechanical Measurements" />
              <div style={{ display: 'flex', gap: '14px', marginBottom: '24px' }}>
                <table style={{ flex: 1, borderCollapse: 'collapse', fontSize: '10px', border: `1px solid ${c.slate200}`, borderRadius: '6px' }}>
                  <thead>
                    <tr style={{ backgroundColor: c.slate50, borderBottom: `1px solid ${c.slate200}` }}>
                      <th style={{ padding: '5px 8px', textAlign: 'left', color: c.slate600, fontWeight: 700 }}>Joint</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Value</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Safe</th>
                      <th style={{ padding: '5px 8px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { m: 'Right Knee ROM', v: bio.right_knee_rom, thresh: 130, unit: '°' },
                      { m: 'Left Knee ROM', v: bio.left_knee_rom, thresh: 130, unit: '°' },
                      { m: 'Right Hip ROM', v: bio.right_hip_rom, thresh: 60, unit: '°' },
                      { m: 'Left Hip ROM', v: bio.left_hip_rom, thresh: 60, unit: '°' },
                      { m: 'Right Elbow ROM', v: bio.right_elbow_rom, thresh: 140, unit: '°' },
                      { m: 'Left Elbow ROM', v: bio.left_elbow_rom, thresh: 140, unit: '°' },
                      { m: 'Knee Asymmetry', v: bio.knee_symmetry_avg, thresh: 15, unit: '°' },
                      { m: 'Hip Asymmetry', v: bio.hip_symmetry_avg, thresh: 15, unit: '°' },
                      { m: 'Balance Sway', v: bio.balance_sway, thresh: 0.5, unit: '' },
                    ].map((row, i) => {
                      const hasVal = row.v !== undefined && row.v !== null;
                      const valNum = typeof row.v === 'number' ? row.v : 0;
                      const bad = hasVal && valNum > row.thresh;
                      return (
                        <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${c.slate100}` : 'none' }}>
                          <td style={{ padding: '4px 8px', color: c.slate700, fontWeight: 600 }}>{row.m}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: bad ? c.re600 : c.slate700 }}>
                            {hasVal ? `${typeof row.v === 'number' ? row.v.toFixed(1) : row.v}${row.unit}` : '--'}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'center', color: c.slate400 }}>≤{row.thresh}{row.unit}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '8px', fontWeight: 700, backgroundColor: !hasVal ? c.slate100 : bad ? c.re100 : c.em100, color: !hasVal ? c.slate500 : bad ? c.re700 : c.em700 }}>
                              {!hasVal ? 'N/A' : bad ? 'Flagged' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ width: '240px', flexShrink: 0 }}>
                  <div style={{ border: `1px solid ${c.slate200}`, borderRadius: '8px', backgroundColor: c.slate50, padding: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <svg viewBox="0 0 120 260" width="70" height="170" style={{ flexShrink: 0 }}>
                      <circle cx="60" cy="22" r="16" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="44" y="40" width="32" height="74" rx="10" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="24" y="46" width="14" height="54" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="82" y="46" width="14" height="54" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="44" y="118" width="14" height="58" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="62" y="118" width="14" height="58" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="44" y="180" width="14" height="56" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
                      <rect x="62" y="180" width="14" height="56" rx="7" fill={c.slate200} stroke={c.slate400} strokeWidth="1.5"/>
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
                        const col = bad ? c.re500 : mid ? c.am500 : c.em500;
                        return <circle key={i} cx={dot.cx} cy={dot.cy} r="7" fill={col} stroke={c.white} strokeWidth="1.5" opacity="0.9" />;
                      })}
                    </svg>
                    <div style={{ flex: 1, fontSize: '8px', lineHeight: '1.8' }}>
                      {[
                        { name: 'R. Knee', v: bio.right_knee_rom, t: 130 },
                        { name: 'L. Knee', v: bio.left_knee_rom, t: 130 },
                        { name: 'R. Hip', v: bio.right_hip_rom, t: 60 },
                        { name: 'L. Hip', v: bio.left_hip_rom, t: 60 },
                        { name: 'R. Elbow', v: bio.right_elbow_rom, t: 140 },
                        { name: 'L. Elbow', v: bio.left_elbow_rom, t: 140 },
                        { name: 'Sway', v: bio.balance_sway, t: 0.5 },
                      ].filter(j => j.v !== undefined).map((j, i) => {
                        const bad = j.v > j.t;
                        const mid = j.v > j.t * 0.85;
                        const col = bad ? c.re500 : mid ? c.am500 : c.em500;
                        return (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: c.slate600 }}>{j.name}</span>
                            <span style={{ fontWeight: 700, color: col }}>{typeof j.v === 'number' ? j.v.toFixed(1) : j.v}{j.name !== 'Sway' ? '°' : ''}</span>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: `1px solid ${c.slate200}`, fontSize: '7px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div><span style={{ color: c.re500 }}>● </span><span style={{ color: c.slate500 }}>High Risk</span></div>
                        <div><span style={{ color: c.am500 }}>● </span><span style={{ color: c.slate500 }}>Moderate</span></div>
                        <div><span style={{ color: c.em500 }}>● </span><span style={{ color: c.slate500 }}>Normal</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SecHead n="5" title="7-Day Recovery Plan" />
              <div style={{ display: 'flex', gap: '4px', marginBottom: '0' }}>
                {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                  <div key={d} style={{ flex: 1, border: `1px solid ${c.slate200}`, borderRadius: '6px', overflow: 'hidden', textAlign: 'center' }}>
                    <div style={{ padding: '4px', backgroundColor: c.slate100, fontSize: '8px', fontWeight: 700, color: c.slate700, borderBottom: `1px solid ${c.slate200}` }}>{d}</div>
                    <div style={{ padding: '6px 4px', fontSize: '8px', color: c.slate600, height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {['Balance + Mobility', 'Lower Body Strength', 'Active Recovery', 'Core + Stability', 'Plyometrics', 'Full Body', 'Rest'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <PF page={2} total={totalPages} />
          </div>

          {/* ═══ PAGE 3 (Conditional) — MoveIQ AI Recommendations ═══ */}
          {hasRecs && (
            <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, pageBreakAfter: 'always', minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <PH />
                <SecHead n="6" title="MoveIQ AI Recommendations" />
                {typeof recommendations === 'object' && recommendations.one_line_summary ? (
                  <div style={{ marginBottom: '20px', border: `1px solid ${c.slate200}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: c.slate900, padding: '12px 16px', color: c.white, fontSize: '10px', lineHeight: '1.5', fontWeight: 600 }}>
                      {recommendations.one_line_summary}
                    </div>
                    <div style={{ padding: '16px', backgroundColor: c.white }}>
                      {recommendations.categories && recommendations.categories.map((cat: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: idx === recommendations.categories.length - 1 ? '0' : '12px', paddingBottom: idx === recommendations.categories.length - 1 ? '0' : '12px', borderBottom: idx === recommendations.categories.length - 1 ? 'none' : `1px dashed ${c.slate200}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: c.am500 }}></span>
                            <strong style={{ fontSize: '10px', color: c.slate800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat.category_name.replace(/_/g, ' ')}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: c.slate600, marginBottom: '6px', paddingLeft: '12px' }}>
                            {cat.issue_translation}
                          </div>
                          <div style={{ paddingLeft: '12px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: c.slate500, textTransform: 'uppercase' }}>Recommended Exercises:</span>
                            <div style={{ marginTop: '2px', fontSize: '10px', color: c.em700, fontWeight: 600 }}>
                              {cat.recommended_exercises.join(' • ')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {recommendations.wrap_up_summary && (
                      <div style={{ padding: '12px 16px', backgroundColor: c.slate50, borderTop: `1px solid ${c.slate200}`, fontSize: '9px', color: c.slate500, lineHeight: '1.5' }}>
                        {recommendations.wrap_up_summary}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: c.slate50, border: `1px solid ${c.slate200}`, fontSize: '9px', lineHeight: '1.6', color: c.slate700, marginBottom: '20px', whiteSpace: 'pre-wrap', maxHeight: '550px', overflow: 'hidden' }}>
                    {typeof recommendations === 'string' ? recommendations : JSON.stringify(recommendations)}
                  </div>
                )}
              </div>
              <PF page={3} total={totalPages} />
            </div>
          )}

          {/* ═══ PAGE 4 (or 3) — Progress Comparison + Verdict ═══ */}
          <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <PH />
              <SecHead n={hasRecs ? "7" : "6"} title="Progress Comparison" />
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', border: `1px solid ${c.slate200}`, fontSize: '10px', borderRadius: '6px' }}>
                <thead>
                  <tr style={{ backgroundColor: c.slate50, borderBottom: `1px solid ${c.slate200}` }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', color: c.slate600, fontWeight: 700 }}>Metric</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Previous</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Current</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', color: c.slate600, fontWeight: 700 }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Overall Health Score', cur: healthScore, prev: prevHealth, goodHigh: true },
                    { label: 'Injury Risk Score', cur: finalScore, prev: prevRisk, goodHigh: false },
                    { label: 'Biomechanical Efficiency', cur: bioEff, prev: prevBio, goodHigh: true },
                  ].map((row, i) => {
                    const diff = row.prev !== undefined ? row.cur - row.prev : null;
                    const improved = diff !== null ? (row.goodHigh ? diff > 0 : diff < 0) : null;
                    return (
                      <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${c.slate100}` : 'none' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: c.slate700 }}>{row.label}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: c.slate400 }}>{row.prev !== undefined ? row.prev : 'N/A'}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: c.slate800 }}>{row.cur}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, fontSize: '10px', color: diff === null ? c.slate400 : (improved ? c.em600 : c.re600) }}>
                          {diff === null ? '—' : diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : '→ 0'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {prevHealth !== undefined && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', borderRadius: '6px', marginBottom: '20px', backgroundColor: healthScore >= prevHealth ? c.em100 : c.re50, border: `1px solid ${healthScore >= prevHealth ? c.em400 : c.re200}` }}>
                  {healthScore >= prevHealth
                    ? <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0, color: c.em600, marginTop: '1px' }} />
                    : <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, color: c.re500, marginTop: '1px' }} />}
                  <div style={{ fontSize: '10px' }}>
                    <strong style={{ color: healthScore >= prevHealth ? c.em700 : c.re700 }}>
                      {healthScore >= prevHealth ? 'Improving!' : 'Action Required'}
                    </strong>
                    {' '}
                    <span style={{ color: c.slate700 }}>
                      {healthScore >= prevHealth
                        ? 'Your health score improved. Keep up the corrective exercises.'
                        : 'Health score decreased. Check your movement patterns and get updated recommendations from MoveIQ.'}
                    </span>
                  </div>
                </div>
              )}

              <SecHead n={hasRecs ? "8" : "7"} title="Overall Verdict" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[
                  { icon: '🎯', label: 'Risk Level', value: category, color: riskColor, bg: riskBg },
                  { icon: '⚡', label: 'Main Problem', value: issues.length > 0 ? issues[0].label : 'None Detected', color: c.slate700, bg: c.slate50 },
                  { icon: '🏃', label: 'Best Exercise', value: issues.length > 0 ? exMap[issues[0].priority].ex.split(',')[0].trim() : 'General Mobility', color: c.bl700, bg: c.bl100 },
                  { icon: '📅', label: 'Est. Recovery', value: category.includes('High') ? '4–6 Weeks' : category.includes('Moderate') ? '3–4 Weeks' : '1–2 Weeks', color: c.em700, bg: c.em100 },
                  { icon: '🔄', label: 'Reassessment', value: category.includes('High') ? 'After 5 Days' : category.includes('Moderate') ? 'After 7 Days' : 'After 14 Days', color: c.am700, bg: c.am50 },
                  { icon: '✅', label: 'Confidence', value: '92% — High', color: c.em700, bg: c.em100 },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: item.bg, border: `1px solid ${item.color}25`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: c.slate400, marginBottom: '1px' }}>{item.label}</div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: c.slate900, color: c.white, fontSize: '9px', textAlign: 'center', lineHeight: '1.5' }}>
                <strong>AI Medical Disclosure:</strong> Recommendations generated using MoveIQ AI (Groq/Llama) — for guidance only, not a medical prescription. Consult a licensed physiotherapist or physician for persistent pain, swelling, or clinical injury diagnosis.
              </div>
            </div>
            <PF page={hasRecs ? 4 : 3} total={totalPages} />
          </div>

        </div>
      </div>
    );
  }
);

PdfReport.displayName = 'PdfReport';
