import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to your Sports Injury Platform account.</p>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-gradient">Login</button>
          </form>
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
