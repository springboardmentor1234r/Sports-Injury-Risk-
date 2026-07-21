import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RoleGate } from "@/lib/role-guard";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BiomechanicsReport, type PoseAnalysisRow } from "@/components/biomechanics-report";
import { InjuryRiskCard } from "@/components/injury-risk-card";
import { computeInjuryRiskProfile } from "@/lib/injury-risk";

export const Route = createFileRoute("/_authenticated/analysis")({
  component: AnalysisPage,
  head: () => ({ meta: [{ title: "Analysis Results — KinetIQ" }] }),
});

function AnalysisPage() {
  return (
    <RoleGate allow={["athlete"]}>
      <AthleteAnalysis />
    </RoleGate>
  );
}

type AnalysisWithSubmission = PoseAnalysisRow & {
  video_submission_id: string;
  video_submissions: { title: string } | null;
};

function AthleteAnalysis() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ["pose-analyses", "mine", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pose_analyses")
        .select("*, video_submissions(title)")
        .eq("athlete_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AnalysisWithSubmission[];
    },
    enabled: !!user,
  });

  const { data: myAthleteProfile } = useQuery({
    queryKey: ["my-athlete-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select("training_load, injury_history, current_medical_conditions")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const riskProfile = computeInjuryRiskProfile(
    (analyses ?? []).map((a) => ({
      createdAt: a.created_at,
      movementQualityScore: a.movement_quality_score,
      riskFlags: a.risk_flags,
      aggregates: a.joint_metrics?.aggregates ?? null,
    })),
    {
      trainingLoad: myAthleteProfile?.training_load as
        "low" | "moderate" | "high" | "very_high" | null | undefined,
      injuryHistory: myAthleteProfile?.injury_history,
      currentMedicalConditions: myAthleteProfile?.current_medical_conditions,
    },
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Analysis results</h1>
          <p className="text-muted-foreground">
            Movement quality scores and biomechanical breakdowns from your submitted videos.
          </p>
        </div>
      </div>

      {!isLoading &&
        (riskProfile.dataQuality.hasBiomechanicalData ||
          riskProfile.dataQuality.hasProfileData) && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Your injury risk profile</h2>
            <InjuryRiskCard profile={riskProfile} />
          </div>
        )}

      <div className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">Per-video reports</h2>
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            No analyses available yet. Once a sports scientist reviews a video you've submitted,
            results will show up here.
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => {
              const isExpanded = expandedId === a.id;
              return (
                <div key={a.id} className="rounded-2xl border border-border bg-card shadow-card">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedId(open ? a.id : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between gap-4 p-5 text-left">
                        <div>
                          <div className="font-display font-semibold">
                            {a.video_submissions?.title || "Video analysis"}
                          </div>
                          <div className="mt-0.5 text-sm text-muted-foreground">
                            {new Date(a.created_at).toLocaleDateString()} · Score{" "}
                            {a.movement_quality_score}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {a.risk_flags.length > 0 && (
                            <Badge className="bg-warning/20 text-warning border-0">
                              {a.risk_flags.length} flag{a.risk_flags.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t border-border p-5">
                      <BiomechanicsReport analysis={a} />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
