import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../../api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import { SeverityBadge, RecoveryBadge } from "../ui/Badge";
import { Field, Input, Select, Textarea } from "../ui/FormField";

const BODY_PARTS = ["knee", "ankle", "hamstring", "shoulder", "lower_back", "hip", "calf", "groin", "other"];
const SEVERITIES = ["mild", "moderate", "severe"];
const RECOVERY_STATUSES = ["active", "recovering", "recovered"];

const EMPTY_FORM = {
  body_part: "knee",
  injury_type: "",
  severity: "mild",
  recovery_status: "active",
  date_occurred: "",
  expected_recovery_date: "",
  actual_recovery_date: "",
  notes: "",
};

export default function InjuriesPanel({ profileId, canWrite }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get(`/athletes/${profileId}/injuries`).then((res) => setItems(res.data));
  }

  useEffect(load, [profileId]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.expected_recovery_date) delete payload.expected_recovery_date;
      if (!payload.actual_recovery_date) delete payload.actual_recovery_date;
      await api.post(`/athletes/${profileId}/injuries`, payload);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this injury record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this injury record? This cannot be undone.")) return;
    await api.delete(`/athletes/${profileId}/injuries/${id}`);
    load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading injury history...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} record{items.length !== 1 ? "s" : ""}</p>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Log injury
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No injuries recorded"
            description="This athlete has a clean injury history so far. Records logged by a physiotherapist will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((inj) => (
            <Card key={inj.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-medium text-paper capitalize">{inj.body_part.replace("_", " ")}</span>
                  <span className="text-muted text-sm">&middot;</span>
                  <span className="text-sm text-muted">{inj.injury_type}</span>
                  <SeverityBadge value={inj.severity} />
                  <RecoveryBadge value={inj.recovery_status} />
                </div>
                <p className="text-xs text-muted font-mono">
                  Occurred {inj.date_occurred}
                  {inj.expected_recovery_date && ` · Expected recovery ${inj.expected_recovery_date}`}
                  {inj.actual_recovery_date && ` · Recovered ${inj.actual_recovery_date}`}
                </p>
                {inj.notes && <p className="text-sm text-muted mt-2">{inj.notes}</p>}
              </div>
              {canWrite && (
                <button
                  onClick={() => handleDelete(inj.id)}
                  className="text-muted hover:text-coral transition-colors shrink-0"
                  aria-label="Delete injury record"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log an injury">
        {error && <div className="mb-4 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-lg text-coral text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Body part" required>
              <Select value={form.body_part} onChange={(e) => setForm({ ...form, body_part: e.target.value })}>
                {BODY_PARTS.map((b) => <option key={b} value={b}>{b.replace("_", " ")}</option>)}
              </Select>
            </Field>
            <Field label="Severity" required>
              <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Injury type" required>
            <Input
              placeholder="e.g. ACL Tear, Grade 2 Hamstring Strain"
              value={form.injury_type}
              onChange={(e) => setForm({ ...form, injury_type: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Recovery status" required>
              <Select value={form.recovery_status} onChange={(e) => setForm({ ...form, recovery_status: e.target.value })}>
                {RECOVERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Date occurred" required>
              <Input type="date" value={form.date_occurred} onChange={(e) => setForm({ ...form, date_occurred: e.target.value })} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Expected recovery date">
              <Input type="date" value={form.expected_recovery_date} onChange={(e) => setForm({ ...form, expected_recovery_date: e.target.value })} />
            </Field>
            <Field label="Actual recovery date">
              <Input type="date" value={form.actual_recovery_date} onChange={(e) => setForm({ ...form, actual_recovery_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Clinical notes, mechanism of injury, treatment plan..." />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save record"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
