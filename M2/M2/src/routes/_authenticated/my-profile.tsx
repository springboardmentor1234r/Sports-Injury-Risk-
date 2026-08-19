import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AthleteForm } from "@/components/athlete-form";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/my-profile")({
  component: MyProfilePage,
  head: () => ({ meta: [{ title: "My Profile — KinetIQ" }] }),
});

function MyProfilePage() {
  return (
    <RoleGate allow={["athlete"]}>
      <MyProfile />
    </RoleGate>
  );
}

function MyProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-athlete", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">My profile</h1>
      <p className="mt-2 text-muted-foreground">
        {data
          ? "Keep your athlete profile up to date so your coach and physiotherapist can support you."
          : "Complete your athlete profile to begin tracking training load, injury history and analysis."}
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <AthleteForm
          initial={data ?? undefined}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["my-athlete", user?.id] });
            await qc.invalidateQueries({ queryKey: ["athletes"] });
          }}
        />
      </div>

      <div className="mt-6 text-right">
        <Button asChild variant="link">
          <Link to="/settings">Manage account settings</Link>
        </Button>
      </div>
    </div>
  );
}
