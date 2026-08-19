import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RoleGate } from "@/lib/role-guard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/athletes")({
  component: AthletesPage,
  head: () => ({ meta: [{ title: "Athletes — KinetIQ" }] }),
});

const LOAD_TONE: Record<string, string> = {
  low: "bg-success/20 text-success",
  moderate: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  very_high: "bg-destructive/20 text-destructive",
};

function AthletesPage() {
  return (
    <RoleGate allow={["coach", "physiotherapist", "sports_scientist", "administrator"]}>
      <AthletesList />
    </RoleGate>
  );
}

function AthletesList() {
  const { roles } = useAuth();
  const canManage = roles.some((r) => ["coach", "administrator"].includes(r));
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<string>("all");
  const [load, setLoad] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sports = Array.from(new Set((data ?? []).map((a) => a.sport_type).filter(Boolean)));

  const filtered = (data ?? []).filter((a) => {
    if (sport !== "all" && a.sport_type !== sport) return false;
    if (load !== "all" && a.training_load !== load) return false;
    if (!q) return true;
    return [a.full_name, a.sport_type, a.position, a.team_club, a.coach_name]
      .filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Athletes</h1>
          <p className="mt-2 text-muted-foreground">
            Manage athlete profiles, training load and injury history.
          </p>
        </div>
        {canManage && (
          <Button asChild>
            <Link to="/athletes/new">
              <Plus className="h-4 w-4" /> New athlete
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, sport, position, team or coach"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>
        <Select value={sport} onValueChange={setSport}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Sport" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {sports.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={load} onValueChange={setLoad}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Training load" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All loads</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="very_high">Very high</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading athletes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No athletes match your filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {(data ?? []).length === 0
                ? "Register your first athlete to begin tracking."
                : "Try clearing search or filters to see more athletes."}
            </p>
            {canManage && (
              <Button asChild className="mt-6">
                <Link to="/athletes/new"><Plus className="h-4 w-4" /> New athlete</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <Link
                key={a.id}
                to="/athletes/$id"
                params={{ id: a.id }}
                className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold group-hover:text-primary">{a.full_name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {a.sport_type}{a.position ? ` · ${a.position}` : ""}
                    </div>
                    {a.team_club && <div className="mt-0.5 text-xs text-muted-foreground">{a.team_club}</div>}
                  </div>
                  {a.training_load && (
                    <Badge className={`${LOAD_TONE[a.training_load] ?? "bg-muted text-muted-foreground"} border-0`}>
                      {a.training_load.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <Stat label="Age" value={a.age ?? "—"} />
                  <Stat label="Height" value={a.height_cm ? `${a.height_cm} cm` : "—"} />
                  <Stat label="Weight" value={a.weight_kg ? `${a.weight_kg} kg` : "—"} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/60 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}
