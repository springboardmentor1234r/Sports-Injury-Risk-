import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Athlete = {
  id?: string;
  full_name: string;
  sport_type: string;
  position: string | null;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_side: string | null;
  training_load: string | null;
  training_experience: string | null;
  contact_number: string | null;
  email: string | null;
  emergency_contact: string | null;
  coach_name: string | null;
  team_club: string | null;
  injury_history: string | null;
  current_medical_conditions: string | null;
  notes: string | null;
};

const SPORTS = [
  "Football", "Basketball", "Soccer", "Track & Field", "Tennis",
  "Baseball", "Volleyball", "Rugby", "Cricket", "Swimming", "Cycling",
  "Hockey", "Badminton", "Martial Arts", "Other",
];

const emptyAthlete: Athlete = {
  full_name: "", sport_type: "Football", position: null, age: null, gender: null,
  height_cm: null, weight_kg: null, dominant_side: null, training_load: null,
  training_experience: null, contact_number: null, email: null, emergency_contact: null,
  coach_name: null, team_club: null, injury_history: null,
  current_medical_conditions: null, notes: null,
};

export function AthleteForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<Athlete> & { id?: string };
  onSaved?: (id: string) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const { user, roles } = useAuth();
  const startValues = { ...emptyAthlete, ...(initial ?? {}) } as Athlete;
  const [a, setA] = useState<Athlete>(startValues);
  const [busy, setBusy] = useState(false);

  const isStaff = roles.some((r) =>
    ["coach", "physiotherapist", "sports_scientist", "administrator"].includes(r),
  );

  const set = <K extends keyof Athlete>(k: K, v: Athlete[K]) => setA((s) => ({ ...s, [k]: v }));

  const reset = () => setA({ ...emptyAthlete, ...(initial ?? {}) } as Athlete);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a.full_name.trim() || !a.sport_type.trim()) {
      return toast.error("Full name and sport are required.");
    }
    if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) {
      return toast.error("Please enter a valid email address.");
    }
    setBusy(true);
    const payload = initial?.id
      ? a
      : { ...a, created_by: user?.id, user_id: isStaff ? null : user?.id };
    const query = initial?.id
      ? supabase.from("athlete_profiles").update(payload).eq("id", initial.id).select().single()
      : supabase.from("athlete_profiles").insert(payload).select().single();
    const { data, error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(initial?.id ? "Athlete profile updated successfully" : "Athlete registered successfully");
    if (data && onSaved) await onSaved(data.id);
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <Section title="Personal information">
        <Grid>
          <Field label="Athlete name" required>
            <Input value={a.full_name} onChange={(e) => set("full_name", e.target.value)} required maxLength={120} />
          </Field>
          <Field label="Athlete ID">
            <Input value={initial?.id ?? "Auto-generated on save"} disabled />
          </Field>
          <Field label="Age (years)">
            <Input type="number" min={5} max={100} value={a.age ?? ""} onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Gender">
            <Select value={a.gender ?? ""} onValueChange={(v) => set("gender", v || null)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contact number">
            <Input value={a.contact_number ?? ""} onChange={(e) => set("contact_number", e.target.value || null)} maxLength={30} />
          </Field>
          <Field label="Email">
            <Input type="email" value={a.email ?? ""} onChange={(e) => set("email", e.target.value || null)} maxLength={255} />
          </Field>
          <Field label="Emergency contact">
            <Input value={a.emergency_contact ?? ""} onChange={(e) => set("emergency_contact", e.target.value || null)} placeholder="Name and phone number" maxLength={200} />
          </Field>
        </Grid>
      </Section>

      <Section title="Sport profile">
        <Grid>
          <Field label="Sport" required>
            <Select value={a.sport_type} onValueChange={(v) => set("sport_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Position / event">
            <Input value={a.position ?? ""} onChange={(e) => set("position", e.target.value || null)} />
          </Field>
          <Field label="Team / club">
            <Input value={a.team_club ?? ""} onChange={(e) => set("team_club", e.target.value || null)} />
          </Field>
          <Field label="Coach name">
            <Input value={a.coach_name ?? ""} onChange={(e) => set("coach_name", e.target.value || null)} />
          </Field>
          <Field label="Training experience">
            <Select value={a.training_experience ?? ""} onValueChange={(v) => set("training_experience", v || null)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (&lt; 1 year)</SelectItem>
                <SelectItem value="intermediate">Intermediate (1–3 years)</SelectItem>
                <SelectItem value="advanced">Advanced (3–7 years)</SelectItem>
                <SelectItem value="elite">Elite (7+ years)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Training load">
            <Select value={a.training_load ?? ""} onValueChange={(v) => set("training_load", v || null)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very_high">Very high</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid>
      </Section>

      <Section title="Anthropometrics">
        <Grid>
          <Field label="Height (cm)">
            <Input type="number" step="0.1" value={a.height_cm ?? ""} onChange={(e) => set("height_cm", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" step="0.1" value={a.weight_kg ?? ""} onChange={(e) => set("weight_kg", e.target.value ? Number(e.target.value) : null)} />
          </Field>
          <Field label="Dominant leg / side">
            <Select value={a.dominant_side ?? ""} onValueChange={(v) => set("dominant_side", v || null)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid>
      </Section>

      <Section title="Medical">
        <Field label="Previous injury history">
          <Textarea rows={3} value={a.injury_history ?? ""} onChange={(e) => set("injury_history", e.target.value || null)} placeholder="Previous injuries, dates, recovery status…" maxLength={2000} />
        </Field>
        <Field label="Current medical conditions">
          <Textarea rows={3} value={a.current_medical_conditions ?? ""} onChange={(e) => set("current_medical_conditions", e.target.value || null)} placeholder="Ongoing conditions, medications, restrictions…" maxLength={2000} />
        </Field>
        <Field label="Notes">
          <Textarea rows={3} value={a.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} placeholder="Anything relevant to movement or risk assessment." maxLength={2000} />
        </Field>
      </Section>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="button" variant="ghost" onClick={reset}>Reset</Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save changes" : "Save athlete"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}
