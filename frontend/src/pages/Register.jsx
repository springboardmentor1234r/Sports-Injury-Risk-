import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

const ROLES = [["athlete", "Athlete"], ["coach", "Coach"], ["physiotherapist", "Physiotherapist"], ["sports_scientist", "Sports scientist"], ["administrator", "Administrator"]];

export default function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "athlete" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event) => { event.preventDefault(); setError(""); setSubmitting(true); try { await register(form.fullName, form.email, form.password, form.role); navigate("/dashboard"); } catch (err) { setError(err.response?.data?.detail || "We could not create this account."); } finally { setSubmitting(false); } };
  return <div className="auth-layout"><section className="auth-visual register-visual"><div className="auth-copy"><span className="hero-pill"><i/>EARLY INSIGHT. BETTER OUTCOMES.</span><h1>Stronger today.<br/><em>Safer tomorrow.</em></h1><p>One intelligent workspace for athletes and the people who keep them performing at their best.</p><div className="role-preview"><span>ATHLETE</span><span>COACH</span><span>CLINICAL</span><span>SCIENCE</span></div></div><div className="visual-credit">Movement data with human context</div></section><section className="auth-panel"><div className="auth-form register-form"><Link to="/login" className="mobile-brand"><span className="brand-mark"><span/></span><b>Kinetic</b>Guard</Link><div className="auth-heading"><span className="eyebrow">CREATE WORKSPACE</span><h2>Start your protection plan.</h2><p>Set up your role-specific KineticGuard experience.</p></div><form onSubmit={submit}><div className="two-fields"><label>Full name<input value={form.fullName} onChange={event => update("fullName", event.target.value)} placeholder="Alex Morgan" autoComplete="name" required/></label><label>Role<select value={form.role} onChange={event => update("role", event.target.value)}>{ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><label>Email address<input type="email" value={form.email} onChange={event => update("email", event.target.value)} placeholder="alex@example.com" autoComplete="email" required/></label><label>Password<input type="password" value={form.password} onChange={event => update("password", event.target.value)} placeholder="At least 8 characters" minLength="8" autoComplete="new-password" required/></label>{error && <div className="form-alert">{error}</div>}<button className="primary-button wide" disabled={submitting}>{submitting ? "Creating account…" : "Create workspace"}</button></form><p className="auth-switch">Already have access? <Link to="/login">Sign in</Link></p></div></section></div>;
}
