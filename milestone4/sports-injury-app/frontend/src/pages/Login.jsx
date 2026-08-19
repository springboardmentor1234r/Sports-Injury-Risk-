import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import KeypointMotif from "../components/ui/KeypointMotif";
import { Field, Input } from "../components/ui/FormField";
import Button from "../components/ui/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute -left-32 top-0 w-[560px] h-[560px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7C6FFF 0%, transparent 70%)" }}
      />
      <div
        className="absolute -right-24 bottom-0 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #22D3C7 0%, transparent 70%)" }}
      />
      <KeypointMotif className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 w-52 h-auto opacity-60" />

      <div className="w-full max-w-sm relative">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <KeypointMotif className="w-6 h-auto" />
          <span className="font-display font-semibold text-lg text-paper">Vantage</span>
        </div>

        <div className="glass-panel rounded-2xl shadow-panel p-8">
          <h1 className="font-display text-xl font-semibold text-paper mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to your injury intelligence dashboard.</p>

          {error && (
            <div className="mb-5 px-3 py-2.5 bg-coral-soft border border-coral/30 rounded-xl text-coral text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-sm text-muted text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-cyan hover:text-cyan/80 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
