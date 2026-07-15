import { useEffect, useState } from "react";
import api from "../api";

export default function AthleteList() {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/athletes")
      .then((res) => setAthletes(res.data))
      .catch(() => setError("Could not load athlete list."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-16 text-slate-500">Loading athletes...</div>;
  if (error) return <div className="text-center mt-16 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Athletes</h1>

      {athletes.length === 0 ? (
        <p className="text-slate-500">No athletes have registered yet.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Sport</th>
              <th className="py-2 pr-4">Position</th>
              <th className="py-2 pr-4">Age</th>
              <th className="py-2 pr-4">Height (cm)</th>
              <th className="py-2 pr-4">Weight (kg)</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a) => (
              <tr key={a.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-800">{a.user.full_name}</td>
                <td className="py-2 pr-4">{a.sport_type || "—"}</td>
                <td className="py-2 pr-4">{a.position || "—"}</td>
                <td className="py-2 pr-4">{a.age ?? "—"}</td>
                <td className="py-2 pr-4">{a.height_cm ?? "—"}</td>
                <td className="py-2 pr-4">{a.weight_kg ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
