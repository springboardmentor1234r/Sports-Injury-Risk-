/**
 * Biomechanical analysis engine (Milestone 2).
 *
 * Takes a time series of 2D pose landmarks (one frame per sampled video
 * timestamp) and derives joint-angle metrics, a movement quality score, and
 * heuristic risk flags.
 *
 * Landmark indices follow MediaPipe's BlazePose 33-point topology
 * (https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker).
 *
 * Note on accuracy: angles are computed in the 2D image plane from a single
 * camera view. That's sufficient to flag gross asymmetries and movement
 * trends (which is what this milestone targets), but it is an approximation
 * — true frontal-plane knee valgus, for example, ideally needs a
 * front-facing camera and/or 3D landmarks, which is a reasonable
 * enhancement for a later milestone rather than this one.
 */

export type Landmark = { x: number; y: number; z?: number; visibility?: number };

export type PoseFrame = {
  /** Milliseconds from the start of the analyzed clip. */
  t: number;
  landmarks: Landmark[];
};

const LM = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
} as const;

const MIN_VISIBILITY = 0.5;

function visible(lm: Landmark | undefined): lm is Landmark {
  return !!lm && (lm.visibility === undefined || lm.visibility >= MIN_VISIBILITY);
}

/** Angle at point b, formed by rays b->a and b->c, in degrees [0, 180]. */
function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);
  if (magAB === 0 || magCB === 0) return NaN;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Angle of vector (from -> to) from vertical (0 = perfectly upright), in degrees. */
function angleFromVertical(from: Landmark, to: Landmark): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

/**
 * Frontal-plane knee alignment proxy: how far the knee deviates sideways
 * from the straight line between hip and ankle, as an angle. Larger values
 * suggest the knee is caving in/out relative to hip-ankle alignment — a
 * classic knee valgus/varus indicator, albeit a 2D approximation (see
 * module note above).
 */
/**
 * Frontal-plane knee projection angle (FPPA) — a standard, simplified 2D
 * screening measure for knee valgus/varus: how far the knee deviates
 * sideways from the straight hip–ankle line, expressed as an angle.
 * Positive = knee has drifted toward the body's midline (valgus-direction)
 * relative to a perfectly straight hip-knee-ankle column.
 *
 * Deliberately does NOT use the hip-knee-ankle interior angle — that angle
 * also changes with completely normal forward knee flexion (e.g. going
 * deeper into a squat), which would falsely read as "valgus" on every
 * flexed rep. FPPA isolates the sideways (frontal-plane) component instead.
 *
 * This assumes a roughly front-facing camera. Filmed from the side, this
 * number isn't meaningful — see the caveat surfaced in the UI.
 */
function kneeAlignmentDeviation(hip: Landmark, knee: Landmark, ankle: Landmark): number {
  const legLength = Math.hypot(ankle.x - hip.x, ankle.y - hip.y);
  if (legLength === 0) return 0;
  const t = (knee.y - hip.y) / (ankle.y - hip.y || 1e-6);
  const expectedKneeX = hip.x + (ankle.x - hip.x) * t;
  const lateralOffset = knee.x - expectedKneeX;
  return (Math.atan2(Math.abs(lateralOffset), legLength) * 180) / Math.PI;
}

export type FrameMetrics = {
  t: number;
  leftKnee: number | null;
  rightKnee: number | null;
  leftHip: number | null;
  rightHip: number | null;
  leftElbow: number | null;
  rightElbow: number | null;
  trunkLean: number | null;
  kneeValgusLeft: number | null;
  kneeValgusRight: number | null;
};

export function computeFrameMetrics(frame: PoseFrame): FrameMetrics {
  const p = frame.landmarks;
  const get = (i: number) => p[i];

  const lHip = get(LM.LEFT_HIP);
  const rHip = get(LM.RIGHT_HIP);
  const lKnee = get(LM.LEFT_KNEE);
  const rKnee = get(LM.RIGHT_KNEE);
  const lAnkle = get(LM.LEFT_ANKLE);
  const rAnkle = get(LM.RIGHT_ANKLE);
  const lShoulder = get(LM.LEFT_SHOULDER);
  const rShoulder = get(LM.RIGHT_SHOULDER);
  const lElbow = get(LM.LEFT_ELBOW);
  const rElbow = get(LM.RIGHT_ELBOW);
  const lWrist = get(LM.LEFT_WRIST);
  const rWrist = get(LM.RIGHT_WRIST);

  const leftKnee =
    visible(lHip) && visible(lKnee) && visible(lAnkle) ? angleAt(lHip, lKnee, lAnkle) : null;
  const rightKnee =
    visible(rHip) && visible(rKnee) && visible(rAnkle) ? angleAt(rHip, rKnee, rAnkle) : null;
  const leftHip =
    visible(lShoulder) && visible(lHip) && visible(lKnee) ? angleAt(lShoulder, lHip, lKnee) : null;
  const rightHip =
    visible(rShoulder) && visible(rHip) && visible(rKnee) ? angleAt(rShoulder, rHip, rKnee) : null;
  const leftElbow =
    visible(lShoulder) && visible(lElbow) && visible(lWrist)
      ? angleAt(lShoulder, lElbow, lWrist)
      : null;
  const rightElbow =
    visible(rShoulder) && visible(rElbow) && visible(rWrist)
      ? angleAt(rShoulder, rElbow, rWrist)
      : null;

  let trunkLean: number | null = null;
  if (visible(lShoulder) && visible(rShoulder) && visible(lHip) && visible(rHip)) {
    const midShoulder = { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 };
    const midHip = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };
    trunkLean = angleFromVertical(midHip, midShoulder);
  }

  const kneeValgusLeft =
    visible(lHip) && visible(lKnee) && visible(lAnkle)
      ? kneeAlignmentDeviation(lHip, lKnee, lAnkle)
      : null;
  const kneeValgusRight =
    visible(rHip) && visible(rKnee) && visible(rAnkle)
      ? kneeAlignmentDeviation(rHip, rKnee, rAnkle)
      : null;

  return {
    t: frame.t,
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    leftElbow,
    rightElbow,
    trunkLean,
    kneeValgusLeft,
    kneeValgusRight,
  };
}

type Stat = { min: number; max: number; avg: number; rom: number };

function stat(values: number[]): Stat {
  if (values.length === 0) return { min: 0, max: 0, avg: 0, rom: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, avg, rom: max - min };
}

function nums(series: FrameMetrics[], key: keyof Omit<FrameMetrics, "t">): number[] {
  return series.map((f) => f[key]).filter((v): v is number => v !== null && !Number.isNaN(v));
}

function pctDiff(a: number, b: number): number {
  const denom = Math.max(a, b);
  if (denom === 0) return 0;
  return (Math.abs(a - b) / denom) * 100;
}

export type Aggregates = {
  leftKnee: Stat;
  rightKnee: Stat;
  leftHip: Stat;
  rightHip: Stat;
  trunkLean: { max: number; avg: number };
  kneeValgus: { left: { max: number; avg: number }; right: { max: number; avg: number } };
  symmetry: { kneeRomDiffPct: number; hipRomDiffPct: number };
};

export type AnalysisResult = {
  frameCount: number;
  durationSeconds: number;
  timeSeries: FrameMetrics[];
  aggregates: Aggregates;
  movementQualityScore: number;
  riskFlags: string[];
};

const THRESHOLDS = {
  kneeValgusWarn: 12, // degrees of hip-knee-ankle deviation
  kneeValgusHigh: 20,
  trunkLeanWarn: 15, // degrees from vertical
  trunkLeanHigh: 25,
  symmetryWarnPct: 15, // % difference between left/right ROM
  symmetryHighPct: 25,
};

export function analyzeFrames(frames: PoseFrame[]): AnalysisResult {
  const timeSeries = frames.map(computeFrameMetrics);
  const durationSeconds =
    frames.length > 0 ? (frames[frames.length - 1].t - frames[0].t) / 1000 : 0;

  const leftKnee = stat(nums(timeSeries, "leftKnee"));
  const rightKnee = stat(nums(timeSeries, "rightKnee"));
  const leftHip = stat(nums(timeSeries, "leftHip"));
  const rightHip = stat(nums(timeSeries, "rightHip"));
  const trunkLeanVals = nums(timeSeries, "trunkLean");
  const valgusLeftVals = nums(timeSeries, "kneeValgusLeft");
  const valgusRightVals = nums(timeSeries, "kneeValgusRight");

  const aggregates: Aggregates = {
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    trunkLean: {
      max: trunkLeanVals.length ? Math.max(...trunkLeanVals) : 0,
      avg: trunkLeanVals.length
        ? trunkLeanVals.reduce((a, b) => a + b, 0) / trunkLeanVals.length
        : 0,
    },
    kneeValgus: {
      left: {
        max: valgusLeftVals.length ? Math.max(...valgusLeftVals) : 0,
        avg: valgusLeftVals.length
          ? valgusLeftVals.reduce((a, b) => a + b, 0) / valgusLeftVals.length
          : 0,
      },
      right: {
        max: valgusRightVals.length ? Math.max(...valgusRightVals) : 0,
        avg: valgusRightVals.length
          ? valgusRightVals.reduce((a, b) => a + b, 0) / valgusRightVals.length
          : 0,
      },
    },
    symmetry: {
      kneeRomDiffPct: pctDiff(leftKnee.rom, rightKnee.rom),
      hipRomDiffPct: pctDiff(leftHip.rom, rightHip.rom),
    },
  };

  const riskFlags = deriveRiskFlags(aggregates);
  const movementQualityScore = computeMovementQualityScore(aggregates, riskFlags);

  return {
    frameCount: frames.length,
    durationSeconds,
    timeSeries,
    aggregates,
    movementQualityScore,
    riskFlags,
  };
}

function deriveRiskFlags(agg: Aggregates): string[] {
  const flags: string[] = [];

  const maxValgus = Math.max(agg.kneeValgus.left.max, agg.kneeValgus.right.max);
  if (maxValgus >= THRESHOLDS.kneeValgusHigh) {
    flags.push(
      agg.kneeValgus.left.max > agg.kneeValgus.right.max
        ? "Marked knee valgus deviation (left)"
        : "Marked knee valgus deviation (right)",
    );
  } else if (maxValgus >= THRESHOLDS.kneeValgusWarn) {
    flags.push("Mild knee alignment deviation observed");
  }

  if (agg.trunkLean.max >= THRESHOLDS.trunkLeanHigh) {
    flags.push("Significant trunk lean during movement");
  } else if (agg.trunkLean.max >= THRESHOLDS.trunkLeanWarn) {
    flags.push("Moderate trunk lean observed");
  }

  const symmetryMax = Math.max(agg.symmetry.kneeRomDiffPct, agg.symmetry.hipRomDiffPct);
  if (symmetryMax >= THRESHOLDS.symmetryHighPct) {
    flags.push("Notable left/right movement asymmetry");
  } else if (symmetryMax >= THRESHOLDS.symmetryWarnPct) {
    flags.push("Mild left/right movement asymmetry");
  }

  return flags;
}

/**
 * 0–100 movement quality score. Starts at 100 and deducts for each
 * biomechanical concern, weighted by how far past threshold it is. This is
 * a transparent, rule-based quality score — distinct from a trained
 * injury-probability model (that's a Milestone 3 deliverable that would
 * train on historical injury outcomes).
 */
function computeMovementQualityScore(agg: Aggregates, flags: string[]): number {
  let score = 100;

  const maxValgus = Math.max(agg.kneeValgus.left.max, agg.kneeValgus.right.max);
  score -= clampDeduction(maxValgus, THRESHOLDS.kneeValgusWarn, THRESHOLDS.kneeValgusHigh, 25);

  score -= clampDeduction(
    agg.trunkLean.max,
    THRESHOLDS.trunkLeanWarn,
    THRESHOLDS.trunkLeanHigh,
    20,
  );

  const symmetryMax = Math.max(agg.symmetry.kneeRomDiffPct, agg.symmetry.hipRomDiffPct);
  score -= clampDeduction(symmetryMax, THRESHOLDS.symmetryWarnPct, THRESHOLDS.symmetryHighPct, 20);

  if (flags.length === 0) score = Math.max(score, 90);

  return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
}

function clampDeduction(
  value: number,
  warnAt: number,
  highAt: number,
  maxDeduction: number,
): number {
  if (value < warnAt) return 0;
  if (value >= highAt) return maxDeduction;
  const t = (value - warnAt) / (highAt - warnAt);
  return t * maxDeduction;
}
