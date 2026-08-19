import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { riskLevelFromScore, type RiskLevel } from "@/lib/injury-risk";
import type { TrainingLoad } from "@/lib/injury-risk";

export type AlertRow = {
  id: string;
  athlete_user_id: string;
  video_submission_id: string | null;
  severity: RiskLevel;
  category: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AlertCategory = "risk" | "training_load" | "recovery" | "assessment_complete";

export type NotificationPreferences = {
  risk_alerts: boolean;
  training_load: boolean;
  recovery_reminders: boolean;
  assessment_complete: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  risk_alerts: true,
  training_load: true,
  recovery_reminders: true,
  assessment_complete: true,
};

const PREFERENCE_KEY_BY_CATEGORY: Record<AlertCategory, keyof NotificationPreferences> = {
  risk: "risk_alerts",
  training_load: "training_load",
  recovery: "recovery_reminders",
  assessment_complete: "assessment_complete",
};

/**
 * Reads the target athlete's notification preferences. High/critical risk
 * alerts always fire regardless of preference — this is only consulted for
 * the lower-stakes categories (training load, recovery, assessment-complete)
 * so a user can quiet those without missing something that actually matters.
 */
async function isCategoryEnabled(
  athleteUserId: string,
  category: AlertCategory,
  opts?: { alwaysOn?: boolean },
): Promise<boolean> {
  if (opts?.alwaysOn) return true;
  const { data, error } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", athleteUserId)
    .maybeSingle();
  if (error || !data) return true; // fail open: don't silently swallow real alerts on a read error
  const prefs = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(data.notification_preferences as Partial<NotificationPreferences> | null),
  };
  return prefs[PREFERENCE_KEY_BY_CATEGORY[category]] ?? true;
}

/**
 * Avoids re-raising the same reminder every time a dashboard mounts: skips
 * insert if an unread alert in this category for this athlete was already
 * created within `withinHours`.
 */
async function recentlyRaised(
  athleteUserId: string,
  category: AlertCategory,
  withinHours: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("alerts")
    .select("id")
    .eq("athlete_user_id", athleteUserId)
    .eq("category", category)
    .gte("created_at", since)
    .limit(1);
  if (error) return true; // fail closed here: better a missed duplicate-check than a spam loop
  return (data ?? []).length > 0;
}

export const ALERT_QUERY_KEY = ["alerts"] as const;

export function useAlerts(enabled = true) {
  return useQuery({
    queryKey: ALERT_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select(
          "id, athlete_user_id, video_submission_id, severity, category, title, message, is_read, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as AlertRow[];
    },
  });
}

/**
 * Raises an alert when an analysis crosses the high-risk threshold.
 * Safe to call after every analysis — it no-ops below the threshold.
 */
export async function raiseRiskAlert(params: {
  athleteUserId: string;
  athleteName: string;
  videoSubmissionId?: string | null;
  movementQualityScore: number;
  riskFlags: string[];
  createdBy?: string | null;
}) {
  const riskScore = Math.max(0, Math.round(100 - params.movementQualityScore));
  const severity = riskLevelFromScore(riskScore);
  if (severity !== "high" && severity !== "critical") return null;

  const { error } = await supabase.from("alerts").insert({
    athlete_user_id: params.athleteUserId,
    video_submission_id: params.videoSubmissionId ?? null,
    severity,
    category: "risk",
    title: `${severity === "critical" ? "Critical" : "High"} injury risk — ${params.athleteName}`,
    message:
      params.riskFlags.length > 0
        ? `Movement quality ${Math.round(params.movementQualityScore)}/100. Flags: ${params.riskFlags.join("; ")}.`
        : `Movement quality ${Math.round(params.movementQualityScore)}/100 indicates elevated injury risk.`,
    created_by: params.createdBy ?? null,
  });
  if (error) throw error;
  return severity;
}

/**
 * Assessment-completion alert (spec: "Assessment completion alerts").
 * Notifies the athlete their submitted video has been analyzed, separate
 * from — and always alongside, when applicable — the risk alert above.
 */
export async function raiseAssessmentCompleteAlert(params: {
  athleteUserId: string;
  videoTitle: string;
  videoSubmissionId?: string | null;
  movementQualityScore: number;
  createdBy?: string | null;
}) {
  if (!(await isCategoryEnabled(params.athleteUserId, "assessment_complete"))) return null;

  const { error } = await supabase.from("alerts").insert({
    athlete_user_id: params.athleteUserId,
    video_submission_id: params.videoSubmissionId ?? null,
    severity: "low",
    category: "assessment_complete",
    title: `Analysis ready — "${params.videoTitle}"`,
    message: `Your movement quality score is ${Math.round(params.movementQualityScore)}/100. View the full breakdown in your dashboard.`,
    created_by: params.createdBy ?? null,
  });
  if (error) throw error;
  return true;
}

/**
 * Training-load warning (spec: "Training load warnings").
 * Raised when staff set an athlete's training load to high/very_high.
 * Dedupes against the last 24h so repeated edits to the same value don't
 * spam the athlete's alert feed.
 */
export async function raiseTrainingLoadAlert(params: {
  athleteUserId: string;
  athleteName: string;
  trainingLoad: TrainingLoad;
  createdBy?: string | null;
}) {
  if (params.trainingLoad !== "high" && params.trainingLoad !== "very_high") return null;
  if (!(await isCategoryEnabled(params.athleteUserId, "training_load"))) return null;
  if (await recentlyRaised(params.athleteUserId, "training_load", 24)) return null;

  const severity: RiskLevel = params.trainingLoad === "very_high" ? "high" : "moderate";
  const { error } = await supabase.from("alerts").insert({
    athlete_user_id: params.athleteUserId,
    severity,
    category: "training_load",
    title: `Training load: ${params.trainingLoad.replace("_", " ")} — ${params.athleteName}`,
    message:
      params.trainingLoad === "very_high"
        ? "Training load is set to very high. Combined with biomechanical or fatigue flags, this meaningfully raises injury risk — consider a load review."
        : "Training load is set to high. Worth monitoring alongside recovery and movement-quality trends.",
    created_by: params.createdBy ?? null,
  });
  if (error) throw error;
  return severity;
}

/**
 * Recovery reminder (spec: "Recovery reminders").
 * Raised for an athlete who hasn't had a video analyzed in `staleDays` and
 * whose most recent analysis (if any) flagged elevated risk — i.e. someone
 * who was flagged and then went quiet. Meant to be called opportunistically
 * (e.g. on staff dashboard load) rather than on a schedule, since this app
 * has no background job runner; it's idempotent via `recentlyRaised`.
 */
export async function raiseRecoveryReminderIfStale(params: {
  athleteUserId: string;
  athleteName: string;
  lastAnalysisAt: string | null;
  lastRiskFlagCount: number;
  staleDays?: number;
}) {
  const staleDays = params.staleDays ?? 14;
  const isStale =
    !params.lastAnalysisAt ||
    Date.now() - new Date(params.lastAnalysisAt).getTime() > staleDays * 24 * 60 * 60 * 1000;
  if (!isStale || params.lastRiskFlagCount === 0) return null;
  if (!(await isCategoryEnabled(params.athleteUserId, "recovery"))) return null;
  if (await recentlyRaised(params.athleteUserId, "recovery", 24 * 7)) return null;

  const { error } = await supabase.from("alerts").insert({
    athlete_user_id: params.athleteUserId,
    severity: "moderate",
    category: "recovery",
    title: `Recovery check-in — ${params.athleteName}`,
    message: params.lastAnalysisAt
      ? `No new analysis in over ${staleDays} days since the last one flagged movement-quality concerns. A follow-up submission or recovery check is recommended.`
      : `No video analysis on record yet, and prior notes flagged concerns. A baseline submission is recommended.`,
  });
  if (error) throw error;
  return true;
}

export const SEVERITY_TONE: Record<RiskLevel, string> = {
  low: "bg-muted text-muted-foreground border-0",
  moderate: "bg-warning/20 text-warning border-0",
  high: "bg-destructive/15 text-destructive border-0",
  critical: "bg-destructive text-destructive-foreground border-0",
};
