import React from 'react';
import { Info, CheckCircle2 } from 'lucide-react';

interface PdfRecommendationOnlyProps {
  session: any;
  recommendations: any;
}

export const PdfRecommendationOnly = React.forwardRef<HTMLDivElement, PdfRecommendationOnlyProps>(({ session, recommendations }, ref) => {
  if (!session) return null;

  const riskData = session.risk_data || {};
  const bio = session.biomechanics || {};
  const fatigueScore = Math.round(riskData.fatigue_score || 0);
  
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
    emerald50: '#ecfdf5',
    emerald200: '#a7f3d0',
    emerald800: '#065f46',
    amber50: '#fffbeb',
    amber100: '#fef3c7',
    amber200: '#fde68a',
    amber500: '#f59e0b',
    amber600: '#d97706',
    amber700: '#b45309',
  };

  // Sort categories by severity/priority
  const getPriorityScore = (catName: string) => {
    const lower = (catName || '').toLowerCase();
    if (lower.includes('asymmetry') || lower.includes('instability') || lower.includes('knee')) return 1;
    if (lower.includes('elbow') || lower.includes('hip') || lower.includes('sway')) return 2;
    return 3;
  };

  const sortedCategories = recommendations && recommendations.categories && Array.isArray(recommendations.categories)
    ? [...recommendations.categories].sort((a, b) => getPriorityScore(a.category_name) - getPriorityScore(b.category_name))
    : [];

  const PageHeader = () => (
    <div className="flex justify-between items-end pb-3 mb-6 border-b-2" style={{ borderColor: colors.slate800 }}>
      <div>
        <h1 className="text-xl font-black tracking-tight" style={{ color: colors.slate900 }}>MoveIQ</h1>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: colors.slate500 }}>AI Biomechanics Intervention Plan</p>
      </div>
      <div className="text-right text-[11px] space-y-0.5" style={{ color: colors.slate500 }}>
        <p>Report ID: <span className="font-bold" style={{ color: colors.slate800 }}>MIQ-{(session.session_id || "TEMP").substring(0, 8).toUpperCase()}</span></p>
        <p>Date: <span className="font-bold" style={{ color: colors.slate800 }}>{date}</span></p>
      </div>
    </div>
  );

  const PageFooter = ({ page, total }: { page: number; total: number }) => (
    <div className="absolute bottom-6 left-10 right-10 flex justify-between items-center text-[10px] pt-3 border-t" style={{ color: colors.slate400, borderColor: colors.slate200 }}>
      <span>MoveIQ AI — Intervention Plan & Corrective Prescriptions</span>
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

            {/* Summary Block */}
            {recommendations && typeof recommendations === 'object' && recommendations.one_line_summary && (
              <div className="bg-slate-900 p-4 rounded-xl text-white text-xs font-bold leading-relaxed mb-6 shadow-sm">
                {recommendations.one_line_summary}
              </div>
            )}

            <SecHead n="1" title="Priority-Ranked Corrective Recommendations" />

            <div className="overflow-hidden rounded-xl border mb-6" style={{ borderColor: colors.slate200 }}>
              <div className="p-4 bg-white space-y-4">
                {sortedCategories.length > 0 ? (
                  sortedCategories.map((cat: any, idx: number) => {
                    const catLower = (cat.category_name || '').toLowerCase();
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
                            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">{cat.category_name.replace(/_/g, ' ')}</h3>
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
                  })
                ) : (
                  <div className="py-8 px-6 text-center text-slate-500 text-xs">
                    {typeof recommendations === 'string' ? recommendations : "No specific recommendations generated yet."}
                  </div>
                )}
              </div>

              {recommendations && typeof recommendations === 'object' && recommendations.wrap_up_summary && (
                <div className="p-3.5 bg-slate-50 border-t text-[10px] text-slate-600 leading-relaxed font-medium" style={{ borderColor: colors.slate200 }}>
                  {recommendations.wrap_up_summary}
                </div>
              )}
            </div>

            <SecHead n="2" title="7-Day Recovery & Training Plan (Sample)" />

            <div className="grid grid-cols-7 gap-1.5 mb-6">
              {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((d, i) => (
                <div key={d} className="border rounded-lg overflow-hidden text-center" style={{ borderColor: colors.slate200 }}>
                  <div className="py-1 bg-slate-100 font-bold text-[9px] text-slate-700 border-b" style={{ borderColor: colors.slate200 }}>{d}</div>
                  <div className="p-1.5 text-[8px] font-medium text-slate-600 h-12 flex items-center justify-center bg-white leading-tight">
                    {['Balance Drills + Mobility', 'Lower Body Strength (Unilateral)', 'Active Recovery + Stretch', 'Upper Body Stability + Core', 'Plyometrics (Low Impact)', 'Full Body Strength + Control', 'Rest & Recovery'][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {/* AI Medical Disclosure Line */}
            <div className="p-3 rounded-lg bg-slate-900 text-white text-[9px] leading-relaxed text-center mb-6">
              <strong>AI Medical Disclosure:</strong> Recommendations generated using MoveIQ AI (Groq/Llama) — for guidance only, not a medical prescription. Consult a licensed physiotherapist or physician for persistent pain, swelling, or clinical injury diagnosis.
            </div>
            <PageFooter page={1} total={1} />
          </div>
        </div>

      </div>
    </div>
  );
});

PdfRecommendationOnly.displayName = 'PdfRecommendationOnly';

