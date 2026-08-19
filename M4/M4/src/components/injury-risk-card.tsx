import { AlertOctagon, ClipboardList, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  RISK_LEVEL_LABELS,
  WEIGHTS,
  type InjuryRiskProfile,
  type RiskComponents,
  type RiskLevel,
} from "@/lib/injury-risk";

function levelBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-success/20 text-success border-0";
    case "moderate":
      return "bg-warning/20 text-warning border-0";
    case "high":
      return "bg-destructive/15 text-destructive border-0";
    case "critical":
      return "bg-destructive text-destructive-foreground border-0";
  }
}

function levelFillClass(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-success";
    case "moderate":
      return "bg-warning";
    case "high":
    case "critical":
      return "bg-destructive";
  }
}

function RiskBar({ value }: { value: number }) {
  const level = riskLevelForBar(value);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${levelFillClass(level)}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

const COMPONENT_LABELS: Record<keyof RiskComponents, string> = {
  biomechanicalDeviation: "Biomechanical deviations",
  historicalInjuryFactors: "Historical injury factors",
  movementAsymmetry: "Movement asymmetry",
  trainingLoadIndicators: "Training load indicators",
  fatigueIndicators: "Fatigue indicators",
};

const COMPONENT_WEIGHTS: Record<keyof RiskComponents, number> = {
  biomechanicalDeviation: WEIGHTS.biomechanicalDeviation,
  historicalInjuryFactors: WEIGHTS.historicalInjuryFactors,
  movementAsymmetry: WEIGHTS.movementAsymmetry,
  trainingLoadIndicators: WEIGHTS.trainingLoadIndicators,
  fatigueIndicators: WEIGHTS.fatigueIndicators,
};

export function InjuryRiskCard({ profile }: { profile: InjuryRiskProfile }) {
  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold">{profile.overallScore}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Badge className={levelBadgeClass(profile.riskLevel)}>
            {RISK_LEVEL_LABELS[profile.riskLevel]}
          </Badge>
        </div>
      </div>

      {!profile.dataQuality.hasBiomechanicalData && (
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No video analysis on file yet — this score is based on training load and profile factors
          only. It will sharpen once pose estimation has run on at least one submitted video.
        </div>
      )}

      <div>
        <div className="mb-3 text-sm font-medium">Weighted score breakdown</div>
        <div className="space-y-3">
          {(Object.keys(profile.components) as (keyof RiskComponents)[]).map((key) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {COMPONENT_LABELS[key]}{" "}
                  <span className="text-muted-foreground/70">
                    ({Math.round(COMPONENT_WEIGHTS[key] * 100)}%)
                  </span>
                </span>
                <span className="font-medium">{profile.components[key]}</span>
              </div>
              <RiskBar value={profile.components[key]} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-medium">Injury category breakdown</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profile.categoryRisks.map((c) => (
            <div key={c.category} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{c.score}</span>
                <Badge className={levelBadgeClass(c.level) + " text-[10px]"}>
                  {RISK_LEVEL_LABELS[c.level].replace(" risk", "")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <ClipboardList className="h-4 w-4" /> Corrective recommendations
        </div>
        <ul className="space-y-2">
          {profile.recommendations.map((r, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground"
            >
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function riskLevelForBar(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}
