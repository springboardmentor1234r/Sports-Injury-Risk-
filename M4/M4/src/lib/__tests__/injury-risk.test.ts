import { describe, expect, it } from "vitest";
import {
  WEIGHTS,
  computeInjuryRiskProfile,
  riskLevelFromScore,
  type AnalysisSnapshot,
} from "../injury-risk";
import type { Aggregates } from "../biomechanics";

const cleanAggregates: Aggregates = {
  leftKnee: { min: 60, max: 160, avg: 110, rom: 100 },
  rightKnee: { min: 60, max: 160, avg: 110, rom: 100 },
  leftHip: { min: 70, max: 170, avg: 120, rom: 100 },
  rightHip: { min: 70, max: 170, avg: 120, rom: 100 },
  trunkLean: { max: 5, avg: 3 },
  kneeValgus: { left: { max: 3, avg: 2 }, right: { max: 3, avg: 2 } },
  symmetry: { kneeRomDiffPct: 1, hipRomDiffPct: 1 },
};

const riskyAggregates: Aggregates = {
  leftKnee: { min: 40, max: 140, avg: 90, rom: 100 },
  rightKnee: { min: 40, max: 105, avg: 75, rom: 65 },
  leftHip: { min: 50, max: 150, avg: 100, rom: 100 },
  rightHip: { min: 50, max: 120, avg: 85, rom: 70 },
  trunkLean: { max: 30, avg: 22 },
  kneeValgus: { left: { max: 25, avg: 18 }, right: { max: 22, avg: 16 } },
  symmetry: { kneeRomDiffPct: 35, hipRomDiffPct: 30 },
};

function snapshot(over: Partial<AnalysisSnapshot> = {}): AnalysisSnapshot {
  return {
    createdAt: "2026-01-01T00:00:00.000Z",
    movementQualityScore: 85,
    riskFlags: [],
    aggregates: cleanAggregates,
    ...over,
  };
}

describe("riskLevelFromScore", () => {
  it("maps scores onto the documented bands", () => {
    expect(riskLevelFromScore(0)).toBe("low");
    expect(riskLevelFromScore(24)).toBe("low");
    expect(riskLevelFromScore(25)).toBe("moderate");
    expect(riskLevelFromScore(49)).toBe("moderate");
    expect(riskLevelFromScore(50)).toBe("high");
    expect(riskLevelFromScore(74)).toBe("high");
    expect(riskLevelFromScore(75)).toBe("critical");
    expect(riskLevelFromScore(100)).toBe("critical");
  });
});

describe("weighting model", () => {
  it("uses the agreed factor weights that sum to 1", () => {
    expect(WEIGHTS.biomechanicalDeviation).toBe(0.35);
    expect(WEIGHTS.historicalInjuryFactors).toBe(0.2);
    expect(WEIGHTS.movementAsymmetry).toBe(0.2);
    expect(WEIGHTS.trainingLoadIndicators).toBe(0.15);
    expect(WEIGHTS.fatigueIndicators).toBe(0.1);
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(Number(total.toFixed(5))).toBe(1);
  });
});

describe("computeInjuryRiskProfile", () => {
  const noFactors = {
    trainingLoad: null,
    injuryHistory: null,
    currentMedicalConditions: null,
  } as const;

  it("returns a low score with clean mechanics and no history", () => {
    const profile = computeInjuryRiskProfile([snapshot()], noFactors);
    expect(profile.overallScore).toBeLessThan(25);
    expect(profile.riskLevel).toBe("low");
    expect(profile.dataQuality.hasBiomechanicalData).toBe(true);
    expect(profile.dataQuality.analysisCount).toBe(1);
  });

  it("scores poor mechanics far higher than clean mechanics", () => {
    const clean = computeInjuryRiskProfile([snapshot()], noFactors);
    const risky = computeInjuryRiskProfile(
      [snapshot({ aggregates: riskyAggregates, movementQualityScore: 45 })],
      noFactors,
    );
    expect(risky.overallScore).toBeGreaterThan(clean.overallScore);
    expect(risky.components.biomechanicalDeviation).toBeGreaterThan(
      clean.components.biomechanicalDeviation,
    );
    expect(risky.components.movementAsymmetry).toBeGreaterThan(clean.components.movementAsymmetry);
  });

  it("raises the training-load component as load increases", () => {
    const low = computeInjuryRiskProfile([snapshot()], { ...noFactors, trainingLoad: "low" });
    const veryHigh = computeInjuryRiskProfile([snapshot()], {
      ...noFactors,
      trainingLoad: "very_high",
    });
    expect(veryHigh.components.trainingLoadIndicators).toBeGreaterThan(
      low.components.trainingLoadIndicators,
    );
  });

  it("accounts for injury history and medical conditions", () => {
    const withHistory = computeInjuryRiskProfile([snapshot()], {
      ...noFactors,
      injuryHistory: "ACL reconstruction, right knee, 2024",
      currentMedicalConditions: "Patellar tendinopathy",
    });
    expect(withHistory.components.historicalInjuryFactors).toBeGreaterThan(0);
    expect(withHistory.dataQuality.hasProfileData).toBe(true);
  });

  it("degrades gracefully with no analyses at all", () => {
    const profile = computeInjuryRiskProfile([], noFactors);
    expect(profile.dataQuality.hasBiomechanicalData).toBe(false);
    expect(profile.overallScore).toBeGreaterThanOrEqual(0);
    expect(profile.overallScore).toBeLessThanOrEqual(100);
    expect(profile.recommendations.length).toBeGreaterThan(0);
  });

  it("always produces bounded scores and category risks", () => {
    const profile = computeInjuryRiskProfile(
      [snapshot({ aggregates: riskyAggregates, movementQualityScore: 30 })],
      { trainingLoad: "very_high", injuryHistory: "Hamstring tear", currentMedicalConditions: "" },
    );
    expect(profile.overallScore).toBeGreaterThanOrEqual(0);
    expect(profile.overallScore).toBeLessThanOrEqual(100);
    expect(profile.categoryRisks.length).toBeGreaterThan(0);
    for (const c of profile.categoryRisks) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
      expect(c.level).toBe(riskLevelFromScore(c.score));
    }
    expect(profile.recommendations.length).toBeLessThanOrEqual(5);
  });
});
