import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AthleteProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [form, setForm] = useState({
    sport: "", position: "", age: "", height: "", weight: "",
    injury_history: "", training_load: ""
  });
  const [message, setMessage] = useState("");
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8000/athlete/profile", { headers })
      .then(res => { setForm(res.data); setIsNew(false); })
      .catch(() => setIsNew(true));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (isNew) {
        await axios.post("http://localhost:8000/athlete/profile", form, { headers });
      } else {
        await axios.put("http://localhost:8000/athlete/profile", form, { headers });
      }
      setMessage("Profile saved successfully!");
      setIsNew(false);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Error saving profile");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topRow}>
          <h2 style={styles.title}>👤 Athlete Profile</h2>
          <button style={styles.back} onClick={() => navigate("/dashboard")}>← Dashboard</button>
        </div>
        {message && <p style={styles.msg}>{message}</p>}
        <div style={styles.grid}>
          <input style={styles.input} name="sport" placeholder="Sport (e.g. Cricket)" value={form.sport} onChange={handleChange} />
          <input style={styles.input} name="position" placeholder="Position (e.g. Batsman)" value={form.position} onChange={handleChange} />
          <input style={styles.input} name="age" placeholder="Age" type="number" value={form.age} onChange={handleChange} />
          <input style={styles.input} name="height" placeholder="Height (cm)" type="number" value={form.height} onChange={handleChange} />
          <input style={styles.input} name="weight" placeholder="Weight (kg)" type="number" value={form.weight} onChange={handleChange} />
          <select style={styles.input} name="training_load" value={form.training_load} onChange={handleChange}>
            <option value="">Training Load</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </div>
        <textarea style={styles.textarea} name="injury_history" placeholder="Injury History (e.g. Left knee sprain 2023)" value={form.injury_history} onChange={handleChange} />
        <button style={styles.button} onClick={handleSubmit}>{isNew ? "Save Profile" : "Update Profile"}</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#fdf4ff 0%,#f8e8ff 35%,#fce7f3 70%,#ede9fe 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "50px",
    fontFamily: "'Poppins', sans-serif",
  },

  card: {
    width: "850px",
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(18px)",
    borderRadius: "28px",
    padding: "40px",
    boxShadow:
      "0 15px 50px rgba(168,85,247,0.18),0 5px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
    color: "#6d28d9",
    letterSpacing: ".5px",
  },

  back: {
    background: "#ede9fe",
    color: "#6d28d9",
    border: "none",
    padding: "10px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "600",
    transition: ".3s",
    boxShadow: "0 4px 10px rgba(109,40,217,.12)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  input: {
    padding: "15px 18px",
    borderRadius: "16px",
    border: "2px solid #f3e8ff",
    background: "#ffffff",
    color: "#4c1d95",
    fontSize: "15px",
    outline: "none",
    transition: ".3s",
    boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },

  textarea: {
    padding: "18px",
    borderRadius: "18px",
    border: "2px solid #f3e8ff",
    background: "#fff",
    color: "#4c1d95",
    fontSize: "15px",
    minHeight: "120px",
    resize: "vertical",
    outline: "none",
    boxShadow: "0 5px 15px rgba(236,72,153,.05)",
  },

  button: {
    marginTop: "10px",
    background:
      "linear-gradient(135deg,#d946ef,#ec4899,#8b5cf6)",
    color: "white",
    padding: "16px",
    border: "none",
    borderRadius: "18px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "16px",
    letterSpacing: ".5px",
    boxShadow:
      "0 10px 25px rgba(217,70,239,.35)",
    transition: ".3s",
  },

  msg: {
    background: "#ecfdf5",
    color: "#047857",
    padding: "12px",
    borderRadius: "14px",
    textAlign: "center",
    fontWeight: "600",
    border: "1px solid #bbf7d0",
  },
};