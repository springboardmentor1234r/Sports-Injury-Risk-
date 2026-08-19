import { describe, expect, it } from "vitest";
import {
  buildAthleteRisks,
  monthlyTrend,
  personalTrend,
  riskDistribution,
  type AnalysisRow,
  type AthleteRow,
} from "../analytics-data";

const athlete: AthleteRow = {
  id: "a1",
  user_id: "u1",
  full_name: "Test Athlete",
  sport_type: "Football",
  position: "Winger",
  training_load: "high",
  injury_history: null,
  current_medical_conditions: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

const analysis = (createdAt: string, quality: number): AnalysisRow => ({
  id: `an-${createdAt}`,
  athlete_user_id: "u1",
  movement_quality_score: quality,
  risk_flags: [],
  created_at: createdAt,
  joint_metrics: null,
});

describe("buildAthleteRisks", () => {
  it("attaches analyses to the right athlete and averages quality", () => {
    const rows = buildAthleteRisks(
      [athlete],
      [analysis("2026-01-10T00:00:00.000Z", 80), analysis("2026-02-10T00:00:00.000Z", 60)],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.analyses).toHaveLength(2);
    expect(rows[0]!.averageQuality).toBe(70);
    expect(rows[0]!.latestAnalysisAt).toBe("2026-02-10T00:00:00.000Z");
  });

  it("still scores athletes with no analyses", () => {
    const rows = buildAthleteRisks([athlete], []);
    expect(rows[0]!.averageQuality).toBeNull();
    expect(rows[0]!.profile.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("ignores analyses belonging to other athletes", () => {
    const rows = buildAthleteRisks(
      [athlete],
      [{ ...analysis("2026-01-10T00:00:00.000Z", 90), athlete_user_id: "someone-else" }],
    );
    expect(rows[0]!.analyses).toHaveLength(0);
  });
});

describe("riskDistribution", () => {
  it("counts every athlete exactly once", () => {
    const rows = buildAthleteRisks([athlete, { ...athlete, id: "a2", user_id: "u2" }], []);
    const dist = riskDistribution(rows);
    const total = dist.low + dist.moderate + dist.high + dist.critical;
    expect(total).toBe(2);
  });
});

describe("trends", () => {
  it("buckets analyses by month in chronological order", () => {
    const rows = buildAthleteRisks(
      [athlete],
      [
        analysis("2026-02-10T00:00:00.000Z", 60),
        analysis("2026-01-10T00:00:00.000Z", 80),
        analysis("2026-01-20T00:00:00.000Z", 70),
      ],
    );
    const trend = monthlyTrend(rows);
    expect(trend.map((t) => t.month)).toEqual(["2026-01", "2026-02"]);
    expect(trend[0]!.quality).toBe(75);
    expect(trend[0]!.analyses).toBe(2);
    expect(trend[1]!.risk).toBe(40);
  });

  it("returns one personal trend point per analysis", () => {
    const rows = buildAthleteRisks(
      [athlete],
      [analysis("2026-01-10T00:00:00.000Z", 80), analysis("2026-02-10T00:00:00.000Z", 60)],
    );
    const points = personalTrend(rows[0]!.analyses);
    expect(points).toHaveLength(2);
    expect(points[0]!.quality).toBe(80);
    expect(points[1]!.index).toBe(2);
  });
});
