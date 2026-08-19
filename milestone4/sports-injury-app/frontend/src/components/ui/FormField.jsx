const baseField =
  "w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-paper placeholder:text-muted/60 focus:outline-none focus:border-cyan/50 focus:bg-white/[0.06] transition-colors";

export function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-coral">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return <input className={baseField} {...props} />;
}

export function Select({ children, ...props }) {
  return (
    <select className={`${baseField} appearance-none`} {...props}>
      {children}
    </select>
  );
}

export function Textarea(props) {
  return <textarea className={`${baseField} resize-none`} {...props} />;
}
