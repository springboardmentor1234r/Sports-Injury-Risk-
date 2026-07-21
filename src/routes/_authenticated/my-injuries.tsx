import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RoleGate } from "@/lib/role-guard";

export const Route = createFileRoute("/_authenticated/my-injuries")({
  component: MyInjuriesPage,
  head: () => ({ meta: [{ title: "My Injury History — KinetIQ" }] }),
});

function MyInjuriesPage() {
  return (
    <RoleGate allow={["athlete"]}>
      <MyInjuries />
    </RoleGate>
  );
}

function MyInjuries() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [history, setHistory] = useState("");
  const [conditions, setConditions] = useState("");
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["my-athlete", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    setHistory(data?.injury_history ?? "");
    setConditions(data?.current_medical_conditions ?? "");
  }, [data?.injury_history, data?.current_medical_conditions]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.id) {
      return toast.error("Complete your athlete profile first.");
    }
    setBusy(true);
    const { error } = await supabase
      .from("athlete_profiles")
      .update({ injury_history: history || null, current_medical_conditions: conditions || null })
      .eq("id", data.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Injury history updated");
    await qc.invalidateQueries({ queryKey: ["my-athlete", user?.id] });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">My injury history</h1>
      <p className="mt-2 text-muted-foreground">
        Record previous injuries and current medical conditions so risk models can adapt to your history.
      </p>

      {!data?.id ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          You need to complete your athlete profile before logging injury history.
        </div>
      ) : (
        <form onSubmit={save} className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label>Previous injury history</Label>
            <Textarea rows={5} value={history} onChange={(e) => setHistory(e.target.value)} placeholder="Injury, date, side, recovery status…" maxLength={2000} />
          </div>
          <div className="space-y-2">
            <Label>Current medical conditions</Label>
            <Textarea rows={5} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Ongoing conditions, medications, restrictions…" maxLength={2000} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
