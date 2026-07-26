import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { RoleGate } from "@/lib/role-guard";
import { EmptyPage } from "@/components/empty-page";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
  head: () => ({ meta: [{ title: "Reports — KinetIQ" }] }),
});

function ReportsPage() {
  return (
    <RoleGate allow={["coach", "physiotherapist", "sports_scientist", "administrator"]}>
      <EmptyPage
        icon={FileBarChart}
        title="Reports"
        description="Team-wide injury risk overview — biomechanics, training load, history and fatigue trends combined into one score per athlete."
        note="The weighted injury-risk scoring model ships in Milestone 3 — this page is a placeholder for now. Per-video biomechanics reports are already available on Video Analysis and the athlete's Analysis Results page."
      />
    </RoleGate>
  );
}
