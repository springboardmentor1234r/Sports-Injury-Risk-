import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const ROLES = ["athlete", "coach", "physiotherapist", "sports_scientist", "administrator"];

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("athlete");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(fullName, email, password, role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div className="split-auth">
      <div className="split-hero">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-content">
          <h1>
            STRONG <span>TODAY</span>,<br />
            SAFER <span>TOMORROW</span>.
          </h1>
          <p>Monitor. Analyze. Prevent Injuries.</p>
        </div>
        <div className="hero-runner">🏃</div>
      </div>

      <div className="split-form-side">
        <div className="auth-card">
          <div className="auth-brand-badge">🏃</div>
          <h2>Sports Injury <span className="accent">Platform</span></h2>
          <p className="auth-subtitle">Create your account to get started</p>
          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace("_", " ")}
                </option>
              ))}
            </select>

            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-gradient">🏆 Register</button>
          </form>
          <p>
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
