import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AthleteForm } from "@/components/athlete-form";
import { RoleGate } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/athletes/new")({
  component: NewAthletePage,
  head: () => ({ meta: [{ title: "Register Athlete — KinetIQ" }] }),
});

function NewAthletePage() {
  return (
    <RoleGate allow={["coach", "administrator"]}>
      <NewAthlete />
    </RoleGate>
  );
}

function NewAthlete() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">Register a new athlete</h1>
      <p className="mt-2 text-muted-foreground">
        Capture the baseline profile used by pose estimation, training-load monitoring and injury-risk analysis.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <AthleteForm
          onSaved={() => navigate({ to: "/athletes" })}
          onCancel={() => navigate({ to: "/athletes" })}
        />
      </div>
    </div>
  );
}
