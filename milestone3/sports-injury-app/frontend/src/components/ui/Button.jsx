const VARIANTS = {
  primary:
    "bg-gradient-brand text-ink font-semibold hover:brightness-110 hover:shadow-glow",
  secondary:
    "glass-panel text-paper hover:border-cyan/40",
  danger:
    "bg-coral/10 text-coral border border-coral/30 hover:bg-coral/20",
  ghost: "text-muted hover:text-paper",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
