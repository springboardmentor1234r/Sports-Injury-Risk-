const RISK_BADGES = {
  'Very Low': 'border-green-200 bg-green-50 text-green-700',
  Low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-700',
  High: 'border-brand-200 bg-brand-100 text-brand-700',
  Critical: 'border-red-200 bg-red-50 text-red-700',
};

const getRiskBadgeClass = (riskLevel) => RISK_BADGES[riskLevel] || 'border-brand-200 bg-brand-50 text-slate-600';

const formatRiskScore = (score) => (Number.isFinite(score) ? `${score.toFixed(2)} / 100` : 'Unavailable');

const formatAngle = (angle) => (Number.isFinite(angle) ? `${angle.toFixed(2)}°` : '—');

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unavailable';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleString();
};

const formatConfidence = (confidence) => {
  if (!confidence) return 'Unavailable';
  if (typeof confidence === 'string') return confidence;
  if (typeof confidence === 'object') {
    return Number.isFinite(confidence.score) ? `${confidence.level || 'Unknown'} (${confidence.score}%)` : confidence.level || 'Unavailable';
  }
  return 'Unavailable';
};

export { formatAngle, formatConfidence, formatRiskScore, formatTimestamp, getRiskBadgeClass };
