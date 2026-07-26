import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Aggregates, FrameMetrics } from "@/lib/biomechanics";

export type PoseAnalysisRow = {
  id: string;
  frame_count: number;
  duration_seconds: number;
  movement_quality_score: number;
  risk_flags: string[];
  joint_metrics: { timeSeries?: FrameMetrics[]; aggregates?: Aggregates } | null;
  created_at: string;
};

function scoreBand(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Good", className: "bg-success/20 text-success border-0" };
  if (score >= 55) return { label: "Fair", className: "bg-warning/20 text-warning border-0" };
  return { label: "Needs attention", className: "bg-destructive/20 text-destructive border-0" };
}

const chartConfig: ChartConfig = {
  leftKnee: { label: "Left knee", color: "var(--chart-1)" },
  rightKnee: { label: "Right knee", color: "var(--chart-2)" },
  trunkLean: { label: "Trunk lean", color: "var(--chart-3)" },
};

function MetricCell({
  label,
  value,
  unit = "°",
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-semibold">
        {value}
        <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

export function BiomechanicsReport({ analysis }: { analysis: PoseAnalysisRow }) {
  const band = scoreBand(analysis.movement_quality_score);
  const timeSeries = analysis.joint_metrics?.timeSeries ?? [];
  const agg = analysis.joint_metrics?.aggregates;

  const chartData = timeSeries.map((f) => ({
    t: Math.round(f.t / 100) / 10, // seconds, 1 decimal
    leftKnee: f.leftKnee ?? undefined,
    rightKnee: f.rightKnee ?? undefined,
    trunkLean: f.trunkLean ?? undefined,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-display text-3xl font-bold">{analysis.movement_quality_score}</div>
        <Badge className={band.className}>{band.label}</Badge>
        <span className="text-sm text-muted-foreground">
          {analysis.frame_count} frames · {analysis.duration_seconds.toFixed(1)}s analyzed
        </span>
      </div>

      {analysis.risk_flags.length > 0 ? (
        <div className="space-y-2">
          {analysis.risk_flags.map((flag) => (
            <div
              key={flag}
              className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {flag}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          No biomechanical concerns flagged for this clip.
        </div>
      )}

      {agg && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCell label="Left knee ROM" value={agg.leftKnee.rom.toFixed(0)} />
          <MetricCell label="Right knee ROM" value={agg.rightKnee.rom.toFixed(0)} />
          <MetricCell
            label="Knee ROM asymmetry"
            value={agg.symmetry.kneeRomDiffPct.toFixed(0)}
            unit="%"
          />
          <MetricCell label="Max trunk lean" value={agg.trunkLean.max.toFixed(0)} />
          <MetricCell label="Left knee valgus (max)" value={agg.kneeValgus.left.max.toFixed(0)} />
          <MetricCell label="Right knee valgus (max)" value={agg.kneeValgus.right.max.toFixed(0)} />
          <MetricCell label="Left hip ROM" value={agg.leftHip.rom.toFixed(0)} />
          <MetricCell label="Right hip ROM" value={agg.rightHip.rom.toFixed(0)} />
        </div>
      )}

      {chartData.length > 1 && (
        <div>
          <div className="mb-2 text-sm font-medium">Joint angle over time</div>
          <ChartContainer config={chartConfig} className="aspect-[16/7] w-full">
            <LineChart data={chartData} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="t" tickLine={false} axisLine={false} unit="s" fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={32} fontSize={11} unit="°" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="leftKnee"
                stroke="var(--color-leftKnee)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="rightKnee"
                stroke="var(--color-rightKnee)"
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="trunkLean"
                stroke="var(--color-trunkLean)"
                dot={false}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
}
