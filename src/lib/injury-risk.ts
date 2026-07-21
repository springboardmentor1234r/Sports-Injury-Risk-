/**
 * Injury risk prediction & scoring engine (Milestone 3).
 *
 * Combines four inputs into a single 0-100 injury risk score, per the
 * weighted model from the project spec:
 *
 *   Injury Risk Score = Biomechanical Deviations (35%)
 *                      + Historical Injury Factors (20%)
 *                      + Movement Asymmetry (20%)
 *                      + Training Load Indicators (15%)
 *                      + Fatigue Indicators (10%)
 *
 * Like the Milestone 2 biomechanics engine, this is a transparent, rule-based
 * scoring model — not a trained ML classifier. A genuine injury-*probability*
 * model would need to learn from a labeled dataset of historical injury
 * outcomes (dates, mechanism, side, severity) tied back to prior movement
 * data; this app doesn't have that dataset yet (see FIFA Injury Dataset in
 * the project spec for a reference source). What's here is the same kind of
 * documented, threshold-based heuristic as `biomechanics.ts`, just composed
 * across more inputs — sports scientists/physiotherapists should treat the
 * output as a triage signal, not a diagnosis.
 *
 * Inputs come from:
 *  - `pose_analyses` rows (via `biomechanics.ts` aggregates) for the
 *    biomechanical-deviation and movement-asymmetry components, plus a
 *    trend across an athlete's analysis history for the fatigue component.
 *  - `athlete_profiles.training_load` for the training-load component.
 *  - `athlete_profiles.injury_history` / `current_medical_conditions`
 *    (free text) for the historical-factors component. These are presence
 *    heuristics, not a severity classifier — the app doesn't store
 *    structured, coded injury records (type/date/side/severity), so it
 *    can't respond confidently to "how bad." Adding that structure would be
 *    a natural follow-up if this needs to get more precise.
 */

import type { Aggregates } from "./biomechanics";

export type TrainingLoad = "low" | "moderate" | "high" | "very_high" | null | undefined;

export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type InjuryCategory =
  "acl" | "hamstring" | "ankle_sprain" | "shoulder" | "lower_back" | "overuse";

export const CATEGORY_LABELS: Record<InjuryCategory, string> = {
  acl: "ACL injury risk",
  hamstring: "Hamstring injury risk",
  ankle_sprain: "Ankle sprain risk",
  shoulder: "Shoulder injury risk",
  lower_back: "Lower back injury risk",
  overuse: "Overuse injury risk",
};

export type CategoryRisk = {
  category: InjuryCategory;
  label: string;
  score: number;
  level: RiskLevel;
};

/** A single video's worth of computed biomechanics, as stored in `pose_analyses`. */
export type AnalysisSnapshot = {
  createdAt: string;
  movementQualityScore: number;
  riskFlags: string[];
  aggregates: Aggregates | null;
};

export type AthleteFactors = {
  trainingLoad: TrainingLoad;
  injuryHistory: string | null | undefined;
  currentMedicalConditions: string | null | undefined;
};

export type RiskComponents = {
  biomechanicalDeviation: number;
  historicalInjuryFactors: number;
  movementAsymmetry: number;
  trainingLoadIndicators: number;
  fatigueIndicators: number;
};

export type InjuryRiskProfile = {
  overallScore: number;
  riskLevel: RiskLevel;
  components: RiskComponents;
  categoryRisks: CategoryRisk[];
  recommendations: string[];
  dataQuality: {
    hasBiomechanicalData: boolean;
    analysisCount: number;
    hasProfileData: boolean;
  };
};

export const WEIGHTS = {
  biomechanicalDeviation: 0.35,
  historicalInjuryFactors: 0.2,
  movementAsymmetry: 0.2,
  trainingLoadIndicators: 0.15,
  fatigueIndicators: 0.1,
} as const;

// Same thresholds biomechanics.ts uses to flag concerns, reused here so the
// risk score and the risk flags stay consistent with each other.
const THRESHOLDS = {
  kneeValgusWarn: 12,
  kneeValgusHigh: 20,
  trunkLeanWarn: 15,
  trunkLeanHigh: 25,
  symmetryWarnPct: 15,
  symmetryHighPct: 25,
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
  critical: "Critical risk",
};

/** Maps a raw value onto 0-100, ramping to 40 at `warnAt` and 100 at `highAt`. */
function scaleTo100(value: number, warnAt: number, highAt: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= highAt) return 100;
  if (value <= warnAt) return (value / warnAt) * 40;
  const t = (value - warnAt) / (highAt - warnAt);
  return 40 + t * 60;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function trainingLoadScore(load: TrainingLoad): number {
  switch (load) {
    case "low":
      return 15;
    case "moderate":
      return 40;
    case "high":
      return 70;
    case "very_high":
      return 92;
    default:
      return 35; // unrecorded — treat as mild/unknown rather than 0
  }
}

function hasText(v: string | null | undefined): boolean {
  return !!v && v.trim().length > 0;
}

/**
 * Presence-based heuristic: whether the athlete has *any* recorded injury
 * history or ongoing medical condition. Not a severity score — see module
 * doc comment.
 */
function historicalFactorScore(factors: AthleteFactors): number {
  let score = 0;
  if (hasText(factors.injuryHistory)) score += 55;
  if (hasText(factors.currentMedicalConditions)) score += 30;
  return Math.min(100, score);
}

function biomechanicalDeviationScore(agg: Aggregates | null): number {
  if (!agg) return 0;
  const valgus = Math.max(agg.kneeValgus.left.max, agg.kneeValgus.right.max);
  const valgusScore = scaleTo100(valgus, THRESHOLDS.kneeValgusWarn, THRESHOLDS.kneeValgusHigh);
  const trunkScore = scaleTo100(
    agg.trunkLean.max,
    THRESHOLDS.trunkLeanWarn,
    THRESHOLDS.trunkLeanHigh,
  );
  return Math.round(
    Math.max(valgusScore, trunkScore) * 0.6 + Math.min(valgusScore, trunkScore) * 0.4,
  );
}

function movementAsymmetryScore(agg: Aggregates | null): number {
  if (!agg) return 0;
  const sym = Math.max(agg.symmetry.kneeRomDiffPct, agg.symmetry.hipRomDiffPct);
  return Math.round(scaleTo100(sym, THRESHOLDS.symmetryWarnPct, THRESHOLDS.symmetryHighPct));
}

/**
 * Fatigue-related movement monitoring: with fewer than two analyses there's
 * no trend to observe, so this falls back to a training-load-only baseline.
 * With two or more, it compares the athlete's earlier movement-quality
 * scores against their most recent ones — a declining trend (quality
 * dropping over successive sessions) is the fatigue signal, blended with a
 * smaller training-load contribution (harder training blocks make fatigue
 * accumulate faster for the same decline).
 */
function fatigueScore(sortedAnalyses: AnalysisSnapshot[], load: TrainingLoad): number {
  const loadBaseline = trainingLoadScore(load) * 0.3;

  if (sortedAnalyses.length < 2) {
    const noTrendBaseline = load === "high" || load === "very_high" ? 45 : 25;
    return Math.round(noTrendBaseline);
  }

  const half = Math.max(1, Math.floor(sortedAnalyses.length / 2));
  const earlier = avg(sortedAnalyses.slice(0, half).map((a) => a.movementQualityScore));
  const recent = avg(sortedAnalyses.slice(-half).map((a) => a.movementQualityScore));
  const decline = Math.max(0, earlier - recent);
  const trendScore = scaleTo100(decline, 5, 20);

  return Math.round(Math.min(100, trendScore * 0.7 + loadBaseline));
}

/**
 * Per-category injury risk. ACL, hamstring, ankle-sprain, and lower-back
 * draw on metrics this app actually measures (frontal-plane knee alignment,
 * trunk lean, left/right asymmetry). Shoulder and overuse lean mostly on
 * training-load / history / fatigue, since Milestone 2's pose-estimation
 * engine targets lower-body and trunk landmarks and doesn't compute
 * elbow/shoulder joint-angle aggregates — extending it to throwing-motion
 * metrics would sharpen the shoulder estimate in a later milestone.
 */
function computeCategoryRisks(agg: Aggregates | null, components: RiskComponents): CategoryRisk[] {
  const valgus = agg ? Math.max(agg.kneeValgus.left.max, agg.kneeValgus.right.max) : 0;
  const valgusScore = scaleTo100(valgus, THRESHOLDS.kneeValgusWarn, THRESHOLDS.kneeValgusHigh);
  const trunkScore = agg
    ? scaleTo100(agg.trunkLean.max, THRESHOLDS.trunkLeanWarn, THRESHOLDS.trunkLeanHigh)
    : 0;
  const asymmetryScore = components.movementAsymmetry;
  const trainingScore = components.trainingLoadIndicators;
  const historyScore = components.historicalInjuryFactors;
  const fatigueVal = components.fatigueIndicators;

  const raw: { category: InjuryCategory; score: number }[] = [
    { category: "acl", score: valgusScore * 0.65 + asymmetryScore * 0.35 },
    {
      category: "hamstring",
      score: asymmetryScore * 0.55 + trainingScore * 0.25 + fatigueVal * 0.2,
    },
    { category: "ankle_sprain", score: valgusScore * 0.5 + asymmetryScore * 0.5 },
    { category: "shoulder", score: trainingScore * 0.4 + historyScore * 0.35 + fatigueVal * 0.25 },
    { category: "lower_back", score: trunkScore * 0.6 + trainingScore * 0.4 },
    { category: "overuse", score: trainingScore * 0.5 + fatigueVal * 0.3 + historyScore * 0.2 },
  ];

  return raw.map((c) => {
    const score = Math.round(Math.min(100, Math.max(0, c.score)));
    return {
      category: c.category,
      label: CATEGORY_LABELS[c.category],
      score,
      level: riskLevelFromScore(score),
    };
  });
}

function buildRecommendations(components: RiskComponents, categoryRisks: CategoryRisk[]): string[] {
  const recs: string[] = [];

  if (components.biomechanicalDeviation >= 50) {
    recs.push(
      "Prioritize landing/squat mechanics coaching — focus on knee alignment and a controlled trunk position during deceleration.",
    );
  }
  if (components.movementAsymmetry >= 50) {
    recs.push(
      "Add unilateral strength and mobility work to correct left/right imbalance (single-leg squats, step-ups, lateral band walks).",
    );
  }
  if (components.trainingLoadIndicators >= 60) {
    recs.push(
      "Review training load — consider a deload week or reduced volume to lower cumulative strain.",
    );
  }
  if (components.fatigueIndicators >= 55) {
    recs.push(
      "Movement quality is trending down across recent sessions — prioritize recovery (sleep, mobility, reduced intensity) before the next hard session.",
    );
  }
  if (components.historicalInjuryFactors >= 50) {
    recs.push(
      "Flag for physiotherapist review given recorded injury history or medical conditions before increasing load.",
    );
  }

  const topCategory = [...categoryRisks].sort((a, b) => b.score - a.score)[0];
  if (topCategory && topCategory.score >= 50) {
    recs.push(
      `Highest projected concern is ${topCategory.label.toLowerCase()} — build sport-specific prevention work for this pattern into the training plan.`,
    );
  }

  if (recs.length === 0) {
    recs.push(
      "No elevated risk factors detected — maintain the current training and monitoring routine.",
    );
  }

  return recs.slice(0, 5);
}

/**
 * Computes an athlete's overall injury risk profile from their analysis
 * history (any order) and profile factors.
 */
export function computeInjuryRiskProfile(
  analyses: AnalysisSnapshot[],
  factors: AthleteFactors,
): InjuryRiskProfile {
  const sorted = [...analyses].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const agg = latest?.aggregates ?? null;

  const components: RiskComponents = {
    biomechanicalDeviation: biomechanicalDeviationScore(agg),
    historicalInjuryFactors: historicalFactorScore(factors),
    movementAsymmetry: movementAsymmetryScore(agg),
    trainingLoadIndicators: trainingLoadScore(factors.trainingLoad),
    fatigueIndicators: fatigueScore(sorted, factors.trainingLoad),
  };

  const overallScore = Math.round(
    components.biomechanicalDeviation * WEIGHTS.biomechanicalDeviation +
      components.historicalInjuryFactors * WEIGHTS.historicalInjuryFactors +
      components.movementAsymmetry * WEIGHTS.movementAsymmetry +
      components.trainingLoadIndicators * WEIGHTS.trainingLoadIndicators +
      components.fatigueIndicators * WEIGHTS.fatigueIndicators,
  );

  const categoryRisks = computeCategoryRisks(agg, components);
  const recommendations = buildRecommendations(components, categoryRisks);

  return {
    overallScore,
    riskLevel: riskLevelFromScore(overallScore),
    components,
    categoryRisks,
    recommendations,
    dataQuality: {
      hasBiomechanicalData: !!agg,
      analysisCount: sorted.length,
      hasProfileData: !!(
        factors.trainingLoad ||
        hasText(factors.injuryHistory) ||
        hasText(factors.currentMedicalConditions)
      ),
    },
  };
}
