// Shared helpers for Milestone 3 (Injury Risk Prediction / Risk Scoring /
// Corrective Recommendations) across VideoAnalysis, AthleteDetail,
// InjuryRiskDashboard, and StaffDashboard.

export const RISK_STYLES = {
  Low: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
  Moderate: { bg: "#fffbeb", border: "#fde68a", text: "#d97706" },
  High: { bg: "#fff1f2", border: "#fecdd3", text: "#e11d48" },
  Critical: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
};

export function riskStyle(category) {
  return RISK_STYLES[category] || { bg: "#f3f4f6", border: "#e5e7eb", text: "#6b7280" };
}

export const RECOMMENDATION_META = {
  strengthening: { emoji: "💪", label: "Strengthening" },
  mobility: { emoji: "🤸", label: "Mobility" },
  exercise: { emoji: "🏋️", label: "Exercise" },
  recovery: { emoji: "😴", label: "Recovery" },
  training_modification: { emoji: "📉", label: "Training Modification" },
};

export function recommendationMeta(category) {
  return RECOMMENDATION_META[category] || { emoji: "📝", label: "Recommendation" };
}

export const SEVERITY_COLOR = {
  info: "#6b7280",
  moderate: "#d97706",
  high: "#dc2626",
};

export function severityColor(severity) {
  return SEVERITY_COLOR[severity] || "#6b7280";
}

// Weighted Scoring Model sub-scores, in the same order/weights as the PDF
// ("8. Risk Scoring Engine" -> "Weighted Scoring Model").
export const RISK_SUBSCORE_FIELDS = [
  { key: "biomechanical_deviation_score", label: "Biomechanical Deviations", weight: "35%" },
  { key: "historical_injury_score", label: "Historical Injury Factors", weight: "20%" },
  { key: "movement_asymmetry_score", label: "Movement Asymmetry", weight: "20%" },
  { key: "training_load_score", label: "Training Load Indicators", weight: "15%" },
  { key: "fatigue_score", label: "Fatigue Indicators", weight: "10%" },
];

export const INJURY_TYPE_EMOJI = {
  "ACL Injury Risk": "🦵",
  "Hamstring Injury Risk": "🏃",
  "Ankle Sprain Risk": "🦶",
  "Shoulder Injury Risk": "🤾",
  "Lower Back Injury Risk": "🧍",
  "Overuse Injury Risk": "⏱️",
};
