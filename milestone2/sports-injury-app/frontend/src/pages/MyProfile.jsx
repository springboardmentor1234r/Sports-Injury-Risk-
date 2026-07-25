import { useEffect, useState } from "react";
import { Save, Ruler, Weight, Cake, Trophy } from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import { StatChip } from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import Tabs from "../components/ui/Tabs";
import { Field, Input } from "../components/ui/FormField";
import InjuriesPanel from "../components/panels/InjuriesPanel";
import PerformancePanel from "../components/panels/PerformancePanel";
import AssessmentsPanel from "../components/panels/AssessmentsPanel";
import TrainingLoadPanel from "../components/panels/TrainingLoadPanel";
import VideosPanel from "../components/panels/VideosPanel";

const EMPTY_FORM = { sport_type: "", position: "", age: "", height_cm: "", weight_kg: "" };

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "videos", label: "Video Analysis" },
  { value: "injuries", label: "Injuries" },
  { value: "performance", label: "Performance" },
  { value: "assessments", label: "Assessments" },
  { value: "training", label: "Training Load" },
];

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    api.get("/athletes/me").then((res) => {
      setProfile(res.data);
      setForm({
        sport_type: res.data.sport_type || "",
        position: res.data.position || "",
        age: res.data.age ?? "",
        height_cm: res.data.height_cm ?? "",
        weight_kg: res.data.weight_kg ?? "",
      });
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        age: form.age === "" ? null : Number(form.age),
        height_cm: form.height_cm === "" ? null : Number(form.height_cm),
        weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
      };
      const res = await api.put("/athletes/me", payload);
      setProfile(res.data);
      setEditing(false);
      setMessage("Profile saved.");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <p className="text-sm text-muted">Loading your profile...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-ink font-display font-bold text-xl shrink-0">
            {user.full_name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted mb-0.5">My Profile</p>
            <h1 className="text-2xl font-display font-semibold text-paper">{user.full_name}</h1>
            <p className="text-sm text-muted mt-0.5">
              {profile.sport_type || "Sport not set"}{profile.position ? ` · ${profile.position}` : ""}
            </p>
          </div>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatChip label="Height" value={profile.height_cm ?? "—"} unit={profile.height_cm ? "cm" : ""} icon={<Ruler size={14} className="text-muted" />} fill="glass" />
            <StatChip label="Weight" value={profile.weight_kg ?? "—"} unit={profile.weight_kg ? "kg" : ""} icon={<Weight size={14} className="text-muted" />} fill="glass" />
            <StatChip label="Age" value={profile.age ?? "—"} unit={profile.age ? "yrs" : ""} icon={<Cake size={14} className="text-muted" />} fill="glass" />
            <StatChip label="Sport" value={profile.sport_type || "—"} icon={<Trophy size={14} className="text-ink/70" />} fill="brand" />
          </div>

          <Card className="max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-paper">Profile details</h3>
              {!editing && (
                <Button variant="secondary" onClick={() => setEditing(true)} className="text-xs px-3 py-1.5">Edit</Button>
              )}
            </div>

            {message && (
              <div className="mb-4 px-3 py-2.5 bg-cyan-soft border border-cyan/30 rounded-xl text-cyan text-sm">{message}</div>
            )}

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Sport type">
                    <Input value={form.sport_type} onChange={(e) => setForm({ ...form, sport_type: e.target.value })} placeholder="e.g. Football" />
                  </Field>
                  <Field label="Position">
                    <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Striker" />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Age">
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                  </Field>
                  <Field label="Height (cm)">
                    <Input type="number" step="0.1" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} />
                  </Field>
                  <Field label="Weight (kg)">
                    <Input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
                  </Field>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    <Save size={15} /> {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted text-xs uppercase tracking-wide mb-1">Sport</dt><dd className="text-paper">{profile.sport_type || "—"}</dd></div>
                <div><dt className="text-muted text-xs uppercase tracking-wide mb-1">Position</dt><dd className="text-paper">{profile.position || "—"}</dd></div>
                <div><dt className="text-muted text-xs uppercase tracking-wide mb-1">Age</dt><dd className="text-paper">{profile.age ?? "—"}</dd></div>
                <div><dt className="text-muted text-xs uppercase tracking-wide mb-1">Height</dt><dd className="text-paper">{profile.height_cm ? `${profile.height_cm} cm` : "—"}</dd></div>
                <div><dt className="text-muted text-xs uppercase tracking-wide mb-1">Weight</dt><dd className="text-paper">{profile.weight_kg ? `${profile.weight_kg} kg` : "—"}</dd></div>
              </dl>
            )}
          </Card>
        </div>
      )}

      {tab === "videos" && <VideosPanel profileId={profile.id} canWrite={true} />}
      {tab === "injuries" && <InjuriesPanel profileId={profile.id} canWrite={false} />}
      {tab === "performance" && <PerformancePanel profileId={profile.id} canWrite={false} />}
      {tab === "assessments" && <AssessmentsPanel profileId={profile.id} canWrite={false} />}
      {tab === "training" && <TrainingLoadPanel profileId={profile.id} canWrite={true} />}
    </div>
  );
}
