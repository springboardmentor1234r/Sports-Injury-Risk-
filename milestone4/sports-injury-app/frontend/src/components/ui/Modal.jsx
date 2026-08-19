import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${width} glass-panel rounded-2xl shadow-panel max-h-[85vh] overflow-y-auto`}
        style={{ background: "rgba(15, 20, 32, 0.9)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0" style={{ background: "rgba(15, 20, 32, 0.9)" }}>
          <h2 className="text-base font-display font-semibold text-paper">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted hover:text-paper hover:bg-white/10 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
