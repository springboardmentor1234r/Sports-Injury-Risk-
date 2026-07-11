import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      const res = await axios.post("http://localhost:8000/auth/login", form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={styles.page}>

      {/* FULL PAGE BACKGROUND IMAGE */}
      <img src="/athlete.png" style={styles.bgImage} alt="background" />

      {/* DARK OVERLAY */}
      <div style={styles.overlay} />

      {/* FORM BOX - RIGHT SIDE */}
     <div className="form-container" style={styles.formContainer}>
        <div style={styles.card}>
          <div style={styles.logoCircle}>🏃</div>
          <h2 style={styles.title}>
            Sports Injury <span style={styles.pink}>Platform</span>
          </h2>
          <p style={styles.welcome}>
            Welcome back! Please <span style={styles.pink}>login</span> to continue
          </p>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>✉️</span>
            <input
              style={styles.input}
              name="email"
              placeholder="Email"
              type="email"
              onChange={handleChange}
            />
          </div>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>🔒</span>
            <input
              style={styles.input}
              name="password"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              onChange={handleChange}
            />
            <span style={styles.eyeIcon} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>
          
          <button style={styles.button} onClick={handleSubmit}>
            🧑 Login
          </button>
          <div style={styles.orRow}>
            <div style={styles.orLine} />
            <span style={styles.orText}>or</span>
            <div style={styles.orLine} />
          </div>
          <p style={styles.registerText}>
            Don't have an account?{" "}
            <span style={styles.pinkLink} onClick={() => navigate("/register")}>
              Register
            </span>
          </p>
          <p style={styles.footer}>© 2026 Sports Injury Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    fontFamily: "'Segoe UI', sans-serif",
    overflow: "hidden",
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  formContainer: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50%",
    minHeight: "100vh",
    padding: "40px",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    borderRadius: "24px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  logoCircle: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #ec4899, #a855f7)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    alignSelf: "center",
  },
  title: {
    textAlign: "center",
    fontSize: "26px",
    fontWeight: "800",
    color: "#1e1b4b",
    margin: 0,
  },
  pink: { color: "#ec4899" },
  pinkLink: { color: "#ec4899", cursor: "pointer", fontWeight: "bold" },
  welcome: { textAlign: "center", color: "#6b7280", fontSize: "14px", margin: 0 },
  error: { color: "#ef4444", textAlign: "center", fontSize: "13px" },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    padding: "0 16px",
    gap: "10px",
    background: "#fafafa",
  },
  inputIcon: { fontSize: "16px" },
  input: {
    flex: 1,
    padding: "14px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#374151",
  },
  eyeIcon: { fontSize: "16px", cursor: "pointer" },
  forgot: {
    color: "#ec4899",
    textAlign: "right",
    cursor: "pointer",
    fontSize: "13px",
    marginTop: "-4px",
  },
  button: {
    padding: "16px",
    background: "linear-gradient(135deg, #ec4899, #a855f7)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
    letterSpacing: "0.5px",
  },
  orRow: { display: "flex", alignItems: "center", gap: "12px" },
  orLine: { flex: 1, height: "1px", background: "#e5e7eb" },
  orText: { color: "#9ca3af", fontSize: "13px" },
  registerText: { textAlign: "center", color: "#6b7280", fontSize: "14px" },
  footer: { textAlign: "center", color: "#9ca3af", fontSize: "11px", marginTop: "8px" },
};