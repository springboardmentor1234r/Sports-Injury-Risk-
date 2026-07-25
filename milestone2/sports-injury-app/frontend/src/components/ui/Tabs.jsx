export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="glass-panel inline-flex items-center gap-1 rounded-full p-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
            active === tab.value
              ? "bg-gradient-brand text-ink shadow-glow"
              : "text-muted hover:text-paper"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
