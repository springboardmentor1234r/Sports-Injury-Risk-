import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from "@/lib/alerts";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — KinetIQ" }] }),
});

function SettingsPage() {
  const { user, roles } = useAuth();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [prefsBusy, setPrefsBusy] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);
  useEffect(() => {
    if (profile?.notification_preferences) {
      setPrefs({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...(profile.notification_preferences as Partial<NotificationPreferences>),
      });
    }
  }, [profile?.notification_preferences]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName }, { onConflict: "id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Settings updated");
    await refetch();
  };

  const togglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next); // optimistic
    setPrefsBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, notification_preferences: next }, { onConflict: "id" });
    setPrefsBusy(false);
    if (error) {
      setPrefs(prefs); // revert
      return toast.error(error.message);
    }
    await refetch();
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your account details.</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Signed in as
            </div>
            <div className="mt-1 font-medium">{user?.email}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Staff / member ID:{" "}
              <span className="font-mono text-foreground">{profile?.staff_code ?? "—"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <Badge variant="outline">No role assigned</Badge>
            ) : (
              roles.map((r) => (
                <Badge key={r} className="border-0 bg-primary/15 text-primary">
                  {ROLE_LABELS[r]}
                </Badge>
              ))
            )}
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fn">Full name</Label>
            <Input
              id="fn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          High and critical injury-risk alerts always notify you. These control the lower-stakes
          categories.
        </p>
        <div className="mt-5 space-y-4">
          <PrefRow
            label="Training load warnings"
            description="When your training load is set to high or very high."
            checked={prefs.training_load}
            disabled={prefsBusy}
            onChange={(v) => togglePref("training_load", v)}
          />
          <PrefRow
            label="Recovery reminders"
            description="When you've gone quiet after a flagged analysis."
            checked={prefs.recovery_reminders}
            disabled={prefsBusy}
            onChange={(v) => togglePref("recovery_reminders", v)}
          />
          <PrefRow
            label="Assessment completion"
            description="When a submitted video finishes analysis."
            checked={prefs.assessment_complete}
            disabled={prefsBusy}
            onChange={(v) => togglePref("assessment_complete", v)}
          />
        </div>
      </div>
    </div>
  );
}

function PrefRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
