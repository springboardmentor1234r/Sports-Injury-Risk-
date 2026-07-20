const RISK_BADGES = {
  'Very Low': 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  Low: 'border-yellow-500/40 bg-yellow-500/15 text-yellow-300',
  Moderate: 'border-orange-500/40 bg-orange-500/15 text-orange-300',
  High: 'border-red-500/40 bg-red-500/15 text-red-300',
  Critical: 'border-red-950 bg-red-950/80 text-red-100',
};

const getRiskBadgeClass = (riskLevel) => RISK_BADGES[riskLevel] || 'border-slate-600 bg-slate-800 text-slate-300';

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

