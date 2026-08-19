import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BarChart3, Gauge, ShieldAlert, Users, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAnalyticsData,
  monthlyTrend,
  personalTrend,
  riskDistribution,
  RISK_ORDER,
  type AthleteRisk,
} from "@/lib/analytics-data";
import {
  ChartCard,
  EmptyChart,
  MetricBars,
  QualityLine,
  RiskDonut,
  SymmetryChart,
  TrendChart,
} from "@/components/analytics-charts";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/injury-risk";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
  head: () => ({
    meta: [
      { title: "Analytics — KinetIQ" },
      {
        name: "description",
        content: "Squad-wide injury risk analytics, movement quality trends and workload insights.",
      },
    ],
  }),
});

const RISK_TONE: Record<RiskLevel, string> = {
  low: "bg-success/20 text-success border-0",
  moderate: "bg-warning/20 text-warning border-0",
  high: "bg-destructive/15 text-destructive border-0",
  critical: "bg-destructive text-destructive-foreground border-0",
};

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AnalyticsPage() {
  const { roles, user } = useAuth();
  const primary = roles[0];
  const isAthlete = primary === "athlete";

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              {isAthlete
                ? "Your movement quality, risk trend and current risk drivers."
                : "Squad-wide risk distribution, movement quality trends and athletes needing attention."}
            </p>
          </div>
        </div>
        {primary && (
          <Badge className="border-0 bg-primary/15 text-primary">{ROLE_LABELS[primary]} view</Badge>
        )}
      </div>

      {isAthlete ? <AthleteAnalytics userId={user?.id} /> : <StaffAnalytics role={primary} />}
    </div>
  );
}

function StaffAnalytics({ role }: { role: AppRole | undefined }) {
  const { data, isLoading, error } = useAnalyticsData();

  const { data: platform } = useQuery({
    queryKey: ["platform-stats"],
    enabled: role === "administrator",
    queryFn: async () => {
      const [rolesRes, alertsRes] = await Promise.all([
        supabase.from("user_roles").select("role"),
        supabase.from("alerts").select("id, is_read"),
      ]);
      if (rolesRes.error) throw rolesRes.error;
      if (alertsRes.error) throw alertsRes.error;
      const byRole = new Map<string, number>();
      for (const r of rolesRes.data ?? []) byRole.set(r.role, (byRole.get(r.role) ?? 0) + 1);
      return {
        byRole: [...byRole.entries()].map(([label, value]) => ({
          label: ROLE_LABELS[label as AppRole] ?? label,
          value,
        })),
        alerts: (alertsRes.data ?? []).length,
        unread: (alertsRes.data ?? []).filter((a) => !a.is_read).length,
      };
    },
  });

  const rows = data?.rows ?? [];
  const distribution = useMemo(() => riskDistribution(rows), [rows]);
  const trend = useMemo(() => monthlyTrend(rows), [rows]);

  const attention = [...rows]
    .filter((r) => r.profile.riskLevel === "high" || r.profile.riskLevel === "critical")
    .sort(
      (a, b) =>
        RISK_ORDER[a.profile.riskLevel] - RISK_ORDER[b.profile.riskLevel] ||
        b.profile.overallScore - a.profile.overallScore,
    )
    .slice(0, 8);

  const scored = rows.filter((r) => r.averageQuality !== null);
  const avgQuality =
    scored.length > 0
      ? Math.round(scored.reduce((s, r) => s + (r.averageQuality ?? 0), 0) / scored.length)
      : null;
  const avgRisk =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + r.profile.overallScore, 0) / rows.length)
      : 0;

  const pending = (data?.submissions ?? []).filter((s) => s.status === "pending").length;

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Could not load analytics: {(error as Error).message}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-card/60" />
        ))}
      </div>
    );
  }

  const rehabView = role === "physiotherapist";
  const caseload = rows.filter(
    (r) => r.athlete.injury_history || r.athlete.current_medical_conditions,
  );

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Athletes tracked" value={rows.length} />
        <StatCard
          icon={ShieldAlert}
          label="High / critical risk"
          value={distribution.high + distribution.critical}
          hint={`${distribution.critical} critical`}
        />
        <StatCard
          icon={Gauge}
          label="Avg movement quality"
          value={avgQuality === null ? "—" : `${avgQuality}`}
          hint="0–100, higher is better"
        />
        <StatCard
          icon={rehabView ? Activity : Video}
          label={rehabView ? "Rehab caseload" : "Videos awaiting review"}
          value={rehabView ? caseload.length : pending}
          hint={
            rehabView ? "Athletes with injury history" : `${data?.submissions.length ?? 0} total`
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Risk distribution" description="Athletes by current risk level">
          <RiskDonut data={distribution} />
        </ChartCard>
        <ChartCard title="Movement quality trend" description="Monthly average across all analyses">
          <TrendChart
            data={trend as unknown as Record<string, string | number>[]}
            series={[
              { key: "quality", label: "Movement quality", color: "var(--chart-1)" },
              { key: "risk", label: "Risk index", color: "var(--chart-5)" },
            ]}
          />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Average risk contribution"
          description="Weighted factors driving the squad score"
        >
          <MetricBars
            domain={[0, 100]}
            data={
              rows.length === 0
                ? []
                : [
                    { label: "Biomechanics", key: "biomechanicalDeviation" },
                    { label: "History", key: "historicalInjuryFactors" },
                    { label: "Asymmetry", key: "movementAsymmetry" },
                    { label: "Load", key: "trainingLoadIndicators" },
                    { label: "Fatigue", key: "fatigueIndicators" },
                  ].map((c) => ({
                    label: c.label,
                    value: Math.round(
                      rows.reduce(
                        (s, r) =>
                          s + r.profile.components[c.key as keyof typeof r.profile.components],
                        0,
                      ) / rows.length,
                    ),
                  }))
            }
          />
        </ChartCard>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">Athletes needing attention</h3>
              <p className="text-xs text-muted-foreground">
                Squad average risk score {avgRisk}/100
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/report-builder">Build report</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {attention.length === 0 ? (
              <EmptyChart message="No athletes are currently in the high or critical band." />
            ) : (
              attention.map(({ athlete, profile }) => (
                <Link
                  key={athlete.id}
                  to="/athletes/$id"
                  params={{ id: athlete.id }}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 transition hover:border-primary/50"
                >
                  <div>
                    <div className="text-sm font-medium">{athlete.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {athlete.sport_type}
                      {athlete.position ? ` · ${athlete.position}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold">{profile.overallScore}</span>
                    <Badge className={RISK_TONE[profile.riskLevel]}>
                      {RISK_LEVEL_LABELS[profile.riskLevel]}
                    </Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {role === "administrator" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChartCard title="Users by role" description="Platform membership breakdown">
            <MetricBars data={platform?.byRole ?? []} color="var(--chart-3)" />
          </ChartCard>
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={Video} label="Videos submitted" value={data?.submissions.length ?? 0} />
            <StatCard icon={Activity} label="Analyses run" value={data?.analyses.length ?? 0} />
            <StatCard icon={AlertTriangle} label="Alerts raised" value={platform?.alerts ?? 0} />
            <StatCard icon={ShieldAlert} label="Unread alerts" value={platform?.unread ?? 0} />
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Scores combine biomechanical deviation (35%), injury history (20%), movement asymmetry
        (20%), training load (15%) and fatigue trend (10%). They are a triage signal, not a
        diagnosis.
      </p>
    </>
  );
}

function AthleteAnalytics({ userId }: { userId: string | undefined }) {
  const { data, isLoading, error } = useAnalyticsData();
  const mine: AthleteRisk | undefined = (data?.rows ?? []).find(
    (r) => r.athlete.user_id === userId,
  );

  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
        Could not load your analytics: {(error as Error).message}
      </div>
    );
  }
  if (isLoading) {
    return <div className="mt-8 h-64 animate-pulse rounded-2xl border border-border bg-card/60" />;
  }
  if (!mine) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
        <h3 className="font-display text-lg font-semibold">No profile data yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete your athlete profile and submit a movement video to unlock personal analytics.
        </p>
        <Button asChild className="mt-5">
          <Link to="/my-profile">Complete my profile</Link>
        </Button>
      </div>
    );
  }

  const trend = personalTrend(mine.analyses);
  const latest = mine.analyses[mine.analyses.length - 1] ?? null;
  const agg = latest?.aggregates ?? null;

  const jointData = agg
    ? [
        { label: "L knee ROM", value: Math.round(agg.leftKnee.rom) },
        { label: "R knee ROM", value: Math.round(agg.rightKnee.rom) },
        { label: "L hip ROM", value: Math.round(agg.leftHip.rom) },
        { label: "R hip ROM", value: Math.round(agg.rightHip.rom) },
        { label: "Trunk lean", value: Math.round(agg.trunkLean.max) },
      ]
    : [];

  const symmetryData = agg
    ? [
        {
          label: "Knee ROM",
          left: Math.round(agg.leftKnee.rom),
          right: Math.round(agg.rightKnee.rom),
        },
        {
          label: "Hip ROM",
          left: Math.round(agg.leftHip.rom),
          right: Math.round(agg.rightHip.rom),
        },
        {
          label: "Knee valgus",
          left: Math.round(agg.kneeValgus.left.max),
          right: Math.round(agg.kneeValgus.right.max),
        },
      ]
    : [];

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ShieldAlert}
          label="Current risk score"
          value={mine.profile.overallScore}
          hint={RISK_LEVEL_LABELS[mine.profile.riskLevel]}
        />
        <StatCard icon={Gauge} label="Avg movement quality" value={mine.averageQuality ?? "—"} />
        <StatCard icon={Activity} label="Analyses completed" value={mine.analyses.length} />
        <StatCard
          icon={AlertTriangle}
          label="Active risk flags"
          value={latest?.riskFlags.length ?? 0}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Movement quality progression" description="Each completed analysis">
          <QualityLine data={trend} />
        </ChartCard>
        <ChartCard title="Left / right symmetry" description="Latest analysis comparison">
          <SymmetryChart data={symmetryData} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Joint metrics" description="Range of motion and trunk lean (degrees)">
          <MetricBars data={jointData} />
        </ChartCard>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-base font-semibold">Recommended actions</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {mine.profile.recommendations.map((rec) => (
              <li key={rec} className="flex gap-2 rounded-xl border border-border px-4 py-3">
                <span className="text-primary">•</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
