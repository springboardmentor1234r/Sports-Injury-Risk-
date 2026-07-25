import { useEffect, useState, useCallback } from "react";
import { RefreshCw, AlertTriangle, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from "recharts";
import api from "../../api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { RiskBandBadge } from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { StatChip } from "../ui/StatCard";

const CATEGORY_LABELS = {
  biomechanical_score: "Biomechanical (35%)",
  asymmetry_score: "Asymmetry (20%)",
  historical_injury_score: "Injury History (20%)",
  training_load_score: "Training Load (15%)",
  fatigue_score: "Fatigue (10%)",
};

export default function RiskAssessmentPanel({ profileId, canCompute }) {
  const [latest, setLatest] = useState(undefined); // undefined = loading, null = none yet
  const [history, setHistory] = useState([]);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api.get(`/athletes/${profileId}/risk-assessments/latest`)
      .then((res) => setLatest(res.data))
      .catch(() => setLatest(null));
    api.get(`/athletes/${profileId}/risk-assessments`)
      .then((res) => setHistory(res.data.slice().reverse()))
      .catch(() => setHistory([]));
  }, [profileId]);

  useEffect(load, [load]);

  async function handleCompute() {
    setComputing(true);
    setError("");
    try {
      await api.post(`/athletes/${profileId}/risk-assessments`);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not compute a risk assessment.");
    } finally {
      setComputing(false);
    }
  }

  const chartData = history.map((h, i) => ({
    index: i + 1,
    date: new Date(h.computed_at).toLocaleDateString(),
    score: h.overall_score,
  }));

  if (latest === undefined) return <p className="text-sm text-muted">Loading risk assessment...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {latest ? `Last computed ${new Date(latest.computed_at).toLocaleString()}` : "No assessment computed yet"}
        </p>
        {canCompute && (
          <Button onClick={handleCompute} disabled={computing}>
            <RefreshCw size={15} className={computing ? "animate-spin" : ""} />
            {computing ? "Computing..." : "Compute new assessment"}
          </Button>
        )}
      </div>

      {error && <div className="px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-xl text-coral text-sm">{error}</div>}

      {!latest ? (
        <Card>
          <EmptyState
            title="No risk assessment yet"
            description="A physiotherapist, sports scientist, or admin can compute one from this athlete's video analysis, injury history, and training load data."
          />
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted mb-2">Overall risk score</p>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-5xl font-bold text-paper">{latest.overall_score}</span>
                <RiskBandBadge value={latest.risk_band} />
              </div>
            </div>
            <div className="text-xs text-muted max-w-xs flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>This is a heuristic screening score based on published sports-science thresholds -- not a diagnosis. Always use clinical judgment.</span>
            </div>
          </Card>

          {latest.data_completeness_warnings?.length > 0 && (
            <Card className="border-amber/30">
              <div className="flex items-start gap-2 text-amber text-sm">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {latest.data_completeness_warnings.map((w, i) => <p key={i}>{w}</p>)}
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const value = latest[key];
              return (
                <StatChip
                  key={key}
                  label={label}
                  value={value ?? "—"}
                  fill={value === null || value === undefined ? "glass" : (value > 64 ? "coral" : "glass")}
                />
              );
            })}
          </div>

          {chartData.length > 1 && (
            <Card>
              <p className="text-xs uppercase tracking-wide text-muted mb-3">Risk score trend</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8892AB", fontSize: 11 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.08)" }} />
                  <Tooltip contentStyle={{ background: "rgba(15,20,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8892AB" }} />
                  <ReferenceArea y1={0} y2={39} fill="#4ADE80" fillOpacity={0.06} />
                  <ReferenceArea y1={40} y2={64} fill="#F5A623" fillOpacity={0.06} />
                  <ReferenceArea y1={65} y2={100} fill="#FF6B6B" fillOpacity={0.06} />
                  <Line type="monotone" dataKey="score" stroke="#22D3C7" strokeWidth={2} dot={{ fill: "#22D3C7", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card>
            <p className="text-xs uppercase tracking-wide text-muted mb-3">Why this score</p>
            <ul className="space-y-2 text-sm text-muted">
              {latest.breakdown?.map((line, i) => (
                <li key={i} className="pl-4 border-l-2 border-line">{line}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
