import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/Forms.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      alert(response.data.message);

      localStorage.setItem(
        "user",
        JSON.stringify({
          name: response.data.name,
          email: email,
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

        <h2>Login</h2>

        <p>Welcome back! Login to continue.</p>

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

          <button type="submit">
            Login
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;