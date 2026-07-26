import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, FileBarChart, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoleGate } from "@/lib/role-guard";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InjuryRiskCard } from "@/components/injury-risk-card";
import type { Aggregates } from "@/lib/biomechanics";
import {
  RISK_LEVEL_LABELS,
  computeInjuryRiskProfile,
  type AnalysisSnapshot,
  type InjuryRiskProfile,
  type RiskLevel,
} from "@/lib/injury-risk";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — KinetIQ" }] }),
});

function ReportsPage() {
  return (
    <RoleGate allow={["coach", "physiotherapist", "sports_scientist", "administrator"]}>
      <Reports />
    </RoleGate>
  );
}

type AthleteProfileRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  sport_type: string;
  position: string | null;
  training_load: "low" | "moderate" | "high" | "very_high" | null;
  injury_history: string | null;
  current_medical_conditions: string | null;
};

type PoseAnalysisRow = {
  athlete_user_id: string;
  movement_quality_score: number;
  risk_flags: string[];
  created_at: string;
  joint_metrics: { aggregates?: Aggregates } | null;
};

const RISK_TONE: Record<RiskLevel, string> = {
  low: "bg-success/20 text-success border-0",
  moderate: "bg-warning/20 text-warning border-0",
  high: "bg-destructive/15 text-destructive border-0",
  critical: "bg-destructive text-destructive-foreground border-0",
};

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

function Reports() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const { data: athletes, isLoading: athletesLoading } = useQuery({
    queryKey: ["reports-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select(
          "id, user_id, full_name, sport_type, position, training_load, injury_history, current_medical_conditions",
        )
        .order("full_name");
      if (error) throw error;
      return data as AthleteProfileRow[];
    },
  });

  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ["reports-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pose_analyses")
        .select("athlete_user_id, movement_quality_score, risk_flags, created_at, joint_metrics");
      if (error) throw error;
      return data as PoseAnalysisRow[];
    },
  });

  const rows = useMemo(() => {
    if (!athletes) return [];
    const byAthlete = new Map<string, AnalysisSnapshot[]>();
    for (const a of analyses ?? []) {
      const list = byAthlete.get(a.athlete_user_id) ?? [];
      list.push({
        createdAt: a.created_at,
        movementQualityScore: a.movement_quality_score,
        riskFlags: a.risk_flags,
        aggregates: a.joint_metrics?.aggregates ?? null,
      });
      byAthlete.set(a.athlete_user_id, list);
    }

    return athletes.map((athlete) => {
      const athleteAnalyses = (athlete.user_id && byAthlete.get(athlete.user_id)) || [];
      const profile = computeInjuryRiskProfile(athleteAnalyses, {
        trainingLoad: athlete.training_load,
        injuryHistory: athlete.injury_history,
        currentMedicalConditions: athlete.current_medical_conditions,
      });
      return { athlete, profile };
    });
  }, [athletes, analyses]);

  const filteredRows = rows
    .filter((r) => levelFilter === "all" || r.profile.riskLevel === levelFilter)
    .sort(
      (a, b) =>
        RISK_ORDER[a.profile.riskLevel] - RISK_ORDER[b.profile.riskLevel] ||
        b.profile.overallScore - a.profile.overallScore,
    );

  const summary = rows.reduce(
    (acc, r) => {
      acc[r.profile.riskLevel] += 1;
      return acc;
    },
    { low: 0, moderate: 0, high: 0, critical: 0 } as Record<RiskLevel, number>,
  );

  const isLoading = athletesLoading || analysesLoading;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <FileBarChart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Team-wide injury risk overview — biomechanics, training load, history and fatigue trends
            combined into one score per athlete.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(["critical", "high", "moderate", "low"] as RiskLevel[]).map((level) => (
          <div key={level} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="text-sm text-muted-foreground">{RISK_LEVEL_LABELS[level]}</div>
            <div className="mt-1 font-display text-2xl font-bold">{summary[level]}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4" /> {rows.length} athlete{rows.length === 1 ? "" : "s"}{" "}
          scored
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "No athlete profiles yet — reports will populate once athletes are registered."
              : "No athletes match this filter."}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Training load</TableHead>
                  <TableHead>Risk score</TableHead>
                  <TableHead>Risk level</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map(({ athlete, profile }) => (
                  <ReportRow
                    key={athlete.id}
                    athlete={athlete}
                    profile={profile}
                    expanded={expandedId === athlete.id}
                    onToggle={() => setExpandedId(expandedId === athlete.id ? null : athlete.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Scores are a transparent, rule-based composite (biomechanics, history, asymmetry, training
        load, fatigue trend) — not a trained injury-probability model. Treat them as a triage signal
        for where to look next, not a diagnosis.
      </div>
    </div>
  );
}

function ReportRow({
  athlete,
  profile,
  expanded,
  onToggle,
}: {
  athlete: AthleteProfileRow;
  profile: InjuryRiskProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          <div className="font-medium">{athlete.full_name}</div>
          {athlete.position && (
            <div className="text-xs text-muted-foreground">{athlete.position}</div>
          )}
        </TableCell>
        <TableCell className="text-muted-foreground">{athlete.sport_type}</TableCell>
        <TableCell className="text-muted-foreground">
          {athlete.training_load ? athlete.training_load.replace("_", " ") : "—"}
        </TableCell>
        <TableCell className="font-display font-semibold">{profile.overallScore}</TableCell>
        <TableCell>
          <Badge className={RISK_TONE[profile.riskLevel]}>
            {RISK_LEVEL_LABELS[profile.riskLevel]}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Hide" : "View"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="p-0">
            <div className="border-t border-border bg-muted/20 p-5">
              <InjuryRiskCard profile={profile} />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
