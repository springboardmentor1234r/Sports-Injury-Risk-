// These posture thresholds are configurable and do not represent injury-risk predictions.
// Hyperextension needs directional/anatomical context: a three-point angle alone is
// bounded at 180 degrees and cannot distinguish a locked joint from hyperextension.
const MOVEMENT_THRESHOLDS = {
  leftElbow: { highFlexionMax: 90, normalMin: 145, extensionEvidenceMin: 170 },
  rightElbow: { highFlexionMax: 90, normalMin: 145, extensionEvidenceMin: 170 },
  leftKnee: { highFlexionMax: 100, normalMin: 150, extensionEvidenceMin: 170 },
  rightKnee: { highFlexionMax: 100, normalMin: 150, extensionEvidenceMin: 170 },
};

const JOINT_LABELS = {
  leftElbow: 'Left elbow',
  rightElbow: 'Right elbow',
  leftKnee: 'Left knee',
  rightKnee: 'Right knee',
};

const QUALITY_THRESHOLDS = {
  expectedLandmarkCount: 33,
  minimumVisibility: 0.5,
  confidenceRatios: {
    high: 0.8,
    medium: 0.5,
  },
};

/**
 * Rounds a calculated joint angle for a stable, readable API response.
 */
const roundAngle = (angle) => (Number.isFinite(angle) ? Number(angle.toFixed(2)) : null);

/**
 * Rounds every calculated joint angle while retaining the existing joint keys.
 */
const roundJointAngles = (jointAngles = {}) => Object.fromEntries(
  Object.entries(jointAngles ?? {}).map(([joint, angle]) => [joint, roundAngle(angle)]),
);

/**
 * Classifies one joint angle using configurable thresholds and optional directional evidence.
 */
const classifyJointAngle = (angle, thresholds, hasHyperextensionEvidence = false) => {
  if (!Number.isFinite(angle)) return 'Unknown';
  if (hasHyperextensionEvidence && angle >= thresholds.extensionEvidenceMin) return 'Hyperextended';
  if (angle >= thresholds.normalMin) return 'Normal';
  if (angle > thresholds.highFlexionMax) return 'Slightly Bent';
  return 'High Flexion';
};

/**
 * Builds a human-readable movement result for a single joint.
 */
const analyzeJoint = (angle, joint, hasHyperextensionEvidence = false) => {
  const roundedAngle = roundAngle(angle);
  const status = classifyJointAngle(roundedAngle, MOVEMENT_THRESHOLDS[joint], hasHyperextensionEvidence);
  const label = JOINT_LABELS[joint];
  const details = {
    Normal: {
      message: `${label} alignment appears normal.`,
      recommendation: 'Maintain your current posture.',
    },
    'Slightly Bent': {
      message: `${label} is mildly bent.`,
      recommendation: 'Use controlled movement and monitor joint alignment.',
    },
    Hyperextended: {
      message: `${label} appears excessively extended.`,
      recommendation: 'Avoid locking the joint completely.',
    },
    'High Flexion': {
      message: `${label} is significantly bent.`,
      recommendation: 'Reduce excessive bending during movement.',
    },
    Unknown: {
      message: 'Unable to analyze this joint because the landmarks were not detected.',
      recommendation: 'Ensure the joint is visible to the camera.',
    },
  };

  return {
    angle: roundedAngle,
    status,
    ...details[status],
  };
};

/**
 * Counts reliably visible landmarks and assigns a confidence level for one frame.
 */
const calculateAnalysisQuality = (landmarks) => {
  const totalLandmarks = Array.isArray(landmarks) ? landmarks.length : 0;
  const detectedLandmarks = Array.isArray(landmarks)
    ? landmarks.filter((landmark) => Number(landmark?.visibility) >= QUALITY_THRESHOLDS.minimumVisibility).length
    : 0;
  const highConfidenceLandmarks = Math.ceil(
    QUALITY_THRESHOLDS.expectedLandmarkCount * QUALITY_THRESHOLDS.confidenceRatios.high,
  );
  const mediumConfidenceLandmarks = Math.ceil(
    QUALITY_THRESHOLDS.expectedLandmarkCount * QUALITY_THRESHOLDS.confidenceRatios.medium,
  );
  let confidence = 'Low';

  if (detectedLandmarks >= highConfidenceLandmarks) {
    confidence = 'High';
  } else if (detectedLandmarks >= mediumConfidenceLandmarks) {
    confidence = 'Medium';
  }

  return { totalLandmarks, detectedLandmarks, confidence };
};

const formatJointList = (joints) => {
  if (joints.length < 2) return joints[0] ?? '';
  if (joints.length === 2) return joints.join(' and ');
  return `${joints.slice(0, -1).join(', ')}, and ${joints.at(-1)}`;
};

/**
 * Produces a frame-level summary that identifies the posture categories present.
 */
const createOverallSummary = (jointAnalysis) => {
  const results = Object.entries(jointAnalysis);
  const byStatus = (status) => results.filter(([, analysis]) => analysis.status === status)
    .map(([joint]) => JOINT_LABELS[joint].toLowerCase());
  const unknownJoints = byStatus('Unknown');
  const severeJoints = [...byStatus('High Flexion'), ...byStatus('Hyperextended')];
  const slightlyBentJoints = byStatus('Slightly Bent');
  const analyzedJointCount = results.length - unknownJoints.length;
  const analysisContext = `${analyzedJointCount} of ${results.length} joints analyzed`;
  const unknownContext = unknownJoints.length
    ? ` Unable to analyze: ${formatJointList(unknownJoints)}.`
    : '';

  if (unknownJoints.length === results.length) {
    return {
      overallStatus: 'Unable to Analyze',
      summary: `${analysisContext}. Movement could not be assessed because no required joint landmarks were detected.`,
    };
  }

  if (severeJoints.length) {
    const severeVerb = severeJoints.length === 1 ? 'shows' : 'show';

    return {
      overallStatus: 'Needs Attention',
      summary: `${analysisContext}. Posture quality needs attention: ${formatJointList(severeJoints)} ${severeVerb} significant bending or excessive extension.${unknownContext}`,
    };
  }

  if (slightlyBentJoints.length) {
    const postureExplanation = slightlyBentJoints.length === 1
      ? `${formatJointList(slightlyBentJoints)} shows mild bending`
      : `${formatJointList(slightlyBentJoints)} show mild bending across ${slightlyBentJoints.length} joints`;

    return {
      overallStatus: 'Minor Posture Adjustments Recommended',
      summary: `${analysisContext}. ${postureExplanation}; focus on controlled alignment.${unknownContext}`,
    };
  }

  if (unknownJoints.length) {
    return {
      overallStatus: 'Movement Quality Good',
      summary: `${analysisContext}. Visible joints appear normally aligned.${unknownContext}`,
    };
  }

  return {
    overallStatus: 'Excellent Movement',
    summary: `${analysisContext}. All analyzed joints appear naturally aligned with controlled movement.`,
  };
};

/**
 * Converts calculated joint angles into reusable, human-readable movement analysis.
 */
const analyzeMovement = (jointAngles = {}, movementContext = {}) => {
  const jointAnalysis = Object.fromEntries(
    Object.keys(MOVEMENT_THRESHOLDS).map((joint) => [
      joint,
      analyzeJoint(jointAngles?.[joint], joint, movementContext?.hyperextensionEvidence?.[joint] === true),
    ]),
  );

  return {
    ...jointAnalysis,
    ...createOverallSummary(jointAnalysis),
  };
};

export {
  MOVEMENT_THRESHOLDS,
  QUALITY_THRESHOLDS,
  analyzeJoint,
  calculateAnalysisQuality,
  classifyJointAngle,
  createOverallSummary,
  roundAngle,
  roundJointAngles,
};
export default analyzeMovement;
