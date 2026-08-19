import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import api from "../api";
import Card from "../components/ui/Card";
import { StatChip } from "../components/ui/StatCard";
import { RiskBandBadge } from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const BAND_ORDER = ["critical", "high", "moderate", "low"];
const BAND_LABELS = { critical: "Critical", high: "High", moderate: "Moderate", low: "Low" };
const BAND_FILL = { critical: "coral", high: "coral", moderate: "amber", low: "glass" };

export default function TeamOverview() {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/analytics/team-overview")
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load the team overview."));
  }, []);

  if (error) return <p className="text-sm text-coral">{error}</p>;
  if (data === undefined) return <p className="text-sm text-muted">Loading team overview...</p>;

  const flaggedCount = (data.band_counts.high || 0) + (data.band_counts.critical || 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold text-paper">Team Overview</h1>
        <p className="text-sm text-muted mt-1">Injury risk across your entire roster, highest risk first.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <StatChip label="Total Athletes" value={data.total_athletes} fill="glass" />
        <StatChip label="Assessed" value={data.assessed_athletes} fill="glass" />
        {BAND_ORDER.map((band) => (
          <StatChip key={band} label={BAND_LABELS[band]} value={data.band_counts[band] || 0} fill={BAND_FILL[band]} />
        ))}
      </div>

      {flaggedCount > 0 && (
        <Card className="mb-6 border-coral/30">
          <div className="flex items-center gap-2 text-coral text-sm">
            <AlertTriangle size={15} />
            <span>{flaggedCount} athlete{flaggedCount !== 1 ? "s" : ""} currently flagged High or Critical risk.</span>
          </div>
        </Card>
      )}

      {data.athletes.length === 0 ? (
        <Card>
          <EmptyState title="No athletes yet" description="Athletes will appear here once they register." />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted text-xs uppercase tracking-wide">
                <th className="py-3 px-5 font-medium">Athlete</th>
                <th className="py-3 px-5 font-medium">Sport</th>
                <th className="py-3 px-5 font-medium">Risk Score</th>
                <th className="py-3 px-5 font-medium">Band</th>
                <th className="py-3 px-5 font-medium">Last Assessed</th>
              </tr>
            </thead>
            <tbody>
              {data.athletes.map((a) => (
                <tr
                  key={a.profile_id}
                  onClick={() => navigate(`/athletes/${a.profile_id}`)}
                  className="border-b border-line last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-ink text-xs font-display font-semibold shrink-0">
                        {a.full_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-paper font-medium">{a.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-muted">{a.sport_type || "\u2014"}</td>
                  <td className="py-3 px-5 font-mono text-paper">{a.latest_score ?? "\u2014"}</td>
                  <td className="py-3 px-5">{a.latest_band ? <RiskBandBadge value={a.latest_band} /> : <span className="text-muted text-xs">Not assessed</span>}</td>
                  <td className="py-3 px-5 text-muted text-xs">{a.computed_at ? new Date(a.computed_at).toLocaleDateString() : "\u2014"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
