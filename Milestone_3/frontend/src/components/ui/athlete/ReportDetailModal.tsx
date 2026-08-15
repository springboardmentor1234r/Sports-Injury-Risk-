import React from 'react';

interface ReportDetailModalProps {
  session: any;
  onClose: () => void;
  onNavigateToRecommendations: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  session,
  onClose,
  onNavigateToRecommendations,
}) => {
  if (!session) return null;

  const getRiskLabel = () => {
    return session?.risk_data?.risk_category ?? 'Low Risk';
  };

  const getIssuesString = (issues: any) => {
    if (!issues) return 'Movement patterns analyzed by AI Biomechanics Engine.';
    if (typeof issues === 'string') {
      if (issues === 'None') return 'No issues flagged.';
      return issues;
    }
    if (Array.isArray(issues)) {
      if (issues.length === 0) return 'No issues flagged.';
      return issues.map((i: any) => i.issue || i).join(', ');
    }
    return 'Movement patterns analyzed by AI Biomechanics Engine.';
  };

  const getExercisesForRisk = (risk: string) => {
    if (risk === 'High Risk' || risk === 'Severe') {
      return [
        { id: 1, name: 'Single-leg Squats', reps: '3 sets x 10 reps per leg', targetJoint: 'Knee & Hip Stabilizers' },
        { id: 2, name: 'Glute Bridges (Banded)', reps: '4 sets x 15 reps', targetJoint: 'Gluteus Medius & Hips' }
      ];
    } else {
      return [
        { id: 1, name: 'Lateral Band Walks', reps: '3 sets x 12 steps each side', targetJoint: 'Gluteus Medius' }
      ];
    }
  };

  const exercises = getExercisesForRisk(getRiskLabel());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#c3c6d7] max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left text-[#191c1f]">
        {/* Header */}
        <div className="bg-[#191b23] text-white p-5 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#004ccd]">
                description
              </span>
              <h3 className="text-[20px] font-bold">
                Biomechanical Report Preview
              </h3>
            </div>
            <p className="text-[12px] text-[#c3c6d7] font-mono mt-0.5 truncate max-w-[400px]">
              {session.video_name} • {session.session_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[14px]">
          {/* Risk Level Banner */}
          <div className="flex items-center justify-between p-4 bg-[#faf8ff] border border-[#c3c6d7] rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-[#434654] uppercase block">
                Risk Classification
              </span>
              <span className="text-[20px] font-bold text-[#191b23]">
                {getRiskLabel()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#434654] uppercase block">
                Health Score
              </span>
              <span className="text-[24px] font-bold text-[#00379b]">
                {session.risk_data?.overall_health_score || 100} / 100
              </span>
            </div>
          </div>

          {/* Kinematic Angle Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-white border border-[#c3c6d7] rounded-lg text-center">
              <div className="text-[11px] font-semibold text-[#434654] uppercase">
                Peak Valgus
              </div>
              <div className="text-[18px] font-bold text-[#ba1a1a]">
                {session.risk_data?.valgus_angle !== undefined ? `${session.risk_data.valgus_angle.toFixed(1)}°` : '--'}
              </div>
            </div>
            <div className="p-3 bg-white border border-[#c3c6d7] rounded-lg text-center">
              <div className="text-[11px] font-semibold text-[#434654] uppercase">
                Efficiency
              </div>
              <div className="text-[18px] font-bold text-[#00379b]">
                {session.risk_data?.biomechanical_efficiency_score || 100}%
              </div>
            </div>
            <div className="p-3 bg-white border border-[#c3c6d7] rounded-lg text-center">
              <div className="text-[11px] font-semibold text-[#434654] uppercase">
                Date Recorded
              </div>
              <div className="text-[13px] font-bold text-[#191b23] mt-1">
                {session.created_at ? new Date(session.created_at).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Insight Text */}
          <div>
            <h4 className="font-bold text-[#191b23] uppercase text-[12px] tracking-wider mb-2">
              AI Motion Findings
            </h4>
            <p className="p-4 bg-[#faf8ff] border-l-4 border-[#00379b] rounded-r-lg text-[#191b23]">
              {getIssuesString(session.risk_data?.flagged_issues)}
            </p>
          </div>

          {/* Exercises */}
          <div>
            <h4 className="font-bold text-[#191b23] uppercase text-[12px] tracking-wider mb-2">
              Prescribed Interventions ({exercises.length})
            </h4>
            <ul className="space-y-2">
              {exercises.map((ex) => (
                <li
                  key={ex.id}
                  className="p-3 bg-[#faf8ff] border border-[#c3c6d7] rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-[#191b23]">
                      {ex.name}
                    </span>
                    <span className="text-[12px] text-[#737686] block">
                      {ex.targetJoint}
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#00379b] bg-[#f3f3fe] px-2 py-1 rounded">
                    {ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#c3c6d7] bg-[#faf8ff] flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[#c3c6d7] text-[#434654] font-semibold text-[13px]"
          >
            Close
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigateToRecommendations();
            }}
            className="px-6 py-2.5 bg-[#00379b] text-white rounded-lg font-semibold text-[13px] uppercase tracking-wider hover:bg-[#004ccd]"
          >
            View AI Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};
