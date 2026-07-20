// Explainable heuristic configuration. These values describe movement-pattern
// signals only and can be replaced by a trained model without changing callers.
const RISK_CONFIG = {
  jointKeys: ['leftElbow', 'rightElbow', 'leftKnee', 'rightKnee'],
  statusPoints: {
    Normal: 0,
    'Slightly Bent': 20,
    'High Flexion': 55,
    Hyperextended: 65,
    Unknown: 0,
  },
  persistence: {
    minimumFrames: 2,
    ratio: 0.5,
    maxPoints: 10,
  },
  angleVariation: {
    minimumDegrees: 60,
    maxPoints: 10,
  },
  multipleJoint: {
    minimumJoints: 2,
    maxPoints: 10,
  },
  riskLevels: [
    { maximumScore: 9, label: 'Very Low' },
    { maximumScore: 29, label: 'Low' },
    { maximumScore: 54, label: 'Moderate' },
    { maximumScore: 79, label: 'High' },
    { maximumScore: 100, label: 'Critical' },
  ],
};

const JOINT_LABELS = {
  leftElbow: 'Left elbow',
  rightElbow: 'Right elbow',
  leftKnee: 'Left knee',
  rightKnee: 'Right knee',
};

const isFiniteAngle = (angle) => Number.isFinite(angle);
const isAbnormalStatus = (status) => ['Slightly Bent', 'High Flexion', 'Hyperextended'].includes(status);

/**
 * Returns a readable list without coupling the risk module to API presentation code.
 */
const formatList = (items) => {
  if (items.length < 2) return items[0] ?? '';
  if (items.length === 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

/**
 * Normalizes either a frames array or a pipeline result containing a frames array.
 */
const getFrames = (input) => (Array.isArray(input) ? input : input?.frames ?? []);

/**
 * Aggregates one joint's statuses and angles across all available frames.
 */
const analyzeJointTrend = (frames, joint) => {
  const statuses = [];
  const angles = [];

  frames.forEach((frame) => {
    const movement = frame?.movementAnalysis?.[joint];
    const status = movement?.status ?? 'Unknown';
    const angle = frame?.jointAngles?.[joint] ?? movement?.angle;

    statuses.push(status);
    if (isFiniteAngle(angle)) angles.push(angle);
  });

  const statusCounts = Object.fromEntries(
    Object.keys(RISK_CONFIG.statusPoints).map((status) => [status, 0]),
  );
  statuses.forEach((status) => {
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  });

  const analyzedFrames = statuses.filter((status) => status !== 'Unknown').length;
  const abnormalFrames = statuses.filter(isAbnormalStatus).length;
  const abnormalFrameRatio = analyzedFrames ? abnormalFrames / analyzedFrames : 0;
  const angleRange = angles.length ? Math.max(...angles) - Math.min(...angles) : null;
  const averageStatusPoints = analyzedFrames
    ? statuses.reduce((total, status) => total + (RISK_CONFIG.statusPoints[status] ?? 0), 0) / analyzedFrames
    : 0;
  const isPersistent = abnormalFrames >= RISK_CONFIG.persistence.minimumFrames
    && abnormalFrameRatio >= RISK_CONFIG.persistence.ratio;
  const hasHighVariation = angleRange !== null && angleRange >= RISK_CONFIG.angleVariation.minimumDegrees;
  const contributionScore = Math.min(
    100,
    averageStatusPoints
      + (isPersistent ? RISK_CONFIG.persistence.maxPoints : 0)
      + (hasHighVariation ? RISK_CONFIG.angleVariation.maxPoints : 0),
  );

  return {
    joint,
    label: JOINT_LABELS[joint],
    analyzedFrames,
    abnormalFrames,
    abnormalFrameRatio: Number(abnormalFrameRatio.toFixed(2)),
    statusCounts,
    angleRange: angleRange === null ? null : Number(angleRange.toFixed(2)),
    persistent: isPersistent,
    highVariation: hasHighVariation,
    contributionScore: Number(contributionScore.toFixed(2)),
  };
};

/**
 * Analyzes all supported joints to create the movement-pattern trend input for scoring.
 */
const analyzeMovementTrends = (input) => {
  const frames = getFrames(input);
  const jointTrends = RISK_CONFIG.jointKeys.map((joint) => analyzeJointTrend(frames, joint));
  const analyzedJointObservations = jointTrends.reduce((total, trend) => total + trend.analyzedFrames, 0);

  return {
    frameCount: frames.length,
    analyzedJointObservations,
    totalJointObservations: frames.length * RISK_CONFIG.jointKeys.length,
    jointTrends,
  };
};

/**
 * Converts trend data into a bounded, explainable 0-100 movement-pattern score.
 */
const calculateRiskScore = (trendAnalysis) => {
  const { jointTrends, analyzedJointObservations } = trendAnalysis;
  if (!analyzedJointObservations) return 0;

  const averageJointScore = jointTrends.reduce(
    (total, trend) => total + trend.contributionScore,
    0,
  ) / jointTrends.length;
  const affectedJoints = jointTrends.filter((trend) => trend.abnormalFrames > 0).length;
  const multiJointPoints = affectedJoints >= RISK_CONFIG.multipleJoint.minimumJoints
    ? RISK_CONFIG.multipleJoint.maxPoints
    : 0;
  // Lower coverage does not increase risk; it only limits confidence in the result.
  const score = Math.min(100, averageJointScore + multiJointPoints);

  return Number(score.toFixed(2));
};

/**
 * Maps a bounded score to the public overall risk classification.
 */
const classifyRiskLevel = (riskScore) => (
  RISK_CONFIG.riskLevels.find(({ maximumScore }) => riskScore <= maximumScore)?.label ?? 'Critical'
);

/**
 * Produces transparent joint-level factors instead of medical or diagnostic claims.
 */
const buildContributingFactors = (jointTrends) => jointTrends.flatMap((trend) => {
  const factors = [];

  if (trend.abnormalFrames) {
    factors.push(`${trend.label} showed non-neutral movement in ${trend.abnormalFrames} of ${trend.analyzedFrames} analyzed frames.`);
  }
  if (trend.persistent) {
    factors.push(`${trend.label} showed a repeated non-neutral movement pattern across analyzed frames.`);
  }
  if (trend.highVariation) {
    factors.push(`${trend.label} angle varied by ${trend.angleRange}° across analyzed frames.`);
  }
  if (!trend.analyzedFrames) {
    factors.push(`${trend.label} could not be analyzed because valid frame data was unavailable.`);
  }

  return factors;
});

/**
 * Creates a concise explanation of the calculated movement-pattern indicator.
 */
const createRiskSummary = (riskLevel, trendAnalysis, contributingJoints) => {
  const coverage = trendAnalysis.totalJointObservations
    ? Math.round((trendAnalysis.analyzedJointObservations / trendAnalysis.totalJointObservations) * 100)
    : 0;

  if (!trendAnalysis.analyzedJointObservations) {
    return 'Unable to calculate a movement-pattern indicator because no joints were analyzed.';
  }

  if (!contributingJoints.length) {
    return `${riskLevel} movement-pattern indicator based on ${coverage}% analyzable joint observations; no repeated non-neutral joint patterns were detected.`;
  }

  return `${riskLevel} movement-pattern indicator based on ${coverage}% analyzable joint observations. Primary contributing joints: ${formatList(contributingJoints.map(({ label }) => label.toLowerCase()))}.`;
};

/**
 * Generates a modular, non-diagnostic injury-risk indicator from processed video frames.
 */
const predictInjuryRisk = (input) => {
  const trendAnalysis = analyzeMovementTrends(input);
  const riskScore = calculateRiskScore(trendAnalysis);
  const riskLevel = classifyRiskLevel(riskScore);
  const contributingJoints = trendAnalysis.jointTrends
    .filter((trend) => trend.contributionScore > 0)
    .sort((left, right) => right.contributionScore - left.contributionScore);

  return {
    riskScore,
    riskLevel,
    contributingJoints,
    contributingFactors: buildContributingFactors(trendAnalysis.jointTrends),
    trendAnalysis,
    summary: createRiskSummary(riskLevel, trendAnalysis, contributingJoints),
    model: {
      type: 'Explainable heuristic',
      version: '1.0',
      note: 'This movement-pattern indicator is not a medical diagnosis and can be replaced by a future ML model.',
    },
  };
};

export {
  RISK_CONFIG,
  analyzeJointTrend,
  analyzeMovementTrends,
  calculateRiskScore,
  classifyRiskLevel,
  predictInjuryRisk,
};
export default predictInjuryRisk;
