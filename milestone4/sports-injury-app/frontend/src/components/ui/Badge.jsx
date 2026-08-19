// Badge tones map directly to what the label means, and are reused identically
// everywhere that value appears (list rows, detail views, forms) so a person
// learns the color language once and it holds everywhere.
const TONES = {
  cyan: "bg-cyan-soft text-cyan border-cyan/25",
  violet: "bg-violet-soft text-violet border-violet/25",
  coral: "bg-coral-soft text-coral border-coral/25",
  amber: "bg-amber-soft text-amber border-amber/25",
  sage: "bg-sage-soft text-sage border-sage/25",
  neutral: "bg-white/[0.04] text-muted border-white/10",
};

const SEVERITY_TONE = { mild: "amber", moderate: "amber", severe: "coral" };
const RECOVERY_TONE = { active: "coral", recovering: "amber", recovered: "sage" };
const RISK_BAND_TONE = { low: "sage", moderate: "amber", high: "coral", critical: "coral" };

export default function Badge({ children, tone = "neutral", className = "", ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium capitalize backdrop-blur-sm ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ value }) {
  return <Badge tone={SEVERITY_TONE[value] || "neutral"}>{value}</Badge>;
}

export function RecoveryBadge({ value }) {
  return <Badge tone={RECOVERY_TONE[value] || "neutral"}>{value?.replace("_", " ")}</Badge>;
}

export function RoleBadge({ value }) {
  const tone = value === "athlete" ? "cyan" : value === "admin" ? "coral" : "violet";
  return <Badge tone={tone}>{value?.replace("_", " ")}</Badge>;
}

export function RiskBandBadge({ value, className = "" }) {
  return <Badge tone={RISK_BAND_TONE[value] || "neutral"} className={`text-sm px-3 py-1.5 ${className}`}>{value}</Badge>;
}
