import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    client.get("/athletes/me").then((res) => setProfile(res.data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      sport_type: form.sport_type.value,
      position: form.position.value,
      age: form.age.value ? parseInt(form.age.value) : null,
      height_cm: form.height_cm.value ? parseFloat(form.height_cm.value) : null,
      weight_kg: form.weight_kg.value ? parseFloat(form.weight_kg.value) : null,
      training_load: form.training_load.value,
      injury_history: form.injury_history.value,
    };
    const res = await client.put("/athletes/me", payload);
    setProfile(res.data);
    setMessage("Profile saved successfully.");
    setTimeout(() => setMessage(""), 2500);
  };

  if (!profile) return <p className="loading-text">Loading profile...</p>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card-header">
          <h2>👤 Athlete Profile</h2>
          <Link to="/dashboard" className="btn-pill">← Dashboard</Link>
        </div>

        <form onSubmit={handleSave} className="profile-form">
          <div className="form-row">
            <div>
              <label>Sport</label>
              <input name="sport_type" defaultValue={profile.sport_type || ""} placeholder="e.g. Cricket" />
            </div>
            <div>
              <label>Position</label>
              <input name="position" defaultValue={profile.position || ""} placeholder="e.g. Batsman" />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Age</label>
              <input name="age" type="number" defaultValue={profile.age || ""} />
            </div>
            <div>
              <label>Height (cm)</label>
              <input name="height_cm" type="number" defaultValue={profile.height_cm || ""} />
            </div>
            <div>
              <label>Weight (kg)</label>
              <input name="weight_kg" type="number" defaultValue={profile.weight_kg || ""} />
            </div>
          </div>

          <label>Training Load</label>
          <select name="training_load" defaultValue={profile.training_load || ""}>
            <option value="">-- select --</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>

          <label>Injury History</label>
          <textarea
            name="injury_history"
            defaultValue={profile.injury_history || ""}
            placeholder="e.g. Left knee sprain, 2023"
          />

          <button type="submit" className="btn-gradient">Save Profile</button>
          {message && <p className="success">{message}</p>}
        </form>
      </div>
    </div>
  );
}
