import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
  head: () => ({ meta: [{ title: "Signing in — KinetIQ" }] }),
});

/**
 * OAuth2 redirect target. `supabase-js` reads the session out of the URL
 * fragment automatically (`detectSessionInUrl: true` by default) as soon as
 * this page loads — we just wait for `getSession()` to resolve and then
 * route on, or show an error if the provider denied/cancelled the flow.
 */
function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Give supabase-js a tick to parse the URL fragment before checking.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError || !data.session) {
        setError(sessionError?.message ?? "Sign-in didn't complete. Please try again.");
        return;
      }
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              className="mt-4 text-sm text-primary underline"
              onClick={() => navigate({ to: "/auth" })}
            >
              Back to sign in
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
