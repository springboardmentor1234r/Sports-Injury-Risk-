import { Search } from "lucide-react";

export default function Topbar({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
      <div>
        {title && <h1 className="text-2xl font-display font-semibold text-paper">{title}</h1>}
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">{actions}</div>
    </div>
  );
}

export function SearchPill({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="glass-panel rounded-full pl-9 pr-4 py-2.5 text-sm text-paper placeholder:text-muted/70 focus:outline-none focus:border-cyan/40 transition-colors w-64"
      />
    </div>
  );
}
