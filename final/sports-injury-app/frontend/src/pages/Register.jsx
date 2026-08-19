import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import KeypointMotif from "../components/ui/KeypointMotif";
import { Field, Input, Select } from "../components/ui/FormField";
import Button from "../components/ui/Button";

const ROLES = [
  { value: "athlete", label: "Athlete" },
  { value: "coach", label: "Coach" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "sports_scientist", label: "Sports Scientist" },
  { value: "admin", label: "Administrator" },
];

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "athlete" });
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div
        className="absolute -right-32 top-0 w-[560px] h-[560px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7C6FFF 0%, transparent 70%)" }}
      />
      <div
        className="absolute -left-24 bottom-0 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #22D3C7 0%, transparent 70%)" }}
      />
      <KeypointMotif className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 w-52 h-auto opacity-60" />

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <KeypointMotif className="w-6 h-auto" />
          <span className="font-display font-semibold text-lg text-paper">Vantage</span>
        </div>

        <div className="glass-panel rounded-2xl shadow-panel p-8">
          <h1 className="font-display text-xl font-semibold text-paper mb-1">Create your account</h1>
          <p className="text-sm text-muted mb-6">Set up access to the injury intelligence platform.</p>

          {error && (
            <div className="mb-5 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-xl text-coral text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full name" required>
              <Input name="full_name" value={form.full_name} onChange={handleChange} required autoFocus />
            </Field>
            <Field label="Email" required>
              <Input type="email" name="email" value={form.email} onChange={handleChange} required />
            </Field>
            <Field label="Password" required hint="At least 8 characters">
              <Input type="password" name="password" value={form.password} onChange={handleChange} required minLength={8} />
            </Field>
            <Field label="Role" required>
              <Select name="role" value={form.role} onChange={handleChange}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-sm text-muted text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan hover:text-cyan/80 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
