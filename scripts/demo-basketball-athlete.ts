import { computeInjuryRiskProfile, type AnalysisSnapshot } from "../src/lib/injury-risk";
import type { Aggregates } from "../src/lib/biomechanics";

// A sample male basketball athlete, built around what basketball actually
// stresses: repeated jump-landing (knee valgus, ACL risk), hard
// cuts/direction changes (asymmetry, ankle risk), and a prior ankle sprain.
const athlete = {
  full_name: "Jordan Mitchell",
  sport_type: "Basketball",
  position: "Shooting Guard",
  gender: "male",
  age: 24,
  height_cm: 196,
  weight_kg: 88,
  dominant_side: "right",
  training_load: "high" as const,
  training_experience: "advanced",
  team_club: "Riverside Hawks",
  injury_history: "Grade 2 right ankle sprain, March 2025 — fully rehabbed, cleared to play. History of patellar tendinopathy, load-managed.",
  current_medical_conditions: "",
};

function agg(kneeValgusMax: number, trunkLeanMax: number, symPct: number): Aggregates {
  return {
    leftKnee: { min: 20, max: 95, avg: 60, rom: 75 },
    rightKnee: { min: 18, max: 100, avg: 62, rom: 82 },
    leftHip: { min: 10, max: 70, avg: 40, rom: 60 },
    rightHip: { min: 8, max: 74, avg: 42, rom: 66 },
    trunkLean: { max: trunkLeanMax, avg: trunkLeanMax * 0.6 },
    kneeValgus: {
      left: { max: kneeValgusMax * 0.8, avg: kneeValgusMax * 0.5 },
      right: { max: kneeValgusMax, avg: kneeValgusMax * 0.6 },
    },
    symmetry: { kneeRomDiffPct: symPct, hipRomDiffPct: symPct * 0.7 },
  };
}

// Three jump-landing / cutting drill videos over three weeks — movement
// quality trending down a little as the training block gets harder
// (fatigue signal), with a persistent right-side knee valgus and
// left/right asymmetry consistent with the old ankle sprain.
const analyses: AnalysisSnapshot[] = [
  {
    createdAt: "2026-06-29T10:00:00Z",
    movementQualityScore: 82,
    riskFlags: ["Elevated right knee valgus on landing"],
    aggregates: agg(14, 12, 16),
  },
  {
    createdAt: "2026-07-08T10:00:00Z",
    movementQualityScore: 76,
    riskFlags: ["Elevated right knee valgus on landing", "Knee ROM asymmetry"],
    aggregates: agg(17, 14, 20),
  },
  {
    createdAt: "2026-07-18T10:00:00Z",
    movementQualityScore: 68,
    riskFlags: ["Elevated right knee valgus on landing", "Knee ROM asymmetry", "Trunk lean on deceleration"],
    aggregates: agg(19, 17, 23),
  },
];

const profile = computeInjuryRiskProfile(analyses, {
  trainingLoad: athlete.training_load,
  injuryHistory: athlete.injury_history,
  currentMedicalConditions: athlete.current_medical_conditions,
});

console.log("=== Athlete ===");
console.log(athlete);
console.log("\n=== Injury Risk Profile ===");
console.log(`Overall score: ${profile.overallScore} / 100  ->  ${profile.riskLevel.toUpperCase()}`);
console.log("\nWeighted components:");
for (const [k, v] of Object.entries(profile.components)) console.log(`  ${k}: ${v}`);
console.log("\nCategory risks:");
for (const c of profile.categoryRisks) console.log(`  ${c.label}: ${c.score} (${c.level})`);
console.log("\nRecommendations:");
profile.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
