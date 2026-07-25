// StatChip -- the bold, colorful "hero number" card style borrowed directly
// from the reference (e.g. the Wins/Losses/Winning% chips): solid gradient
// fill for the primary metric, glass for secondary ones, big mono numerals.
const FILLS = {
  brand: "bg-gradient-brand text-ink",
  coral: "bg-coral text-white",
  glass: "glass-panel text-paper",
};

export function StatChip({ icon, label, value, unit, fill = "glass", className = "", ...rest }) {
  const isSolid = fill !== "glass";
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${FILLS[fill]} ${isSolid ? "shadow-panel" : "shadow-panel"} ${className}`} {...rest}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium uppercase tracking-wide ${isSolid ? "text-ink/70" : "text-muted"}`}>
          {label}
        </span>
        {icon && (
          <span className={`w-7 h-7 rounded-full flex items-center justify-center ${isSolid ? "bg-ink/10" : "bg-white/[0.06]"}`}>
            {icon}
          </span>
        )}
      </div>
      <span className="font-mono text-3xl font-semibold leading-none">
        {value}
        {unit && <span className="text-base font-body font-normal ml-1 opacity-70">{unit}</span>}
      </span>
    </div>
  );
}

// StatCard -- quieter glass variant for dense secondary readouts (unchanged API
// from before, so existing panel code keeps working).
export default function StatCard({ label, value, unit, tone = "cyan", className = "", ...rest }) {
  const toneClass = { cyan: "text-cyan", violet: "text-violet", coral: "text-coral", amber: "text-amber", sage: "text-sage" }[tone];
  return (
    <div className={`glass-panel rounded-2xl p-5 flex flex-col gap-1.5 shadow-panel ${className}`} {...rest}>
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span className={`font-mono text-2xl font-semibold ${toneClass}`}>
        {value}
        {unit && <span className="text-sm text-muted ml-1 font-body font-normal">{unit}</span>}
      </span>
    </div>
  );
}
