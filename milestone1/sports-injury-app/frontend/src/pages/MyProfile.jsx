import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  sport_type: "",
  position: "",
  age: "",
  height_cm: "",
  weight_kg: "",
  injury_history: "",
  training_load: "",
};

export default function MyProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/athletes/me").then((res) => {
      const data = res.data;
      setForm({
        sport_type: data.sport_type || "",
        position: data.position || "",
        age: data.age ?? "",
        height_cm: data.height_cm ?? "",
        weight_kg: data.weight_kg ?? "",
        injury_history: data.injury_history || "",
        training_load: data.training_load || "",
      });
      setLoading(false);
    });
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        age: form.age === "" ? null : Number(form.age),
        height_cm: form.height_cm === "" ? null : Number(form.height_cm),
        weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      };
      await api.put("/athletes/me", payload);
      setMessage("Profile saved successfully.");
    } catch (err) {
      setMessage("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center mt-16 text-slate-500">Loading your profile...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-1 text-slate-800">My Athlete Profile</h1>
      <p className="text-slate-500 mb-6">Welcome, {user.full_name}</p>

      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Sport type</label>
          <input name="sport_type" value={form.sport_type} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="e.g. Football" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Position</label>
          <input name="position" value={form.position} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="e.g. Striker" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Age</label>
          <input type="number" name="age" value={form.age} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Height (cm)</label>
          <input type="number" step="0.1" name="height_cm" value={form.height_cm} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Weight (kg)</label>
          <input type="number" step="0.1" name="weight_kg" value={form.weight_kg} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Training load</label>
          <input name="training_load" value={form.training_load} onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="e.g. Moderate, 5 sessions/week" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">Injury history</label>
          <textarea name="injury_history" value={form.injury_history} onChange={handleChange} rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2" placeholder="Describe any past injuries..." />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
