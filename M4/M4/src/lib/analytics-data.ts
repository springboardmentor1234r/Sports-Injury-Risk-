import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Aggregates } from "@/lib/biomechanics";
import {
  computeInjuryRiskProfile,
  riskLevelFromScore,
  type AnalysisSnapshot,
  type InjuryRiskProfile,
  type RiskLevel,
} from "@/lib/injury-risk";

export type AthleteRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  sport_type: string;
  position: string | null;
  training_load: "low" | "moderate" | "high" | "very_high" | null;
  injury_history: string | null;
  current_medical_conditions: string | null;
  created_at: string;
};

export type AnalysisRow = {
  id: string;
  athlete_user_id: string;
  movement_quality_score: number;
  risk_flags: string[];
  created_at: string;
  joint_metrics: { aggregates?: Aggregates } | null;
};

export type SubmissionRow = {
  id: string;
  athlete_user_id: string;
  title: string;
  status: string;
  created_at: string;
};

export type AthleteRisk = {
  athlete: AthleteRow;
  profile: InjuryRiskProfile;
  analyses: AnalysisSnapshot[];
  latestAnalysisAt: string | null;
  averageQuality: number | null;
};

export const RISK_LEVELS: RiskLevel[] = ["critical", "high", "moderate", "low"];

export const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "var(--success)",
  moderate: "var(--warning)",
  high: "var(--chart-5)",
  critical: "var(--destructive)",
};

function toSnapshot(a: AnalysisRow): AnalysisSnapshot {
  return {
    createdAt: a.created_at,
    movementQualityScore: Number(a.movement_quality_score),
    riskFlags: a.risk_flags ?? [],
    aggregates: a.joint_metrics?.aggregates ?? null,
  };
}

/** Combines athlete profiles with their analysis history into scored rows. */
export function buildAthleteRisks(athletes: AthleteRow[], analyses: AnalysisRow[]): AthleteRisk[] {
  const byAthlete = new Map<string, AnalysisSnapshot[]>();
  for (const a of analyses) {
    const list = byAthlete.get(a.athlete_user_id) ?? [];
    list.push(toSnapshot(a));
    byAthlete.set(a.athlete_user_id, list);
  }

  return athletes.map((athlete) => {
    const snapshots = ((athlete.user_id && byAthlete.get(athlete.user_id)) || []).sort(
      (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime(),
    );
    const profile = computeInjuryRiskProfile(snapshots, {
      trainingLoad: athlete.training_load,
      injuryHistory: athlete.injury_history,
      currentMedicalConditions: athlete.current_medical_conditions,
    });
    const averageQuality =
      snapshots.length > 0
        ? Math.round(snapshots.reduce((s, x) => s + x.movementQualityScore, 0) / snapshots.length)
        : null;
    return {
      athlete,
      profile,
      analyses: snapshots,
      latestAnalysisAt: snapshots.length > 0 ? snapshots[snapshots.length - 1]!.createdAt : null,
      averageQuality,
    };
  });
}

export function riskDistribution(rows: AthleteRisk[]): Record<RiskLevel, number> {
  return rows.reduce(
    (acc, r) => {
      acc[r.profile.riskLevel] += 1;
      return acc;
    },
    { low: 0, moderate: 0, high: 0, critical: 0 } as Record<RiskLevel, number>,
  );
}

/** Monthly average risk score + movement quality across all supplied analyses. */
export function monthlyTrend(rows: AthleteRisk[]) {
  const buckets = new Map<string, { quality: number[]; count: number }>();
  for (const row of rows) {
    for (const a of row.analyses) {
      const d = new Date(a.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(key) ?? { quality: [], count: 0 };
      b.quality.push(a.movementQualityScore);
      b.count += 1;
      buckets.set(key, b);
    }
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, b]) => {
      const quality = Math.round(b.quality.reduce((s, x) => s + x, 0) / b.quality.length);
      return {
        month,
        label: new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        quality,
        risk: Math.max(0, 100 - quality),
        level: riskLevelFromScore(Math.max(0, 100 - quality)),
        analyses: b.count,
      };
    });
}

/** Per-athlete analysis trend for personal dashboards. */
export function personalTrend(analyses: AnalysisSnapshot[]) {
  return analyses.map((a, i) => ({
    label: new Date(a.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    index: i + 1,
    quality: Math.round(a.movementQualityScore),
    flags: a.riskFlags.length,
  }));
}

export function useAnalyticsData() {
  return useQuery({
    queryKey: ["analytics-data"],
    queryFn: async () => {
      const [athletesRes, analysesRes, submissionsRes] = await Promise.all([
        supabase
          .from("athlete_profiles")
          .select(
            "id, user_id, full_name, sport_type, position, training_load, injury_history, current_medical_conditions, created_at",
          )
          .order("full_name"),
        supabase
          .from("pose_analyses")
          .select(
            "id, athlete_user_id, movement_quality_score, risk_flags, created_at, joint_metrics",
          ),
        supabase
          .from("video_submissions")
          .select("id, athlete_user_id, title, status, created_at")
          .order("created_at", { ascending: false }),
      ]);
      if (athletesRes.error) throw athletesRes.error;
      if (analysesRes.error) throw analysesRes.error;
      if (submissionsRes.error) throw submissionsRes.error;

      const athletes = (athletesRes.data ?? []) as AthleteRow[];
      const analyses = (analysesRes.data ?? []) as unknown as AnalysisRow[];
      const submissions = (submissionsRes.data ?? []) as SubmissionRow[];

      return { athletes, analyses, submissions, rows: buildAthleteRisks(athletes, analyses) };
    },
  });
}
