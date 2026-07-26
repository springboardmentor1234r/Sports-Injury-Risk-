import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AthleteForm } from "@/components/athlete-form";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InjuryRiskCard } from "@/components/injury-risk-card";
import { useAuth } from "@/lib/auth-context";
import { RoleGate } from "@/lib/role-guard";
import { computeInjuryRiskProfile } from "@/lib/injury-risk";

export const Route = createFileRoute("/_authenticated/athletes/$id")({
  component: AthleteDetailPage,
  head: () => ({ meta: [{ title: "Athlete — KinetIQ" }] }),
});

function AthleteDetailPage() {
  return (
    <RoleGate allow={["coach", "physiotherapist", "sports_scientist", "administrator"]}>
      <AthleteDetail />
    </RoleGate>
  );
}

function AthleteDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { roles } = useAuth();
  const canDelete = roles.some((r) => ["coach", "administrator"].includes(r));

  const { data, isLoading } = useQuery({
    queryKey: ["athlete", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: analyses } = useQuery({
    queryKey: ["athlete-analyses", data?.user_id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("pose_analyses")
        .select("movement_quality_score, risk_flags, created_at, joint_metrics")
        .eq("athlete_user_id", data!.user_id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return rows;
    },
    enabled: !!data?.user_id,
  });

  const riskProfile = data
    ? computeInjuryRiskProfile(
        (analyses ?? []).map((a) => ({
          createdAt: a.created_at,
          movementQualityScore: a.movement_quality_score,
          riskFlags: a.risk_flags,
          aggregates:
            (a.joint_metrics as { aggregates?: import("@/lib/biomechanics").Aggregates } | null)
              ?.aggregates ?? null,
        })),
        {
          trainingLoad: data.training_load as "low" | "moderate" | "high" | "very_high" | null,
          injuryHistory: data.injury_history,
          currentMedicalConditions: data.current_medical_conditions,
        },
      )
    : null;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>
    );
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted-foreground">Athlete not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/athletes">Back</Link>
        </Button>
      </div>
    );
  }

  const onDelete = async () => {
    const { error } = await supabase.from("athlete_profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Athlete deleted");
    await qc.invalidateQueries({ queryKey: ["athletes"] });
    navigate({ to: "/athletes" });
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link
        to="/athletes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All athletes
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{data.full_name}</h1>
          <p className="mt-1 text-muted-foreground">
            {data.sport_type}
            {data.position ? ` · ${data.position}` : ""}
            {data.team_club ? ` · ${data.team_club}` : ""}
          </p>
        </div>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this athlete?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the profile permanently. Analysis history tied to this athlete will
                  be inaccessible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {riskProfile &&
        (riskProfile.dataQuality.hasBiomechanicalData ||
          riskProfile.dataQuality.hasProfileData) && (
          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold">Injury risk profile</h2>
            <InjuryRiskCard profile={riskProfile} />
          </div>
        )}

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <AthleteForm
          initial={data}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["athlete", id] });
            await qc.invalidateQueries({ queryKey: ["athletes"] });
          }}
        />
      </div>
    </div>
  );
}
