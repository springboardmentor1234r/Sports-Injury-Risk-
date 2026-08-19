import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { FileDown, FileSpreadsheet, FileText, Sheet } from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/lib/role-guard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { useAnalyticsData, riskDistribution, type AthleteRisk } from "@/lib/analytics-data";
import { ChartCard, MetricBars, QualityLine, RiskDonut } from "@/components/analytics-charts";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/injury-risk";
import { exportCsv, exportReportPdf, exportWorkbook } from "@/lib/report-export";

export const Route = createFileRoute("/_authenticated/report-builder")({
  component: ReportBuilderPage,
  head: () => ({
    meta: [
      { title: "Report Builder — KinetIQ" },
      {
        name: "description",
        content:
          "Generate injury risk, biomechanical and rehabilitation reports and export them to PDF or Excel.",
      },
    ],
  }),
});

const REPORT_TYPES = {
  injury_risk: "Injury risk assessment",
  biomechanical: "Biomechanical assessment",
  movement: "Movement analysis summary",
  performance: "Athlete performance overview",
  rehabilitation: "Rehabilitation status",
} as const;

type ReportType = keyof typeof REPORT_TYPES;

const paramsSchema = z.object({
  athleteId: z.string().min(1, "Select an athlete or the full squad"),
  type: z.enum(["injury_risk", "biomechanical", "movement", "performance", "rehabilitation"]),
  from: z.string().optional(),
  to: z.string().optional(),
});

const RISK_TONE: Record<RiskLevel, string> = {
  low: "bg-success/20 text-success border-0",
  moderate: "bg-warning/20 text-warning border-0",
  high: "bg-destructive/15 text-destructive border-0",
  critical: "bg-destructive text-destructive-foreground border-0",
};

function ReportBuilderPage() {
  return (
    <RoleGate allow={["coach", "physiotherapist", "sports_scientist", "administrator"]}>
      <ReportBuilder />
    </RoleGate>
  );
}

function ReportBuilder() {
  const { data, isLoading, error } = useAnalyticsData();
  const [athleteId, setAthleteId] = useState("all");
  const [type, setType] = useState<ReportType>("injury_risk");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [generated, setGenerated] = useState<null | {
    athleteId: string;
    type: ReportType;
    from: string;
    to: string;
  }>(null);

  const rows = data?.rows ?? [];

  const scoped: AthleteRisk[] = useMemo(() => {
    if (!generated) return [];
    const base =
      generated.athleteId === "all"
        ? rows
        : rows.filter((r) => r.athlete.id === generated.athleteId);
    const fromTs = generated.from ? new Date(generated.from).getTime() : null;
    const toTs = generated.to ? new Date(generated.to).getTime() + 86_400_000 : null;
    return base.map((r) => ({
      ...r,
      analyses: r.analyses.filter((a) => {
        const t = new Date(a.createdAt).getTime();
        return (fromTs === null || t >= fromTs) && (toTs === null || t <= toTs);
      }),
    }));
  }, [generated, rows]);

  const generate = () => {
    const parsed = paramsSchema.safeParse({ athleteId, type, from, to });
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Invalid report parameters");
    }
    if (from && to && new Date(from) > new Date(to)) {
      return toast.error("The start date must be before the end date.");
    }
    setGenerated({ athleteId, type, from, to });
    toast.success("Report generated");
  };

  const title = generated
    ? `${REPORT_TYPES[generated.type]} — ${
        generated.athleteId === "all" ? "Full squad" : (scoped[0]?.athlete.full_name ?? "Athlete")
      }`
    : "";

  const rangeLabel = generated
    ? generated.from || generated.to
      ? `${generated.from || "start"} to ${generated.to || "today"}`
      : "All recorded data"
    : "";

  const tableColumns = [
    "Athlete",
    "Sport",
    "Training load",
    "Analyses",
    "Avg quality",
    "Risk score",
    "Risk level",
  ];

  const tableRows = scoped.map((r) => [
    r.athlete.full_name,
    r.athlete.sport_type,
    r.athlete.training_load ? r.athlete.training_load.replace("_", " ") : "—",
    r.analyses.length,
    r.averageQuality ?? "—",
    r.profile.overallScore,
    RISK_LEVEL_LABELS[r.profile.riskLevel],
  ]);

  const factorRows = scoped.map((r) => [
    r.athlete.full_name,
    Math.round(r.profile.components.biomechanicalDeviation),
    Math.round(r.profile.components.historicalInjuryFactors),
    Math.round(r.profile.components.movementAsymmetry),
    Math.round(r.profile.components.trainingLoadIndicators),
    Math.round(r.profile.components.fatigueIndicators),
  ]);

  const factorColumns = [
    "Athlete",
    "Biomechanics",
    "History",
    "Asymmetry",
    "Training load",
    "Fatigue",
  ];

  const downloadPdf = () => {
    if (!generated) return;
    exportReportPdf({ title, subtitle: rangeLabel, generatedFor: `${scoped.length} athlete(s)` }, [
      { heading: "Risk summary", columns: tableColumns, rows: tableRows },
      { heading: "Risk factor breakdown (0–100)", columns: factorColumns, rows: factorRows },
      {
        heading: "Recommendations",
        text:
          scoped
            .flatMap((r) =>
              r.profile.recommendations.map((rec) => `${r.athlete.full_name}: ${rec}`),
            )
            .slice(0, 25)
            .join("\n") || "No recommendations generated for this selection.",
      },
      {
        heading: "Methodology",
        text: "Overall risk combines biomechanical deviation (35%), injury history (20%), movement asymmetry (20%), training load (15%) and fatigue trend (10%). Scores are a rule-based triage signal, not a medical diagnosis.",
      },
    ]);
  };

  const downloadExcel = () => {
    if (!generated) return;
    exportWorkbook(title, [
      { name: "Risk summary", columns: tableColumns, rows: tableRows },
      { name: "Risk factors", columns: factorColumns, rows: factorRows },
    ]);
  };

  const distribution = riskDistribution(scoped);
  const qualityTrend = scoped
    .flatMap((r) =>
      r.analyses.map((a) => ({ createdAt: a.createdAt, quality: a.movementQualityScore })),
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      label: new Date(a.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      quality: Math.round(a.quality),
    }));

  const factorAverages =
    scoped.length === 0
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
            scoped.reduce(
              (s, r) => s + r.profile.components[c.key as keyof typeof r.profile.components],
              0,
            ) / scoped.length,
          ),
        }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Report builder</h1>
          <p className="text-muted-foreground">
            Generate a report for one athlete or the whole squad, then export it to PDF or Excel.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card md:grid-cols-4">
        <div className="space-y-2">
          <Label>Athlete</Label>
          <Select value={athleteId} onValueChange={setAthleteId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Full squad</SelectItem>
              {rows.map((r) => (
                <SelectItem key={r.athlete.id} value={r.athlete.id}>
                  {r.athlete.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Report type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(REPORT_TYPES) as ReportType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {REPORT_TYPES[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="md:col-span-4">
          <Button onClick={generate} disabled={isLoading || rows.length === 0}>
            <FileBarIcon /> Generate report
          </Button>
          {rows.length === 0 && !isLoading && (
            <span className="ml-3 text-xs text-muted-foreground">
              No athlete profiles are registered yet.
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Could not load report data: {(error as Error).message}
        </div>
      )}

      {generated && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div>
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {rangeLabel} · {scoped.length} athlete{scoped.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                <FileDown className="h-4 w-4" /> PDF
              </Button>
              <Button variant="outline" size="sm" onClick={downloadExcel}>
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCsv(title, tableColumns, tableRows)}
              >
                <Sheet className="h-4 w-4" /> CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Risk distribution" description="Athletes in this report">
              <RiskDonut data={distribution} />
            </ChartCard>
            <ChartCard title="Movement quality" description="Analyses inside the selected range">
              <QualityLine data={qualityTrend} />
            </ChartCard>
          </div>

          <ChartCard title="Average risk factors" description="Weighted contributions (0–100)">
            <MetricBars data={factorAverages} domain={[0, 100]} />
          </ChartCard>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {tableColumns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoped.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No data matches this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  scoped.map((r) => (
                    <TableRow key={r.athlete.id}>
                      <TableCell className="font-medium">{r.athlete.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.athlete.sport_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.athlete.training_load ? r.athlete.training_load.replace("_", " ") : "—"}
                      </TableCell>
                      <TableCell>{r.analyses.length}</TableCell>
                      <TableCell>{r.averageQuality ?? "—"}</TableCell>
                      <TableCell className="font-display font-semibold">
                        {r.profile.overallScore}
                      </TableCell>
                      <TableCell>
                        <Badge className={RISK_TONE[r.profile.riskLevel]}>
                          {RISK_LEVEL_LABELS[r.profile.riskLevel]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-base font-semibold">Recommendations</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {scoped.flatMap((r) =>
                r.profile.recommendations.map((rec) => (
                  <li
                    key={`${r.athlete.id}-${rec}`}
                    className="rounded-xl border border-border px-4 py-3"
                  >
                    <span className="font-medium text-foreground">{r.athlete.full_name}: </span>
                    {rec}
                  </li>
                )),
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function FileBarIcon() {
  return <FileText className="h-4 w-4" />;
}
