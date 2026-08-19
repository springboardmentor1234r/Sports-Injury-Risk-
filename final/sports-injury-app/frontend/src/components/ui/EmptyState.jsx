import KeypointMotif from "./KeypointMotif";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6">
      <KeypointMotif className="w-10 h-auto mb-5" />
      <h3 className="font-display text-paper font-semibold mb-1.5">{title}</h3>
      {description && <p className="text-sm text-muted max-w-sm mb-5">{description}</p>}
      {action}
    </div>
  );
}
