import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RoleGate } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/injuries")({
  component: InjuriesPage,
  head: () => ({ meta: [{ title: "Injury Management — KinetIQ" }] }),
});

function InjuriesPage() {
  return (
    <RoleGate allow={["physiotherapist", "administrator"]}>
      <Injuries />
    </RoleGate>
  );
}

function Injuries() {
  const { data, isLoading } = useQuery({
    queryKey: ["injury-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select("id, full_name, sport_type, position, training_load, injury_history, current_medical_conditions")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const withInjuries = (data ?? []).filter((a) => a.injury_history || a.current_medical_conditions);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Injury management</h1>
          <p className="text-muted-foreground">Athletes with recorded injury history or medical conditions.</p>
        </div>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : withInjuries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <HeartPulse className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No injury records</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              As athletes log injuries, they will appear here for review and management.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {withInjuries.map((a) => (
              <Link
                key={a.id}
                to="/athletes/$id"
                params={{ id: a.id }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/50"
              >
                <div className="font-display text-lg font-semibold group-hover:text-primary">{a.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {a.sport_type}{a.position ? ` · ${a.position}` : ""}
                </div>
                {a.injury_history && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Injury: </span>{a.injury_history}
                  </p>
                )}
                {a.current_medical_conditions && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Conditions: </span>{a.current_medical_conditions}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
