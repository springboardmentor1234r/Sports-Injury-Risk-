import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("athlete");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/login", {
        email,
        password,
        role,
      });

      alert(response.data.message);

      localStorage.setItem(
        "user",
        JSON.stringify({
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
        })
      );

      navigate("/dashboard");

    } catch (error) {

      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Something went wrong. Please try again.");
      }

    }
  };

  return (
    <div className="form-container">

      <div className="form-card">

        <h1 className="auth-title">
          Sports Injury Risk Detection
        </h1>

        <h2>Welcome Back</h2>

        <p>
          Sign in to continue your analysis dashboard.
        </p>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="athlete">Athlete</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>

          <div className="form-options">

            <label className="remember">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              Remember Me

            </label>

            <button
              type="button"
              className="forgot-password"
            >
              Forgot Password?
            </button>

          </div>

          <button type="submit">
            Sign In
          </button>

        </form>

        <div className="auth-footer">

          Don't have an account?{" "}

          <span
            className="auth-link"
            onClick={() => navigate("/register")}
          >
            Create Account
          </span>

        </div>

      </div>

    </div>
  );
}

export default Login;