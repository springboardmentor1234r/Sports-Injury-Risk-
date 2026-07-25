import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import api from "../../api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import { Field, Input, Textarea } from "../ui/FormField";

const EMPTY_FORM = { assessment_type: "", assessment_date: "", findings: "", recommendations: "", follow_up_required: false };

export default function AssessmentsPanel({ profileId, canWrite }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get(`/athletes/${profileId}/assessments`).then((res) => setItems(res.data));
  }

  useEffect(load, [profileId]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/athletes/${profileId}/assessments`, form);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this assessment.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this assessment record?")) return;
    await api.delete(`/athletes/${profileId}/assessments/${id}`);
    load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading assessments...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} assessment{items.length !== 1 ? "s" : ""}</p>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> New assessment
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No assessments on file"
            description="Periodic screenings — pre-season checks, return-to-play clearances — logged by a physiotherapist or sports scientist will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items
            .slice()
            .sort((a, b) => new Date(b.assessment_date) - new Date(a.assessment_date))
            .map((a) => (
              <Card key={a.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-medium text-paper">{a.assessment_type}</span>
                    <span className="text-xs text-muted font-mono">{a.assessment_date}</span>
                    {a.follow_up_required && (
                      <span className="inline-flex items-center gap-1 text-amber text-xs bg-amber-soft border border-amber/30 rounded-full px-2 py-0.5">
                        <AlertTriangle size={11} /> Follow-up required
                      </span>
                    )}
                  </div>
                  {a.findings && (
                    <p className="text-sm text-muted mt-1"><span className="text-paper/80">Findings: </span>{a.findings}</p>
                  )}
                  {a.recommendations && (
                    <p className="text-sm text-muted mt-1"><span className="text-paper/80">Recommendations: </span>{a.recommendations}</p>
                  )}
                </div>
                {canWrite && (
                  <button onClick={() => handleDelete(a.id)} className="text-muted hover:text-coral transition-colors shrink-0" aria-label="Delete assessment">
                    <Trash2 size={16} />
                  </button>
                )}
              </Card>
            ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log a physical assessment">
        {error && <div className="mb-4 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-lg text-coral text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Assessment type" required hint="e.g. Pre-season Screening, Return-to-Play">
            <Input value={form.assessment_type} onChange={(e) => setForm({ ...form, assessment_type: e.target.value })} required />
          </Field>
          <Field label="Assessment date" required>
            <Input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} required />
          </Field>
          <Field label="Findings">
            <Textarea rows={3} value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} />
          </Field>
          <Field label="Recommendations">
            <Textarea rows={3} value={form.recommendations} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-paper">
            <input
              type="checkbox"
              checked={form.follow_up_required}
              onChange={(e) => setForm({ ...form, follow_up_required: e.target.checked })}
              className="w-4 h-4 rounded border-line bg-surface-raised accent-cyan"
            />
            Follow-up required
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save assessment"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
