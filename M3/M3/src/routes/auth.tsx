import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Activity, ArrowLeft, Github } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — KinetIQ" },
      { name: "description", content: "Sign in or create your KinetIQ account." },
    ],
  }),
});

const SIGNUP_ROLES: AppRole[] = [
  "athlete",
  "coach",
  "physiotherapist",
  "sports_scientist",
  "administrator",
];

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(mode === "signup" ? "signup" : "signin");

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <div className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </span>
          KinetIQ
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-card">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-6">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or continue with
            <div className="h-px flex-1 bg-border" />
          </div>
          <OAuthButtons />
        </div>
      </div>
    </div>
  );
}

/**
 * OAuth2 login (spec: "OAuth2 login").
 *
 * `signInWithOAuth` redirects to the provider, then back to `/auth/callback`
 * — Supabase's client picks the session up from the URL automatically
 * (`detectSessionInUrl` defaults to true), and the callback route below just
 * forwards to the dashboard once a session exists.
 *
 * IMPORTANT: this code path is real and will run, but each provider (Google,
 * GitHub, ...) has to be turned on in the Supabase dashboard — Authentication
 * → Providers — with a client ID/secret registered with that provider first.
 * That's an account-level credential only the project owner can create; it
 * can't be wired up from application code. Until a provider is enabled
 * there, clicking its button will show a Supabase "provider not enabled"
 * error rather than a broken app.
 */
function OAuthButtons() {
  const [busyProvider, setBusyProvider] = useState<"google" | "github" | null>(null);

  const signInWith = async (provider: "google" | "github") => {
    setBusyProvider(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusyProvider(null);
      toast.error(error.message);
    }
    // On success the browser navigates away to the provider, so there's
    // nothing further to do here.
  };

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <Button
        type="button"
        variant="outline"
        disabled={busyProvider !== null}
        onClick={() => signInWith("google")}
      >
        <GoogleIcon className="h-4 w-4" />
        {busyProvider === "google" ? "Redirecting…" : "Google"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={busyProvider !== null}
        onClick={() => signInWith("github")}
      >
        <Github className="h-4 w-4" />
        {busyProvider === "github" ? "Redirecting…" : "GitHub"}
      </Button>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.65z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.07.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.4-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.77 1.3 5.4l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.6l4.01 3.09C6.25 6.86 8.89 4.77 12 4.77z"
      />
    </svg>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Chrome (and others) will silently autofill saved credentials into a
  // plain email/password pair on page load, even with autocomplete="off".
  // Keeping the fields read-only until the user actually focuses them
  // reliably stops that — autofill only fires on load, not on focus.
  const [emailLocked, setEmailLocked] = useState(true);
  const [passwordLocked, setPasswordLocked] = useState(true);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setEmailLocked(false)}
          readOnly={emailLocked}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPasswordLocked(false)}
          readOnly={passwordLocked}
          autoComplete="off"
        />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("athlete");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const emailRedirectTo = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created");
    navigate({ to: "/dashboard" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su_email">Email</Label>
        <Input
          id="su_email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su_password">Password</Label>
        <Input
          id="su_password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label>Your role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIGNUP_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
