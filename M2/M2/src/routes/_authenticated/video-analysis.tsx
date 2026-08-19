import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ExternalLink, Loader2, PlayCircle, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { RoleGate } from "@/lib/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BiomechanicsReport, type PoseAnalysisRow } from "@/components/biomechanics-report";
import {
  isDirectVideoUrl,
  estimatePoseFromVideoUrl,
  PoseEstimationError,
} from "@/lib/pose-estimation";
import { analyzeFrames } from "@/lib/biomechanics";

export const Route = createFileRoute("/_authenticated/video-analysis")({
  component: VideoAnalysisPage,
  head: () => ({ meta: [{ title: "Video Analysis — KinetIQ" }] }),
});

function VideoAnalysisPage() {
  return (
    <RoleGate allow={["sports_scientist", "administrator"]}>
      <VideoAnalysis />
    </RoleGate>
  );
}

type Submission = {
  id: string;
  athlete_user_id: string;
  title: string;
  video_url: string;
  notes: string | null;
  status: string;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

function VideoAnalysis() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["video-submissions", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_submissions")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Submission[];
    },
  });

  const { data: analyses } = useQuery({
    queryKey: ["pose-analyses", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pose_analyses").select("*");
      if (error) throw error;
      return data as (PoseAnalysisRow & { video_submission_id: string })[];
    },
  });

  const analysisBySubmission = new Map((analyses ?? []).map((a) => [a.video_submission_id, a]));

  const runAnalysis = useMutation({
    mutationFn: async (submission: Submission) => {
      setRunningId(submission.id);
      setProgress(null);
      const frames = await estimatePoseFromVideoUrl(submission.video_url, (p) =>
        setProgress({ processed: p.processedFrames, total: p.totalFrames }),
      );
      const result = analyzeFrames(frames);

      const { error } = await supabase.from("pose_analyses").upsert(
        {
          video_submission_id: submission.id,
          athlete_user_id: submission.athlete_user_id,
          analyzed_by: user!.id,
          frame_count: result.frameCount,
          duration_seconds: result.durationSeconds,
          movement_quality_score: result.movementQualityScore,
          risk_flags: result.riskFlags,
          joint_metrics: { timeSeries: result.timeSeries, aggregates: result.aggregates },
        },
        { onConflict: "video_submission_id" },
      );
      if (error) throw error;

      await supabase
        .from("video_submissions")
        .update({ status: "reviewed" })
        .eq("id", submission.id);

      return result;
    },
    onSuccess: async (_result, submission) => {
      toast.success(`Analysis complete for "${submission.title}"`);
      setExpandedId(submission.id);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["pose-analyses", "all"] }),
        qc.invalidateQueries({ queryKey: ["video-submissions", "all"] }),
      ]);
    },
    onError: (err) => {
      if (err instanceof PoseEstimationError) {
        toast.error(err.message);
      } else {
        toast.error("Analysis failed. Please try again.");
      }
    },
    onSettled: () => {
      setRunningId(null);
      setProgress(null);
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Video className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Video analysis</h1>
          <p className="text-muted-foreground">
            Run pose estimation and biomechanical analysis on submitted athlete videos.
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-xs text-muted-foreground">
        Automatic analysis works on direct video files (.mp4, .webm, .mov). Links to embedded
        players — YouTube, Vimeo, Google Drive preview links — can't be read frame-by-frame by the
        browser, so those are marked as needing a direct file link instead.
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            No videos are currently queued for analysis.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => {
              const analyzable = isDirectVideoUrl(s.video_url);
              const analysis = analysisBySubmission.get(s.id);
              const isRunning = runningId === s.id;
              const isExpanded = expandedId === s.id;

              return (
                <div key={s.id} className="rounded-2xl border border-border bg-card shadow-card">
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="font-display font-semibold">{s.title}</div>
                      <div className="mt-0.5 text-sm text-muted-foreground">
                        {s.profiles?.full_name || "Unknown athlete"}
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
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge
                        className={
                          s.status === "reviewed"
                            ? "bg-success/20 text-success border-0"
                            : "bg-primary/20 text-primary border-0"
                        }
                      >
                        {s.status}
                      </Badge>
                      {analyzable ? (
                        <Button
                          size="sm"
                          variant={analysis ? "outline" : "default"}
                          disabled={isRunning}
                          onClick={() => runAnalysis.mutate(s)}
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
                            </>
                          ) : (
                            <>
                              <PlayCircle className="h-3.5 w-3.5" />{" "}
                              {analysis ? "Re-run" : "Run analysis"}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs font-normal text-muted-foreground"
                        >
                          Needs direct file link
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isRunning && progress && (
                    <div className="px-5 pb-4">
                      <Progress value={(progress.processed / Math.max(1, progress.total)) * 100} />
                      <div className="mt-1 text-xs text-muted-foreground">
                        Processing frame {progress.processed} of {progress.total}…
                      </div>
                    </div>
                  )}

                  {analysis && (
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={(open) => setExpandedId(open ? s.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-center gap-1 border-t border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted/40">
                          {isExpanded ? "Hide report" : "View biomechanics report"}
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="border-t border-border p-5">
                        <BiomechanicsReport analysis={analysis} />
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
