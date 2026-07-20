// Report rules are presentation-level mappings only. They do not recalculate
// pose, movement, risk, or recommendation data.
const REPORT_CONFIG = {
  version: '1.0.0',
  maximumConcernAreas: 3,
  qualityByRiskLevel: {
    'Very Low': 'Excellent',
    Low: 'Good',
    Moderate: 'Needs Attention',
    High: 'Poor',
    Critical: 'Requires Assessment',
  },
  conclusionByRiskLevel: {
    'Very Low': 'Movement quality appears well controlled in the analyzed frames. Continue to maintain sound technique.',
    Low: 'Movement quality appears generally controlled, with minor areas to monitor during training.',
    Moderate: 'Movement quality requires attention; use the provided guidance and monitor form before progressing load.',
    High: 'Movement quality shows notable concerns. Reduce load around affected areas and consider qualified professional assessment.',
    Critical: 'Movement quality shows significant concerns. Pause high-load activity involving affected areas and seek qualified professional assessment.',
  },
  confidenceLevels: [
    { minimum: 90, label: 'High' },
    { minimum: 60, label: 'Moderate' },
    { minimum: 1, label: 'Low' },
    { minimum: 0, label: 'Unavailable' },
  ],
  engine: {
    type: 'Explainable rule-based report generator',
    futureMlCompatible: true,
    inputContract: ['frameCount', 'riskPrediction', 'exerciseRecommendations'],
  },
};

const getRiskLevel = (riskPrediction) => (
  REPORT_CONFIG.qualityByRiskLevel[riskPrediction?.riskLevel] ? riskPrediction.riskLevel : 'Low'
);

const getPrimaryConcernAreas = (riskPrediction, exerciseRecommendations) => {
  const contributingAreas = (riskPrediction?.contributingJoints ?? [])
    .map((joint) => joint?.label ?? joint?.joint)
    .filter(Boolean);
  const recommendationAreas = exerciseRecommendations?.priorityAreas ?? [];

  return [...new Set([...contributingAreas, ...recommendationAreas])]
    .slice(0, REPORT_CONFIG.maximumConcernAreas);
};

const getKeyFindings = (riskPrediction) => {
  const findings = (riskPrediction?.contributingFactors ?? []).filter(Boolean);
  if (findings.length) return findings;
  if (riskPrediction?.summary) return [riskPrediction.summary];
  return ['No movement-pattern findings were available from the analysis output.'];
};

const createRecommendationSummary = (exerciseRecommendations) => {
  const recommendations = exerciseRecommendations?.recommendations ?? [];
  const areas = exerciseRecommendations?.priorityAreas ?? [];

  if (!recommendations.length) {
    return 'No exercise recommendations were available from the recommendation output.';
  }

  const categories = [...new Set(recommendations.map(({ category }) => category).filter(Boolean))];
  const areaText = areas.length ? ` for ${areas.map((area) => area.toLowerCase()).join(', ')}` : '';
  return `Prioritize ${recommendations.length} ${categories.join(' and ').toLowerCase()} recommendation${recommendations.length === 1 ? '' : 's'}${areaText}.`;
};

const createAnalysisConfidence = (riskPrediction) => {
  const trendAnalysis = riskPrediction?.trendAnalysis;
  const total = trendAnalysis?.totalJointObservations ?? 0;
  const analyzed = trendAnalysis?.analyzedJointObservations ?? 0;
  const score = total ? Math.round((analyzed / total) * 100) : 0;
  const level = REPORT_CONFIG.confidenceLevels.find(({ minimum }) => score >= minimum)?.label ?? 'Unavailable';

  return { score, level };
};

/**
 * Creates an explainable report from existing pipeline outputs. A future ML
 * prediction/recommendation provider only needs to preserve this input contract.
 */
const generateAnalysisReport = ({
  frameCount = 0,
  riskPrediction = {},
  exerciseRecommendations = {},
  generatedAt = null,
} = {}) => {
  const riskLevel = getRiskLevel(riskPrediction);
  const primaryConcernAreas = getPrimaryConcernAreas(riskPrediction, exerciseRecommendations);

  return {
    overallMovementQuality: REPORT_CONFIG.qualityByRiskLevel[riskLevel],
    riskLevel,
    riskScore: Number.isFinite(riskPrediction.riskScore) ? riskPrediction.riskScore : 0,
    primaryConcernAreas,
    keyFindings: getKeyFindings(riskPrediction),
    movementSummary: riskPrediction.summary ?? 'No movement summary was available from the risk prediction output.',
    recommendationSummary: createRecommendationSummary(exerciseRecommendations),
    activityGuidance: exerciseRecommendations.activityGuidance ?? 'No activity guidance was available from the recommendation output.',
    overallConclusion: REPORT_CONFIG.conclusionByRiskLevel[riskLevel],
    analysisMetadata: {
      framesAnalyzed: frameCount,
      analysisConfidence: createAnalysisConfidence(riskPrediction),
      generatedAt,
      reportVersion: REPORT_CONFIG.version,
      engine: REPORT_CONFIG.engine,
    },
  };
};

export { REPORT_CONFIG, generateAnalysisReport };
export default generateAnalysisReport;
