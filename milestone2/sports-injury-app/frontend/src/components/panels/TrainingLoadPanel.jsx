import { useEffect, useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../api";
import Card from "../ui/Card";
import StatCard from "../ui/StatCard";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import { Field, Input, Select, Textarea } from "../ui/FormField";

const EMPTY_FORM = { session_date: "", session_type: "", duration_minutes: "", intensity_rpe: "", notes: "" };
const SESSION_TYPES = ["Strength", "Conditioning", "Skills", "Match", "Recovery", "Rehab"];

function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export default function TrainingLoadPanel({ profileId, canWrite }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get(`/athletes/${profileId}/training-load`).then((res) => setItems(res.data));
  }

  useEffect(load, [profileId]);

  const weeklyData = useMemo(() => {
    if (!items) return [];
    const byWeek = {};
    items.forEach((entry) => {
      const key = isoWeekKey(entry.session_date);
      const load = entry.duration_minutes * (entry.intensity_rpe || 5); // session-RPE load, standard sports-science formula
      byWeek[key] = (byWeek[key] || 0) + load;
    });
    return Object.entries(byWeek)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .slice(-8)
      .map(([week, load]) => ({ week: week.split("-W")[1] ? `Wk ${week.split("-W")[1]}` : week, load }));
  }, [items]);

  const last7DaysMinutes = useMemo(() => {
    if (!items) return 0;
    const cutoff = Date.now() - 7 * 86400000;
    return items.filter((i) => new Date(i.session_date).getTime() >= cutoff).reduce((sum, i) => sum + i.duration_minutes, 0);
  }, [items]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, duration_minutes: Number(form.duration_minutes) };
      if (payload.intensity_rpe === "") delete payload.intensity_rpe;
      else payload.intensity_rpe = Number(payload.intensity_rpe);
      await api.post(`/athletes/${profileId}/training-load`, payload);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this session.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this training session?")) return;
    await api.delete(`/athletes/${profileId}/training-load/${id}`);
    load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading training load...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} session{items.length !== 1 ? "s" : ""} logged</p>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Log session
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No training sessions logged"
            description="Session load — type, duration, and perceived exertion — will appear here once logged."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard label="Last 7 days" value={last7DaysMinutes} unit="min" tone="cyan" />
            <StatCard label="Sessions logged" value={items.length} tone="cyan" />
          </div>

          {weeklyData.length > 1 && (
            <Card className="mb-4">
              <p className="text-xs uppercase tracking-wide text-muted mb-3">Weekly load (duration &times; RPE)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <YAxis tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Tooltip contentStyle={{ background: "rgba(15,20,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8892AB" }} />
                  <Bar dataKey="load" fill="#22D3C7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="space-y-2">
            {items
              .slice()
              .sort((a, b) => new Date(b.session_date) - new Date(a.session_date))
              .map((s) => (
                <Card key={s.id} padded={false} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-paper font-medium">{s.session_type}</span>
                    <span className="font-mono text-cyan text-sm">{s.duration_minutes} min</span>
                    {s.intensity_rpe && <span className="font-mono text-amber text-sm">RPE {s.intensity_rpe}</span>}
                    <span className="text-xs text-muted font-mono">{s.session_date}</span>
                  </div>
                  {canWrite && (
                    <button onClick={() => handleDelete(s.id)} className="text-muted hover:text-coral transition-colors" aria-label="Delete session">
                      <Trash2 size={15} />
                    </button>
                  )}
                </Card>
              ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log a training session">
        {error && <div className="mb-4 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-lg text-coral text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Session type" required>
              <Select value={form.session_type} onChange={(e) => setForm({ ...form, session_type: e.target.value })} required>
                <option value="" disabled>Select type</option>
                {SESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.session_date} onChange={(e) => setForm({ ...form, session_date: e.target.value })} required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes)" required>
              <Input type="number" min={1} max={1440} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} required />
            </Field>
            <Field label="Perceived exertion (RPE)" hint="1 (easy) to 10 (max effort)">
              <Input type="number" min={1} max={10} value={form.intensity_rpe} onChange={(e) => setForm({ ...form, intensity_rpe: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save session"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
