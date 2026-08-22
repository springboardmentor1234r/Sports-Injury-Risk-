import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import Icon from "../components/Icon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = async (event) => { event.preventDefault(); setError(""); setSubmitting(true); try { await login(email, password); navigate("/dashboard"); } catch (err) { setError(err.response?.data?.detail || "We could not sign you in. Check your details and try again."); } finally { setSubmitting(false); } };
  return <div className="auth-layout"><section className="auth-visual"><div className="auth-copy"><span className="hero-pill"><i/>MOVEMENT INTELLIGENCE</span><h1>Train with<br/><em>confidence.</em></h1><p>See movement risks sooner, make every session smarter, and protect the performance you have worked for.</p><div className="hero-proof"><span className="proof-mark"><Icon name="shield" size={18}/></span><span><b>Built for proactive care</b><small>Biomechanics, risk, and recovery in one workspace.</small></span></div></div><div className="visual-credit">KineticGuard / AI sports health</div></section><section className="auth-panel"><div className="auth-form"><Link to="/login" className="mobile-brand"><span className="brand-mark"><span/></span><b>Kinetic</b>Guard</Link><div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h2>Ready when you are.</h2><p>Enter your details to access your personal workspace.</p></div><form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required/></label><label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" required/></label>{error && <div className="form-alert">{error}</div>}<button className="primary-button wide" disabled={submitting}>{submitting ? "Signing in…" : <>Sign in <Icon name="arrow" size={18}/></>}</button></form><p className="auth-switch">New to KineticGuard? <Link to="/register">Create an account</Link></p><p className="auth-note"><Icon name="shield" size={14}/> Your account is protected with secure, role-based access.</p></div></section></div>;
}
