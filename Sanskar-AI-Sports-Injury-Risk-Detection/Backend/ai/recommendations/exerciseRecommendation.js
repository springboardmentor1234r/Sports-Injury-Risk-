// Explainable, rule-based recommendation configuration. A future ML model can
// provide the same riskPrediction-shaped input without changing this module's callers.
const RECOMMENDATION_CONFIG = {
  version: '1.0',
  maximumPriorityAreas: 3,
  riskLevels: {
    'Very Low': {
      priority: 'low',
      activityGuidance: 'Continue normal training with attention to controlled, pain-free movement.',
    },
    Low: {
      priority: 'low',
      activityGuidance: 'Continue training conservatively and reinforce controlled movement technique.',
    },
    Moderate: {
      priority: 'medium',
      activityGuidance: 'Reduce intensity if movement quality declines and prioritize controlled, pain-free training.',
    },
    High: {
      priority: 'high',
      activityGuidance: 'Avoid high-load or high-impact activity involving the affected area until movement quality improves; consider assessment by a qualified professional.',
    },
    Critical: {
      priority: 'high',
      activityGuidance: 'Pause high-load or high-impact activity involving the affected area and seek assessment from a qualified healthcare or sports professional before returning to it.',
    },
  },
  jointPrograms: {
    leftElbow: {
      targetArea: 'Left elbow',
      exercises: [
        { category: 'Mobility', exercise: 'Gentle elbow flexion and extension', guidance: 'Use a comfortable range of motion and stop if pain occurs.' },
        { category: 'Control', exercise: 'Light, controlled elbow movement drill', guidance: 'Use slow repetitions with neutral wrist and shoulder alignment.' },
      ],
    },
    rightElbow: {
      targetArea: 'Right elbow',
      exercises: [
        { category: 'Mobility', exercise: 'Gentle elbow flexion and extension', guidance: 'Use a comfortable range of motion and stop if pain occurs.' },
        { category: 'Control', exercise: 'Light, controlled elbow movement drill', guidance: 'Use slow repetitions with neutral wrist and shoulder alignment.' },
      ],
    },
    leftKnee: {
      targetArea: 'Left knee',
      exercises: [
        { category: 'Mobility', exercise: 'Supported knee flexion and extension', guidance: 'Use a comfortable range of motion and stop if pain occurs.' },
        { category: 'Stability', exercise: 'Supported single-leg balance', guidance: 'Keep the knee aligned over the foot and use support as needed.' },
      ],
    },
    rightKnee: {
      targetArea: 'Right knee',
      exercises: [
        { category: 'Mobility', exercise: 'Supported knee flexion and extension', guidance: 'Use a comfortable range of motion and stop if pain occurs.' },
        { category: 'Stability', exercise: 'Supported single-leg balance', guidance: 'Keep the knee aligned over the foot and use support as needed.' },
      ],
    },
  },
  generalProgram: {
    targetArea: 'General movement',
    exercises: [
      { category: 'Mobility', exercise: 'Gentle full-body mobility warm-up', guidance: 'Use controlled, pain-free movement before training.' },
      { category: 'Control', exercise: 'Bodyweight movement-quality drill', guidance: 'Use light effort and stop if pain or instability occurs.' },
    ],
  },
};

const normalizeRiskLevel = (riskLevel) => (
  RECOMMENDATION_CONFIG.riskLevels[riskLevel] ? riskLevel : 'Low'
);

const formatRationale = (joint) => {
  const details = [];
  if (joint.abnormalFrames) details.push(`non-neutral movement in ${joint.abnormalFrames} analyzed frames`);
  if (joint.persistent) details.push('a repeated movement pattern');
  if (joint.highVariation) details.push(`angle variation of ${joint.angleRange}°`);

  return details.length
    ? `Recommended because ${joint.label ?? joint.joint} showed ${details.join(' and ')}.`
    : 'Recommended to support general movement quality.';
};

const getPriorityJoints = (riskPrediction) => (riskPrediction?.contributingJoints ?? [])
  .filter((joint) => joint?.joint && RECOMMENDATION_CONFIG.jointPrograms[joint.joint])
  .slice(0, RECOMMENDATION_CONFIG.maximumPriorityAreas);

const buildRecommendations = (priorityJoints, priority) => {
  const programs = priorityJoints.length
    ? priorityJoints.map((joint) => ({ program: RECOMMENDATION_CONFIG.jointPrograms[joint.joint], joint }))
    : [{ program: RECOMMENDATION_CONFIG.generalProgram, joint: null }];

  return programs.flatMap(({ program, joint }) => program.exercises.map((exercise) => ({
    category: exercise.category,
    targetArea: program.targetArea,
    exercise: exercise.exercise,
    rationale: joint ? formatRationale(joint) : 'Recommended because no repeated non-neutral joint pattern was detected.',
    guidance: exercise.guidance,
    priority,
  })));
};

/**
 * Produces deterministic, non-diagnostic exercise guidance from the explainable
 * risk-prediction output. The input contract is intentionally model-agnostic.
 */
const generateExerciseRecommendations = (riskPrediction = {}) => {
  const riskLevel = normalizeRiskLevel(riskPrediction.riskLevel);
  const riskProfile = RECOMMENDATION_CONFIG.riskLevels[riskLevel];
  const priorityJoints = getPriorityJoints(riskPrediction);

  return {
    type: 'Explainable rule-based recommendations',
    version: RECOMMENDATION_CONFIG.version,
    riskLevel,
    riskScore: Number.isFinite(riskPrediction.riskScore) ? riskPrediction.riskScore : null,
    priorityAreas: priorityJoints.map((joint) => joint.label ?? joint.joint),
    recommendations: buildRecommendations(priorityJoints, riskProfile.priority),
    activityGuidance: riskProfile.activityGuidance,
    disclaimer: 'These recommendations support general training decisions and are not medical advice, diagnosis, or treatment. Stop any exercise that causes pain and consult a qualified professional when appropriate.',
    model: {
      inputContract: 'riskPrediction',
      futureMlCompatible: true,
    },
  };
};

export { RECOMMENDATION_CONFIG, generateExerciseRecommendations };
export default generateExerciseRecommendations;
