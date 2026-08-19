import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { RoleGate } from "@/lib/role-guard";
import { EmptyPage } from "@/components/empty-page";

export const Route = createFileRoute("/_authenticated/video-analysis")({
  component: VideoAnalysisPage,
  head: () => ({ meta: [{ title: "Video Analysis — KinetIQ" }] }),
});

function VideoAnalysisPage() {
  return (
    <RoleGate allow={["sports_scientist", "administrator"]}>
      <EmptyPage
        icon={Video}
        title="Video analysis"
        description="Run pose estimation and biomechanical analysis on submitted athlete videos."
        note="Pose estimation ships in Milestone 2 — this page is a placeholder for now. Submitted videos can already be reviewed via the athlete's upload history."
      />
    </RoleGate>
  );
}
