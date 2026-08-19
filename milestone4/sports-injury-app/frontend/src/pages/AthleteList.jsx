import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { SearchPill } from "../components/Topbar";

export default function AthleteList() {
  const [athletes, setAthletes] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/athletes")
      .then((res) => setAthletes(res.data))
      .catch(() => setError("Could not load athlete list."));
  }, []);

  const filtered = useMemo(() => {
    if (!athletes) return [];
    const q = query.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter(
      (a) =>
        a.user.full_name.toLowerCase().includes(q) ||
        (a.sport_type || "").toLowerCase().includes(q) ||
        (a.position || "").toLowerCase().includes(q)
    );
  }, [athletes, query]);

  if (error) return <p className="text-sm text-coral">{error}</p>;
  if (athletes === null) return <p className="text-sm text-muted">Loading athletes...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-paper">Athletes</h1>
          <p className="text-sm text-muted mt-1">{athletes.length} athlete{athletes.length !== 1 ? "s" : ""} on the roster</p>
        </div>
        <SearchPill value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, sport, position..." />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={athletes.length === 0 ? "No athletes yet" : "No matches"}
            description={athletes.length === 0 ? "Athletes will appear here once they register." : "Try a different search term."}
          />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted text-xs uppercase tracking-wide">
                <th className="py-3 px-5 font-medium">Name</th>
                <th className="py-3 px-5 font-medium">Sport</th>
                <th className="py-3 px-5 font-medium">Position</th>
                <th className="py-3 px-5 font-medium">Age</th>
                <th className="py-3 px-5 font-medium">Height</th>
                <th className="py-3 px-5 font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/athletes/${a.id}`)}
                  className="border-b border-line last:border-0 hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-ink text-xs font-display font-semibold shrink-0">
                        {a.user.full_name[0]?.toUpperCase()}
                      </div>
                      <span className="text-paper font-medium">{a.user.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-muted">{a.sport_type || "—"}</td>
                  <td className="py-3 px-5 text-muted">{a.position || "—"}</td>
                  <td className="py-3 px-5 text-muted font-mono">{a.age ?? "—"}</td>
                  <td className="py-3 px-5 text-muted font-mono">{a.height_cm ? `${a.height_cm} cm` : "—"}</td>
                  <td className="py-3 px-5 text-muted font-mono">{a.weight_kg ? `${a.weight_kg} kg` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
