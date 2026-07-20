import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PdfAnalyticsOnlyProps {
  session: any;
}

export const PdfAnalyticsOnly = React.forwardRef<HTMLDivElement, PdfAnalyticsOnlyProps>(({ session }, ref) => {
  if (!session) return null;

  const riskData = session.risk_data || {};
  const finalScore = riskData.final_risk_score || 0;
  const healthScore = riskData.overall_health_score || 0;
  const category = riskData.risk_category || 'Unknown';
  
  const date = session.created_at ? new Date(session.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) : new Date().toLocaleDateString();

  const colors = {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    emerald100: '#d1fae5',
    emerald500: '#10b981',
    emerald600: '#059669',
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber600: '#d97706',
    rose50: '#fff1f2',
    rose100: '#ffe4e6',
    rose200: '#fecdd3',
    rose500: '#f43f5e',
    rose600: '#e11d48',
  };

  const riskColor = category === 'High Risk' ? colors.rose600 : category === 'Moderate Risk' ? colors.amber500 : colors.emerald500;
  const riskBg = category === 'High Risk' ? colors.rose100 : category === 'Moderate Risk' ? colors.amber100 : colors.emerald100;
  
  return (
    <div>
      <div ref={ref} className="font-sans w-[800px] mx-auto text-sm" style={{ backgroundColor: colors.white, color: colors.slate900 }}>
        
        {/* ================= PAGE 1 ================= */}
        <div className="pdf-page p-10 relative" style={{ pageBreakAfter: 'always', backgroundColor: colors.white }}>
          <div className="flex justify-between items-end pb-4 mb-8" style={{ borderBottom: `2px solid ${colors.slate200}` }}>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.slate800 }}>MoveIQ</h1>
              <p className="text-sm font-semibold uppercase tracking-widest mt-1" style={{ color: colors.slate500 }}>AI Biomechanics Analytics</p>
            </div>
            <div className="text-right text-xs space-y-1" style={{ color: colors.slate500 }}>
              <p>Report ID: <span className="font-medium" style={{ color: colors.slate700 }}>MIQ-{session.session_id.substring(0, 8).toUpperCase()}</span></p>
              <p>Date: <span className="font-medium" style={{ color: colors.slate700 }}>{date}</span></p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>1</span> 
            SUMMARY
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="rounded-xl p-8 flex flex-col items-center justify-center text-center" style={{ border: `1px solid ${colors.slate200}` }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: colors.slate500 }}>Overall Athlete Health Score</h3>
              <div className="flex items-end justify-center gap-1 mb-4">
                <span className="text-6xl font-black" style={{ color: colors.slate900 }}>{healthScore}</span>
                <span className="text-xl font-bold mb-2" style={{ color: colors.slate400 }}>/100</span>
              </div>
              <span className="px-4 py-1.5 rounded-full font-bold text-sm tracking-wider uppercase" style={{ backgroundColor: riskBg, color: riskColor }}>
                {category}
              </span>
            </div>
            <div className="rounded-xl p-8 flex flex-col justify-center" style={{ border: `1px solid ${colors.slate200}` }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: colors.slate500 }}>Risk Category</h3>
              <h4 className="text-2xl font-bold mb-3" style={{ color: riskColor }}>{category}</h4>
              <p className="leading-relaxed" style={{ color: colors.slate600 }}>
                The analysis reveals {category.toLowerCase()} movement concerns based on automated pose tracking. 
                Focus on the flagged biomechanical inefficiencies and fatigue indicators to prevent further complications.
              </p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>2</span> 
            SUPPORTING SCORES
          </h2>
          
          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Injury Risk Score', val: finalScore, isGoodHigh: false, bcolor: colors.rose500 },
              { label: 'Movement Quality', val: riskData.movement_quality_score || 0, isGoodHigh: true, bcolor: colors.emerald500 },
              { label: 'Biomechanical Efficiency', val: riskData.biomechanical_efficiency_score || 0, isGoodHigh: true, bcolor: colors.emerald500 },
              { label: 'Fatigue Score', val: riskData.fatigue_score || 0, isGoodHigh: false, bcolor: colors.amber500 }
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-6 text-center" style={{ border: `1px solid ${colors.slate200}`, borderBottom: `4px solid ${s.bcolor}` }}>
                <div className="flex justify-center items-end gap-1 mb-2">
                  <span className="text-3xl font-bold" style={{ color: colors.slate900 }}>{s.val}</span>
                  <span className="text-sm font-bold mb-1" style={{ color: colors.slate400 }}>/100</span>
                </div>
                <p className="text-xs font-semibold uppercase" style={{ color: colors.slate500 }}>{s.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>3</span> 
            DETECTED ISSUES
          </h2>
          
          <div className="space-y-4">
            {typeof riskData.flagged_issues === 'string' && riskData.flagged_issues !== 'None' 
              ? riskData.flagged_issues.split(' | ').map((issue: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: colors.rose500 }} />
                  <p style={{ color: colors.slate700 }}>{issue}</p>
                </div>
              ))
              : <div className="flex items-center gap-2" style={{ color: colors.emerald600 }}><CheckCircle2 className="w-5 h-5"/> No major issues detected.</div>
            }
          </div>
          
          <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs pt-4" style={{ color: colors.slate400, borderTop: `1px solid ${colors.slate200}` }}>
            <span>MoveIQ AI</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        {/* ================= PAGE 2 ================= */}
        <div className="pdf-page p-10 relative" style={{ backgroundColor: colors.white }}>
          <div className="flex justify-between items-end pb-4 mb-8" style={{ borderBottom: `1px solid ${colors.slate200}` }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.slate500 }}>MoveIQ AI Biomechanics Analytics</p>
            <p className="text-xs" style={{ color: colors.slate500 }}>Report ID: MIQ-{session.session_id.substring(0, 8).toUpperCase()}</p>
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>4</span> 
            BIOMECHANICAL MEASUREMENTS
          </h2>

          <div className="overflow-hidden rounded-xl mb-10" style={{ border: `1px solid ${colors.slate200}` }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: colors.slate50, borderBottom: `1px solid ${colors.slate200}` }}>
                <tr>
                  <th className="py-4 px-6 font-semibold" style={{ color: colors.slate600 }}>Metric</th>
                  <th className="py-4 px-6 font-semibold text-center" style={{ color: colors.slate600 }}>Your Value</th>
                  <th className="py-4 px-6 font-semibold text-center" style={{ color: colors.slate600 }}>Normal Range</th>
                  <th className="py-4 px-6 font-semibold text-center" style={{ color: colors.slate600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { 
                    m: 'Knee Asymmetry',  
                    v: session.biomechanics?.knee_symmetry_avg ? `${Math.round(session.biomechanics.knee_symmetry_avg)}°` : '0°', 
                    r: '< 15°', 
                    s: (session.biomechanics?.knee_symmetry_avg || 0) > 15 ? 'High' : 'Normal', 
                    bad: (session.biomechanics?.knee_symmetry_avg || 0) > 15 
                  },
                  { 
                    m: 'Trunk Lean Angle (Est)', 
                    v: riskData.biomechanical_deviation_score ? `${Math.round(riskData.biomechanical_deviation_score)}°` : '0°', 
                    r: '< 10°', 
                    s: (riskData.biomechanical_deviation_score || 0) > 20 ? 'High' : 'Normal', 
                    bad: (riskData.biomechanical_deviation_score || 0) > 20 
                  },
                  { 
                    m: 'Landing Balance (Sway)', 
                    v: session.biomechanics?.balance_sway ? `${Number(session.biomechanics.balance_sway).toFixed(2)}` : '0.00', 
                    r: '< 0.50', 
                    s: (session.biomechanics?.balance_sway || 0) > 0.5 ? 'Poor' : 'Normal', 
                    bad: (session.biomechanics?.balance_sway || 0) > 0.5 
                  },
                  { 
                    m: 'Elbow Instability', 
                    v: session.biomechanics?.elbow_symmetry_avg ? `${Math.round(session.biomechanics.elbow_symmetry_avg)}°` : '0°', 
                    r: '< 20°', 
                    s: (session.biomechanics?.elbow_symmetry_avg || 0) > 25 ? 'High' : 'Normal', 
                    bad: (session.biomechanics?.elbow_symmetry_avg || 0) > 25 
                  },
                  { 
                    m: 'Fatigue Score', 
                    v: riskData.fatigue_score ? `${riskData.fatigue_score}/100` : '0/100', 
                    r: '< 30/100', 
                    s: (riskData.fatigue_score || 0) > 40 ? 'High' : 'Normal', 
                    bad: (riskData.fatigue_score || 0) > 40 
                  },
                ].map((row, i) => (
                  <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${colors.slate100}` : 'none' }}>
                    <td className="py-4 px-6 font-medium" style={{ color: colors.slate800 }}>{row.m}</td>
                    <td className="py-4 px-6 text-center" style={{ color: colors.slate600 }}>{row.v}</td>
                    <td className="py-4 px-6 text-center" style={{ color: colors.slate500 }}>{row.r}</td>
                    <td className="py-4 px-6 text-center font-bold" style={{ color: row.bad ? colors.rose500 : colors.emerald500 }}>{row.s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs pt-4" style={{ color: colors.slate400, borderTop: `1px solid ${colors.slate200}` }}>
            <span>MoveIQ AI</span>
            <span>Page 2 of 2</span>
          </div>
        </div>

      </div>
    </div>
  );
});

PdfAnalyticsOnly.displayName = 'PdfAnalyticsOnly';
