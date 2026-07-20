import React from 'react';

interface PdfRecommendationOnlyProps {
  session: any;
  recommendations: any;
}

export const PdfRecommendationOnly = React.forwardRef<HTMLDivElement, PdfRecommendationOnlyProps>(({ session, recommendations }, ref) => {
  if (!session) return null;

  const riskData = session.risk_data || {};
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

  return (
    <div>
      <div ref={ref} className="font-sans w-[800px] mx-auto text-sm" style={{ backgroundColor: colors.white, color: colors.slate900 }}>
        
        {/* ================= PAGE 1 ================= */}
        <div className="pdf-page p-10 relative" style={{ backgroundColor: colors.white }}>
          <div className="flex justify-between items-end pb-4 mb-8" style={{ borderBottom: `2px solid ${colors.slate200}` }}>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.slate800 }}>MoveIQ</h1>
              <p className="text-sm font-semibold uppercase tracking-widest mt-1" style={{ color: colors.slate500 }}>AI Biomechanics Recommendation</p>
            </div>
            <div className="text-right text-xs space-y-1" style={{ color: colors.slate500 }}>
              <p>Report ID: <span className="font-medium" style={{ color: colors.slate700 }}>MIQ-{(session.session_id || "TEMP").substring(0, 8).toUpperCase()}</span></p>
              <p>Date: <span className="font-medium" style={{ color: colors.slate700 }}>{date}</span></p>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>1</span> 
            RECOMMENDATIONS (PRIORITY BASED)
          </h2>

          <div className="overflow-hidden rounded-xl mb-10" style={{ border: `1px solid ${colors.slate200}` }}>
            <table className="w-full text-left">
              <thead style={{ backgroundColor: colors.slate50, borderBottom: `1px solid ${colors.slate200}` }}>
                <tr>
                  <th className="py-4 px-6 font-semibold w-32" style={{ color: colors.slate600 }}>Priority</th>
                  <th className="py-4 px-6 font-semibold" style={{ color: colors.slate600 }}>Recommendations (Based on AI Analysis)</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${colors.slate100}` }}>
                {recommendations && recommendations.categories && recommendations.categories.length > 0 ? (
                  recommendations.categories.map((cat: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-6 px-6 align-top">
                        <span className="px-3 py-1 rounded text-xs font-bold capitalize" 
                              style={{ 
                                border: `1px solid ${colors.amber200}`,
                                color: colors.amber600, 
                                backgroundColor: colors.amber50 
                              }}>
                          {cat.category_name.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-6 px-6">
                        <div className="text-sm leading-relaxed mb-2" style={{ color: colors.slate700 }}>
                          {cat.issue_translation}
                        </div>
                        <div className="text-xs uppercase font-bold tracking-wider mb-1" style={{ color: colors.slate500 }}>
                          Recommended Exercises
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-sm" style={{ color: colors.slate600 }}>
                          {cat.recommended_exercises?.map((ex: string, i: number) => (
                            <li key={i}>{ex}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-8 px-6 text-center" style={{ color: colors.slate500 }}>No specific recommendations generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: colors.slate800 }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.slate900, color: colors.white }}>2</span> 
            RECOVERY & TRAINING PLAN (SAMPLE)
          </h2>

          <div className="grid grid-cols-7 gap-2 mb-10">
            {['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, i) => (
              <div key={day} className="rounded-lg overflow-hidden text-center" style={{ border: `1px solid ${colors.slate200}` }}>
                <div className="py-2" style={{ backgroundColor: colors.slate100, borderBottom: `1px solid ${colors.slate200}` }}>
                  <span className="text-xs font-bold" style={{ color: colors.slate600 }}>{day}</span>
                </div>
                <div className="p-3 py-4 text-xs font-medium h-24 flex items-center justify-center" style={{ color: colors.slate700 }}>
                  {i === 0 ? "Balance Drills + Mobility" :
                   i === 1 ? "Lower Body Strength (Unilateral)" :
                   i === 2 ? "Active Recovery + Stretch" :
                   i === 3 ? "Upper Body Stability + Core" :
                   i === 4 ? "Plyometric Training (Low Impact)" :
                   i === 5 ? "Full Body Strength + Balance" :
                   "Rest & Recovery"}
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs pt-4" style={{ color: colors.slate400, borderTop: `1px solid ${colors.slate200}` }}>
            <span>MoveIQ AI</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

      </div>
    </div>
  );
});

PdfRecommendationOnly.displayName = 'PdfRecommendationOnly';
