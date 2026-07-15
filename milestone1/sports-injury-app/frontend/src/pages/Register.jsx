import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

const ROLES = [
  { value: "athlete", label: "Athlete" },
  { value: "coach", label: "Coach" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "sports_scientist", label: "Sports Scientist" },
  { value: "admin", label: "Administrator" },
];

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "athlete",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Create your account</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Full name</label>
          <input
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">I am a...</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500 text-center">
        Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Log in</Link>
      </p>
    </div>
  );
}
