import { useEffect, useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import EmptyState from "../ui/EmptyState";
import { Field, Input, Select } from "../ui/FormField";

const EMPTY_FORM = { metric_name: "", metric_value: "", unit: "", recorded_date: "", notes: "" };
const COMMON_METRICS = ["40m Sprint", "Vertical Jump", "Broad Jump", "Beep Test Level", "1RM Squat", "Agility T-Test"];

export default function PerformancePanel({ profileId, canWrite }) {
  const [items, setItems] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState(null);

  function load() {
    api.get(`/athletes/${profileId}/performance`).then((res) => {
      setItems(res.data);
    });
  }

  useEffect(load, [profileId]);

  const metricNames = useMemo(
    () => [...new Set((items || []).map((i) => i.metric_name))],
    [items]
  );

  const chartData = useMemo(() => {
    if (!items || !selectedMetric) return [];
    return items
      .filter((i) => i.metric_name === selectedMetric)
      .sort((a, b) => new Date(a.recorded_date) - new Date(b.recorded_date))
      .map((i) => ({ date: i.recorded_date, value: i.metric_value }));
  }, [items, selectedMetric]);

  useEffect(() => {
    if (metricNames.length && !selectedMetric) setSelectedMetric(metricNames[0]);
  }, [metricNames, selectedMetric]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/athletes/${profileId}/performance`, { ...form, metric_value: Number(form.metric_value) });
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save this metric.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this performance metric?")) return;
    await api.delete(`/athletes/${profileId}/performance/${id}`);
    load();
  }

  if (items === null) return <p className="text-sm text-muted">Loading performance data...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">{items.length} recorded result{items.length !== 1 ? "s" : ""}</p>
        {canWrite && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Log result
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            title="No performance data yet"
            description="Test results logged by a coach or sports scientist — sprint times, jump height, and more — will appear here."
          />
        </Card>
      ) : (
        <>
          {metricNames.length > 0 && (
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 flex-wrap">
                  {metricNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => setSelectedMetric(name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selectedMetric === name
                          ? "bg-cyan-soft text-cyan border-cyan/30"
                          : "text-muted border-line hover:text-paper"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <YAxis tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,20,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#8892AB" }}
                    itemStyle={{ color: "#22D3C7" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#22D3C7" strokeWidth={2} dot={{ fill: "#22D3C7", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="space-y-2">
            {items
              .slice()
              .sort((a, b) => new Date(b.recorded_date) - new Date(a.recorded_date))
              .map((m) => (
                <Card key={m.id} padded={false} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-paper font-medium">{m.metric_name}</span>
                    <span className="font-mono text-cyan text-sm">{m.metric_value} {m.unit}</span>
                    <span className="text-xs text-muted font-mono">{m.recorded_date}</span>
                  </div>
                  {canWrite && (
                    <button onClick={() => handleDelete(m.id)} className="text-muted hover:text-coral transition-colors" aria-label="Delete metric">
                      <Trash2 size={15} />
                    </button>
                  )}
                </Card>
              ))}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log a performance result">
        {error && <div className="mb-4 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-lg text-coral text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Metric name" required hint="e.g. 40m Sprint, Vertical Jump">
            <Input
              list="common-metrics"
              value={form.metric_name}
              onChange={(e) => setForm({ ...form, metric_name: e.target.value })}
              required
            />
            <datalist id="common-metrics">
              {COMMON_METRICS.map((m) => <option key={m} value={m} />)}
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Value" required>
              <Input type="number" step="0.01" value={form.metric_value} onChange={(e) => setForm({ ...form, metric_value: e.target.value })} required />
            </Field>
            <Field label="Unit" required hint="seconds, cm, kg...">
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
            </Field>
          </div>
          <Field label="Date recorded" required>
            <Input type="date" value={form.recorded_date} onChange={(e) => setForm({ ...form, recorded_date: e.target.value })} required />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save result"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
