import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

export default function AthleteProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    sport_type: "",
    position: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    training_load: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/athletes/me").then((res) => {
      const p = res.data;
      setForm({
        sport_type: p.sport_type || "",
        position: p.position || "",
        age: p.age ?? "",
        height_cm: p.height_cm ?? "",
        weight_kg: p.weight_kg ?? "",
        training_load: p.training_load || "",
        notes: p.notes || "",
      });
    });
  }, []);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const payload = {
        ...form,
        age: form.age === "" ? null : Number(form.age),
        height_cm: form.height_cm === "" ? null : Number(form.height_cm),
        weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      };
      await api.put("/athletes/me", payload);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save profile.");
    }
  };

  return (
    <div className="page">
      <h1>Edit Athlete Profile</h1>
      <div className="card mt-24" style={{ maxWidth: 560 }}>
        {error && <div className="error-box">{error}</div>}
        {saved && (
          <div
            className="error-box"
            style={{ background: "rgba(0,230,168,0.1)", borderColor: "rgba(0,230,168,0.4)", color: "var(--accent)" }}
          >
            Profile saved successfully.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="field">
              <label>Sport Type</label>
              <input value={form.sport_type} onChange={handleChange("sport_type")} placeholder="e.g. Football" />
            </div>
            <div className="field">
              <label>Position</label>
              <input value={form.position} onChange={handleChange("position")} placeholder="e.g. Midfielder" />
            </div>
            <div className="field">
              <label>Age</label>
              <input type="number" value={form.age} onChange={handleChange("age")} />
            </div>
            <div className="field">
              <label>Training Load</label>
              <select value={form.training_load} onChange={handleChange("training_load")}>
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="field">
              <label>Height (cm)</label>
              <input type="number" step="0.1" value={form.height_cm} onChange={handleChange("height_cm")} />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" value={form.weight_kg} onChange={handleChange("weight_kg")} />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={handleChange("notes")} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-primary">Save Profile</button>
            <button type="button" className="btn" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
