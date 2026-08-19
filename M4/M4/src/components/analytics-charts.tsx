import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RISK_COLORS } from "@/lib/analytics-data";
import { RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/injury-risk";

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 };

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
};

export function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 h-64">{children}</div>
    </div>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-full place-items-center rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
      <span className="px-6">{message}</span>
    </div>
  );
}

export function RiskDonut({ data }: { data: Record<RiskLevel, number> }) {
  const entries = (Object.keys(data) as RiskLevel[])
    .map((level) => ({ level, name: RISK_LEVEL_LABELS[level], value: data[level] }))
    .filter((e) => e.value > 0);

  if (entries.length === 0) return <EmptyChart message="No scored athletes yet." />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={entries}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="80%"
          paddingAngle={3}
        >
          {entries.map((e) => (
            <Cell key={e.level} fill={RISK_COLORS[e.level]} stroke="var(--card)" />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({
  data,
  xKey = "label",
  series,
}: {
  data: Record<string, string | number>[];
  xKey?: string;
  series: { key: string; label: string; color: string }[];
}) {
  if (data.length === 0) return <EmptyChart message="No analysis history yet." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#grad-${s.key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MetricBars({
  data,
  color = "var(--primary)",
  domain,
}: {
  data: { label: string; value: number }[];
  color?: string;
  domain?: [number, number];
}) {
  if (data.length === 0) return <EmptyChart message="No biomechanical metrics available." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-12}
          height={44}
          textAnchor="end"
        />
        <YAxis domain={domain ?? [0, "auto"]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
        <Bar dataKey="value" name="Value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SymmetryChart({
  data,
}: {
  data: { label: string; left: number; right: number }[];
}) {
  if (data.length === 0) return <EmptyChart message="No left/right comparison available." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="left" name="Left" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="right" name="Right" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function QualityLine({ data }: { data: { label: string; quality: number }[] }) {
  if (data.length === 0) return <EmptyChart message="No movement analyses recorded yet." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Line
          type="monotone"
          dataKey="quality"
          name="Movement quality"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
