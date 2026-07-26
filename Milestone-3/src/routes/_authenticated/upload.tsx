import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Upload, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RoleGate } from "@/lib/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/upload")({
  component: UploadPage,
  head: () => ({ meta: [{ title: "Upload Video — KinetIQ" }] }),
});

function UploadPage() {
  return (
    <RoleGate allow={["athlete"]}>
      <UploadVideo />
    </RoleGate>
  );
}

function isLikelyUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function UploadVideo() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["video-submissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_submissions")
        .select("*")
        .eq("athlete_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Give the video a title.");
    if (!isLikelyUrl(videoUrl)) {
      return toast.error("Enter a valid video link (any site — YouTube, Vimeo, Drive, a direct .mp4 link, etc.).");
    }
    setBusy(true);
    const { error } = await supabase.from("video_submissions").insert({
      athlete_user_id: user!.id,
      title: title.trim(),
      video_url: videoUrl.trim(),
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Video submitted for analysis");
    setTitle("");
    setVideoUrl("");
    setNotes("");
    await qc.invalidateQueries({ queryKey: ["video-submissions", user?.id] });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Upload a video</h1>
          <p className="text-muted-foreground">
            Paste a link to your training or movement clip — from any site — for pose estimation and injury-risk analysis. Your uploads are private and only visible to your assigned staff.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint session — 12 July" maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label>Video link *</Label>
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://... (YouTube, Vimeo, Google Drive, direct link — any domain)"
          />
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything relevant — drill, context, how you're feeling…" maxLength={2000} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit video"}</Button>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Your submissions</h2>
        <div className="mt-4">
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : !submissions || submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No videos uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <div>
                    <div className="flex items-center gap-2 font-display font-semibold">
                      <Video className="h-4 w-4 text-primary" /> {s.title}
                    </div>
                    {s.notes && <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>}
                    <a
                      href={s.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Open video <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <Badge className={s.status === "reviewed" ? "bg-success/20 text-success border-0" : "bg-primary/20 text-primary border-0"}>
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
