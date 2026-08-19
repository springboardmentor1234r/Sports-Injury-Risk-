import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  FileBarChart,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserCircle,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import { computeInjuryRiskProfile, type AnalysisSnapshot } from "@/lib/injury-risk";
import type { Aggregates } from "@/lib/biomechanics";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — KinetIQ" }] }),
});

type ActionCard = {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
};

const ROLE_ACTIONS: Record<AppRole, ActionCard[]> = {
  athlete: [
    {
      icon: UserCircle,
      title: "My profile",
      description: "Keep your baseline profile up to date.",
      to: "/my-profile",
    },
    {
      icon: HeartPulse,
      title: "Injury history",
      description: "Review and update your injury history.",
      to: "/my-injuries",
    },
    {
      icon: Upload,
      title: "Upload a video",
      description: "Submit a training or movement clip for analysis.",
      to: "/upload",
    },
    {
      icon: BarChart3,
      title: "Analysis results",
      description: "See risk assessments produced from your videos.",
      to: "/analysis",
    },
  ],
  coach: [
    {
      icon: Users,
      title: "Athlete list",
      description: "Search, filter and manage your squad.",
      to: "/athletes",
    },
    {
      icon: UserCircle,
      title: "Add athlete",
      description: "Register a new athlete with a full baseline profile.",
      to: "/athletes/new",
    },
    {
      icon: FileBarChart,
      title: "Reports",
      description: "Review training-load and risk reports across athletes.",
      to: "/reports",
    },
  ],
  physiotherapist: [
    {
      icon: Users,
      title: "Athlete list",
      description: "Open athlete files and review recovery status.",
      to: "/athletes",
    },
    {
      icon: Stethoscope,
      title: "Injury management",
      description: "Log injuries, treatments and return-to-play checks.",
      to: "/injuries",
    },
    {
      icon: FileBarChart,
      title: "Reports",
      description: "Track case load and outcomes.",
      to: "/reports",
    },
  ],
  sports_scientist: [
    {
      icon: Users,
      title: "Athlete list",
      description: "Explore anthropometrics and training-load data.",
      to: "/athletes",
    },
    {
      icon: Video,
      title: "Video analysis",
      description: "Run pose estimation and injury-risk analysis on submitted clips.",
      to: "/video-analysis",
    },
    {
      icon: FileBarChart,
      title: "Reports",
      description: "Publish performance and risk analyses.",
      to: "/reports",
    },
  ],
  administrator: [
    {
      icon: ShieldCheck,
      title: "Users",
      description: "Manage user accounts and role assignments.",
      to: "/users",
    },
    {
      icon: Users,
      title: "Athlete list",
      description: "System-wide view of every athlete profile.",
      to: "/athletes",
    },
    {
      icon: FileBarChart,
      title: "Reports",
      description: "Review reports across the organisation.",
      to: "/reports",
    },
    {
      icon: Activity,
      title: "System settings",
      description: "Configure organisation-wide preferences.",
      to: "/system",
    },
  ],
};

function Dashboard() {
  const { user, roles } = useAuth();
  const primaryRole: AppRole = roles[0] ?? "athlete";
  const actions = ROLE_ACTIONS[primaryRole];
  const isAthlete = primaryRole === "athlete";

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", primaryRole, user?.id],
    queryFn: async () => {
      const { count: athleteCount } = await supabase
        .from("athlete_profiles")
        .select("*", { count: "exact", head: true });

      const videosQuery = supabase
        .from("video_submissions")
        .select("*", { count: "exact", head: true });
      const { count: videoCount } = isAthlete
        ? await videosQuery.eq("athlete_user_id", user!.id)
        : await videosQuery;

      const analysesSelect =
        "movement_quality_score, risk_flags, created_at, joint_metrics, athlete_user_id";
      const analysesQuery = supabase.from("pose_analyses").select(analysesSelect);
      const { data: analysesRows } = isAthlete
        ? await analysesQuery.eq("athlete_user_id", user!.id)
        : await analysesQuery;

      let riskAssessments = 0;
      if (isAthlete) {
        const { data: myProfile } = await supabase
          .from("athlete_profiles")
          .select("training_load, injury_history, current_medical_conditions")
          .eq("user_id", user!.id)
          .maybeSingle();
        const snapshots: AnalysisSnapshot[] = (analysesRows ?? []).map((a) => ({
          createdAt: a.created_at,
          movementQualityScore: a.movement_quality_score,
          riskFlags: a.risk_flags,
          aggregates: (a.joint_metrics as { aggregates?: Aggregates } | null)?.aggregates ?? null,
        }));
        const profile = computeInjuryRiskProfile(snapshots, {
          trainingLoad: myProfile?.training_load as
            "low" | "moderate" | "high" | "very_high" | null,
          injuryHistory: myProfile?.injury_history,
          currentMedicalConditions: myProfile?.current_medical_conditions,
        });
        riskAssessments = profile.riskLevel === "high" || profile.riskLevel === "critical" ? 1 : 0;
      } else {
        const { data: athletes } = await supabase
          .from("athlete_profiles")
          .select("user_id, training_load, injury_history, current_medical_conditions");
        const byAthlete = new Map<string, AnalysisSnapshot[]>();
        for (const a of analysesRows ?? []) {
          const list = byAthlete.get(a.athlete_user_id) ?? [];
          list.push({
            createdAt: a.created_at,
            movementQualityScore: a.movement_quality_score,
            riskFlags: a.risk_flags,
            aggregates: (a.joint_metrics as { aggregates?: Aggregates } | null)?.aggregates ?? null,
          });
          byAthlete.set(a.athlete_user_id, list);
        }
        riskAssessments = (athletes ?? []).filter((athlete) => {
          const level = computeInjuryRiskProfile(
            (athlete.user_id && byAthlete.get(athlete.user_id)) || [],
            {
              trainingLoad: athlete.training_load as
                "low" | "moderate" | "high" | "very_high" | null,
              injuryHistory: athlete.injury_history,
              currentMedicalConditions: athlete.current_medical_conditions,
            },
          ).riskLevel;
          return level === "high" || level === "critical";
        }).length;
      }

      return {
        athletes: athleteCount ?? 0,
        videos: videoCount ?? 0,
        analyses: (analysesRows ?? []).length,
        riskAssessments,
      };
    },
  });

  const cards = [
    {
      icon: Users,
      label: isAthlete ? "My profiles" : "Athletes tracked",
      value: stats?.athletes ?? "—",
    },
    { icon: Video, label: "Video uploads", value: stats?.videos ?? "—" },
    { icon: Activity, label: "Analyses run", value: stats?.analyses ?? "—" },
    {
      icon: ShieldCheck,
      label: isAthlete ? "Your risk flagged" : "Athletes at high/critical risk",
      value: stats?.riskAssessments ?? "—",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">
            Welcome, {ROLE_LABELS[primaryRole]}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {isAthlete
              ? "Keep your profile, training load and injury history up to date so your coach and physiotherapist can support you."
              : "Manage athlete profiles, training load and injury data from a workspace built for your role."}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <c.icon className="h-4 w-4" />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Quick actions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shortcuts to the workflows that matter most for your role.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.title}
              to={a.to}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/50"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                <a.icon className="h-4 w-4" />
              </div>
              <div className="mt-4 font-display text-base font-semibold group-hover:text-primary">
                {a.title}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
