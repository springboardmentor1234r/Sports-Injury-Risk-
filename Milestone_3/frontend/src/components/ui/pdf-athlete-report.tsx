import React from 'react';
import { Info, CheckCircle2, Trophy, Sparkles, Activity } from 'lucide-react';

interface PdfAthleteReportProps {
  session: any;
  recommendations: any;
  previousSession?: any;
  athleteProfile?: any;
}

export const PdfAthleteReport = React.forwardRef<HTMLDivElement, PdfAthleteReportProps>(({ session, recommendations, previousSession, athleteProfile }, ref) => {
  if (!session) return null;

  const riskData = session.risk_data || {};
  const bio = session.biomechanics || {};
  const prof = {
    ...(athleteProfile?.profile || {}),
    ...(athleteProfile?.user || {}),
    ...(athleteProfile || {}),
  };
  const athleteName = prof.full_name || prof.name || session.athlete_name || 'Athlete';
  const healthScore = Math.round(riskData.overall_health_score || 100);
  const movQuality = Math.round(riskData.movement_quality_score || 100);
  const bioEff = Math.round(riskData.biomechanical_efficiency_score || 100);
  const fatigueScore = Math.round(riskData.fatigue_score || 0);
  const category = riskData.risk_category || 'Low Risk';

  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString();

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
  const SemicircleGauge = ({ value }: { value: number }) => {
    const pct = Math.min(100, Math.max(0, value));
    const r = 45;
    const circ = Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 70 ? c.em500 : pct >= 45 ? c.am500 : c.re500;
    return (
      <svg viewBox="0 0 120 65" width="140" height="75" style={{ margin: '0 auto' }}>
        <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={c.slate200} strokeWidth="10" strokeLinecap="round" />
        <path d="M 15,55 A 45,45 0 0,1 105,55" fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        <text x="60" y="48" textAnchor="middle" fontSize="22" fontWeight="900" fill={c.slate900}>{value}</text>
        <text x="60" y="60" textAnchor="middle" fontSize="8" fontWeight="600" fill={c.slate400}>/ 100</text>
      </svg>
    );
  };

  // Friendly translation of issues for athlete
  const parseAthleteFriendlyIssues = (input: any) => {
    if (!input || input === 'None') return [];
    const issuesList: { title: string; explanation: string; tip: string; badge: string; color: string; bg: string }[] = [];
    
    // Convert to a single string for simple matching
    let s = "";
    if (typeof input === "string") {
      s = input;
    } else if (Array.isArray(input)) {
      // If it's an array of dicts, extract the "issue" or stringify
      s = input.map(i => typeof i === 'string' ? i : (i.issue || JSON.stringify(i))).join(" ");
    } else {
      s = JSON.stringify(input);
    }
    
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
    if (issuesList.length === 0 && lower !== 'none' && lower.length > 0) {
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

  const PH = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px', marginBottom: '24px', borderBottom: `2px solid ${c.slate900}` }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: c.slate900, letterSpacing: '-0.5px' }}>MoveIQ</div>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: c.bl600, marginTop: '2px' }}>Personal Athlete Performance Report</div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '10px', color: c.slate500, lineHeight: '1.6' }}>
        <div>Report ID: <strong style={{ color: c.slate800 }}>MIQ-{session.session_id.substring(0, 8).toUpperCase()}</strong></div>
        <div>Date: <strong style={{ color: c.slate800 }}>{date}</strong></div>
      </div>
    </div>
  );

  const PF = ({ page, total }: { page: number; total: number }) => (
    <div style={{ position: 'absolute', bottom: '28px', left: '40px', right: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: c.slate400, paddingTop: '8px', borderTop: `1px solid ${c.slate200}` }}>
      <span>MoveIQ Athlete Engine — Tailored Performance & Injury Prevention</span>
      <span>Page {page} of {total}</span>
    </div>
  );

  const SecHead = ({ n, title }: { n: string; title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
      <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: c.bl600, color: c.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{n}</span>
      <span style={{ fontSize: '14px', fontWeight: 800, color: c.slate900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
    </div>
  );

  return (
    <div>
      <div ref={ref} style={{ fontFamily: 'sans-serif', width: '794px', margin: '0 auto', backgroundColor: c.white, color: c.slate900, fontSize: '12px' }}>

        {/* ═══ PAGE 1: Your Scores & Movement Breakdown ═══ */}
        <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, pageBreakAfter: 'always', minHeight: '1122px', boxSizing: 'border-box' }}>
          <PH />

          {/* Athlete Welcome Banner */}
          <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: c.slate900, color: c.white, marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Hello, {athleteName}! 🏃‍♂️</div>
              <div style={{ fontSize: '11px', color: c.slate300, marginTop: '4px', maxWidth: '480px', lineHeight: '1.4' }}>
                Here is your AI biomechanics assessment for <strong style={{ color: c.white }}>{session.video_name || 'your training session'}</strong>. We’ve analyzed your joint angles and movement symmetry to keep you performing at your peak.
              </div>
            </div>
            <div style={{ textAlign: 'right', backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: c.slate300, fontWeight: 700 }}>Status</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: category.includes('High') ? '#ff8a80' : category.includes('Moderate') ? '#ffd54f' : '#69f0ae', marginTop: '2px' }}>
                {category}
              </div>
            </div>
          </div>

          {/* ── Section 1: Score Dashboard ── */}
          <SecHead n="1" title="Your Performance Dashboard" />
          <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
            {/* Main Score Gauge */}
            <div style={{ width: '200px', flexShrink: 0, border: `1px solid ${c.slate200}`, borderRadius: '12px', padding: '16px 10px', textAlign: 'center', backgroundColor: c.slate50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: c.slate500, marginBottom: '6px' }}>Overall Health Score</div>
              <SemicircleGauge value={healthScore} />
              <div style={{ fontSize: '11px', fontWeight: 700, color: riskColor, marginTop: '6px' }}>
                {healthScore >= 80 ? 'Excellent Form! 🔥' : healthScore >= 60 ? 'Good, Room to Grow 💪' : 'Needs Attention ⚡'}
              </div>
            </div>

            {/* Sub Metrics */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Movement Quality', val: `${movQuality}/100`, desc: 'Smoothness and alignment of your form.', good: movQuality >= 70 },
                { label: 'Biomechanical Efficiency', val: `${bioEff}%`, desc: 'How well your body converts effort to power.', good: bioEff >= 70 },
                { label: 'Fatigue Index', val: `${fatigueScore}/100`, desc: 'Estimated muscle tiredness during session.', good: fatigueScore < 40 },
                { label: 'Injury Risk Level', val: category, desc: 'Based on joint stress and asymmetries.', good: !category.includes('High') },
              ].map((m, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: '10px', border: `1px solid ${c.slate200}`, backgroundColor: c.white, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: c.slate400, textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: m.good ? c.slate800 : c.re600, marginTop: '2px' }}>{m.val}</div>
                  </div>
                  <div style={{ fontSize: '9px', color: c.slate500, marginTop: '6px', lineHeight: '1.3' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2: What We Noticed (Athlete Friendly) ── */}
          <SecHead n="2" title="What We Noticed In Your Movement" />
          {athleteIssues.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              {athleteIssues.map((iss, idx) => (
                <div key={idx} style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${iss.color}30`, backgroundColor: iss.bg, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '20px', lineHeight: 1 }}>💡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: c.slate900 }}>{iss.title}</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: c.white, color: iss.color, border: `1px solid ${iss.color}40` }}>{iss.badge}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: c.slate700, lineHeight: '1.4', marginBottom: '6px' }}>{iss.explanation}</div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: iss.color, backgroundColor: 'rgba(255,255,255,0.6)', padding: '6px 10px', borderRadius: '6px' }}>
                      🚀 Coach Tip: {iss.tip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: c.em100, border: `1px solid ${c.em400}`, color: c.em700, textAlign: 'center', fontWeight: 700, fontSize: '12px', marginBottom: '28px' }}>
              🌟 Fantastic job! No major movement flaws or high-risk joint deviations were detected in this video!
            </div>
          )}

          {/* ── Section 3: Body Map Status ── */}
          <SecHead n="3" title="Joint Health Quick Check" />
          <div style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${c.slate200}`, backgroundColor: c.slate50, display: 'flex', gap: '20px', alignItems: 'center' }}>
            <svg viewBox="0 0 120 260" width="80" height="170" style={{ flexShrink: 0 }}>
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
              ].map((dot, i) => {
                if (dot.v === undefined) return null;
                const bad = dot.v > dot.t;
                const col = bad ? c.re500 : c.em500;
                return <circle key={i} cx={dot.cx} cy={dot.cy} r="7" fill={col} stroke={c.white} strokeWidth="1.5" />;
              })}
            </svg>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              {[
                { label: 'Knees (Stability & Flexion)', ok: (bio.right_knee_rom || 0) <= 130 && (bio.left_knee_rom || 0) <= 130 },
                { label: 'Hips (Mobility & Power)', ok: (bio.right_hip_rom || 0) <= 60 && (bio.left_hip_rom || 0) <= 60 },
                { label: 'Elbows & Upper Body', ok: (bio.right_elbow_rom || 0) <= 140 },
                { label: 'Left/Right Symmetry', ok: (bio.knee_symmetry_avg || 0) <= 15 },
              ].map((j, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', backgroundColor: c.white, border: `1px solid ${c.slate200}` }}>
                  <span style={{ fontSize: '14px' }}>{j.ok ? '🟢' : '🔴'}</span>
                  <span style={{ fontWeight: 700, color: c.slate800 }}>{j.label}</span>
                </div>
              ))}
            </div>
          </div>
          <PF page={1} total={3} />
        </div>

        {/* ═══ PAGE 2: Key Moments & Corrective Exercises ═══ */}
        <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, pageBreakAfter: 'always', minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <PH />

            {/* ── Section 4: AI Key Moments ── */}
            {session.key_moments && session.key_moments.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <SecHead n="4" title="AI-Detected Key Moments" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {session.key_moments.slice(0, 4).map((url: string, i: number) => (
                    <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${c.slate200}` }}>
                      <img src={url} alt={`Key moment ${i+1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SecHead n={session.key_moments && session.key_moments.length > 0 ? "5" : "4"} title="Your Personalized Corrective Exercises" />
            <p style={{ fontSize: '11px', color: c.slate600, marginBottom: '16px', lineHeight: '1.5' }}>
              Based on your biomechanics, our AI has prescribed these targeted drills. Integrate them into your warm-ups or recovery days to strengthen weak points and prevent injury.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {recommendations && recommendations.categories && recommendations.categories.length > 0 ? (
                recommendations.categories.map((cat: any, idx: number) => (
                  <div key={idx} style={{ border: `1px solid ${c.slate200}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', backgroundColor: c.slate50, borderBottom: `1px solid ${c.slate200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontStyle: 'normal', fontWeight: 800, fontSize: '12px', color: c.slate800, textTransform: 'capitalize' }}>
                        🎯 Focus Area #{idx + 1}: {cat.category_name.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: c.bl600, backgroundColor: c.bl100, padding: '2px 8px', borderRadius: '10px' }}>Priority Target</span>
                    </div>
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontSize: '11px', color: c.slate600, marginBottom: '10px', lineHeight: '1.4' }}>
                        {cat.issue_translation}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: c.slate400, marginBottom: '6px' }}>Recommended Drills:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cat.recommended_exercises?.map((ex: string, i: number) => (
                          <span key={i} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: c.em100, color: c.em700, fontWeight: 700, fontSize: '11px', border: `1px solid ${c.em400}40` }}>
                            ✓ {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: c.slate50, borderRadius: '10px', color: c.slate500, fontSize: '11px' }}>
                  {typeof recommendations === 'string' ? recommendations : "No specific recommendations needed. Keep up your standard training routine!"}
                </div>
              )}
            </div>
          </div>
          <PF page={2} total={3} />
        </div>

        {/* ═══ PAGE 3: Game Plan & Closing ═══ */}
        <div className="pdf-page" style={{ padding: '40px', paddingBottom: '60px', position: 'relative', backgroundColor: c.white, minHeight: '1122px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <PH />
            <SecHead n={session.key_moments && session.key_moments.length > 0 ? "6" : "5"} title="Your 7-Day Game Plan" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '28px' }}>
              {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                <div key={d} style={{ border: `1px solid ${c.slate200}`, borderRadius: '8px', overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ padding: '6px', backgroundColor: i === 0 || i === 2 ? c.bl100 : c.slate100, fontSize: '9px', fontWeight: 800, color: i === 0 || i === 2 ? c.bl700 : c.slate700, borderBottom: `1px solid ${c.slate200}` }}>{d}</div>
                  <div style={{ padding: '8px 4px', fontSize: '9px', color: c.slate600, fontWeight: 600, height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }}>
                    {['Mobility + Balance', 'Lower Body Strength', 'Active Recovery Drills', 'Core & Stability', 'Plyo Control', 'Full Body Form Check', 'Rest & Rehydrate'][i]}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 20px', borderRadius: '10px', backgroundColor: c.bl50, border: `1px solid ${c.bl100}`, color: c.bl700, display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <strong style={{ fontWeight: 800 }}>Keep Striving for Greatness!</strong> Small corrections in your movement mechanics compound into massive gains in speed, strength, and endurance over time. Re-record a session in 7–14 days to track your progress!
              </div>
            </div>
          </div>

          <div>
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: c.slate900, color: c.white, fontSize: '9px', textAlign: 'center', lineHeight: '1.5', marginBottom: '16px' }}>
              <strong>AI Medical Disclosure:</strong> Recommendations generated using MoveIQ AI (Groq/Llama) — for guidance only, not a medical prescription. Consult a licensed physiotherapist or physician for persistent pain, swelling, or clinical injury diagnosis.
            </div>
            <PF page={3} total={3} />
          </div>
        </div>

      </div>
    </div>
  );
});

PdfAthleteReport.displayName = 'PdfAthleteReport';
